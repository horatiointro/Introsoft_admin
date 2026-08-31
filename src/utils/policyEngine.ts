import crypto from 'crypto';

export interface AI_Governance_Policy {
  policyCode: string;
  policyVersion: string;
  tenantId: string; // 'all' or specific tenant ID
  enabled: boolean;
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
  };
}

export interface PolicyDecisionEvidence {
  id: string;
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

export class PolicyEngine {
  public static getPolicies(tenantId?: string): AI_Governance_Policy[] {
    if (!tenantId || tenantId === 'all') {
      return activePolicies;
    }
    return activePolicies.filter(p => p.tenantId === 'all' || p.tenantId === tenantId);
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
    tenantId: string | null;
    appId: string;
    userOrKeyPrefix: string;
    capability: string;
    providerId: string;
    providerType: string;
    modelId: string;
    prompt: string;
  }): {
    decision: 'ALLOW' | 'DENY' | 'REDACT' | 'REQUIRE_APPROVAL' | 'RATE_LIMIT' | 'BLOCK';
    reason: string;
    policyCode: string;
    policyVersion: string;
    sanitizedPrompt?: string;
  } {
    const tenantId = request.tenantId || 'global';
    const applicable = activePolicies.filter(p => p.enabled && (p.tenantId === 'all' || p.tenantId === tenantId));

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
      if (rules.localModelOnly && request.providerType !== 'ollama') {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `SaaS cloud provider [${request.providerType}] blocked: policy enforces local-model-only on-prem execution.`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }

      // 4. External cloud provider block check
      if (rules.externalProviderBlock && request.providerType !== 'ollama') {
        const dec = this.logDecision(policy, tenantId, request, 'BLOCK', `External SaaS cloud provider [${request.providerType}] is blocked by policy rules.`);
        return { decision: 'BLOCK', reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
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
      sanitizedPrompt: sanitized
    };
  }

  private static logDecision(
    policy: AI_Governance_Policy,
    tenantId: string,
    req: { appId: string; userOrKeyPrefix: string; capability: string; providerId: string; modelId: string },
    decision: 'ALLOW' | 'DENY' | 'REDACT' | 'REQUIRE_APPROVAL' | 'RATE_LIMIT' | 'BLOCK',
    reason: string
  ): PolicyDecisionEvidence {
    const id = 'ev-' + crypto.randomBytes(8).toString('hex');
    const evidence: PolicyDecisionEvidence = {
      id,
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
    policyEvidenceLedger.unshift({
      id: evidence.requestId,
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
    });
  }
}
