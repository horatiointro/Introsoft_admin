import crypto from 'crypto';
import { resolveProviderLocality, residencySatisfied, type ProviderLocalityInput } from '../security/providerLocality';

export type PolicyLayer = 'LEGAL_BASELINE' | 'ALTIL_BASELINE' | 'CUSTOMER' | 'ORGANISATION' | 'APPLICATION' | 'ENVIRONMENT' | 'API_KEY' | 'REQUEST';
export const POLICY_LAYER_ORDER: readonly PolicyLayer[] = ['LEGAL_BASELINE', 'ALTIL_BASELINE', 'CUSTOMER', 'ORGANISATION', 'APPLICATION', 'ENVIRONMENT', 'API_KEY', 'REQUEST'];

export interface AI_Governance_Policy {
  policyCode: string;
  policyVersion: string;
  tenantId: string; // 'all' or specific tenant ID
  enabled: boolean;
  layer?: PolicyLayer;
  /** Optional application boundary. An empty list means all applications in the tenant scope. */
  applicationIds?: string[];
  rules: {
    permittedProviders?: string[];      // e.g. ['p-gemini', 'p-ollama']
    permittedModels?: string[];         // e.g. ['m-gemini-25-flash', 'm-qwen36']
    permittedCapabilities?: string[];   // e.g. ['general_ai', 'security_analysis']
    prohibitedCapabilities?: string[];  // e.g. ['image_generation']
    localModelOnly?: boolean;           // true means only local (ollama) allowed
    externalProviderBlock?: boolean;    // true means no external cloud SaaS models
    dataResidency?: string[];           // e.g. ['South Africa Only', 'EU Sovereign Nodes']
    piiHandling?: 'redact' | 'block' | 'none';
    phiHandling?: 'allow' | 'block';
    financialData?: 'allow' | 'block';
    maxTokenLimit?: number;             // maximum total tokens allowed per request
    maxSpendLimit?: number;             // maximum cost allowed per request
    pemRequired?: boolean;
    dcrRequired?: boolean;
    responseDlpRequired?: boolean;
    retentionPolicyId?: string;
    crossMatterSharing?: 'ALLOW' | 'APPROVAL_REQUIRED' | 'DENY';
  };
}

export interface EffectivePolicyDecision {
  policyIds: string[];
  versions: string[];
  rules: AI_Governance_Policy['rules'];
  source: PolicyLayer[];
  conflicts: string[];
  decision: 'ALLOW' | 'DENY';
  reason: string;
}

export interface PolicyConflict {
  policyCode: string;
  field: string;
  requestedValue: string;
  mandatoryValue: string;
  reason: string;
  remediation: string;
}

export interface PolicyDecisionEvidence {
  id: string;
  transactionId?: string;
  policyCode: string;
  policyVersion: string;
  tenantId: string;
  appId: string;
  userOrKeyPrefix: string;
  capability: string;
  providerId: string;
  modelId: string;
  decision: 'ALLOW' | 'DENY' | 'REDACT' | 'REQUIRE_APPROVAL' | 'RATE_LIMIT' | 'BLOCK';
  reason: string;
  timestamp: string;
}

// In-memory active corporate governance policies
const activePolicies: AI_Governance_Policy[] = [
  {
    policyCode: 'POL-SYSTEM-DEFAULT',
    policyVersion: '1.0.0',
    tenantId: 'all',
    enabled: true,
    rules: {
      permittedProviders: ['p-gemini', 'p-ollama', 'p-groq', 'p-openai', 'p-anthropic', 'p-deepseek', 'p-openrouter'],
      permittedCapabilities: ['general_ai', 'code_generation', 'fast_chat', 'security_analysis', 'document_analysis', 'financial_summary'],
      phiHandling: 'block',
      piiHandling: 'redact'
    }
  },
  {
    policyCode: 'POL-CLINICAL-AI-LOCAL',
    policyVersion: '2.1.0',
    tenantId: 'cust-1', // ACME Financial / Healthcare subsidiary
    enabled: true,
    rules: {
      localModelOnly: true, // Approved local models only!
      permittedProviders: ['p-ollama'],
      permittedModels: ['m-qwen36', 'm-sec-analyst', 'm-qwen25-coder'],
      piiHandling: 'block',
      phiHandling: 'allow' // PHI is allowed but ONLY on local nodes
    }
  },
  {
    policyCode: 'POL-FRAUD-RISK-CLOUD-ONLY',
    policyVersion: '1.5.0',
    tenantId: 'cust-2', // Capitec Bank / Global FinTech Nexus
    enabled: true,
    rules: {
      externalProviderBlock: false,
      permittedProviders: ['p-gemini'], // Approved enterprise provider only!
      permittedModels: ['m-gemini-25-flash', 'm-gemini-25-pro'],
      financialData: 'allow', // Allowed on cloud, but restricted to Gemini
      dataResidency: ['EU Sovereign Nodes']
    }
  }
];

// In-memory immutable policy decision logs
const policyEvidenceLedger: PolicyDecisionEvidence[] = [];
let policyEvidenceSink: ((evidence: PolicyDecisionEvidence) => void | Promise<void>) | undefined;
const applicationPolicyCodes = new Set<string>();

/** Configure the durable evidence boundary without coupling policy evaluation to a database. */
export function configurePolicyEvidenceSink(sink: ((evidence: PolicyDecisionEvidence) => void | Promise<void>) | undefined): void {
  policyEvidenceSink = sink;
}

function publishPolicyEvidence(evidence: PolicyDecisionEvidence): void {
  try { void policyEvidenceSink?.(evidence); } catch { /* The in-memory decision remains available to the caller. */ }
}

export class PolicyEngine {
  /**
   * Reject a lower-layer policy that would explicitly weaken a mandatory
   * legal/security baseline. Tightening controls remains valid and is merged
   * monotonically by resolveEffectivePolicy().
   */
  public static findPolicyConflicts(candidate: AI_Governance_Policy, existingPolicies: readonly AI_Governance_Policy[]): PolicyConflict[] {
    if (!candidate.enabled || candidate.layer === 'LEGAL_BASELINE' || candidate.layer === 'ALTIL_BASELINE') return [];
    const baselinePolicies = existingPolicies.filter(policy =>
      policy.enabled && policy.tenantId === 'all' &&
      (policy.layer === 'LEGAL_BASELINE' || policy.layer === 'ALTIL_BASELINE') &&
      policy.policyCode !== candidate.policyCode,
    );
    if (!baselinePolicies.length) return [];
    const mandatory = this.resolveEffectivePolicy({ policies: baselinePolicies, tenantId: 'any', appId: 'all' }).rules;
    const conflicts: PolicyConflict[] = [];
    const add = (field: string, requestedValue: string, mandatoryValue: string, reason: string, remediation: string) => conflicts.push({ policyCode: candidate.policyCode, field, requestedValue, mandatoryValue, reason, remediation });
    if (mandatory.piiHandling === 'block' && candidate.rules.piiHandling !== undefined && candidate.rules.piiHandling !== 'block') {
      add('piiHandling', candidate.rules.piiHandling, 'block', 'The candidate policy would permit raw personally identifiable information where the mandatory baseline blocks it.', 'Keep PII handling at block or submit a reviewed baseline amendment.');
    } else if (mandatory.piiHandling === 'redact' && candidate.rules.piiHandling === 'none') {
      add('piiHandling', 'none', 'redact', 'The candidate policy would disable mandatory PII redaction.', 'Keep PII handling at redact or stronger.');
    }
    if (mandatory.financialData === 'block' && candidate.rules.financialData === 'allow') {
      add('financialData', 'allow', 'block', 'The candidate policy would permit unprotected financial data against the mandatory baseline.', 'Keep financial-data handling at block or submit a reviewed baseline amendment.');
    }
    if (mandatory.phiHandling === 'block' && candidate.rules.phiHandling === 'allow') {
      add('phiHandling', 'allow', 'block', 'The candidate policy would permit protected health information against the mandatory baseline.', 'Keep PHI handling at block or submit a reviewed baseline amendment.');
    }
    return conflicts;
  }

  /** Resolve policy layers from mandatory baseline to request-specific restrictions. */
  public static resolveEffectivePolicy(input: {
    policies: AI_Governance_Policy[];
    tenantId?: string;
    appId?: string;
  }): EffectivePolicyDecision {
    const applicable = input.policies
      .filter(policy => policy.enabled && (policy.tenantId === 'all' || policy.tenantId === input.tenantId) && (!policy.applicationIds?.length || (Boolean(input.appId) && (policy.applicationIds.includes('all') || policy.applicationIds.includes(input.appId!)))))
      .sort((a, b) => POLICY_LAYER_ORDER.indexOf(a.layer || 'CUSTOMER') - POLICY_LAYER_ORDER.indexOf(b.layer || 'CUSTOMER'));
    const conflicts: string[] = [];
    const rules: AI_Governance_Policy['rules'] = {};
    const policyIds: string[] = [];
    const versions: string[] = [];
    const source: PolicyLayer[] = [];

    for (const policy of applicable) {
      policyIds.push(policy.policyCode);
      versions.push(policy.policyVersion);
      source.push(policy.layer || 'CUSTOMER');
      const incoming = policy.rules;
      if (incoming.permittedProviders) rules.permittedProviders = rules.permittedProviders ? rules.permittedProviders.filter(value => incoming.permittedProviders!.includes(value)) : [...incoming.permittedProviders];
      if (incoming.permittedModels) rules.permittedModels = rules.permittedModels ? rules.permittedModels.filter(value => incoming.permittedModels!.includes(value)) : [...incoming.permittedModels];
      if (incoming.permittedCapabilities) rules.permittedCapabilities = rules.permittedCapabilities ? rules.permittedCapabilities.filter(value => incoming.permittedCapabilities!.includes(value)) : [...incoming.permittedCapabilities];
      if (incoming.prohibitedCapabilities) rules.prohibitedCapabilities = [...new Set([...(rules.prohibitedCapabilities || []), ...incoming.prohibitedCapabilities])];
      if (incoming.localModelOnly) rules.localModelOnly = true;
      if (incoming.externalProviderBlock) rules.externalProviderBlock = true;
      if (incoming.dataResidency) rules.dataResidency = [...new Set([...(rules.dataResidency || []), ...incoming.dataResidency])];
      if (incoming.piiHandling === 'block' || (incoming.piiHandling === 'redact' && rules.piiHandling !== 'block')) rules.piiHandling = incoming.piiHandling;
      if (incoming.phiHandling === 'block' || (incoming.phiHandling === 'allow' && rules.phiHandling === undefined)) rules.phiHandling = incoming.phiHandling;
      if (incoming.financialData === 'block' || (incoming.financialData === 'allow' && rules.financialData === undefined)) rules.financialData = incoming.financialData;
      if (incoming.maxTokenLimit !== undefined) rules.maxTokenLimit = rules.maxTokenLimit === undefined ? incoming.maxTokenLimit : Math.min(rules.maxTokenLimit, incoming.maxTokenLimit);
      if (incoming.maxSpendLimit !== undefined) rules.maxSpendLimit = rules.maxSpendLimit === undefined ? incoming.maxSpendLimit : Math.min(rules.maxSpendLimit, incoming.maxSpendLimit);
      if (incoming.pemRequired) rules.pemRequired = true;
      if (incoming.dcrRequired) rules.dcrRequired = true;
      if (incoming.responseDlpRequired) rules.responseDlpRequired = true;
      if (incoming.retentionPolicyId) rules.retentionPolicyId = incoming.retentionPolicyId;
      if (incoming.crossMatterSharing === 'DENY' || (incoming.crossMatterSharing === 'APPROVAL_REQUIRED' && rules.crossMatterSharing !== 'DENY')) rules.crossMatterSharing = incoming.crossMatterSharing;
    }
    return {
      policyIds,
      versions,
      rules,
      source,
      conflicts,
      decision: conflicts.length ? 'DENY' : 'ALLOW',
      reason: conflicts.length ? conflicts.join(' ') : 'Effective policy resolved with monotonic restrictions.'
    };
  }
  public static getPolicies(tenantId?: string): AI_Governance_Policy[] {
    if (!tenantId || tenantId === 'all') {
      return activePolicies;
    }
    return activePolicies.filter(p => p.tenantId === 'all' || p.tenantId === tenantId);
  }

  /** Replace only the application-managed policies while retaining mandatory ALTIL defaults. */
  public static replaceApplicationPolicies(policies: AI_Governance_Policy[]): void {
    for (const policyCode of applicationPolicyCodes) {
      const index = activePolicies.findIndex(policy => policy.policyCode === policyCode);
      if (index >= 0) activePolicies.splice(index, 1);
    }
    applicationPolicyCodes.clear();
    for (const policy of policies) {
      const existingIndex = activePolicies.findIndex(candidate => candidate.policyCode === policy.policyCode);
      if (existingIndex >= 0) activePolicies[existingIndex] = policy;
      else activePolicies.push(policy);
      applicationPolicyCodes.add(policy.policyCode);
    }
  }

  public static getEvidence(tenantId?: string): PolicyDecisionEvidence[] {
    if (!tenantId || tenantId === 'all') {
      return policyEvidenceLedger;
    }
    return policyEvidenceLedger.filter(ev => ev.tenantId === tenantId);
  }

  public static addPolicy(policy: AI_Governance_Policy): void {
    const existingIdx = activePolicies.findIndex(p => p.policyCode === policy.policyCode);
    if (existingIdx >= 0) {
      activePolicies[existingIdx] = policy;
    } else {
      activePolicies.push(policy);
    }
  }

  public static deletePolicy(policyCode: string): void {
    const idx = activePolicies.findIndex(p => p.policyCode === policyCode);
    if (idx >= 0) {
      activePolicies.splice(idx, 1);
    }
  }

  /**
   * Evaluates an incoming AI orchestrate request against corporate security policies.
   * Returns a decision (ALLOW / DENY / REDACT / BLOCK / REQUIRE_APPROVAL).
   */
  public static evaluate(request: {
    transactionId?: string;
    tenantId: string | null;
    appId: string;
    userOrKeyPrefix: string;
    capability: string;
    providerId: string;
    providerType: string;
    modelId: string;
    prompt: string;
    /** Deployment metadata for the selected provider; locality is resolved from this, not from the vendor type. */
    providerLocality?: ProviderLocalityInput;
  }): {
    decision: 'ALLOW' | 'DENY' | 'REDACT' | 'REQUIRE_APPROVAL' | 'RATE_LIMIT' | 'BLOCK';
    reason: string;
    policyCode: string;
    policyVersion: string;
    sanitizedPrompt?: string;
    providerLocality?: ReturnType<typeof resolveProviderLocality>;
  } {
const tenantId = request.tenantId || 'global';
    const locality = resolveProviderLocality({
      providerId: request.providerId,
      providerType: request.providerType,
      endpoint: request.providerLocality?.endpoint,
      onPremAttested: request.providerLocality?.onPremAttested,
      processingJurisdictions: request.providerLocality?.processingJurisdictions,
    });
    const applicable = activePolicies
      .filter(p => p.enabled && (p.tenantId === 'all' || p.tenantId === tenantId) && (!p.applicationIds?.length || p.applicationIds.includes('all') || p.applicationIds.includes(request.appId)))
      .sort((a, b) => POLICY_LAYER_ORDER.indexOf(a.layer || 'CUSTOMER') - POLICY_LAYER_ORDER.indexOf(b.layer || 'CUSTOMER'));
    const effective = this.resolveEffectivePolicy({ policies: activePolicies, tenantId, appId: request.appId });
    if (effective.decision === 'DENY') {
      const selected = applicable[applicable.length - 1] || activePolicies[0];
      const denied = this.logDecision(selected, tenantId, request, 'BLOCK', effective.reason);
      return { decision: 'BLOCK', reason: denied.reason, policyCode: selected.policyCode, policyVersion: selected.policyVersion, providerLocality: locality };
    }

    const estimatedPromptTokens = Math.ceil(request.prompt.length / 4);
    if (effective.rules.maxTokenLimit !== undefined && estimatedPromptTokens > effective.rules.maxTokenLimit) {
      const selected = applicable[applicable.length - 1] || activePolicies[0];
      const denied = this.logDecision(
        selected,
        tenantId,
        request,
        'BLOCK',
        `Prompt exceeds the effective maximum token limit of ${effective.rules.maxTokenLimit}.`,
      );
      return { decision: 'BLOCK', reason: denied.reason, policyCode: selected.policyCode, policyVersion: selected.policyVersion };
    }

    let sanitized = request.prompt;
    let didRedact = false;

    for (const policy of applicable) {
      const { rules } = policy;

      // 1. Prohibited Capabilities check
      if (rules.prohibitedCapabilities?.includes(request.capability)) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `Capability [${request.capability}] is explicitly prohibited by policy ${policy.policyCode}.`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 2. Permitted Capabilities check
      if (rules.permittedCapabilities && !rules.permittedCapabilities.includes(request.capability)) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `Capability [${request.capability}] is not in the permitted capabilities list.`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 3. Local-model-only check
      if (rules.localModelOnly && !locality.isLocalExecution) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `Provider [${request.providerId}] blocked: policy enforces local-model-only execution and this deployment is ${locality.locality}. ${locality.basis}`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion, providerLocality: locality };
      }

      // 4. External cloud provider block check
      if (rules.externalProviderBlock && locality.isExternalCloud) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `External cloud provider [${request.providerId}] is blocked by policy rules. ${locality.basis}`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion, providerLocality: locality };
      }

      // 4a. Declared data-residency allow-list check
      if (rules.dataResidency?.length && !residencySatisfied(rules.dataResidency, locality.declaredRegions)) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `Provider [${request.providerId}] does not satisfy the residency requirement [${rules.dataResidency.join(', ')}]. ${locality.basis}`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion, providerLocality: locality };
      }

      // 5. Permitted Providers allowlist
      if (rules.permittedProviders && !rules.permittedProviders.includes(request.providerId)) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `AI Provider [${request.providerId}] is not in the authorized provider allowlist.`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 6. Permitted Models allowlist
      if (rules.permittedModels && !rules.permittedModels.includes(request.modelId)) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `AI Model [${request.modelId}] is not in the authorized model allowlist.`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 7. Financial data handling
      const hasFinancial = /iban|account number|credit card|cvv|swift|routing number|bank balance/gi.test(request.prompt);
      if (rules.financialData === 'block' && hasFinancial) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', 'Un-tokenized sensitive banking data/financial credentials detected in request.');
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 8. PHI handling
      const hasMedical = /medical record|patient id|diagnosis|prescription|biometric data/gi.test(request.prompt);
      if (rules.phiHandling === 'block' && hasMedical) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', 'Un-encrypted protected health information (PHI) / medical records detected.');
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 9. PII handling
      if (rules.piiHandling === 'block' && (/@|phone|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/gi.test(request.prompt))) {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', 'Personally Identifiable Information (PII) blocked in raw prompt payload.');
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      if (rules.piiHandling === 'redact') {
        const before = sanitized;
        sanitized = sanitized
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]')
          .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
        if (sanitized !== before) {
          didRedact = true;
        }
      }
    }

    // Default ALLOW or REDACT decision
    const finalDecision = didRedact ? 'REDACT' : 'ALLOW';
    const reason = didRedact ? 'Personally Identifiable Information automatically scrubbed and redacted.' : 'Passed all active policy rules.';
    const selectedPolicy = applicable[applicable.length - 1] || activePolicies[0];

    this.logDecision(selectedPolicy, tenantId, request, finalDecision, reason);

    return {
      decision: finalDecision,
      reason,
      policyCode: selectedPolicy.policyCode,
      policyVersion: selectedPolicy.policyVersion,
      sanitizedPrompt: sanitized,
      providerLocality: locality
    };
  }

  private static logDecision(
    policy: AI_Governance_Policy,
    tenantId: string,
    req: { transactionId?: string; appId: string; userOrKeyPrefix: string; capability: string; providerId: string; modelId: string },
    decision: 'ALLOW' | 'DENY' | 'REDACT' | 'REQUIRE_APPROVAL' | 'RATE_LIMIT' | 'BLOCK',
    reason: string
  ): PolicyDecisionEvidence {
    const id = 'ev-' + crypto.randomBytes(8).toString('hex');
    const evidence: PolicyDecisionEvidence = {
      id,
      transactionId: req.transactionId,
      policyCode: policy.policyCode,
      policyVersion: policy.policyVersion,
      tenantId,
      appId: req.appId,
      userOrKeyPrefix: req.userOrKeyPrefix,
      capability: req.capability,
      providerId: req.providerId,
      modelId: req.modelId,
      decision,
      reason,
      timestamp: new Date().toISOString()
    };
    policyEvidenceLedger.unshift(evidence);
    publishPolicyEvidence(evidence);
    return evidence;
  }

  public static recordEvidence(evidence: {
    requestId: string;
    timestamp: string;
    tenantId: string;
    appId: string;
    modelId: string;
    providerId: string;
    decision: 'ALLOW' | 'DENY' | 'REDACT' | 'REQUIRE_APPROVAL' | 'RATE_LIMIT' | 'BLOCK';
    ruleApplied: string;
    details: string;
  }): void {
    const record: PolicyDecisionEvidence = {
      id: evidence.requestId,
      transactionId: evidence.requestId,
      policyCode: evidence.ruleApplied,
      policyVersion: '1.0.0',
      tenantId: evidence.tenantId,
      appId: evidence.appId,
      userOrKeyPrefix: 'SYSTEM',
      capability: 'general_ai',
      providerId: evidence.providerId,
      modelId: evidence.modelId,
      decision: evidence.decision,
      reason: evidence.details,
      timestamp: evidence.timestamp
    };
    policyEvidenceLedger.unshift(record);
    publishPolicyEvidence(record);
  }
}
