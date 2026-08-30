import { Incident, ProblemRecord, MultiChannelAlert, RagKnowledgeArticle } from '../types';

export const INITIAL_RAG_KNOWLEDGE_BASE: RagKnowledgeArticle[] = [
  {
    id: 'rag-kb-001',
    title: 'Runbook: Resolving Upstream LLM Provider 504 Gateway Timeouts',
    category: 'runbook',
    content: `When upstream providers like OpenAI US-East or Gemini Cloud return 504 Gateway Timeout or P99 latency spikes > 1500ms:
1. Immediate L1 Action: Trigger 'Reroute to Groq LPU' or 'Reroute to Local Ollama GPU Cluster' on the ALTIL Routing Matrix.
2. Verify if the tenant has active SLA penalty countdowns. If SLA breach < 15 mins, page BOC Commander.
3. Flush Redis rate limit cache keys for the affected tenant app using the ALTIL Admin CLI: redis-cli DEL "tenant:rate:{tenantId}".
4. Verify circuit breaker state. If tripped, check whether automated failover succeeded or if manual override is required.`,
    keywords: ['504', 'timeout', 'latency', 'gateway', 'groq', 'ollama', 'circuit breaker'],
    relatedErrorCodes: ['504', '502', 'ERR_UPSTREAM_TIMEOUT'],
    updatedAt: '2026-08-25'
  },
  {
    id: 'rag-kb-002',
    title: 'Statutory Guidance: POPIA Section 72 Cross-Border Data Transfer Mitigation',
    category: 'compliance',
    content: `Under South Africa POPIA Section 72, personal information cannot be transferred outside South Africa unless the recipient is subject to adequate data protection laws or binding corporate rules.
In the event of a Section 72 warning or Special Category Data leak:
1. Immediately switch the affected application route to 'Ollama Local Sovereign Cluster' (Johannesburg On-Prem GPU).
2. Contact Information Officer (Elena Rostova / Adv. Willem Van Zyl).
3. Generate an audit hash report from /api/v1/compliance/audit-hash for statutory reporting.
4. Ensure all unredacted prompt payloads in temporary buffers are purged immediately.`,
    keywords: ['POPIA', 'Section 72', 'cross-border', 'PII', 'sovereign', 'Ollama', 'special category'],
    relatedErrorCodes: ['422_POPIA_SECTION72', 'BLOCKED_BY_POLICY'],
    updatedAt: '2026-08-28'
  },
  {
    id: 'rag-kb-003',
    title: 'SLA Mitigation: Contractual Credit Penalty Minimization Matrix',
    category: 'sla_policy',
    content: `For Enterprise Platinum 99.95% SLA customers (FNB, Standard Bank, Discovery Health):
- P1 Outage Response SLA Target: 15 minutes.
- P1 Fix/Mitigation SLA Target: 2 hours.
- Penalty: 10% monthly billing credit if total downtime exceeds 15 minutes in a calendar month.
- Remediation Protocol:
  a. Acknowledge incident within 3 minutes of alert.
  b. Execute 1-click fallback to secondary model.
  c. Issue automated customer executive alert email & SMS to statutory officer.
  d. Open Post-Incident Review (PIR) within 1 hour of resolution.`,
    keywords: ['SLA', 'credit penalty', 'FNB', 'Discovery', 'Platinum', 'P1', 'response target'],
    relatedErrorCodes: ['SLA_BREACH_WARNING', 'P1_INCIDENT'],
    updatedAt: '2026-08-29'
  },
  {
    id: 'rag-kb-004',
    title: 'Post-Mortem INC-2026-880: SAP Billing Webhook Signature Validation Failure',
    category: 'post_mortem',
    content: `Root Cause: SAP S/4HANA Enterprise Cloud rotated HMAC SHA-256 webhook signing keys without updating the ALTIL License Service vault secrets.
Resolution:
1. Added automated key rotation verification endpoint.
2. Implemented secondary fallback key verification in /api/v1/licensing/webhook.
3. Updated level 2 support playbook to test SAP webhook secret parity on billing cycle dates.`,
    keywords: ['SAP', 'webhook', 'licensing', 'HMAC', 'billing', 'signature'],
    relatedErrorCodes: ['401_WEBHOOK_UNAUTHORIZED', 'PAYMENT_VERIFICATION_FAILED'],
    updatedAt: '2026-08-20'
  }
];

export const INITIAL_INCIDENTS_LIST: Incident[] = [
  {
    id: 'INC-2026-901',
    title: 'P1 CRITICAL: High Latency & 504 Timeout Spike on OpenAI Gateway for FNB Customer Support',
    severity: 'P1_CRITICAL',
    status: 'investigating',
    commander: 'Horatio Huxham (BOC Commander)',
    assignedTeam: 'NOC',
    assignedEngineer: 'Tebogo Molefe (Principal Systems Engineer)',
    affectedTenantIds: ['cust-fnb', 'cust-std-bank'],
    affectedTenantNames: ['First National Bank (FNB)', 'Standard Bank Group'],
    affectedAppIds: ['app-fnb-support', 'app-std-bank-fraud'],
    affectedAppNames: ['FNB Customer Support AI Bot', 'Standard Bank Fraud Analyzer'],
    affectedServiceIds: ['srv-01', 'srv-04'],
    startTime: '2026-08-30 03:45:10',
    estimatedResolutionTime: '2026-08-30 04:30:00',
    slaImpacted: true,
    slaBreachMinutes: 8,
    category: 'Provider_Outage',
    summary: 'OpenAI US-East region experiencing severe P99 latency degradation (1,850ms) causing gateway timeouts and 504 errors on high-frequency customer support channels.',
    
    alertChannels: ['sms', 'email', 'in_app'],
    smsAlertSent: true,
    emailAlertSent: true,
    inAppAlertSent: true,

    bocDetails: {
      revenueAtRiskUsdPerHour: 14500,
      slaCreditPenaltyPercent: 10,
      breachCountdownMinutes: 7,
      affectedTenantTier: 'Enterprise Platinum 99.95%',
      contractImpactSummary: 'Potential R45,000 SLA penalty credit if resolution exceeds 15 minutes. FNB CISO notified.',
      customerExecutiveNotified: true,
      accountManagerName: 'Thabo Mbeki (Key Account Executive)'
    },

    socDetails: {
      threatClassification: 'Nominal Service Degradation (No Security Breach)',
      threatVector: 'Upstream Provider API Bottleneck',
      auditHash: '0x8f2a9918c4d291e10283fa71b00192a8321d',
      sourceIp: '196.25.1.42 (FNB Primary Ingress)',
      informationOfficerPaged: false,
      complianceRiskRating: 'LOW'
    },

    nocDetails: {
      p50LatencyMs: 840,
      p95LatencyMs: 1420,
      p99LatencyMs: 2450,
      httpStatusCodeDistribution: { '504': 148, '429': 22, '200': 1840 },
      upstreamProviderHealth: [
        { name: 'OpenAI Direct Gateway', status: 'degraded', latencyMs: 1850 },
        { name: 'Groq Cloud LPU', status: 'online', latencyMs: 82 },
        { name: 'Ollama Local Cluster', status: 'online', latencyMs: 140 },
        { name: 'Google Gemini Cloud', status: 'online', latencyMs: 290 }
      ],
      activeCircuitBreaker: true,
      gatewayNodeCpuRam: 'CPU 42% | RAM 6.2GB / 16GB'
    },

    level1Details: {
      triageChecklist: [
        { step: 'Confirm upstream provider outage status page', done: true },
        { step: 'Activate dynamic model fallback to Groq LPU', done: true },
        { step: 'Verify FNB customer support response rates', done: false },
        { step: 'Send status update to FNB Operations Desk', done: true }
      ],
      recommendedActions: [
        'Reroute 100% of app-fnb-support traffic to Groq Llama 3.3 LPU',
        'Flush rate limit buffer cache for tenant cust-fnb',
        'Issue SMS update to FNB SOC Commander'
      ],
      suggestedFallbackModel: 'Groq Llama 3.3 70B Versatile',
      oneClickMitigationAvailable: true
    },

    level2Details: {
      rootCauseHypotheses: [
        { hypothesis: 'OpenAI US-East region BGP route degradation & packet loss', probabilityPercent: 75 },
        { hypothesis: 'Rate limit bucket overflow on OpenAI organization key', probabilityPercent: 20 },
        { hypothesis: 'Local gateway socket exhaustion', probabilityPercent: 5 }
      ],
      stackTraceSnippet: `Error: Upstream HTTP 504 Gateway Timeout
  at OpenAIClient.dispatchInference (/server.ts:1774:11)
  at async routeInferenceRequest (/server.ts:1758:9)
  at async /api/v1/orchestrate (server.ts:1620:5)`,
      recentDeploymentsCorrelated: ['CHG-2026-089: Groq Llama 3.3 70B Fallback Node (02:00:00)'],
      payloadHeaderDiff: 'x-openai-processing-ms: 5001 (Exceeded timeout threshold 3000ms)'
    },

    level3Details: {
      rawRequestPayloadJson: JSON.stringify({
        appId: 'app-fnb-support',
        capability: 'fast_chat',
        prompt: 'User: How do I increase my daily EFT transfer limit on the FNB banking app?',
        tenantId: 'cust-fnb'
      }, null, 2),
      rawResponsePayloadJson: JSON.stringify({
        error: {
          code: 504,
          message: 'Upstream provider OpenAI timed out after 3000ms',
          fallbackTriggered: true,
          fallbackProvider: 'Groq Cloud LPU'
        }
      }, null, 2),
      databaseLockStatus: 'MariaDB 10.11.18 connection pool healthy (0 deadlocks, 2 active connections)',
      jiraTicketUrl: 'https://jira.introsoft.internal/browse/ALTIL-1042',
      gitHubIssueUrl: 'https://github.com/introsoft/altil-platform/issues/482',
      suggestedCodePatch: `// Adjust client timeout threshold for primary provider fallback
const TIMEOUT_THRESHOLD_MS = 2000; // Reduced from 3000ms to failover faster`
    },

    timeline: [
      { timestamp: '03:45:10', author: 'Automated NOC Monitor', note: 'Detected 148 HTTP 504 Gateway Timeout errors on OpenAI endpoint within 60s.', channelTriggered: 'In-App Alert' },
      { timestamp: '03:46:00', author: 'ALTIL Alerting Engine', note: 'Dispatched SMS alert to Horatio Huxham (+27 82 555 0192) & Email to admin@fnb.co.za.', channelTriggered: 'SMS & Email' },
      { timestamp: '03:48:30', author: 'Tebogo Molefe', note: 'Activated automated failover to Groq LPU. Latency dropped from 1,850ms to 92ms.', channelTriggered: 'System Action' }
    ],

    postIncidentReview: {
      rootCause: 'OpenAI US-East region BGP network routing instability.',
      customerImpact: '148 customer support interactions experienced 3s delay before fallback.',
      detectionMethod: 'Automated ALTIL Gateway P99 Latency Monitor',
      correctiveActions: [
        'Decreased fallback timeout threshold from 3000ms to 1800ms.',
        'Configured active-active load balancing between Groq and Gemini.'
      ],
      preventiveActions: [
        'Deploy dedicated local Ollama fallback cluster for FNB high-availability tiers.'
      ],
      owner: 'Tebogo Molefe',
      dueDate: '2026-09-02',
      status: 'in_progress'
    }
  },

  {
    id: 'INC-2026-902',
    title: 'P2 HIGH: POPIA Section 72 Cross-Border Compliance Warning on Discovery Medical Claims',
    severity: 'P2_HIGH',
    status: 'assigned',
    commander: 'Elena Rostova (Compliance Director)',
    assignedTeam: 'SOC',
    assignedEngineer: 'Adv. Willem Van Zyl (Information Security Lead)',
    affectedTenantIds: ['cust-discovery'],
    affectedTenantNames: ['Discovery Health SA'],
    affectedAppIds: ['app-discovery-claims'],
    affectedAppNames: ['Discovery Medical Claims Auto-Assessor'],
    affectedServiceIds: ['srv-03'],
    startTime: '2026-08-30 01:15:00',
    slaImpacted: false,
    category: 'Security_POPIA',
    summary: 'Special Category Health Data prompt containing ICD-10 medical diagnostic codes was routed to an unapproved non-EU cloud node without explicit consent proof header.',

    alertChannels: ['email', 'in_app'],
    smsAlertSent: false,
    emailAlertSent: true,
    inAppAlertSent: true,

    bocDetails: {
      revenueAtRiskUsdPerHour: 0,
      slaCreditPenaltyPercent: 0,
      breachCountdownMinutes: 120,
      affectedTenantTier: 'Enterprise Strategic Government',
      contractImpactSummary: 'Statutory compliance review required under Discovery Health DPA.',
      customerExecutiveNotified: true,
      accountManagerName: 'Elena Rostova'
    },

    socDetails: {
      threatClassification: 'POPIA Section 72 Trans-Border Regulatory Warning',
      popiaSectionClause: 'POPIA Section 72 / Part B Special Personal Information',
      threatVector: 'Unsanitized Prompt Payload with Medical ICD-10 Codes',
      auditHash: '0x9918a24c0d12e84712039ab18420e71',
      sourceIp: '105.22.14.88 (Discovery Health Private Node)',
      informationOfficerPaged: true,
      complianceRiskRating: 'HIGH'
    },

    nocDetails: {
      p50LatencyMs: 120,
      p95LatencyMs: 180,
      p99LatencyMs: 290,
      httpStatusCodeDistribution: { '422': 14, '200': 520 },
      upstreamProviderHealth: [
        { name: 'Ollama Local Cluster', status: 'online', latencyMs: 140 },
        { name: 'Google Gemini Cloud', status: 'online', latencyMs: 310 }
      ],
      activeCircuitBreaker: false,
      gatewayNodeCpuRam: 'CPU 28% | RAM 5.1GB / 16GB'
    },

    level1Details: {
      triageChecklist: [
        { step: 'Check if PII Sanitizer mask rules are enabled for app-discovery-claims', done: true },
        { step: 'Force app-discovery-claims route to Local Ollama Sovereign Cluster', done: true },
        { step: 'Log Data Protection Impact Assessment (DPIA) entry', done: false }
      ],
      recommendedActions: [
        'Enforce 100% on-premise local Ollama processing for Discovery Health',
        'Enable POPIA Part B strict blocking filter'
      ],
      suggestedFallbackModel: 'Llama 3.3 70B (Ollama Local Johannesburg)',
      oneClickMitigationAvailable: true
    },

    level2Details: {
      rootCauseHypotheses: [
        { hypothesis: 'Missing X-Consent-Proof-Header in Discovery Claims API request', probabilityPercent: 90 },
        { hypothesis: 'New ICD-10 medical code regex not updated in baseline policy', probabilityPercent: 10 }
      ],
      stackTraceSnippet: `PolicyViolationError: POPIA Section 72 Trans-Border Restriction
  at scanAndSanitizePrompt (/src/utils/complianceEngine.ts:84:12)
  at routeInferenceRequest (/server.ts:1650:9)`,
      recentDeploymentsCorrelated: ['CHG-2026-090: Update POPIA PII Redactor Regex (2026-08-28)'],
      payloadHeaderDiff: 'Missing: X-POPIA-Consent-Proof: "GRANTED_PATIENT_OPT_IN"'
    },

    level3Details: {
      rawRequestPayloadJson: JSON.stringify({
        appId: 'app-discovery-claims',
        prompt: 'Patient ID 9208145028081 diagnosed with ICD-10 J45.9 asthma. Assess claim value.',
        destinationRegion: 'US-East'
      }, null, 2),
      rawResponsePayloadJson: JSON.stringify({
        status: 'FLAGGED_FOR_REVIEW',
        actionTaken: 'REDACTED_FORWARDED',
        popiaViolations: [
          {
            framework: 'POPIA',
            clause: 'Section 72',
            description: 'Trans-border transfer of Special Category Personal Information without verified consent header.'
          }
        ]
      }, null, 2),
      databaseLockStatus: 'Audit ledger table populated with encrypted cryptographic hash',
      jiraTicketUrl: 'https://jira.introsoft.internal/browse/COMP-882'
    },

    timeline: [
      { timestamp: '01:15:00', author: 'POPIA Compliance Engine', note: 'Flagged trans-border medical payload without consent proof header.', channelTriggered: 'In-App & Email' },
      { timestamp: '01:18:00', author: 'Elena Rostova', note: 'Assigned incident to Adv. Willem Van Zyl for DPIA legal verification.', channelTriggered: 'In-App Alert' }
    ]
  },

  {
    id: 'INC-2026-903',
    title: 'P3 MEDIUM: Rate Limit 429 Throttle Warning on MTN Call Center Assistant',
    severity: 'P3_MEDIUM',
    status: 'mitigated',
    commander: 'Sipho Nkosi (NOC Specialist)',
    assignedTeam: 'Level_1',
    assignedEngineer: 'Johan Pretorius',
    affectedTenantIds: ['cust-mtn'],
    affectedTenantNames: ['MTN Group'],
    affectedAppIds: ['app-mtn-assistant'],
    affectedAppNames: ['MTN Call Center Agent Assistant'],
    affectedServiceIds: ['srv-01'],
    startTime: '2026-08-29 18:20:00',
    resolvedTime: '2026-08-29 18:42:00',
    slaImpacted: false,
    category: 'Latency_Spike',
    summary: 'MTN Call Center application reached 88% of configured RPM quota during evening surge, causing temporary 429 rate limit warnings.',

    alertChannels: ['in_app'],
    smsAlertSent: false,
    emailAlertSent: false,
    inAppAlertSent: true,

    bocDetails: {
      revenueAtRiskUsdPerHour: 1200,
      slaCreditPenaltyPercent: 0,
      breachCountdownMinutes: 0,
      affectedTenantTier: 'Enterprise Growth Tier',
      contractImpactSummary: 'Quota recommendation sent to MTN Account Executive for Q4 upgrade.',
      customerExecutiveNotified: false,
      accountManagerName: 'Thabo Mbeki'
    },

    socDetails: {
      threatClassification: 'Legitimate High-Volume Traffic Peak',
      threatVector: 'None (Authorized API Keys)',
      auditHash: '0x1029384756afbce',
      sourceIp: '196.11.240.12 (MTN Core Router)',
      informationOfficerPaged: false,
      complianceRiskRating: 'LOW'
    },

    nocDetails: {
      p50LatencyMs: 140,
      p95LatencyMs: 210,
      p99LatencyMs: 380,
      httpStatusCodeDistribution: { '429': 18, '200': 3400 },
      upstreamProviderHealth: [
        { name: 'Groq Cloud LPU', status: 'online', latencyMs: 84 }
      ],
      activeCircuitBreaker: false,
      gatewayNodeCpuRam: 'CPU 35% | RAM 4.8GB / 16GB'
    },

    level1Details: {
      triageChecklist: [
        { step: 'Check tenant RPM quota threshold', done: true },
        { step: 'Temporarily increase burst RPM limit to 8,000 RPM', done: true },
        { step: 'Confirm 429 errors cleared', done: true }
      ],
      recommendedActions: [
        'Apply temporary 20% burst RPM buffer for MTN Call Center app'
      ],
      suggestedFallbackModel: 'Groq Llama 3.1 8B Instant',
      oneClickMitigationAvailable: true
    },

    timeline: [
      { timestamp: '18:20:00', author: 'ALTIL Quota Monitor', note: 'MTN Call Center app exceeded 85% RPM quota (5,100 / 6,000 RPM).', channelTriggered: 'In-App Alert' },
      { timestamp: '18:25:00', author: 'Sipho Nkosi', note: 'Applied temporary burst limit buffer (+2,000 RPM). 429 errors resolved.', channelTriggered: 'System Action' },
      { timestamp: '18:42:00', author: 'Sipho Nkosi', note: 'Marked incident as Mitigated. Quota upgrade proposal generated.', channelTriggered: 'In-App Alert' }
    ]
  },

  {
    id: 'INC-2026-904',
    title: 'P4 LOW: Minor Model Parameter Drift on Vodacom Churn Predictor',
    severity: 'P4_LOW',
    status: 'resolved',
    commander: 'Tebogo Molefe',
    assignedTeam: 'Level_2',
    assignedEngineer: 'Tebogo Molefe',
    affectedTenantIds: ['cust-vodacom'],
    affectedTenantNames: ['Vodacom Group'],
    affectedAppIds: ['app-vodacom-churn'],
    affectedAppNames: ['Vodacom Churn Prediction Engine'],
    affectedServiceIds: ['srv-01'],
    startTime: '2026-08-28 14:10:00',
    resolvedTime: '2026-08-28 15:00:00',
    slaImpacted: false,
    category: 'Model_Drift',
    summary: 'Temperature parameter variance (0.7 vs 0.2) caused minor formatting inconsistencies in structured JSON churn predictions.',

    alertChannels: ['in_app'],
    smsAlertSent: false,
    emailAlertSent: false,
    inAppAlertSent: true,

    timeline: [
      { timestamp: '14:10:00', author: 'Model Quality Scanner', note: 'Detected JSON schema validation failure rate of 2.1%.', channelTriggered: 'In-App Alert' },
      { timestamp: '14:30:00', author: 'Tebogo Molefe', note: 'Locked temperature parameter to 0.1 for deterministic JSON outputs.', channelTriggered: 'System Action' },
      { timestamp: '15:00:00', author: 'Tebogo Molefe', note: 'Schema validation success returned to 100%. Resolved.', channelTriggered: 'In-App Alert' }
    ]
  }
];

export const INITIAL_ALERTS_LIST: MultiChannelAlert[] = [
  {
    id: 'alt-001',
    incidentId: 'INC-2026-901',
    incidentTitle: 'P1 CRITICAL: High Latency & 504 Timeout Spike on OpenAI Gateway',
    severity: 'P1_CRITICAL',
    timestamp: '2026-08-30 03:46:00',
    tenantName: 'First National Bank (FNB)',
    appName: 'FNB Customer Support AI Bot',
    message: '[ALTIL P1 ALERT] OpenAI Gateway experiencing 504 timeouts. SLA Breach Countdown: 7 mins. Rerouting to Groq LPU active.',
    channels: ['sms', 'email', 'in_app'],
    recipientPhone: '+27 82 555 0192',
    recipientEmail: 'horatio.huxham@gmail.com',
    smsStatus: 'sent',
    emailStatus: 'sent',
    inAppStatus: 'delivered',
    isRead: false
  },
  {
    id: 'alt-002',
    incidentId: 'INC-2026-902',
    incidentTitle: 'P2 HIGH: POPIA Section 72 Cross-Border Compliance Warning',
    severity: 'P2_HIGH',
    timestamp: '2026-08-30 01:15:00',
    tenantName: 'Discovery Health SA',
    appName: 'Discovery Medical Claims Auto-Assessor',
    message: '[ALTIL COMPLIANCE ALERT] Special Category Medical Data prompt flagged for cross-border adequacy check.',
    channels: ['email', 'in_app'],
    recipientEmail: 'elena.rostova@discovery.co.za',
    smsStatus: 'queued',
    emailStatus: 'sent',
    inAppStatus: 'delivered',
    isRead: false
  },
  {
    id: 'alt-003',
    incidentId: 'INC-2026-903',
    incidentTitle: 'P3 MEDIUM: Rate Limit 429 Throttle Warning on MTN',
    severity: 'P3_MEDIUM',
    timestamp: '2026-08-29 18:20:00',
    tenantName: 'MTN Group',
    appName: 'MTN Call Center Agent Assistant',
    message: '[ALTIL CAPACITY WARNING] App reached 88% of RPM quota limit. Temporary burst buffer recommended.',
    channels: ['in_app'],
    smsStatus: 'queued',
    emailStatus: 'queued',
    inAppStatus: 'read',
    isRead: true
  }
];

export const INITIAL_PROBLEMS_LIST: ProblemRecord[] = [
  {
    id: 'PRB-2026-041',
    title: 'Upstream LLM Provider Transient Socket Exhaustion under Peak Concurrency',
    rootCause: 'Connection pool starvation in Node.js HTTP keep-alive sockets during concurrent burst queries > 2,000 RPM.',
    affectedServices: ['ALTIL AI Gateway & Policy Engine', 'Groq Ultra-Fast LPU Acceleration Service'],
    relatedIncidentIds: ['INC-2026-901', 'INC-2026-880'],
    correctiveAction: 'Configured maxSockets = 500 and enabled HTTP/2 multiplexing on upstream provider adapters.',
    preventiveAction: 'Deploy Redis-backed distributed connection rate limiter across multi-region gateway nodes.',
    knownError: true,
    status: 'under_review',
    createdAt: '2026-08-28'
  },
  {
    id: 'PRB-2026-042',
    title: 'POPIA Consent Proof Header Omission in Client REST SDKs',
    rootCause: 'Legacy client application REST headers omit X-POPIA-Consent-Proof header on batch claims endpoints.',
    affectedServices: ['POPIA & GDPR Statutory AI Governance Guard'],
    relatedIncidentIds: ['INC-2026-902'],
    correctiveAction: 'Updated ALTIL Client SDK v2.4 to auto-inject client consent metadata.',
    preventiveAction: 'Enforce mandatory header linting at API Gateway ingress.',
    knownError: true,
    status: 'open',
    createdAt: '2026-08-29'
  }
];
