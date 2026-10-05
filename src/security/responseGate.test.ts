import test from 'node:test';
import assert from 'node:assert/strict';
import { applyResponseGate } from './responseGate';
import { DcrEngine } from '../utils/dcrEngine';
import { scanAndSanitizePrompt } from '../utils/complianceEngine';
import type { AIProvider } from '../types';

test('response gate reconstructs only records explicitly authorised by the caller', async () => {
  const allowed = await applyResponseGate({
    responseText: 'The result is ALTIL_PERSON_ABC123.',
    tenantId: 'tenant-a',
    requestId: 'request-a',
    records: [],
    allowReconstruction: () => true,
  });
  assert.equal(allowed.blocked, false);
  assert.equal(allowed.deliveredText, 'The result is ALTIL_PERSON_ABC123.');
});

test('response gate blocks a response rejected by the configured DLP rules', async () => {
  const result = await applyResponseGate({
    responseText: 'medical diagnosis: protected health record',
    tenantId: 'tenant-a',
    requestId: 'request-b',
    gdprRules: { enabled: true, enforcementMode: 'strict_block', enforceArticle9SpecialCategories: true, enforceEuSovereignResidencyOnly: false, enforceArticle17ZeroRetention: true, enforceArticle22AutomatedDecisionFlag: true, maskEuropeanIbans: true, maskEuPassportsAndNationalIds: true, maskEmailsAndIps: true, dataRetentionTtlDays: 30 },
    popiaRules: { enabled: true, enforcementMode: 'strict_block', maskSaIdNumbers: true, maskSaTaxNumbers: true, maskSaPhoneNumbers: true, maskSaBankingDetails: true, blockSpecialPersonalInfo: true, enforceSection72CrossBorder: false, logInformationOfficerAudit: true, requireConsentProofHeader: false },
  });
  assert.equal(result.blocked, true);
  assert.equal(result.deliveredText, '');
});

test('response gate reports transfer adequacy from deployment metadata, not the vendor name', () => {
  const geminiHost = (overrides: Partial<AIProvider>): AIProvider => ({
    id: 'p-gemini', name: 'Google Gemini Cloud', type: 'gemini', endpoint: 'https://generativelanguage.googleapis.com',
    enabled: true, status: 'online', latencyMs: 1, errorRate: 0, priority: 1, timeoutMs: 1000, modelsCount: 1,
    totalRequests: 0, lastTested: '', ...overrides,
  } as AIProvider);

  const undeclared = scanAndSanitizePrompt('Email jane@example.com', { targetProvider: geminiHost({}) });
  assert.ok(undeclared.crossBorderTransferFlag);
  assert.equal(undeclared.crossBorderTransferFlag!.isAdequate, false);
  assert.equal(undeclared.crossBorderTransferFlag!.destinationJurisdiction.startsWith('Undeclared'), true);

  const declaredAdequate = scanAndSanitizePrompt('Email jane@example.com', { targetProvider: geminiHost({ processingJurisdictions: ['EU'] }) });
  assert.equal(declaredAdequate.crossBorderTransferFlag!.isAdequate, true);

  const onPrem = scanAndSanitizePrompt('Email jane@example.com', { targetProvider: geminiHost({ endpoint: 'http://10.0.0.5:11434' }) });
  assert.equal(onPrem.crossBorderTransferFlag, undefined);
});

test('response gate redacts an upstream re-identification attempt before reconstruction', async () => {
  const transformed = await DcrEngine.cloakPayload('Contact jane@example.com.', { tenantId: 'tenant-a', requestId: 'request-reid', forcedStrategy: 'ENCRYPT' });
  const result = await applyResponseGate({ responseText: 'The provider says this is jane@example.com.', tenantId: 'tenant-a', requestId: 'request-reid', records: transformed.records });
  assert.equal(result.reidentificationDetected, true);
  assert.match(result.deliveredText, /REIDENTIFICATION_BLOCKED/);
  assert.equal(result.deliveredText.includes('jane@example.com'), false);
});
