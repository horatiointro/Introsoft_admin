import test from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, type AI_Governance_Policy } from './policyEngine';
import { toGovernancePolicy } from './applicationPolicyAdapter';

test('effective policy resolution preserves mandatory restrictions across layers', () => {
  const policies: AI_Governance_Policy[] = [
    { policyCode: 'legal', policyVersion: '1', tenantId: 'all', enabled: true, layer: 'LEGAL_BASELINE', rules: { piiHandling: 'block', dcrRequired: true } },
    { policyCode: 'customer', policyVersion: '2', tenantId: 'customer-a', enabled: true, layer: 'CUSTOMER', rules: { piiHandling: 'redact', pemRequired: true, permittedProviders: ['openai', 'ollama'] } },
    { policyCode: 'app', policyVersion: '1', tenantId: 'customer-a', enabled: true, layer: 'APPLICATION', rules: { permittedProviders: ['ollama'], responseDlpRequired: true } },
  ];
  const effective = PolicyEngine.resolveEffectivePolicy({ policies, tenantId: 'customer-a', appId: 'app-a' });
  assert.equal(effective.decision, 'ALLOW');
  assert.equal(effective.rules.piiHandling, 'block');
  assert.equal(effective.rules.dcrRequired, true);
  assert.equal(effective.rules.pemRequired, true);
  assert.deepEqual(effective.rules.permittedProviders, ['ollama']);
  assert.equal(effective.rules.responseDlpRequired, true);
});

test('effective policy resolution does not guess locality from provider identifiers', () => {
  const effective = PolicyEngine.resolveEffectivePolicy({
    policies: [{ policyCode: 'baseline', policyVersion: '1', tenantId: 'all', enabled: true, layer: 'ALTIL_BASELINE', rules: { localModelOnly: true, permittedProviders: ['p-openai'] } }],
    tenantId: 'customer-a'
  });
  assert.equal(effective.rules.localModelOnly, true);
  assert.deepEqual(effective.rules.permittedProviders, ['p-openai']);
  assert.deepEqual(effective.conflicts, []);
});

test('lower-layer policies receive an actionable conflict report instead of weakening mandatory controls', () => {
  const conflicts = PolicyEngine.findPolicyConflicts(
    { policyCode: 'customer-policy', policyVersion: '1', tenantId: 'customer-a', enabled: true, layer: 'CUSTOMER', rules: { piiHandling: 'none', financialData: 'allow' } },
    [{ policyCode: 'legal', policyVersion: '1', tenantId: 'all', enabled: true, layer: 'LEGAL_BASELINE', rules: { piiHandling: 'redact', financialData: 'block' } }],
  );
  assert.equal(conflicts.length, 2);
  assert.match(conflicts[0].reason, /PII/i);
  assert.match(conflicts[0].remediation, /redact/i);
  assert.match(conflicts[1].reason, /financial/i);
});

test('lower-layer policies may tighten the mandatory baseline', () => {
  const conflicts = PolicyEngine.findPolicyConflicts(
    { policyCode: 'customer-policy', policyVersion: '1', tenantId: 'customer-a', enabled: true, layer: 'CUSTOMER', rules: { piiHandling: 'block', financialData: 'block', permittedProviders: ['p-ollama'] } },
    [{ policyCode: 'legal', policyVersion: '1', tenantId: 'all', enabled: true, layer: 'LEGAL_BASELINE', rules: { piiHandling: 'redact', financialData: 'block' } }],
  );
  assert.deepEqual(conflicts, []);
});

test('application-managed policy adapter preserves tenant, application and active boundaries', () => {
  const policy = toGovernancePolicy({
    id: 'pol-company-a',
    name: 'Company A policy',
    description: 'test',
    tenantId: 'company-a',
    appliesToAppIds: ['app-a'],
    rules: {
      blockSensitiveFinancialData: true,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: false,
      maxContextTokens: 4096,
      maxResponseTokens: 1024,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: ['p-approved'],
    },
    status: 'active',
    createdAt: '2026-10-03 00:00:00',
    updatedAt: '2026-10-03 01:00:00',
  });
  assert.equal(policy.policyCode, 'APP-pol-company-a');
  assert.equal(policy.tenantId, 'company-a');
  assert.deepEqual(policy.applicationIds, ['app-a']);
  assert.deepEqual(policy.rules.permittedProviders, ['p-approved']);
  assert.equal(policy.rules.piiHandling, 'redact');
  assert.equal(policy.rules.financialData, 'block');
  assert.equal(policy.enabled, true);
  assert.equal(PolicyEngine.resolveEffectivePolicy({ policies: [policy], tenantId: 'company-a', appId: 'app-a' }).policyIds[0], 'APP-pol-company-a');
  assert.deepEqual(PolicyEngine.resolveEffectivePolicy({ policies: [policy], tenantId: 'company-a', appId: 'app-other' }).policyIds, []);
});

test('policy evidence keeps the gateway transaction identifier', () => {
  const transactionId = 'ATL-policy-evidence-test';
  PolicyEngine.evaluate({ transactionId, tenantId: 'policy-test-tenant', appId: 'policy-test-app', userOrKeyPrefix: 'SESSION', capability: 'general_ai', providerId: 'p-ollama', providerType: 'ollama', modelId: 'm-test', prompt: 'hello' });
  const evidence = PolicyEngine.getEvidence('policy-test-tenant').find(item => item.transactionId === transactionId);
  assert.equal(evidence?.transactionId, transactionId);
});

test('local-model-only policy follows deployment metadata rather than the vendor type', () => {
  PolicyEngine.addPolicy({
    policyCode: 'locality-test',
    policyVersion: '1',
    tenantId: 'locality-tenant',
    enabled: true,
    layer: 'CUSTOMER',
    rules: { localModelOnly: true, permittedProviders: ['p-openai'] },
  });
  const selfHostedCloudProtocol = PolicyEngine.evaluate({
    tenantId: 'locality-tenant',
    appId: 'app-locality',
    userOrKeyPrefix: 'TEST',
    capability: 'general_ai',
    providerId: 'p-openai',
    providerType: 'openai',
    providerLocality: { endpoint: 'http://10.20.30.40:8080/v1' },
    modelId: 'm-test',
    prompt: 'hello',
  });
  assert.equal(selfHostedCloudProtocol.decision, 'ALLOW');
  assert.equal(selfHostedCloudProtocol.providerLocality?.locality, 'ON_PREM');

  const publicHostOfSameType = PolicyEngine.evaluate({
    tenantId: 'locality-tenant',
    appId: 'app-locality',
    userOrKeyPrefix: 'TEST',
    capability: 'general_ai',
    providerId: 'p-openai',
    providerType: 'openai',
    providerLocality: { endpoint: 'https://api.vendor.example/v1' },
    modelId: 'm-test',
    prompt: 'hello',
  });
  assert.equal(publicHostOfSameType.decision, 'BLOCK');
  assert.match(publicHostOfSameType.reason, /local-model-only/i);
  PolicyEngine.deletePolicy('locality-test');
});

test('an undeclared deployment fails closed for locality and residency rules', () => {
  PolicyEngine.addPolicy({
    policyCode: 'residency-test',
    policyVersion: '1',
    tenantId: 'residency-tenant',
    enabled: true,
    layer: 'CUSTOMER',
    rules: { dataResidency: ['EU Sovereign Nodes'], permittedProviders: ['p-openai'] },
  });
  const undeclared = PolicyEngine.evaluate({
    tenantId: 'residency-tenant',
    appId: 'app-residency',
    userOrKeyPrefix: 'TEST',
    capability: 'general_ai',
    providerId: 'p-openai',
    providerType: 'custom',
    modelId: 'm-test',
    prompt: 'hello',
  });
  assert.equal(undeclared.decision, 'BLOCK');
  assert.match(undeclared.reason, /residency requirement/i);
  assert.equal(undeclared.providerLocality?.locality, 'UNDECLARED');

  const declaredInRegion = PolicyEngine.evaluate({
    tenantId: 'residency-tenant',
    appId: 'app-residency',
    userOrKeyPrefix: 'TEST',
    capability: 'general_ai',
    providerId: 'p-openai',
    providerType: 'custom',
    providerLocality: { endpoint: 'https://eu.vendor.example/v1', processingJurisdictions: ['EU'] },
    modelId: 'm-test',
    prompt: 'hello',
  });
  assert.equal(declaredInRegion.decision, 'ALLOW');
  assert.equal(declaredInRegion.providerLocality?.locality, 'SOVEREIGN_CLOUD');
  PolicyEngine.deletePolicy('residency-test');
});

test('effective max token limit is enforced by the gateway policy evaluator', () => {
  PolicyEngine.addPolicy({
    policyCode: 'token-limit-test',
    policyVersion: '1',
    tenantId: 'token-limit-tenant',
    enabled: true,
    layer: 'CUSTOMER',
    rules: { maxTokenLimit: 2 },
  });
  const decision = PolicyEngine.evaluate({
    transactionId: 'token-limit-evidence',
    tenantId: 'token-limit-tenant',
    appId: 'app-token-limit',
    userOrKeyPrefix: 'TEST',
    capability: 'general_ai',
    providerId: 'p-ollama',
    providerType: 'ollama',
    modelId: 'm-test',
    prompt: 'This prompt is longer than two tokens.',
  });
  assert.equal(decision.decision, 'BLOCK');
  assert.match(decision.reason, /maximum token limit/i);
});
