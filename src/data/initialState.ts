import {
  AIProvider,
  AIModel,
  Customer,
  CustomerUser,
  StatutoryOfficers,
  Application,
  ApiKey,
  RoutingRule,
  AIPolicy,
  GlobalComplianceConfig,
  DataSubjectRequest,
  AuditLog,
  SystemHealthItem
} from '../types';

export const INITIAL_PROVIDERS: AIProvider[] = [
  {
    id: 'p-openai',
    name: 'OpenAI Direct Gateway',
    type: 'openai',
    endpoint: 'https://api.openai.com/v1',
    apiKey: 'sk-proj-altil_live_4918f8e02914ba82c91028',
    keyPrefix: 'sk-proj-...82c9',
    organizationId: 'org-introsoft-eu',
    enabled: true,
    status: 'online',
    latencyMs: 260,
    p95LatencyMs: 410,
    uptimePercent: 99.98,
    errorRate: 0.01,
    priority: 1,
    timeoutMs: 30000,
    rateLimitRpm: 10000,
    rateLimitTpm: 2000000,
    hasFreeTier: false,
    freeModelsCount: 0,
    modelsCount: 4,
    totalRequests: 8420,
    tokensTotal: 18450000,
    costTotal: 28.45,
    lastTested: '2026-08-29 10:32:00',
    notes: 'Enterprise Tier 5 direct OpenAI interconnect. Primary reasoning engine for GPT-4o and o3-mini.'
  },
  {
    id: 'p-groq',
    name: 'Groq Cloud LPU',
    type: 'groq',
    endpoint: 'https://api.groq.com/openai/v1',
    apiKey: 'gsk_99a84f39c09d8174e921',
    keyPrefix: 'gsk_...e921',
    enabled: true,
    status: 'online',
    latencyMs: 84,
    p95LatencyMs: 140,
    uptimePercent: 99.99,
    errorRate: 0.05,
    priority: 2,
    timeoutMs: 10000,
    rateLimitRpm: 6000,
    rateLimitTpm: 500000,
    hasFreeTier: true,
    freeModelsCount: 4,
    modelsCount: 6,
    totalRequests: 14605,
    tokensTotal: 29800000,
    costTotal: 3.12,
    lastTested: '2026-08-29 10:29:40',
    notes: 'Ultra-fast LPU inference (500+ tokens/sec). Includes generous free tier models and low latency fallback.'
  },
  {
    id: 'p-ollama',
    name: 'Ollama Local Cluster',
    type: 'ollama',
    endpoint: 'http://192.168.1.100:11434',
    apiKey: '',
    keyPrefix: 'No Auth (Local Socket)',
    enabled: true,
    status: 'online',
    latencyMs: 142,
    p95LatencyMs: 230,
    uptimePercent: 100.0,
    errorRate: 0.12,
    priority: 3,
    timeoutMs: 15000,
    rateLimitRpm: 1200,
    hasFreeTier: true,
    freeModelsCount: 5,
    modelsCount: 5,
    totalRequests: 21420,
    tokensTotal: 44200000,
    costTotal: 0.00,
    lastTested: '2026-08-29 10:28:15',
    notes: 'Local on-prem GPU cluster (4x RTX 4090). 100% free zero-cost private inference for internal datasets.'
  },
  {
    id: 'p-gemini',
    name: 'Google Gemini Cloud',
    type: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com',
    apiKey: 'AIzaSy_altil_gemini_prod_key',
    keyPrefix: 'AIzaSy_...prod',
    enabled: true,
    status: 'online',
    latencyMs: 310,
    p95LatencyMs: 480,
    uptimePercent: 99.95,
    errorRate: 0.02,
    priority: 4,
    timeoutMs: 25000,
    rateLimitRpm: 4000,
    hasFreeTier: true,
    freeModelsCount: 3,
    modelsCount: 5,
    totalRequests: 6396,
    tokensTotal: 14200000,
    costTotal: 4.80,
    lastTested: '2026-08-29 10:30:10',
    notes: 'Enterprise multimodal & massive context window tier (1M-2M tokens) with Gemini 2.0 Flash free quota.'
  },
  {
    id: 'p-openrouter',
    name: 'OpenRouter Multi-Cloud Aggregator',
    type: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1',
    apiKey: 'sk-or-v1-99824cde871a2b',
    keyPrefix: 'sk-or-v1-...1a2b',
    customHeaders: { 'HTTP-Referer': 'https://introsoft.internal', 'X-Title': 'Introsoft ALTIL' },
    enabled: true,
    status: 'online',
    latencyMs: 380,
    p95LatencyMs: 590,
    uptimePercent: 99.85,
    errorRate: 0.15,
    priority: 5,
    timeoutMs: 20000,
    rateLimitRpm: 2000,
    hasFreeTier: true,
    freeModelsCount: 4,
    modelsCount: 8,
    totalRequests: 2890,
    tokensTotal: 6900000,
    costTotal: 5.60,
    lastTested: '2026-08-29 09:15:22',
    notes: 'Universal gateway providing Claude 3.5 Sonnet, free community models (:free), and global fallback routes.'
  },
  {
    id: 'p-anthropic',
    name: 'Anthropic Claude Direct',
    type: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-api03-altil_direct_key_9921',
    keyPrefix: 'sk-ant-...9921',
    enabled: true,
    status: 'online',
    latencyMs: 340,
    p95LatencyMs: 510,
    uptimePercent: 99.97,
    errorRate: 0.01,
    priority: 6,
    timeoutMs: 30000,
    rateLimitRpm: 4000,
    hasFreeTier: false,
    freeModelsCount: 0,
    modelsCount: 3,
    totalRequests: 1840,
    tokensTotal: 4100000,
    costTotal: 12.30,
    lastTested: '2026-08-29 09:45:00',
    notes: 'Direct Anthropic API for complex document synthesis and rigorous safety-aligned code generation.'
  },
  {
    id: 'p-deepseek',
    name: 'DeepSeek Official API',
    type: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1',
    apiKey: 'sk-ds-99218ab4401c29e',
    keyPrefix: 'sk-ds-...c29e',
    enabled: true,
    status: 'online',
    latencyMs: 290,
    p95LatencyMs: 440,
    uptimePercent: 99.80,
    errorRate: 0.08,
    priority: 7,
    timeoutMs: 25000,
    rateLimitRpm: 3000,
    hasFreeTier: true,
    freeModelsCount: 2,
    modelsCount: 2,
    totalRequests: 3410,
    tokensTotal: 8900000,
    costTotal: 1.45,
    lastTested: '2026-08-29 10:10:00',
    notes: 'DeepSeek V3 and R1 reasoning API at ultra-competitive pricing with starting free credits.'
  },
  {
    id: 'p-mvi-dedicated',
    name: 'MVI Dedicated Neural Server',
    type: 'openai_compatible',
    endpoint: 'https://ai-node.mvisecure.internal:8080/v1',
    apiKey: 'mvi_sec_tok_991823',
    keyPrefix: 'mvi_sec_...1823',
    enabled: false,
    status: 'offline',
    latencyMs: 0,
    p95LatencyMs: 0,
    uptimePercent: 94.20,
    errorRate: 0.0,
    priority: 8,
    timeoutMs: 12000,
    rateLimitRpm: 500,
    hasFreeTier: true,
    freeModelsCount: 2,
    modelsCount: 2,
    totalRequests: 110,
    tokensTotal: 250000,
    costTotal: 0.00,
    lastTested: '2026-08-29 08:00:00',
    notes: 'Isolated hardware enclave for classified banking workflows (Scheduled maintenance).'
  }
];

export const INITIAL_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'm-gpt4o',
    modelIdentifier: 'gpt-4o',
    providerId: 'p-openai',
    providerName: 'OpenAI Direct Gateway',
    displayName: 'GPT-4o Omnimodal Flagship',
    status: 'online',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    enabled: true,
    isFree: false,
    capabilities: ['general_ai', 'document_analysis', 'code_generation', 'financial_summary', 'security_analysis'],
    costPer1kInput: 0.0025,
    costPer1kOutput: 0.0100,
    averageLatencyMs: 280,
    tokensPerSecond: 95,
    description: 'High-intelligence flagship model with multimodal inputs and swift reasoning capabilities.'
  },
  {
    id: 'm-gpt4o-mini',
    modelIdentifier: 'gpt-4o-mini',
    providerId: 'p-openai',
    providerName: 'OpenAI Direct Gateway',
    displayName: 'GPT-4o Mini (Cost Optimized)',
    status: 'online',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    enabled: true,
    isFree: false,
    capabilities: ['general_ai', 'fast_chat', 'document_analysis', 'data_extraction'],
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.00060,
    averageLatencyMs: 160,
    tokensPerSecond: 130,
    description: 'Ultra-fast, cost-efficient model for high-frequency operations, chat, and light synthesis.'
  },
  {
    id: 'm-o3-mini',
    modelIdentifier: 'o3-mini',
    providerId: 'p-openai',
    providerName: 'OpenAI Direct Gateway',
    displayName: 'o3-mini STEM & Logic Reasoner',
    status: 'online',
    contextWindow: 200000,
    maxOutputTokens: 100000,
    enabled: true,
    isFree: false,
    capabilities: ['code_generation', 'financial_summary', 'security_analysis'],
    costPer1kInput: 0.0011,
    costPer1kOutput: 0.0044,
    averageLatencyMs: 420,
    tokensPerSecond: 85,
    description: 'Deep mathematical & software reasoning model with configurable reasoning effort tiers.'
  },
  // Groq Models
  {
    id: 'm-llama33-70b',
    modelIdentifier: 'llama-3.3-70b-versatile',
    providerId: 'p-groq',
    providerName: 'Groq Cloud LPU',
    displayName: 'Llama 3.3 70B Versatile (Free Tier / High Speed)',
    status: 'online',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: true,
    capabilities: ['general_ai', 'document_analysis', 'fast_chat', 'data_extraction'],
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
    averageLatencyMs: 95,
    tokensPerSecond: 450,
    description: 'High performance LPU-accelerated reasoning model with sub-second response times and free daily rate limits.'
  },
  {
    id: 'm-llama31-8b',
    modelIdentifier: 'llama-3.1-8b-instant',
    providerId: 'p-groq',
    providerName: 'Groq Cloud LPU',
    displayName: 'Llama 3.1 8B Instant (Free Tier)',
    status: 'online',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: true,
    capabilities: ['fast_chat', 'general_ai', 'data_extraction'],
    costPer1kInput: 0.00005,
    costPer1kOutput: 0.00008,
    averageLatencyMs: 45,
    tokensPerSecond: 750,
    description: 'Blazing fast sub-50ms inference model ideal for real-time validation and streaming agents.'
  },
  {
    id: 'm-deepseek-r1-groq',
    modelIdentifier: 'deepseek-r1-distill-llama-70b',
    providerId: 'p-groq',
    providerName: 'Groq Cloud LPU',
    displayName: 'DeepSeek R1 Distill 70B (Groq)',
    status: 'online',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    enabled: true,
    isFree: true,
    capabilities: ['financial_summary', 'security_analysis', 'document_analysis', 'code_generation'],
    costPer1kInput: 0.00075,
    costPer1kOutput: 0.00099,
    averageLatencyMs: 140,
    tokensPerSecond: 320,
    description: 'Chain-of-thought mathematical reasoning model on ultra-fast Groq LPU hardware.'
  },
  // Ollama Local Models
  {
    id: 'm-qwen36',
    modelIdentifier: 'qwen3.6:16k',
    providerId: 'p-ollama',
    providerName: 'Ollama Local Cluster',
    displayName: 'Qwen 3.6 (16K Context - Free On-Prem)',
    status: 'online',
    contextWindow: 16384,
    maxOutputTokens: 4096,
    enabled: true,
    isFree: true,
    capabilities: ['general_ai', 'code_generation', 'fast_chat', 'security_analysis'],
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
    averageLatencyMs: 180,
    tokensPerSecond: 80,
    description: 'Self-hosted instruction-tuned model running on local GPU cluster with zero API cost and full data privacy.'
  },
  {
    id: 'm-sec-analyst',
    modelIdentifier: 'sec-analyst-7b',
    providerId: 'p-ollama',
    providerName: 'Ollama Local Cluster',
    displayName: 'Specialised Security Analyst 7B (Free Local)',
    status: 'online',
    contextWindow: 32768,
    maxOutputTokens: 4096,
    enabled: true,
    isFree: true,
    capabilities: ['security_analysis', 'data_extraction'],
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
    averageLatencyMs: 160,
    tokensPerSecond: 110,
    description: 'Fine-tuned security & threat intelligence model for automated vulnerability scanning.'
  },
  {
    id: 'm-qwen25-coder',
    modelIdentifier: 'qwen2.5-coder:32b',
    providerId: 'p-ollama',
    providerName: 'Ollama Local Cluster',
    displayName: 'Qwen 2.5 Coder 32B (Free Local)',
    status: 'online',
    contextWindow: 65536,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: true,
    capabilities: ['code_generation', 'general_ai'],
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
    averageLatencyMs: 320,
    tokensPerSecond: 65,
    description: 'Specialised coding model for automated syntax verification and patch generation.'
  },
  // Google Gemini Models
  {
    id: 'm-gemini-25-flash',
    modelIdentifier: 'gemini-2.5-flash',
    providerId: 'p-gemini',
    providerName: 'Google Gemini Cloud',
    displayName: 'Gemini 2.5 Flash (Free Tier / 1M Context)',
    status: 'online',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: true,
    capabilities: ['general_ai', 'financial_summary', 'document_analysis', 'fast_chat'],
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.00060,
    averageLatencyMs: 290,
    tokensPerSecond: 160,
    description: 'Low-latency, high-volume model with 1 Million token context window and free tier access.'
  },
  {
    id: 'm-gemini-25-pro',
    modelIdentifier: 'gemini-2.5-pro',
    providerId: 'p-gemini',
    providerName: 'Google Gemini Cloud',
    displayName: 'Gemini 2.5 Pro (2M Context)',
    status: 'online',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: false,
    capabilities: ['document_analysis', 'security_analysis', 'financial_summary', 'code_generation'],
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.00500,
    averageLatencyMs: 580,
    tokensPerSecond: 90,
    description: 'Premier reasoning model designed for deeply complex structured analysis across massive codebases.'
  },
  // Anthropic Models
  {
    id: 'm-claude-35-sonnet-direct',
    modelIdentifier: 'claude-3-5-sonnet-20241022',
    providerId: 'p-anthropic',
    providerName: 'Anthropic Claude Direct',
    displayName: 'Claude 3.5 Sonnet (Direct)',
    status: 'online',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: false,
    capabilities: ['code_generation', 'document_analysis', 'financial_summary', 'general_ai'],
    costPer1kInput: 0.00300,
    costPer1kOutput: 0.01500,
    averageLatencyMs: 460,
    tokensPerSecond: 80,
    description: 'Industry-standard reasoning and coding model with exceptional nuance and strict safety compliance.'
  },
  {
    id: 'm-claude-35-haiku',
    modelIdentifier: 'claude-3-5-haiku-20241022',
    providerId: 'p-anthropic',
    providerName: 'Anthropic Claude Direct',
    displayName: 'Claude 3.5 Haiku',
    status: 'online',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: false,
    capabilities: ['fast_chat', 'general_ai', 'data_extraction'],
    costPer1kInput: 0.00080,
    costPer1kOutput: 0.00400,
    averageLatencyMs: 220,
    tokensPerSecond: 140,
    description: 'Next-generation rapid inference model outperforming previous Claude 3 Opus on standard benchmarks.'
  },
  // DeepSeek Direct Models
  {
    id: 'm-deepseek-v3',
    modelIdentifier: 'deepseek-chat',
    providerId: 'p-deepseek',
    providerName: 'DeepSeek Official API',
    displayName: 'DeepSeek V3 671B MoE',
    status: 'online',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: true,
    capabilities: ['general_ai', 'code_generation', 'fast_chat'],
    costPer1kInput: 0.00014,
    costPer1kOutput: 0.00028,
    averageLatencyMs: 240,
    tokensPerSecond: 110,
    description: 'Massive mixture-of-experts architecture delivering top-tier performance at disruptive cost.'
  },
  {
    id: 'm-deepseek-r1-direct',
    modelIdentifier: 'deepseek-reasoner',
    providerId: 'p-deepseek',
    providerName: 'DeepSeek Official API',
    displayName: 'DeepSeek R1 Reasoning',
    status: 'online',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    enabled: true,
    isFree: false,
    capabilities: ['financial_summary', 'security_analysis', 'code_generation'],
    costPer1kInput: 0.00055,
    costPer1kOutput: 0.00219,
    averageLatencyMs: 510,
    tokensPerSecond: 75,
    description: 'Frontier reasoning model with transparent chain-of-thought outputs for deep analysis.'
  },
  // OpenRouter Models
  {
    id: 'm-openrouter-free-qwen',
    modelIdentifier: 'qwen/qwen-2.5-72b-instruct:free',
    providerId: 'p-openrouter',
    providerName: 'OpenRouter Multi-Cloud Aggregator',
    displayName: 'Qwen 2.5 72B Instruct (100% Free Tier)',
    status: 'online',
    contextWindow: 32768,
    maxOutputTokens: 4096,
    enabled: true,
    isFree: true,
    capabilities: ['general_ai', 'fast_chat', 'code_generation'],
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
    averageLatencyMs: 380,
    tokensPerSecond: 90,
    description: 'Free public community tier model provided through OpenRouter with zero cost.'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-acme-fintech',
    type: 'company',
    orgRole: 'subsidiary',
    parentId: 'cust-introsoft',
    name: 'Acme Financial Technologies (Pty) Ltd',
    legalName: 'Acme Financial Technologies Proprietary Limited',
    registrationNumber: '2021/489102/07',
    taxVatNumber: '4820194821',
    industry: 'Financial Services & Banking',
    country: 'South Africa (ZA)',
    status: 'active',
    tier: 'enterprise',
    serviceTier: 'enterprise',
    businessCriticality: 'tier_0_mission_critical',
    monthlyBudgetUsd: 15000,
    currentSpendUsd: 3840.50,
    rateLimitRpm: 600,
    rateLimitTpm: 500000,
    healthScore: 98,
    slaProfile: {
      id: 'sla-plat-01',
      name: 'Enterprise Platinum SLA',
      availabilityTargetPercent: 99.95,
      apiResponseTimeTargetMs: 500,
      maxLatencyMs: 1500,
      p95LatencyMsTarget: 800,
      p99LatencyMsTarget: 2000,
      errorRateTargetPercent: 0.10,
      p1ResponseMinutes: 15,
      p2ResponseMinutes: 30,
      p3ResponseHours: 4,
      p4ResponseHours: 12,
      rtoHours: 1,
      rpoMinutes: 15,
      supportHours: '24/7/365',
      escalationTimes: 'P1: 15m Executive Escalation -> P2: 30m Lead Architect',
      penaltyCreditRatePercent: 10
    },
    kpiProfile: {
      requestsMonthlyTarget: 1000000,
      tokensMonthlyTarget: 50000000,
      costMonthlyTargetUsd: 15000,
      avgLatencyMs: 245,
      p95LatencyMs: 680,
      p99LatencyMs: 1420,
      errorRatePercent: 0.02,
      fallbackRatePercent: 0.8,
      availabilityPercent: 99.98,
      piiDetectionRatePercent: 100.0,
      policyViolationRatePercent: 0.01,
      serviceCreditsAccruedUsd: 0
    },
    contractTerms: {
      contractStartDate: '2026-01-01',
      contractEndDate: '2027-12-31',
      renewalDate: '2027-11-15',
      billingTerms: 'net_30',
      currency: 'ZAR',
      monthlyMinimumUsd: 5000,
      spendCeilingUsd: 25000,
      includedTokensMonthly: 30000000,
      overageRatePer1kTokensUsd: 0.00025,
      budgetActionOn100Percent: 'switch_cheaper_model'
    },
    securityProfile: {
      approvedProviderIds: ['p-openai', 'p-groq', 'p-ollama', 'p-gemini'],
      approvedModelIds: ['m-gpt4o', 'm-gpt4o-mini', 'm-llama33-70b', 'm-gemini-25-flash'],
      dataResidencyRestrictions: ['South Africa Sovereign Nodes', 'EU Adequacy Approved'],
      allowedCapabilities: ['general_ai', 'financial_summary', 'security_analysis', 'code_generation', 'document_analysis'],
      retentionPolicyDays: 30,
      businessCriticality: 'tier_0_mission_critical',
      dataClassification: 'special_personal_information',
      riskScore: 'LOW'
    },
    primaryContact: {
      name: 'David Van Der Merwe',
      email: 'd.vandermerwe@acmefintech.co.za',
      phone: '+27 (0)11 555 0192',
      role: 'Chief Technology Officer'
    },
    statutoryOfficers: {
      informationOfficer: {
        name: 'Adv. Willem Van Zyl',
        email: 'privacy@acmefintech.co.za',
        phone: '+27 (0)11 555 0199',
        designation: 'Head of Legal, Regulatory & Compliance',
        registrationNumber: 'ZA-IR-IO-2023-4921',
        registeredDate: '2023-11-14',
        deputyOfficerName: 'Nokuthula Dlamini',
        deputyOfficerEmail: 'n.dlamini@acmefintech.co.za'
      },
      dataProtectionOfficer: {
        name: 'Dr. Sarah Schmidt, LL.M.',
        email: 'dpo.external@acmefintech.co.za',
        phone: '+49 30 9281 440',
        dpoType: 'external_counsel',
        leadSupervisoryAuthority: 'BfDI (Federal Commissioner for Data Protection, Germany)',
        registrationNumber: 'EU-DPO-REG-77291',
        registeredDate: '2024-02-10'
      }
    },
    users: [
      {
        id: 'usr-acme-1',
        customerId: 'cust-acme-fintech',
        name: 'David Van Der Merwe',
        email: 'd.vandermerwe@acmefintech.co.za',
        role: 'owner',
        designation: 'Chief Technology Officer',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-29 08:45:00',
        createdAt: '2026-08-01 10:00:00'
      },
      {
        id: 'usr-acme-2',
        customerId: 'cust-acme-fintech',
        name: 'Adv. Willem Van Zyl',
        email: 'privacy@acmefintech.co.za',
        role: 'compliance_officer',
        designation: 'Statutory Information Officer',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-29 07:15:00',
        createdAt: '2026-08-02 09:00:00'
      }
    ],
    connectedAppIds: ['app-fineduca', 'app-mvi-secure'],
    assignedPolicyIds: ['pol-financial-protection', 'pol-mvi-audit', 'pol-global-safety'],
    createdAt: '2026-08-01 09:00:00',
    updatedAt: '2026-08-29 09:30:00',
    notes: 'Tier 1 Enterprise customer. Strict financial data isolation and statutory POPIA/GDPR real-time masking.'
  },
  {
    id: 'cust-safecircle',
    type: 'company',
    orgRole: 'subsidiary',
    parentId: 'cust-introsoft',
    name: 'SafeCircle Global Health B.V.',
    legalName: 'SafeCircle Global Health Besloten Vennootschap',
    registrationNumber: 'KVK-84920194',
    taxVatNumber: 'NL849201940B01',
    industry: 'Healthcare & Medical Technology',
    country: 'Netherlands (EU)',
    status: 'active',
    tier: 'growth',
    serviceTier: 'professional',
    businessCriticality: 'tier_1_business_critical',
    monthlyBudgetUsd: 8000,
    currentSpendUsd: 1940.20,
    rateLimitRpm: 300,
    rateLimitTpm: 250000,
    healthScore: 94,
    slaProfile: {
      id: 'sla-gold-02',
      name: 'Professional Gold SLA',
      availabilityTargetPercent: 99.90,
      apiResponseTimeTargetMs: 800,
      maxLatencyMs: 2500,
      p95LatencyMsTarget: 1200,
      p99LatencyMsTarget: 3000,
      errorRateTargetPercent: 0.25,
      p1ResponseMinutes: 30,
      p2ResponseMinutes: 60,
      p3ResponseHours: 8,
      p4ResponseHours: 24,
      rtoHours: 4,
      rpoMinutes: 60,
      supportHours: '24/5',
      escalationTimes: 'P1: 30m Lead Engineer -> P2: 60m On-Call',
      penaltyCreditRatePercent: 5
    },
    kpiProfile: {
      requestsMonthlyTarget: 500000,
      tokensMonthlyTarget: 20000000,
      costMonthlyTargetUsd: 8000,
      avgLatencyMs: 310,
      p95LatencyMs: 890,
      p99LatencyMs: 1850,
      errorRatePercent: 0.05,
      fallbackRatePercent: 1.2,
      availabilityPercent: 99.92,
      piiDetectionRatePercent: 100.0,
      policyViolationRatePercent: 0.02,
      serviceCreditsAccruedUsd: 0
    },
    contractTerms: {
      contractStartDate: '2026-03-01',
      contractEndDate: '2027-02-28',
      renewalDate: '2027-01-15',
      billingTerms: 'net_30',
      currency: 'EUR',
      monthlyMinimumUsd: 2500,
      spendCeilingUsd: 12000,
      includedTokensMonthly: 15000000,
      overageRatePer1kTokensUsd: 0.00030,
      budgetActionOn100Percent: 'notify_only'
    },
    securityProfile: {
      approvedProviderIds: ['p-anthropic', 'p-gemini', 'p-ollama'],
      approvedModelIds: ['m-claude-35-sonnet-direct', 'm-gemini-25-pro', 'm-llama33-70b'],
      dataResidencyRestrictions: ['EU Sovereign Nodes Only'],
      allowedCapabilities: ['document_analysis', 'general_ai', 'fast_chat'],
      retentionPolicyDays: 14,
      businessCriticality: 'tier_1_business_critical',
      dataClassification: 'special_personal_information',
      riskScore: 'LOW'
    },
    primaryContact: {
      name: 'Anouk Van Dijk',
      email: 'anouk.vandijk@safecircle.health',
      phone: '+31 20 892 1092',
      role: 'VP Product & Clinical AI'
    },
    statutoryOfficers: {
      informationOfficer: {
        name: 'Thabo Molefe',
        email: 't.molefe@safecircle.health',
        phone: '+27 (0)21 880 1920',
        designation: 'Africa Data Governance Lead',
        registrationNumber: 'ZA-IR-IO-2024-0819',
        registeredDate: '2024-04-18'
      },
      dataProtectionOfficer: {
        name: 'Elena Rostova, CIPP/E',
        email: 'dpo@safecircle.health',
        phone: '+31 20 892 1099',
        dpoType: 'internal',
        leadSupervisoryAuthority: 'Autoriteit Persoonsgegevens (Dutch DPA, Netherlands)',
        registrationNumber: 'NL-DPO-2024-1102',
        registeredDate: '2024-01-15'
      }
    },
    users: [],
    connectedAppIds: ['app-safecircle'],
    assignedPolicyIds: ['pol-safecircle-privacy', 'pol-global-safety'],
    createdAt: '2026-08-10 14:15:00',
    updatedAt: '2026-08-28 17:00:00',
    notes: 'Health-tech provider with strict patient privacy constraints and Special Category Data redaction.'
  },
  {
    id: 'cust-cashcreators',
    type: 'company',
    orgRole: 'partner_reseller',
    parentId: 'cust-acme-fintech',
    name: 'Cash Creators E-Commerce Ltd',
    legalName: 'Cash Creators Commerce & Automation Limited',
    registrationNumber: 'UK-14298104',
    taxVatNumber: 'GB394820194',
    industry: 'E-Commerce & Digital Marketing',
    country: 'United Kingdom (UK)',
    status: 'active',
    tier: 'startup',
    monthlyBudgetUsd: 3000,
    currentSpendUsd: 680.40,
    rateLimitRpm: 150,
    rateLimitTpm: 120000,
    primaryContact: {
      name: 'Oliver Wright',
      email: 'oliver@cashcreators.co.uk',
      phone: '+44 20 7946 0912',
      role: 'Managing Director'
    },
    statutoryOfficers: {
      dataProtectionOfficer: {
        name: 'James H. Sterling',
        email: 'dpo@cashcreators.co.uk',
        phone: '+44 20 7946 0999',
        dpoType: 'internal',
        leadSupervisoryAuthority: 'Information Commissioner’s Office (ICO, United Kingdom)',
        registrationNumber: 'UK-ICO-ZA991048',
        registeredDate: '2024-03-01'
      }
    },
    users: [
      {
        id: 'usr-cash-1',
        customerId: 'cust-cashcreators',
        name: 'Oliver Wright',
        email: 'oliver@cashcreators.co.uk',
        role: 'owner',
        designation: 'Managing Director',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-29 05:20:00',
        createdAt: '2026-08-15 16:45:00'
      },
      {
        id: 'usr-cash-2',
        customerId: 'cust-cashcreators',
        name: 'Sophie Clark',
        email: 'sophie.c@cashcreators.co.uk',
        role: 'developer',
        designation: 'Full Stack Web Developer',
        mfaEnabled: false,
        status: 'active',
        lastLogin: '2026-08-27 12:00:00',
        createdAt: '2026-08-16 10:00:00'
      }
    ],
    connectedAppIds: ['app-cashcreators'],
    assignedPolicyIds: ['pol-global-safety'],
    createdAt: '2026-08-15 16:45:00',
    updatedAt: '2026-08-27 12:00:00',
    notes: 'Fast-growing retail e-commerce aggregator using marketing and catalog extraction APIs.'
  },
  {
    id: 'cust-introsoft',
    type: 'company',
    orgRole: 'parent_owner',
    parentId: null,
    name: 'Introsoft Technology Solutions (Pty) Ltd',
    legalName: 'Introsoft Technology Solutions Proprietary Limited',
    registrationNumber: '2019/338192/07',
    taxVatNumber: '4190284711',
    industry: 'Enterprise Software & Cloud Platforms',
    country: 'South Africa (ZA)',
    status: 'active',
    tier: 'enterprise',
    monthlyBudgetUsd: 25000,
    currentSpendUsd: 5410.80,
    rateLimitRpm: 1200,
    rateLimitTpm: 1000000,
    primaryContact: {
      name: 'Horatio Huxham',
      email: 'horatio.huxham@introsoft.co.za',
      phone: '+27 (0)21 440 9000',
      role: 'Principal Architect & Founder'
    },
    statutoryOfficers: {
      informationOfficer: {
        name: 'Horatio Huxham',
        email: 'horatio.huxham@introsoft.co.za',
        phone: '+27 (0)21 440 9000',
        designation: 'Managing Director & Statutory Information Officer',
        registrationNumber: 'ZA-IR-IO-2022-0194',
        registeredDate: '2022-06-30',
        deputyOfficerName: 'Ruan Steyn',
        deputyOfficerEmail: 'r.steyn@introsoft.co.za'
      },
      dataProtectionOfficer: {
        name: 'Marcus Vance, Esq.',
        email: 'dpo.counsel@introsoft.co.za',
        phone: '+44 20 7946 0881',
        dpoType: 'external_counsel',
        leadSupervisoryAuthority: 'Information Commissioner’s Office (ICO, UK) / CNIL (EU)',
        registrationNumber: 'EU-DPO-REG-9041',
        registeredDate: '2023-01-20'
      }
    },
    users: [
      {
        id: 'usr-intro-1',
        customerId: 'cust-introsoft',
        name: 'Horatio Huxham',
        email: 'horatio.huxham@introsoft.co.za',
        role: 'owner',
        designation: 'Principal Architect & Founder',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-29 10:14:00',
        createdAt: '2026-08-01 09:00:00'
      },
      {
        id: 'usr-intro-2',
        customerId: 'cust-introsoft',
        name: 'Ruan Steyn',
        email: 'r.steyn@introsoft.co.za',
        role: 'admin',
        designation: 'Head of Infrastructure',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-29 09:40:00',
        createdAt: '2026-08-01 09:30:00'
      },
      {
        id: 'usr-intro-3',
        customerId: 'cust-introsoft',
        name: 'Lindiwe Zulu',
        email: 'l.zulu@introsoft.co.za',
        role: 'developer',
        designation: 'Senior Platform Engineer',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-29 08:50:00',
        createdAt: '2026-08-03 10:00:00'
      },
      {
        id: 'usr-intro-4',
        customerId: 'cust-introsoft',
        name: 'Marcus Vance',
        email: 'dpo.counsel@introsoft.co.za',
        role: 'compliance_officer',
        designation: 'External DPO & Legal Counsel',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-28 15:20:00',
        createdAt: '2026-08-04 11:00:00'
      }
    ],
    connectedAppIds: ['app-introsoft-web', 'app-future-portal'],
    assignedPolicyIds: ['pol-global-safety'],
    createdAt: '2026-08-01 09:00:00',
    updatedAt: '2026-08-29 09:00:00',
    notes: 'Primary parent tenant and enterprise cloud aggregator platform operator.'
  },
  {
    id: 'cust-alex-turner',
    type: 'individual',
    orgRole: 'direct_client',
    parentId: 'cust-introsoft',
    name: 'Dr. Alex Turner (AI Research Specialist)',
    legalName: 'Dr. Alexander Turner',
    taxVatNumber: 'DE-389201948',
    industry: 'Independent Academic & AI Research',
    country: 'Germany (EU)',
    status: 'active',
    tier: 'pay_as_you_go',
    monthlyBudgetUsd: 1000,
    currentSpendUsd: 142.60,
    rateLimitRpm: 60,
    rateLimitTpm: 60000,
    primaryContact: {
      name: 'Dr. Alexander Turner',
      email: 'alex.turner@quantum-ai.de',
      phone: '+49 89 2180 9182',
      role: 'Principal Researcher'
    },
    statutoryOfficers: {
      dataProtectionOfficer: {
        name: 'Dr. Alexander Turner',
        email: 'alex.turner@quantum-ai.de',
        phone: '+49 89 2180 9182',
        dpoType: 'internal',
        leadSupervisoryAuthority: 'Bayerisches Landesamt für Datenschutzaufsicht (BayLDA, Germany)',
        registrationNumber: 'DE-BY-DPO-2024-4410',
        registeredDate: '2024-05-02'
      }
    },
    users: [
      {
        id: 'usr-alex-1',
        customerId: 'cust-alex-turner',
        name: 'Dr. Alexander Turner',
        email: 'alex.turner@quantum-ai.de',
        role: 'owner',
        designation: 'Principal Researcher',
        mfaEnabled: true,
        status: 'active',
        lastLogin: '2026-08-28 19:30:00',
        createdAt: '2026-08-20 12:00:00'
      }
    ],
    connectedAppIds: [],
    assignedPolicyIds: ['pol-global-safety'],
    createdAt: '2026-08-20 12:00:00',
    updatedAt: '2026-08-28 19:30:00',
    notes: 'Individual researcher developing novel multi-agent reasoning benchmarks with EU sovereign compliance.'
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-introsoft-web',
    customerId: 'cust-introsoft',
    customerName: 'Introsoft Technology Solutions (Pty) Ltd',
    appIdentifier: 'introsoft-web',
    name: 'Introsoft Website',
    description: 'Main corporate web portal, live customer interactive widgets, and public knowledge base.',
    status: 'active',
    environment: 'production',
    allowedCapabilities: ['general_ai', 'fast_chat', 'document_analysis'],
    rateLimitRpm: 120,
    quotaMonthlyRequests: 50000,
    quotaUsedRequests: 9240,
    assignedPolicyIds: ['pol-global-safety'],
    contactEmail: 'web-team@introsoft.internal',
    createdAt: '2026-08-01 09:00:00',
    updatedAt: '2026-08-29 08:00:00'
  },
  {
    id: 'app-fineduca',
    customerId: 'cust-acme-fintech',
    customerName: 'Acme Financial Technologies (Pty) Ltd',
    appIdentifier: 'fineduca',
    name: 'FinEduca Platform',
    description: 'Financial literacy & algorithmic market education engine with strict compliance controls.',
    status: 'active',
    environment: 'production',
    allowedCapabilities: ['financial_summary', 'document_analysis', 'general_ai'],
    rateLimitRpm: 240,
    quotaMonthlyRequests: 100000,
    quotaUsedRequests: 14820,
    assignedPolicyIds: ['pol-financial-protection', 'pol-global-safety'],
    contactEmail: 'compliance@fineduca.internal',
    createdAt: '2026-08-05 11:30:00',
    updatedAt: '2026-08-29 08:30:00'
  },
  {
    id: 'app-safecircle',
    customerId: 'cust-safecircle',
    customerName: 'SafeCircle Global Health B.V.',
    appIdentifier: 'safecircle',
    name: 'SafeCircle Health',
    description: 'Personal safety, health-tech assistance, and user well-being support portal.',
    status: 'active',
    environment: 'production',
    allowedCapabilities: ['general_ai', 'fast_chat', 'document_analysis'],
    rateLimitRpm: 180,
    quotaMonthlyRequests: 75000,
    quotaUsedRequests: 6110,
    assignedPolicyIds: ['pol-safecircle-privacy', 'pol-global-safety'],
    contactEmail: 'privacy@safecircle.internal',
    createdAt: '2026-08-10 14:15:00',
    updatedAt: '2026-08-28 17:00:00'
  },
  {
    id: 'app-cashcreators',
    customerId: 'cust-cashcreators',
    customerName: 'Cash Creators E-Commerce Ltd',
    appIdentifier: 'cash-creators',
    name: 'Cash Creators App',
    description: 'E-commerce automation, revenue analytics, and campaign copy generator.',
    status: 'active',
    environment: 'production',
    allowedCapabilities: ['general_ai', 'code_generation', 'data_extraction'],
    rateLimitRpm: 90,
    quotaMonthlyRequests: 40000,
    quotaUsedRequests: 3290,
    assignedPolicyIds: ['pol-global-safety'],
    contactEmail: 'growth@cashcreators.internal',
    createdAt: '2026-08-15 16:45:00',
    updatedAt: '2026-08-27 12:00:00'
  },
  {
    id: 'app-mvi-secure',
    customerId: 'cust-acme-fintech',
    customerName: 'Acme Financial Technologies (Pty) Ltd',
    appIdentifier: 'mvi-secure',
    name: 'MVI Secure Gateway',
    description: 'Enterprise security gateway, log vulnerability auditor, and SOC assistant.',
    status: 'active',
    environment: 'production',
    allowedCapabilities: ['security_analysis', 'code_generation', 'data_extraction'],
    rateLimitRpm: 300,
    quotaMonthlyRequests: 150000,
    quotaUsedRequests: 21940,
    assignedPolicyIds: ['pol-mvi-audit', 'pol-global-safety'],
    contactEmail: 'secops@mvisecure.internal',
    createdAt: '2026-08-18 10:00:00',
    updatedAt: '2026-08-29 09:10:00'
  },
  {
    id: 'app-future-portal',
    customerId: 'cust-introsoft',
    customerName: 'Introsoft Technology Solutions (Pty) Ltd',
    appIdentifier: 'future-application-dev',
    name: 'Future Applications Sandbox',
    description: 'Staging environment for prospective Introsoft microservices and R&D pipelines.',
    status: 'suspended',
    environment: 'development',
    allowedCapabilities: ['general_ai', 'code_generation', 'fast_chat'],
    rateLimitRpm: 30,
    quotaMonthlyRequests: 10000,
    quotaUsedRequests: 410,
    assignedPolicyIds: ['pol-global-safety'],
    contactEmail: 'rnd@introsoft.internal',
    createdAt: '2026-08-25 15:00:00',
    updatedAt: '2026-08-28 09:00:00'
  }
];

export const INITIAL_API_KEYS: ApiKey[] = [
  {
    id: 'key-introsoft-prod',
    customerId: 'cust-introsoft',
    customerName: 'Introsoft Technology Solutions (Pty) Ltd',
    appId: 'app-introsoft-web',
    appName: 'Introsoft Website',
    name: 'Introsoft Web Ingress Key',
    key: 'ALTIL-8F72A9B104E729C04859218A',
    prefix: 'ALTIL-8F72...218A',
    status: 'active',
    createdAt: '2026-08-29 09:00:00',
    expiresAt: '2027-08-29 00:00:00',
    lastUsedAt: '2026-08-29 10:31:02',
    rateLimitRpm: 120,
    ipWhitelist: ['10.0.0.0/16', '192.168.1.50'],
    scopes: ['read:inference', 'read:models']
  },
  {
    id: 'key-fineduca-prod',
    customerId: 'cust-acme-fintech',
    customerName: 'Acme Financial Technologies (Pty) Ltd',
    appId: 'app-fineduca',
    appName: 'FinEduca Platform',
    name: 'FinEduca Main Backend Key',
    key: 'ALTIL-3C19F84029B88E1293041A99',
    prefix: 'ALTIL-3C19...1A99',
    status: 'active',
    createdAt: '2026-08-29 09:30:00',
    expiresAt: '2027-08-29 00:00:00',
    lastUsedAt: '2026-08-29 10:30:55',
    rateLimitRpm: 240,
    ipWhitelist: ['10.0.4.0/24'],
    scopes: ['read:inference', 'read:models', 'read:capabilities']
  },
  {
    id: 'key-safecircle-prod',
    customerId: 'cust-safecircle',
    customerName: 'SafeCircle Global Health B.V.',
    appId: 'app-safecircle',
    appName: 'SafeCircle Health',
    name: 'SafeCircle Production API Key',
    key: 'ALTIL-7D9902BA11E39402938472B1',
    prefix: 'ALTIL-7D99...72B1',
    status: 'active',
    createdAt: '2026-08-30 08:00:00',
    expiresAt: '2027-08-30 00:00:00',
    lastUsedAt: '2026-08-29 10:28:44',
    rateLimitRpm: 180,
    ipWhitelist: [],
    scopes: ['read:inference']
  },
  {
    id: 'key-cashcreators-prod',
    customerId: 'cust-cashcreators',
    customerName: 'Cash Creators E-Commerce Ltd',
    appId: 'app-cashcreators',
    appName: 'Cash Creators App',
    name: 'Cash Creators Service Token',
    key: 'ALTIL-4E881023BC9844001928473C',
    prefix: 'ALTIL-4E88...473C',
    status: 'active',
    createdAt: '2026-08-28 14:00:00',
    expiresAt: null,
    lastUsedAt: '2026-08-29 10:25:10',
    rateLimitRpm: 90,
    ipWhitelist: [],
    scopes: ['read:inference']
  },
  {
    id: 'key-mvi-prod',
    customerId: 'cust-acme-fintech',
    customerName: 'Acme Financial Technologies (Pty) Ltd',
    appId: 'app-mvi-secure',
    appName: 'MVI Secure Gateway',
    name: 'MVI Security Daemon Token',
    key: 'ALTIL-1B9044CC8710929940182390',
    prefix: 'ALTIL-1B90...2390',
    status: 'active',
    createdAt: '2026-08-20 10:00:00',
    expiresAt: '2027-01-01 00:00:00',
    lastUsedAt: '2026-08-29 10:31:18',
    rateLimitRpm: 300,
    ipWhitelist: ['10.0.10.12', '10.0.10.13'],
    scopes: ['read:inference', 'read:models', 'write:telemetry']
  },
  {
    id: 'key-test-legacy',
    customerId: 'cust-introsoft',
    customerName: 'Introsoft Technology Solutions (Pty) Ltd',
    appId: 'app-future-portal',
    appName: 'Future Applications Sandbox',
    name: 'Test Application Staging Key',
    key: 'ALTIL-0000REVOKED998811223344',
    prefix: 'ALTIL-0000...3344',
    status: 'revoked',
    createdAt: '2026-08-30 08:30:00',
    expiresAt: '2026-09-01 00:00:00',
    lastUsedAt: '2026-08-27 18:22:00',
    rateLimitRpm: 10,
    ipWhitelist: [],
    scopes: ['read:inference']
  }
];

export const INITIAL_ROUTING_RULES: RoutingRule[] = [
  {
    id: 'route-general-ai',
    name: 'General AI Workload Orchestration',
    taskOrCapability: 'general_ai',
    appId: 'all',
    primaryModelId: 'm-qwen36', // Ollama / Qwen
    firstFallbackModelId: 'm-llama33-70b', // Groq / Llama 3.3
    secondFallbackModelId: 'm-gemini-25-flash', // Gemini
    maxTokens: 4096,
    timeoutMs: 6000,
    fallbackTriggers: ['on_error', 'on_timeout', 'on_rate_limit'],
    loadBalancingStrategy: 'priority_fallback',
    enabled: true,
    description: 'Primary zero-cost inference on Ollama local cluster. Fallback to Groq LPU, then Gemini cloud.'
  },
  {
    id: 'route-security-analysis',
    name: 'Security Analysis & Vulnerability Auditing',
    taskOrCapability: 'security_analysis',
    appId: 'all',
    primaryModelId: 'm-sec-analyst', // Specialised security model
    firstFallbackModelId: 'm-qwen36', // Qwen
    secondFallbackModelId: 'm-gemini-25-pro', // Gemini 2.5 Pro
    maxTokens: 8192,
    timeoutMs: 12000,
    fallbackTriggers: ['on_error', 'on_timeout'],
    loadBalancingStrategy: 'priority_fallback',
    enabled: true,
    description: 'Specialised Security Model primary -> Local Qwen 3.6 fallback -> Deep Gemini Pro analysis.'
  },
  {
    id: 'route-financial-summary',
    name: 'Financial Data & Market Summary',
    taskOrCapability: 'financial_summary',
    appId: 'app-fineduca',
    primaryModelId: 'm-gemini-25-flash',
    firstFallbackModelId: 'm-deepseek-r1-groq',
    secondFallbackModelId: 'm-qwen36',
    maxTokens: 8192,
    timeoutMs: 8000,
    fallbackTriggers: ['on_error', 'on_timeout'],
    loadBalancingStrategy: 'priority_fallback',
    enabled: true,
    description: 'Enforces compliant financial extraction with strict token constraints and arithmetic verification.'
  },
  {
    id: 'route-document-analysis',
    name: 'Long Document & Multi-Page Extraction',
    taskOrCapability: 'document_analysis',
    appId: 'all',
    primaryModelId: 'm-gemini-25-pro',
    firstFallbackModelId: 'm-llama33-70b',
    secondFallbackModelId: 'm-gemini-25-flash',
    maxTokens: 16384,
    timeoutMs: 20000,
    fallbackTriggers: ['on_error', 'on_timeout'],
    loadBalancingStrategy: 'priority_fallback',
    enabled: true,
    description: 'High-context multimodal and PDF evaluation pipeline with multi-million token buffer.'
  },
  {
    id: 'route-code-generation',
    name: 'Automated Code Generation & Patching',
    taskOrCapability: 'code_generation',
    appId: 'all',
    primaryModelId: 'm-qwen25-coder',
    firstFallbackModelId: 'm-llama33-70b',
    secondFallbackModelId: 'm-gemini-25-pro',
    maxTokens: 8192,
    timeoutMs: 10000,
    fallbackTriggers: ['on_error', 'on_timeout'],
    loadBalancingStrategy: 'priority_fallback',
    enabled: true,
    description: 'Directs developer tools to Qwen 2.5 Coder 32B with fallback to Groq.'
  }
];

export const INITIAL_POLICIES: AIPolicy[] = [
  {
    id: 'pol-popia-sa-compliance',
    name: 'POPIA Statutory Privacy & Data Protection (Act 4 of 2013)',
    description: 'Enforces South African POPIA 8 Lawful Processing Conditions, 13-digit SA ID Luhn scrubbing, SARS tax masking, and Section 72 trans-border restrictions.',
    appliesToAppIds: ['all'],
    rules: {
      blockSensitiveFinancialData: true,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: true,
      maxContextTokens: 32768,
      maxResponseTokens: 8192,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: ['p-ollama', 'p-gemini', 'p-groq', 'p-anthropic'],
      popiaRules: {
        enabled: true,
        enforcementMode: 'redact_mask',
        maskSaIdNumbers: true,
        maskSaTaxNumbers: true,
        maskSaPhoneNumbers: true,
        maskSaBankingDetails: true,
        blockSpecialPersonalInfo: true,
        enforceSection72CrossBorder: true,
        logInformationOfficerAudit: true,
        requireConsentProofHeader: false
      },
      gdprRules: {
        enabled: true,
        enforcementMode: 'redact_mask',
        enforceArticle9SpecialCategories: true,
        enforceEuSovereignResidencyOnly: false,
        enforceArticle17ZeroRetention: true,
        enforceArticle22AutomatedDecisionFlag: true,
        maskEuropeanIbans: true,
        maskEuPassportsAndNationalIds: true,
        maskEmailsAndIps: true,
        dataRetentionTtlDays: 30
      }
    },
    status: 'active',
    createdAt: '2026-08-01 08:00:00',
    updatedAt: '2026-08-29 08:00:00'
  },
  {
    id: 'pol-gdpr-eu-sovereign',
    name: 'GDPR EU Sovereign Cloud & Article 9 Guard (EU 2016/679)',
    description: 'Enforces strict European Union GDPR compliance, Article 9 special category shielding, and zero data retention (ZPR).',
    appliesToAppIds: ['app-introsoft-web', 'app-safecircle', 'app-mvi-secure'],
    rules: {
      blockSensitiveFinancialData: true,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: true,
      maxContextTokens: 32768,
      maxResponseTokens: 8192,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: ['p-ollama', 'p-gemini', 'p-anthropic', 'p-mvi-dedicated'],
      gdprRules: {
        enabled: true,
        enforcementMode: 'strict_block',
        enforceArticle9SpecialCategories: true,
        enforceEuSovereignResidencyOnly: true,
        enforceArticle17ZeroRetention: true,
        enforceArticle22AutomatedDecisionFlag: true,
        maskEuropeanIbans: true,
        maskEuPassportsAndNationalIds: true,
        maskEmailsAndIps: true,
        dataRetentionTtlDays: 30
      }
    },
    status: 'active',
    createdAt: '2026-08-05 10:00:00',
    updatedAt: '2026-08-29 07:30:00'
  },
  {
    id: 'pol-financial-protection',
    name: 'Financial Data Protection Policy',
    description: 'Strict privacy envelope for banking, account numbers, routing codes, and trade secrets.',
    appliesToAppIds: ['app-fineduca', 'app-cashcreators'],
    rules: {
      blockSensitiveFinancialData: true,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: true,
      maxContextTokens: 16384,
      maxResponseTokens: 4096,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: ['p-ollama', 'p-gemini'],
      popiaRules: {
        enabled: true,
        enforcementMode: 'strict_block',
        maskSaIdNumbers: true,
        maskSaTaxNumbers: true,
        maskSaPhoneNumbers: true,
        maskSaBankingDetails: true,
        blockSpecialPersonalInfo: true,
        enforceSection72CrossBorder: true,
        logInformationOfficerAudit: true,
        requireConsentProofHeader: false
      }
    },
    status: 'active',
    createdAt: '2026-08-01 10:00:00',
    updatedAt: '2026-08-29 07:00:00'
  },
  {
    id: 'pol-safecircle-privacy',
    name: 'SafeCircle Health & Special Personal Info Redaction',
    description: 'Enforces medical and personal identifiable information scrubbing under POPIA Part B and GDPR Article 9 before any model egress.',
    appliesToAppIds: ['app-safecircle'],
    rules: {
      blockSensitiveFinancialData: false,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: true,
      maxContextTokens: 8192,
      maxResponseTokens: 2048,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: ['p-ollama', 'p-groq', 'p-gemini'],
      popiaRules: {
        enabled: true,
        enforcementMode: 'redact_mask',
        maskSaIdNumbers: true,
        maskSaTaxNumbers: true,
        maskSaPhoneNumbers: true,
        maskSaBankingDetails: true,
        blockSpecialPersonalInfo: true,
        enforceSection72CrossBorder: false,
        logInformationOfficerAudit: true,
        requireConsentProofHeader: false
      },
      gdprRules: {
        enabled: true,
        enforcementMode: 'redact_mask',
        enforceArticle9SpecialCategories: true,
        enforceEuSovereignResidencyOnly: false,
        enforceArticle17ZeroRetention: true,
        enforceArticle22AutomatedDecisionFlag: true,
        maskEuropeanIbans: true,
        maskEuPassportsAndNationalIds: true,
        maskEmailsAndIps: true,
        dataRetentionTtlDays: 30
      }
    },
    status: 'active',
    createdAt: '2026-08-10 12:00:00',
    updatedAt: '2026-08-28 14:00:00'
  },
  {
    id: 'pol-mvi-audit',
    name: 'MVI Strict Audit & Zero-Data Retention',
    description: 'Demands exhaustive audit hashing and forbids third-party provider persistence.',
    appliesToAppIds: ['app-mvi-secure'],
    rules: {
      blockSensitiveFinancialData: true,
      redactPII: true,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: true,
      maxContextTokens: 32768,
      maxResponseTokens: 8192,
      enableAuditTrail: true,
      blockPromptInjections: true,
      allowedProviderIds: ['p-ollama', 'p-mvi-dedicated']
    },
    status: 'active',
    createdAt: '2026-08-18 10:30:00',
    updatedAt: '2026-08-29 08:15:00'
  },
  {
    id: 'pol-global-safety',
    name: 'Global Introsoft AI Safety Baseline',
    description: 'System-wide guardrails guarding against jailbreaks, system prompt exfiltration, and toxic responses.',
    appliesToAppIds: ['all'],
    rules: {
      blockSensitiveFinancialData: false,
      redactPII: false,
      logRequestMetadata: true,
      anonymizePromptsInAudit: true,
      requireApprovedProvider: false,
      maxContextTokens: 65536,
      maxResponseTokens: 8192,
      enableAuditTrail: true,
      blockPromptInjections: true
    },
    status: 'active',
    createdAt: '2026-08-01 00:00:00',
    updatedAt: '2026-08-29 06:00:00'
  }
];

export const INITIAL_GLOBAL_COMPLIANCE_CONFIG: GlobalComplianceConfig = {
  popia: {
    enabled: true,
    enforcementMode: 'redact_mask',
    maskSaIdNumbers: true,
    maskSaTaxNumbers: true,
    maskSaPhoneNumbers: true,
    maskSaBankingDetails: true,
    blockSpecialPersonalInfo: true,
    enforceSection72CrossBorder: true,
    logInformationOfficerAudit: true,
    requireConsentProofHeader: false
  },
  gdpr: {
    enabled: true,
    enforcementMode: 'redact_mask',
    enforceArticle9SpecialCategories: true,
    enforceEuSovereignResidencyOnly: false,
    enforceArticle17ZeroRetention: true,
    enforceArticle22AutomatedDecisionFlag: true,
    maskEuropeanIbans: true,
    maskEuPassportsAndNationalIds: true,
    maskEmailsAndIps: true,
    dataRetentionTtlDays: 30
  },
  informationOfficerName: 'Horatio Huxham (Information Officer)',
  informationOfficerEmail: 'Horatio.huxham@gmail.com',
  euDataProtectionOfficerEmail: 'dpo.europe@introsoft.internal',
  complianceOfficerRegistrationNumber: 'ZA-INF-OFF-2026/89410',
  defaultDataRetentionDays: 30,
  lastUpdated: '2026-08-29 08:30:00'
};

export const INITIAL_DATA_SUBJECT_REQUESTS: DataSubjectRequest[] = [
  {
    id: 'DSR-ZA-8901',
    framework: 'POPIA',
    requestType: 'access',
    subjectIdentifier: 'ID: 890412***** (H. Van Der Merwe)',
    requestorName: 'Hendrik Van Der Merwe',
    appId: 'app-fineduca',
    status: 'fulfilled',
    createdAt: '2026-08-20 14:15:00',
    dueAt: '2026-09-19 14:15:00',
    notes: 'Section 23 POPIA access request. Log records and sanitized AI prompt history delivered.'
  },
  {
    id: 'DSR-EU-4412',
    framework: 'GDPR',
    requestType: 'erasure',
    subjectIdentifier: 'Email: m.dupont@*****.fr',
    requestorName: 'Marie Dupont',
    appId: 'app-introsoft-web',
    status: 'fulfilled',
    createdAt: '2026-08-25 09:00:00',
    dueAt: '2026-09-24 09:00:00',
    notes: 'Article 17 Right to Erasure fulfilled. Zero-retention confirmed across Ollama and Gemini cache.'
  },
  {
    id: 'DSR-ZA-9934',
    framework: 'POPIA',
    requestType: 'objection',
    subjectIdentifier: 'Phone: +27 82 *** 4912',
    requestorName: 'Nandi Sithole',
    appId: 'app-safecircle',
    status: 'in_progress',
    createdAt: '2026-08-28 11:20:00',
    dueAt: '2026-09-27 11:20:00',
    notes: 'Section 11(3) Objection to processing for automated health profiling. Policy filter assigned.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'ALTIL-8F72-3A9B',
    timestamp: '2026-08-29 12:42:18',
    appId: 'app-introsoft-web',
    appName: 'Introsoft Website',
    apiKeyPrefix: 'ALTIL-8F72...',
    requestType: 'capability',
    capability: 'general_ai',
    providerId: 'p-ollama',
    providerName: 'Ollama Local Cluster',
    modelId: 'm-qwen36',
    modelIdentifier: 'qwen3.6:16k',
    durationSeconds: 4.2,
    status: 'SUCCESS',
    fallbackAttempted: false,
    inputTokens: 1420,
    outputTokens: 580,
    costEstimated: 0.00,
    policyApplied: 'Global Introsoft AI Safety Baseline',
    sanitizedPromptPreview: 'Customer inquiry regarding enterprise multi-region support SLA options for UK node...',
    sanitizedResponsePreview: 'Introsoft enterprise plans provide 99.99% uptime with 24/7 dedicated support engineer routing...',
    clientIp: '192.168.1.50'
  },
  {
    id: 'ALTIL-9C14-22DF',
    timestamp: '2026-08-29 12:41:05',
    appId: 'app-fineduca',
    appName: 'FinEduca Platform',
    apiKeyPrefix: 'ALTIL-3C19...',
    requestType: 'capability',
    capability: 'financial_summary',
    providerId: 'p-gemini',
    providerName: 'Google Gemini Cloud',
    modelId: 'm-gemini-25-flash',
    modelIdentifier: 'gemini-2.5-flash',
    durationSeconds: 1.8,
    status: 'SUCCESS',
    fallbackAttempted: false,
    inputTokens: 3890,
    outputTokens: 920,
    costEstimated: 0.0011,
    policyApplied: 'Financial Data Protection Policy',
    sanitizedPromptPreview: 'Analyze quarterly portfolio diversification index and compute Sharpe ratio [PII Redacted]...',
    sanitizedResponsePreview: 'The portfolio demonstrates an annualized Sharpe ratio of 1.84 with defensive asset rebalancing...',
    clientIp: '10.0.4.18'
  },
  {
    id: 'ALTIL-5E31-10B2',
    timestamp: '2026-08-29 12:39:44',
    appId: 'app-mvi-secure',
    appName: 'MVI Secure Gateway',
    apiKeyPrefix: 'ALTIL-1B90...',
    requestType: 'task',
    capability: 'security_analysis',
    providerId: 'p-groq',
    providerName: 'Groq Cloud LPU',
    modelId: 'm-llama33-70b',
    modelIdentifier: 'llama-3.3-70b-versatile',
    durationSeconds: 0.9,
    status: 'FALLBACK_SUCCESS',
    fallbackAttempted: true,
    fallbackProviderName: 'Groq Cloud LPU',
    fallbackModelIdentifier: 'llama-3.3-70b-versatile',
    inputTokens: 2100,
    outputTokens: 450,
    costEstimated: 0.0016,
    policyApplied: 'MVI Strict Audit & Zero-Data Retention',
    sanitizedPromptPreview: 'Ingress authentication payload audit for abnormal certificate chain anomalies...',
    sanitizedResponsePreview: 'No certificate revocation or timestamp mismatch detected in verified payload.',
    clientIp: '10.0.10.12'
  },
  {
    id: 'ALTIL-4A82-99F1',
    timestamp: '2026-08-29 12:35:10',
    appId: 'app-safecircle',
    appName: 'SafeCircle Health',
    apiKeyPrefix: 'ALTIL-7D99...',
    requestType: 'capability',
    capability: 'general_ai',
    providerId: 'p-ollama',
    providerName: 'Ollama Local Cluster',
    modelId: 'm-qwen36',
    modelIdentifier: 'qwen3.6:16k',
    durationSeconds: 2.1,
    status: 'SUCCESS',
    fallbackAttempted: false,
    inputTokens: 820,
    outputTokens: 310,
    costEstimated: 0.00,
    policyApplied: 'SafeCircle Health & PII Redaction',
    sanitizedPromptPreview: 'Guidance regarding routine stress management techniques and hydration schedules...',
    sanitizedResponsePreview: 'Recommended routine includes 4-7-8 rhythmic breathing and structured 250ml water intake...',
    clientIp: '172.16.0.4'
  },
  {
    id: 'ALTIL-1F09-082B',
    timestamp: '2026-08-29 12:30:22',
    appId: 'app-fineduca',
    appName: 'FinEduca Platform',
    apiKeyPrefix: 'ALTIL-3C19...',
    requestType: 'capability',
    capability: 'financial_summary',
    providerId: 'p-gemini',
    providerName: 'Google Gemini Cloud',
    modelId: 'm-gemini-25-flash',
    modelIdentifier: 'gemini-2.5-flash',
    durationSeconds: 0.08,
    status: 'POLICY_BLOCKED',
    fallbackAttempted: false,
    inputTokens: 410,
    outputTokens: 0,
    costEstimated: 0.00,
    policyApplied: 'Financial Data Protection Policy',
    policyViolations: ['Sensitive bank account number (IBAN / PAN) detected in un-tokenized input block'],
    sanitizedPromptPreview: 'Direct transfer verification for IBAN GB82WEST12345678901234...',
    sanitizedResponsePreview: '[BLOCKED BY ALTIL POLICY: Financial Data Protection]',
    clientIp: '10.0.4.18'
  },
  {
    id: 'ALTIL-7B32-55C0',
    timestamp: '2026-08-29 12:28:40',
    appId: 'app-cashcreators',
    appName: 'Cash Creators App',
    apiKeyPrefix: 'ALTIL-4E88...',
    requestType: 'capability',
    capability: 'data_extraction',
    providerId: 'p-groq',
    providerName: 'Groq Cloud LPU',
    modelId: 'm-llama33-70b',
    modelIdentifier: 'llama-3.3-70b-versatile',
    durationSeconds: 0.6,
    status: 'SUCCESS',
    fallbackAttempted: false,
    inputTokens: 1100,
    outputTokens: 420,
    costEstimated: 0.0009,
    policyApplied: 'Global Introsoft AI Safety Baseline',
    sanitizedPromptPreview: 'Extract structured product inventory SKU counts from unstructured supplier invoice...',
    sanitizedResponsePreview: '{"items": [{"sku": "SKU-9921", "qty": 150}, {"sku": "SKU-8812", "qty": 45}]}',
    clientIp: '10.0.8.21'
  }
];

export const INITIAL_SYSTEM_HEALTH: SystemHealthItem[] = [
  {
    id: 'sys-api',
    name: 'ALTIL Gateway Ingress API',
    category: 'core',
    status: 'online',
    details: 'Port 3000 (HTTPS/gRPC proxy active)',
    latencyMs: 8,
    uptime: '99.98%'
  },
  {
    id: 'sys-db',
    name: 'Primary Configuration DB',
    category: 'database',
    status: 'online',
    details: 'PostgreSQL Relational Cluster + WAL replication',
    latencyMs: 12,
    uptime: '100.0%'
  },
  {
    id: 'sys-redis',
    name: 'Redis Cache & Rate Limiter',
    category: 'cache',
    status: 'online',
    details: 'Cluster Node 01 (Hit rate: 89.4%)',
    latencyMs: 2,
    uptime: '99.99%'
  },
  {
    id: 'sys-ollama',
    name: 'Ollama Node (192.168.1.100)',
    category: 'provider',
    status: 'online',
    details: '4x NVIDIA RTX 4090 (VRAM: 96GB total)',
    latencyMs: 142,
    uptime: '99.85%'
  },
  {
    id: 'sys-groq',
    name: 'Groq Cloud API Egress',
    category: 'provider',
    status: 'online',
    details: 'Direct Fiber Interconnect',
    latencyMs: 84,
    uptime: '99.95%'
  },
  {
    id: 'sys-gemini',
    name: 'Google Gemini Cloud Egress',
    category: 'provider',
    status: 'online',
    details: 'Google Enterprise Workspace Tier',
    latencyMs: 310,
    uptime: '99.99%'
  }
];

export const initialProviders = INITIAL_PROVIDERS;
export const initialModels = INITIAL_MODELS;
export const initialCustomers = INITIAL_CUSTOMERS;
export const initialApplications = INITIAL_APPLICATIONS;
export const initialApiKeys = INITIAL_API_KEYS;
export const initialRoutingRules = INITIAL_ROUTING_RULES;
export const initialPolicies = INITIAL_POLICIES;
export const initialGlobalComplianceConfig = INITIAL_GLOBAL_COMPLIANCE_CONFIG;
export const initialDataSubjectRequests = INITIAL_DATA_SUBJECT_REQUESTS;
export const initialAuditLogs = INITIAL_AUDIT_LOGS.map(log => ({
  ...log,
  tokensConsumed: log.tokensConsumed ?? ((log.inputTokens || 0) + (log.outputTokens || 0))
}));
export const initialSystemHealth = INITIAL_SYSTEM_HEALTH;

export const initialUsageMetrics = [
  { time: '06:00', ollama: 320, groq: 120, gemini: 60, total: 500 },
  { time: '08:00', ollama: 850, groq: 320, gemini: 170, total: 1340 },
  { time: '10:00', ollama: 1680, groq: 680, gemini: 350, total: 2710 },
  { time: '12:00', ollama: 2150, groq: 890, gemini: 460, total: 3500 },
  { time: '14:00', ollama: 1820, groq: 740, gemini: 390, total: 2950 },
  { time: '16:00', ollama: 1450, groq: 580, gemini: 310, total: 2340 },
  { time: '18:00', ollama: 980, groq: 390, gemini: 200, total: 1570 }
];


export const USAGE_CHART_DATA = [
  { time: '06:00', ollama: 320, groq: 120, gemini: 60, total: 500 },
  { time: '07:00', ollama: 480, groq: 180, gemini: 90, total: 750 },
  { time: '08:00', ollama: 850, groq: 320, gemini: 170, total: 1340 },
  { time: '09:00', ollama: 1240, groq: 490, gemini: 260, total: 1990 },
  { time: '10:00', ollama: 1680, groq: 680, gemini: 350, total: 2710 },
  { time: '11:00', ollama: 1950, groq: 790, gemini: 410, total: 3150 },
  { time: '12:00', ollama: 2150, groq: 890, gemini: 460, total: 3500 },
  { time: '13:00', ollama: 1820, groq: 740, gemini: 390, total: 2950 }
];

export const CAPABILITIES_CATALOG = [
  {
    id: 'general_ai',
    name: 'General AI',
    description: 'Versatile reasoning, question answering, summarization, and task orchestration.',
    defaultRouting: 'Ollama Qwen -> Groq Llama -> Gemini Flash',
    recommendedContext: '4K - 16K'
  },
  {
    id: 'security_analysis',
    name: 'Security Analysis',
    description: 'Vulnerability detection, auth anomaly audits, threat intelligence and SOC automation.',
    defaultRouting: 'Sec-Analyst-7B -> Ollama Qwen -> Gemini Pro',
    recommendedContext: '8K - 32K'
  },
  {
    id: 'financial_summary',
    name: 'Financial Summary & Calculation',
    description: 'Compliance-checked financial analytics, portfolio metrics, balance sheet audits.',
    defaultRouting: 'Gemini Flash -> DeepSeek R1 -> Ollama Qwen',
    recommendedContext: '8K - 16K'
  },
  {
    id: 'document_analysis',
    name: 'Document Analysis',
    description: 'Long-document ingestion, multi-page PDF processing, contract parsing, legal cross-referencing.',
    defaultRouting: 'Gemini Pro -> Groq Llama 70B -> Gemini Flash',
    recommendedContext: '32K - 1M'
  },
  {
    id: 'code_generation',
    name: 'Code Generation & Review',
    description: 'TypeScript/Python/Rust generation, syntax debugging, automated test suite synthesis.',
    defaultRouting: 'Qwen 2.5 Coder 32B -> Groq Llama -> Gemini Pro',
    recommendedContext: '16K - 64K'
  },
  {
    id: 'fast_chat',
    name: 'Fast Chat & User Assistants',
    description: 'Sub-second real-time conversational agents for end-user web applications.',
    defaultRouting: 'Groq Llama -> Ollama Qwen -> Gemini Flash',
    recommendedContext: '4K - 8K'
  },
  {
    id: 'data_extraction',
    name: 'Structured JSON Extraction',
    description: 'Deterministic schema validation and data parsing into strict JSON formats.',
    defaultRouting: 'Groq Llama -> Gemini Flash -> Ollama Qwen',
    recommendedContext: '8K - 32K'
  }
];

// ==========================================
// NEW ENTERPRISE EXTENDED MOCK DATASETS
// ==========================================

export const initialSlaProfiles = [
  {
    id: 'sla-plat-01',
    name: 'Enterprise Platinum SLA',
    description: 'Mission-critical Tier-0 SLA for core banking, health & automated transaction gateways.',
    availabilityTargetPercent: 99.95,
    apiResponseTimeTargetMs: 500,
    maxLatencyMs: 1500,
    p95LatencyMsTarget: 800,
    p99LatencyMsTarget: 2000,
    errorRateTargetPercent: 0.10,
    p1ResponseMinutes: 15,
    p2ResponseMinutes: 30,
    p3ResponseHours: 4,
    p4ResponseHours: 12,
    rtoHours: 1,
    rpoMinutes: 15,
    supportHours: '24/7/365' as const,
    escalationTimes: 'P1: 15m Executive Escalation -> P2: 30m Lead Architect',
    penaltyCreditRatePercent: 10,
    isDefault: true
  },
  {
    id: 'sla-gold-02',
    name: 'Professional Gold SLA',
    description: 'Business-critical Tier-1 SLA for enterprise SaaS and customer portal applications.',
    availabilityTargetPercent: 99.90,
    apiResponseTimeTargetMs: 800,
    maxLatencyMs: 2500,
    p95LatencyMsTarget: 1200,
    p99LatencyMsTarget: 3000,
    errorRateTargetPercent: 0.25,
    p1ResponseMinutes: 30,
    p2ResponseMinutes: 60,
    p3ResponseHours: 8,
    p4ResponseHours: 24,
    rtoHours: 4,
    rpoMinutes: 60,
    supportHours: '24/5' as const,
    escalationTimes: 'P1: 30m Lead Engineer -> P2: 60m On-Call',
    penaltyCreditRatePercent: 5,
    isDefault: false
  },
  {
    id: 'sla-silver-03',
    name: 'Standard Silver SLA',
    description: 'Standard SLA for internal productivity tools and developer sandbox environments.',
    availabilityTargetPercent: 99.50,
    apiResponseTimeTargetMs: 1200,
    maxLatencyMs: 4000,
    p95LatencyMsTarget: 2000,
    p99LatencyMsTarget: 5000,
    errorRateTargetPercent: 0.50,
    p1ResponseMinutes: 60,
    p2ResponseMinutes: 120,
    p3ResponseHours: 24,
    p4ResponseHours: 48,
    rtoHours: 12,
    rpoMinutes: 240,
    supportHours: 'business_hours_8x5' as const,
    escalationTimes: 'P1: 60m Operations Desk',
    penaltyCreditRatePercent: 2,
    isDefault: false
  }
];

export const initialKpiDefinitions = [
  {
    id: 'kpi-p95-latency',
    name: 'P95 API Gateway Latency',
    description: '95th percentile response time across all active tenant routing nodes.',
    formula: 'P95(request_duration_ms)',
    targetValue: 800,
    unit: 'ms',
    warningThreshold: 700,
    criticalThreshold: 1000,
    measurementPeriod: 'rolling_15m' as const,
    scope: 'global' as const,
    currentValue: 412,
    status: 'within_target' as const,
    notificationThreshold: 'Trigger warning if P95 > 700ms for 2 consecutive periods.'
  },
  {
    id: 'kpi-availability',
    name: 'Platform Service Availability',
    description: 'Uptime percentage calculated from gateway synthetic health probes.',
    formula: '(successful_probes / total_probes) * 100',
    targetValue: 99.95,
    unit: '%',
    warningThreshold: 99.90,
    criticalThreshold: 99.50,
    measurementPeriod: 'monthly' as const,
    scope: 'global' as const,
    currentValue: 99.98,
    status: 'within_target' as const,
    notificationThreshold: 'Notify Executive CTO if monthly availability drops below 99.90%.'
  },
  {
    id: 'kpi-fallback-ratio',
    name: 'Automated Provider Fallback Rate',
    description: 'Percentage of requests rerouted to secondary/tertiary fallback providers.',
    formula: '(fallback_requests / total_requests) * 100',
    targetValue: 2.0,
    unit: '%',
    warningThreshold: 5.0,
    criticalThreshold: 10.0,
    measurementPeriod: 'rolling_15m' as const,
    scope: 'global' as const,
    currentValue: 0.8,
    status: 'within_target' as const,
    notificationThreshold: 'Alert SecOps if fallback rate > 5.0%.'
  },
  {
    id: 'kpi-pii-scrub',
    name: 'POPIA / GDPR PII Scrubbing Accuracy',
    description: 'Percentage of detected sensitive items successfully masked before LLM submission.',
    formula: '(sanitized_pii_items / detected_pii_items) * 100',
    targetValue: 100.0,
    unit: '%',
    warningThreshold: 99.9,
    criticalThreshold: 99.0,
    measurementPeriod: 'hourly' as const,
    scope: 'global' as const,
    currentValue: 100.0,
    status: 'within_target' as const,
    notificationThreshold: 'Critical alert to Compliance Officer on any unmasked PII leak.'
  }
];

export const initialIncidents = [
  {
    id: 'INC-2026-0824',
    title: 'Gemini 2.5 Pro Latency Spike during 2M Context Document Ingestion',
    severity: 'P3_MEDIUM' as const,
    status: 'monitoring' as const,
    commander: 'Sarah Jenkins (SecOps Lead)',
    affectedTenantIds: ['cust-safecircle'],
    affectedServiceIds: ['p-gemini', 'm-gemini-25-pro'],
    startTime: '2026-08-29 06:15:00',
    estimatedResolutionTime: '2026-08-29 11:00:00',
    slaImpacted: false,
    summary: 'P95 latency elevated to 1,850ms on Gemini Pro context ingestion. Automated routing redirected 12% of traffic to Groq Llama 70B.',
    timeline: [
      { timestamp: '06:15', author: 'Monitoring Probe', note: 'Detected P95 latency > 1,200ms on p-gemini.' },
      { timestamp: '06:18', author: 'Automation Engine', note: 'Triggered WF-102 fallback rule. Diverted 12% document queries to Groq Llama 3.3.' },
      { timestamp: '06:30', author: 'Sarah Jenkins', note: 'Identified Google Vertex API quota throttling. Contacted Google Technical Account Manager.' }
    ],
    postIncidentReview: {
      rootCause: 'Google Vertex API regional rate limit reached during concurrent batch ingestion.',
      customerImpact: '12 document requests experienced +400ms latency bump before fallback engagement.',
      detectionMethod: 'Automated KPI monitor (kpi-p95-latency).',
      correctiveActions: ['Increased Vertex API quota allocation to 10k RPM', 'Enabled proactive token bucket smoothing'],
      preventiveActions: ['Implement pre-flight token estimator in client SDK'],
      owner: 'Sarah Jenkins',
      dueDate: '2026-09-05',
      status: 'in_progress' as const
    }
  },
  {
    id: 'INC-2026-0819',
    title: 'Groq Cloud Transient Rate Limit Exceeded during Peak Financial Hours',
    severity: 'P2_HIGH' as const,
    status: 'resolved' as const,
    commander: 'Horatio Huxham (Platform Architect)',
    affectedTenantIds: ['cust-acme-fintech', 'cust-cashcreators'],
    affectedServiceIds: ['p-groq', 'm-llama33-70b'],
    startTime: '2026-08-19 14:10:00',
    resolvedTime: '2026-08-19 14:24:00',
    slaImpacted: true,
    slaBreachMinutes: 14,
    summary: 'Groq endpoint returned HTTP 429 rate limit error for 14 minutes. Seamlessly failed over to local Ollama GPU cluster.',
    timeline: [
      { timestamp: '14:10', author: 'Gateway Monitor', note: 'Received HTTP 429 from api.groq.com.' },
      { timestamp: '14:11', author: 'Orchestrator', note: 'Failover triggered. Rerouted 100% of traffic to Ollama local node (192.168.1.100).' },
      { timestamp: '14:24', author: 'Horatio Huxham', note: 'Groq rate limits reset. Normalized primary dispatch.' }
    ],
    postIncidentReview: {
      rootCause: 'Third-party provider Groq Cloud transient burst limit trigger.',
      customerImpact: 'Zero dropped requests due to local Ollama fallback; average response time increased by 48ms.',
      detectionMethod: 'Orchestration step failover handler.',
      correctiveActions: ['Upgraded Groq tier to Dedicated LPU Provisioned Throughput'],
      preventiveActions: ['Added local queue buffer for high-volume bursts'],
      owner: 'Horatio Huxham',
      dueDate: '2026-08-25',
      status: 'completed' as const
    }
  }
];

export const initialProblems = [
  {
    id: 'PRB-102',
    title: 'Unchunked Financial PDF Burst Ingestion causing Token Queue Depth Spikes',
    rootCause: 'Client applications submitting 200+ page uncompressed PDFs without prior OCR chunking.',
    affectedServices: ['app-fineduca', 'm-gpt4o'],
    relatedIncidentIds: ['INC-2026-0824'],
    correctiveAction: 'Enforce pre-dispatch client-side chunking in API Gateway policy.',
    preventiveAction: 'Add document size pre-validation guardrail rule in Policy Builder.',
    knownError: true,
    status: 'under_review' as const,
    createdAt: '2026-08-25 10:00:00'
  }
];

export const initialWorkflows = [
  {
    id: 'WF-101',
    name: 'Tenant Budget 90% Threshold Action',
    description: 'When tenant monthly AI spend hits 90% of budget, switch non-critical capabilities to lower cost local models and notify Finance Director.',
    triggerEvent: 'budget_exceeded' as const,
    condition: 'tenant.currentSpendUsd >= tenant.monthlyBudgetUsd * 0.90',
    action: 'switch_secondary_provider' as const,
    targetChannel: 'slack' as const,
    enabled: true,
    lastTriggered: '2026-08-25 14:00:00'
  },
  {
    id: 'WF-102',
    name: 'SLA Latency Breach Automated Escalation',
    description: 'If P95 latency exceeds 1,000ms for over 15 minutes, create a P2 incident and alert On-Call Architecture team on PagerDuty.',
    triggerEvent: 'sla_breach' as const,
    condition: 'kpi.p95LatencyMs > 1000 for 15m',
    action: 'trigger_p2_incident' as const,
    targetChannel: 'pagerduty' as const,
    enabled: true,
    lastTriggered: '2026-08-29 06:18:00'
  },
  {
    id: 'WF-103',
    name: 'POPIA Special Category Data Inspection Alert',
    description: 'When Special Personal Information (health/biometric) is detected in a prompt, execute automatic zero-retention masking and notify Statutory IO.',
    triggerEvent: 'pii_detected' as const,
    condition: 'compliance.specialCategoryCount > 0',
    action: 'notify_admin' as const,
    targetChannel: 'email' as const,
    enabled: true,
    lastTriggered: '2026-08-29 07:42:00'
  }
];

export const initialIamRoles = [
  {
    id: 'role-plat-admin',
    name: 'Platform Administrator',
    description: 'Full unconstrained platform control, provider configuration, key management, and system setup.',
    isSystemRole: true,
    permissions: ['tenant.read', 'tenant.write', 'billing.read', 'billing.write', 'models.read', 'models.write', 'policies.read', 'policies.write', 'audit.read', 'security.read', 'security.write']
  },
  {
    id: 'role-tenant-admin',
    name: 'Tenant Administrator',
    description: 'Full administrative access restricted to specific customer organization and assigned apps.',
    isSystemRole: true,
    permissions: ['tenant.read', 'tenant.write', 'billing.read', 'models.read', 'policies.read', 'audit.read']
  },
  {
    id: 'role-sec-officer',
    name: 'Security Officer',
    description: 'SOC threat monitoring, prompt injection telemetry, IP whitelisting, and key revoking permissions.',
    isSystemRole: true,
    permissions: ['security.read', 'security.write', 'policies.read', 'policies.write', 'audit.read']
  },
  {
    id: 'role-compliance-officer',
    name: 'Compliance Officer',
    description: 'POPIA / GDPR statutory oversight, DSAR fulfillment, information officer audits, and evidence review.',
    isSystemRole: true,
    permissions: ['tenant.read', 'policies.read', 'policies.write', 'audit.read', 'security.read']
  },
  {
    id: 'role-fin-admin',
    name: 'Finance Administrator',
    description: 'FinOps cost management, itemized invoices, credit balance management, and budget ceiling controls.',
    isSystemRole: true,
    permissions: ['tenant.read', 'billing.read', 'billing.write', 'audit.read']
  }
];

export const initialIamUsers = [
  {
    id: 'usr-horatio',
    name: 'Horatio Huxham',
    email: 'Horatio.huxham@gmail.com',
    department: 'Executive Platform Architecture',
    roleId: 'role-plat-admin',
    roleName: 'Platform Administrator',
    status: 'active' as const,
    mfaEnabled: true,
    authMethod: 'sso_saml' as const,
    lastLogin: '2026-08-29 08:50:00'
  },
  {
    id: 'usr-david-acme',
    name: 'David Van Der Merwe',
    email: 'd.vandermerwe@acmefintech.co.za',
    department: 'Acme Technology Office',
    roleId: 'role-tenant-admin',
    roleName: 'Tenant Administrator',
    tenantId: 'cust-acme-fintech',
    tenantName: 'Acme Financial Technologies',
    status: 'active' as const,
    mfaEnabled: true,
    authMethod: 'oauth_google' as const,
    lastLogin: '2026-08-29 08:45:00'
  },
  {
    id: 'usr-willem-compliance',
    name: 'Adv. Willem Van Zyl',
    email: 'privacy@acmefintech.co.za',
    department: 'Legal & Regulatory Compliance',
    roleId: 'role-compliance-officer',
    roleName: 'Compliance Officer',
    tenantId: 'cust-acme-fintech',
    tenantName: 'Acme Financial Technologies',
    status: 'active' as const,
    mfaEnabled: true,
    authMethod: 'mfa_password' as const,
    lastLogin: '2026-08-29 07:15:00'
  },
  {
    id: 'usr-sarah-sec',
    name: 'Sarah Jenkins',
    email: 's.jenkins@altil.security',
    department: 'Cyber Security Operations Centre',
    roleId: 'role-sec-officer',
    roleName: 'Security Officer',
    status: 'active' as const,
    mfaEnabled: true,
    authMethod: 'sso_saml' as const,
    lastLogin: '2026-08-29 08:30:00'
  }
];

export const initialComplianceControls = [
  {
    id: 'ctrl-popia-72',
    framework: 'POPIA' as const,
    code: 'POPIA Section 72',
    title: 'Trans-border Data Flow Restrictions',
    requirement: 'Personal information may only be transferred outside South Africa to recipients bound by adequate data protection laws or binding agreements.',
    status: 'compliant' as const,
    owner: 'Adv. Willem Van Zyl',
    evidenceIds: ['evid-01'],
    lastReviewDate: '2026-08-15'
  },
  {
    id: 'ctrl-gdpr-32',
    framework: 'GDPR' as const,
    code: 'GDPR Article 32',
    title: 'Security of Processing & Pseudonymisation',
    requirement: 'Implement appropriate technical and organisational measures including encryption, pseudonymisation, and zero-retention LLM buffers.',
    status: 'compliant' as const,
    owner: 'Elena Rostova, CIPP/E',
    evidenceIds: ['evid-02'],
    lastReviewDate: '2026-08-20'
  },
  {
    id: 'ctrl-nist-rmf-1',
    framework: 'NIST_AI_RMF' as const,
    code: 'NIST AI RMF GOVERN 1.1',
    title: 'AI Risk Management & Safety Guardrails',
    requirement: 'Policies, processes, and procedures for AI risk management are established, documented, and enforced in gateway runtime.',
    status: 'compliant' as const,
    owner: 'Horatio Huxham',
    evidenceIds: ['evid-03'],
    lastReviewDate: '2026-08-28'
  }
];

export const initialEvidence = [
  {
    id: 'evid-01',
    controlId: 'ctrl-popia-72',
    fileName: 'POPIA_Section72_CrossBorder_Legal_Assessment_2026.pdf',
    description: 'Signed legal opinion confirming EU and SA adequacy parity for cloud AI nodes.',
    uploadedBy: 'Adv. Willem Van Zyl',
    uploadedAt: '2026-08-15 11:20:00',
    fileSizeMb: 2.4
  },
  {
    id: 'evid-02',
    controlId: 'ctrl-gdpr-32',
    fileName: 'ALTIL_ZeroRetention_TLS_Architecture_Audit.pdf',
    description: 'Independent SOC 2 Type II audit report validating zero data retention in memory buffers.',
    uploadedBy: 'Elena Rostova, CIPP/E',
    uploadedAt: '2026-08-20 14:10:00',
    fileSizeMb: 4.8
  }
];

export const initialExecutiveReports = [
  {
    id: 'rep-sla-aug-2026',
    title: 'Monthly Executive SLA & Platform Health Report — August 2026',
    type: 'monthly_sla' as const,
    generatedAt: '2026-08-29 08:00:00',
    period: 'August 2026',
    summaryMetrics: {
      'Overall Availability': '99.98%',
      'Total Requests': 48420,
      'P95 Response Latency': '412ms',
      'SLA Breach Minutes': '14 mins',
      'Penalty Credits Accrued': 'R0.00'
    }
  },
  {
    id: 'rep-finops-aug-2026',
    title: 'Enterprise FinOps AI Spend & Token Consumption Report',
    type: 'ai_cost_finops' as const,
    generatedAt: '2026-08-29 07:30:00',
    period: 'August 2026',
    summaryMetrics: {
      'Total AI Spend': '$1,482.40 / R26,683.20',
      'Free Tier Cost Savings': '$420.15 / R7,562.70',
      'Cost per 1k Tokens': '$0.00018',
      'Most Cost Efficient Provider': 'Groq Cloud LPU'
    }
  },
  {
    id: 'rep-soc-aug-2026',
    title: 'Executive CISO Security & Threat Intelligence Summary',
    type: 'security_soc' as const,
    generatedAt: '2026-08-28 18:00:00',
    period: 'August 2026',
    summaryMetrics: {
      'Threats Blocked': 142,
      'Prompt Injections Deflected': 38,
      'PII Redactions Performed': 1240,
      'Auth Failure Anomalies': 4
    }
  }
];

export const initialEntitlements = [
  { feature: 'Monthly Gateway Requests', contracted: '10,000,000', entitled: '10,000,000', consumed: '1,420,000', remaining: '8,580,000', unit: 'requests', status: 'normal' as const },
  { feature: 'Monthly AI Token Volume', contracted: '500,000,000', entitled: '500,000,000', consumed: '84,500,000', remaining: '415,500,000', unit: 'tokens', status: 'normal' as const },
  { feature: 'Availability Commitment', contracted: '99.95%', entitled: '99.95%', consumed: '99.98%', remaining: '+0.03%', unit: 'uptime %', status: 'normal' as const },
  { feature: 'P1 Emergency Incident SLA', contracted: '15 min response / 2 hr fix', entitled: '15 min response / 2 hr fix', consumed: '8 min response / 42 min fix', remaining: 'Compliant', unit: 'time', status: 'normal' as const },
  { feature: 'Private Ollama Local GPU Cluster', contracted: '4 Nodes Dedicated', entitled: '4 Nodes Dedicated', consumed: '4 Nodes Active', remaining: '0 Nodes Available', unit: 'nodes', status: 'normal' as const },
  { feature: 'Cross-Region DR Failover', contracted: 'Active-Active RTO 1h', entitled: 'Active-Active RTO 1h', consumed: 'RTO 24m Verified', remaining: 'Ready', unit: 'status', status: 'normal' as const }
];

export const initialServiceCatalogue = [
  {
    id: 'srv-01',
    name: 'ALTIL AI Gateway & Policy Engine',
    category: 'AI Gateway' as const,
    description: 'High-throughput enterprise AI proxy with real-time prompt injection defense, POPIA/GDPR PII redactor, and fallbacks.',
    serviceOwner: 'Horatio Huxham (Head of AI Ops)',
    technicalOwner: 'Tebogo Molefe (Principal Systems Engineer)',
    slaTier: 'Enterprise Platinum 99.95%',
    pricingModel: '$0.0001 per request + Token Passthrough',
    dependencies: ['Redis Cluster', 'Audit Ledger DB', 'Identity Provider'],
    supportModel: '24/7/365 Dedicated P1 War Room',
    criticality: 'tier_0_mission_critical' as const,
    riskClassification: 'LOW' as const,
    status: 'active' as const
  },
  {
    id: 'srv-02',
    name: 'Dedicated Local Ollama Private AI Cluster',
    category: 'Private AI' as const,
    description: 'Zero-egress, sovereign on-premise AI processing running Llama 3 & DeepSeek on dedicated GPU hardware.',
    serviceOwner: 'Sipho Nkosi (Infrastructure Lead)',
    technicalOwner: 'Johan Pretorius (AI Hardware Ops)',
    slaTier: 'Enterprise Gold 99.90%',
    pricingModel: 'Fixed R15,000/month GPU Node Allocation',
    dependencies: ['On-Prem GPU Cluster', 'VPC Edge Router'],
    supportModel: '24/7/365 On-Call Support',
    criticality: 'tier_1_business_critical' as const,
    riskClassification: 'LOW' as const,
    status: 'active' as const
  },
  {
    id: 'srv-03',
    name: 'POPIA & GDPR Statutory AI Governance Guard',
    category: 'AI Governance' as const,
    description: 'Automated Special Category Data masking, DSAR export pipeline, and cross-border adequacy verifier.',
    serviceOwner: 'Elena Rostova (Compliance Director)',
    technicalOwner: 'Tebogo Molefe (Principal Systems Engineer)',
    slaTier: 'Statutory Zero-Breach SLA',
    pricingModel: 'Included in Enterprise Plan',
    dependencies: ['Audit Ledger DB', 'Vault Encryption Service'],
    supportModel: 'Business Hours + Statutory Emergency Contact',
    criticality: 'tier_0_mission_critical' as const,
    riskClassification: 'LOW' as const,
    status: 'active' as const
  },
  {
    id: 'srv-04',
    name: 'Groq Ultra-Fast LPU Acceleration Service',
    category: 'AI Gateway' as const,
    description: 'Sub-300ms inference routing for high-frequency conversational agents and real-time customer support.',
    serviceOwner: 'Horatio Huxham',
    technicalOwner: 'Groq Cloud API Engineering',
    slaTier: 'Standard 99.9%',
    pricingModel: 'Free Tier + Pay-As-You-Go ($0.00008/1k tokens)',
    dependencies: ['Groq LPU Cloud', 'ALTIL Router'],
    supportModel: '24/5 Standard Support',
    criticality: 'tier_2_important' as const,
    riskClassification: 'LOW' as const,
    status: 'active' as const
  }
];

export const initialCmdbNodes = [
  { id: 'node-t1', name: 'Discovery Health SA (Tenant)', type: 'tenant' as const, status: 'operational' as const },
  { id: 'node-t2', name: 'Standard Bank Group (Tenant)', type: 'tenant' as const, status: 'operational' as const },
  { id: 'node-a1', name: 'Clinical Note Summarizer (App)', type: 'application' as const, status: 'operational' as const, latencyMs: 124 },
  { id: 'node-a2', name: 'Fraud Analysis Copilot (App)', type: 'application' as const, status: 'operational' as const, latencyMs: 88 },
  { id: 'node-gw', name: 'ALTIL Gateway Engine', type: 'gateway' as const, status: 'operational' as const, latencyMs: 12 },
  { id: 'node-orch', name: 'Orchestration & Fallback Matrix', type: 'orchestration' as const, status: 'operational' as const },
  { id: 'node-policy', name: 'POPIA / Security Policy Filter', type: 'policy' as const, status: 'operational' as const, latencyMs: 4 },
  { id: 'node-router', name: 'Dynamic Model Router', type: 'router' as const, status: 'operational' as const },
  { id: 'node-[#prov-groq]', name: 'Groq LPU Cloud', type: 'provider' as const, status: 'operational' as const, latencyMs: 210 },
  { id: 'node-[#prov-ollama]', name: 'Ollama Local Cluster', type: 'provider' as const, status: 'operational' as const, latencyMs: 450 },
  { id: 'node-[#prov-openai]', name: 'OpenAI API Node', type: 'provider' as const, status: 'degraded' as const, latencyMs: 1420, details: 'P99 latency spike in US-East region' },
  { id: 'node-db', name: 'PostgreSQL Audit Ledger', type: 'infrastructure' as const, status: 'operational' as const },
  { id: 'node-redis', name: 'Redis Cache & Rate Limiter', type: 'infrastructure' as const, status: 'operational' as const }
];

export const initialCmdbDependencies = [
  { fromId: 'node-t1', toId: 'node-a1', relation: 'uses' as const },
  { fromId: 'node-t2', toId: 'node-a2', relation: 'uses' as const },
  { fromId: 'node-a1', toId: 'node-gw', relation: 'routes_to' as const },
  { fromId: 'node-a2', toId: 'node-gw', relation: 'routes_to' as const },
  { fromId: 'node-gw', toId: 'node-policy', relation: 'enforces' as const },
  { fromId: 'node-policy', toId: 'node-orch', relation: 'depends_on' as const },
  { fromId: 'node-orch', toId: 'node-router', relation: 'routes_to' as const },
  { fromId: 'node-router', toId: 'node-[#prov-groq]', relation: 'routes_to' as const },
  { fromId: 'node-router', toId: 'node-[#prov-ollama]', relation: 'routes_to' as const },
  { fromId: 'node-router', toId: 'node-[#prov-openai]', relation: 'routes_to' as const },
  { fromId: 'node-gw', toId: 'node-db', relation: 'depends_on' as const },
  { fromId: 'node-gw', toId: 'node-redis', relation: 'depends_on' as const }
];

export const initialRiskRegister = [
  {
    id: 'RISK-001',
    tenantId: 'cust-discovery',
    tenantName: 'Discovery Health SA',
    category: 'Privacy' as const,
    description: 'Special Category Health Data disclosure during prompt evaluation via public API endpoints.',
    probability: 2 as const,
    impact: 5 as const,
    inherentRiskScore: 10,
    inherentRiskLevel: 'HIGH' as const,
    controls: ['POPIA Regex Redactor', 'Local Ollama Zero-Egress Routing', 'TLS 1.3 Payload Encryption'],
    residualRiskScore: 2,
    residualRiskLevel: 'LOW' as const,
    riskOwner: 'Elena Rostova (Compliance Officer)',
    treatment: 'mitigate' as const,
    dueDate: '2026-09-30',
    status: 'in_mitigation' as const,
    evidenceIds: ['evid-01', 'evid-02']
  },
  {
    id: 'RISK-002',
    tenantId: 'cust-std-bank',
    tenantName: 'Standard Bank Group',
    category: 'Cybersecurity' as const,
    description: 'Prompt Injection / Jailbreak attack bypassing baseline system instructions.',
    probability: 4 as const,
    impact: 4 as const,
    inherentRiskScore: 16,
    inherentRiskLevel: 'CRITICAL' as const,
    controls: ['Secondary Adversarial Scanner', 'Regex Rule Base', 'Output Guardrails'],
    residualRiskScore: 4,
    residualRiskLevel: 'MEDIUM' as const,
    riskOwner: 'Dr. Michael Chen (CISO)',
    treatment: 'mitigate' as const,
    dueDate: '2026-09-15',
    status: 'open' as const,
    evidenceIds: ['evid-03']
  },
  {
    id: 'RISK-003',
    tenantId: 'cust-std-bank',
    tenantName: 'Standard Bank Group',
    category: 'Concentration risk' as const,
    description: 'Over-reliance on OpenAI primary model without automated Groq/Ollama fallback active.',
    probability: 3 as const,
    impact: 4 as const,
    inherentRiskScore: 12,
    inherentRiskLevel: 'HIGH' as const,
    controls: ['Automated Fallback Router', 'Multi-Provider Failover Matrix'],
    residualRiskScore: 3,
    residualRiskLevel: 'LOW' as const,
    riskOwner: 'Horatio Huxham (Head of AI Ops)',
    treatment: 'mitigate' as const,
    dueDate: '2026-09-01',
    status: 'in_mitigation' as const,
    evidenceIds: []
  }
];

export const initialAiModelGovernance = [
  {
    id: 'gov-mod-01',
    modelId: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'OpenAI Cloud',
    version: '2024-08-06',
    contextWindow: '128,000 tokens',
    costPer1kInputUsd: 0.0025,
    costPer1kOutputUsd: 0.010,
    accuracyBenchmark: 94.2,
    securityBenchmark: 91.5,
    hallucinationRatePercent: 1.2,
    piiHandlingRating: 'GOOD' as const,
    dataResidency: 'US Sovereign Edge (Zero-Log)',
    approvedUseCases: ['Complex Reasoning', 'Multilingual Code Generation', 'Policy Auditing'],
    prohibitedUseCases: ['Unredacted Special Category Medical Records'],
    riskRating: 'MEDIUM' as const,
    lifecycleState: 'PRODUCTION' as const,
    modelOwner: 'Dr. Michael Chen',
    reviewDate: '2026-11-01'
  },
  {
    id: 'gov-mod-02',
    modelId: 'llama-3.3-70b',
    name: 'Llama 3.3 70B (Ollama Local)',
    provider: 'Private Local GPU Cluster',
    version: '3.3-70b-instruct',
    contextWindow: '128,000 tokens',
    costPer1kInputUsd: 0.0000,
    costPer1kOutputUsd: 0.0000,
    accuracyBenchmark: 91.8,
    securityBenchmark: 98.4,
    hallucinationRatePercent: 1.8,
    piiHandlingRating: 'EXCELLENT' as const,
    dataResidency: 'South Africa On-Premise (Zero Egress)',
    approvedUseCases: ['POPIA Special Category Records', 'Sovereign Banking Workloads', 'Offline Operations'],
    prohibitedUseCases: ['None'],
    riskRating: 'LOW' as const,
    lifecycleState: 'PRODUCTION' as const,
    modelOwner: 'Johan Pretorius',
    reviewDate: '2026-12-15'
  },
  {
    id: 'gov-mod-03',
    modelId: 'llama-3.1-8b-groq',
    name: 'Llama 3.1 8B (Groq LPU)',
    provider: 'Groq LPU Cloud',
    version: '3.1-8b-instant',
    contextWindow: '8,192 tokens',
    costPer1kInputUsd: 0.00005,
    costPer1kOutputUsd: 0.00008,
    accuracyBenchmark: 88.4,
    securityBenchmark: 93.0,
    hallucinationRatePercent: 2.1,
    piiHandlingRating: 'EXCELLENT' as const,
    dataResidency: 'EU Sovereign Region',
    approvedUseCases: ['Sub-300ms Support Chat', 'High-Frequency Intent Classification'],
    prohibitedUseCases: ['Legal Document Drafting'],
    riskRating: 'LOW' as const,
    lifecycleState: 'PRODUCTION' as const,
    modelOwner: 'Tebogo Molefe',
    reviewDate: '2026-10-10'
  }
];

export const initialModelEvalBenchmarks = [
  {
    modelName: 'OpenAI GPT-4o',
    provider: 'OpenAI Cloud',
    latencyMs: 840,
    costPer1kTokens: 0.00625,
    accuracyScore: 95,
    reasoningScore: 96,
    codingScore: 94,
    securityScore: 92,
    piiMaskingScore: 90,
    promptInjectionDefenseScore: 91,
    hallucinationRate: 1.2,
    recommendationWeightScore: 92.4
  },
  {
    modelName: 'Llama 3.3 70B (Ollama On-Prem)',
    provider: 'Local Private GPU',
    latencyMs: 420,
    costPer1kTokens: 0.0000,
    accuracyScore: 92,
    reasoningScore: 90,
    codingScore: 91,
    securityScore: 99,
    piiMaskingScore: 99,
    promptInjectionDefenseScore: 98,
    hallucinationRate: 1.8,
    recommendationWeightScore: 95.8
  },
  {
    modelName: 'Llama 3.1 8B (Groq LPU)',
    provider: 'Groq LPU Cloud',
    latencyMs: 210,
    costPer1kTokens: 0.00006,
    accuracyScore: 88,
    reasoningScore: 85,
    codingScore: 86,
    securityScore: 94,
    piiMaskingScore: 95,
    promptInjectionDefenseScore: 93,
    hallucinationRate: 2.1,
    recommendationWeightScore: 91.2
  }
];

export const initialVendor360 = [
  {
    id: 'vend-01',
    vendorName: 'Groq Cloud LPU',
    status: 'active' as const,
    modelsCount: 3,
    pricingTier: 'Enterprise Free Tier + Volume Discount',
    slaTargetPercent: 99.9,
    actualAvailabilityPercent: 99.98,
    dpaSigned: true,
    securityCertifications: ['SOC 2 Type II', 'ISO 27001', 'EU Adequacy'],
    dataResidency: 'Frankfurt, EU',
    concentrationRiskExposurePercent: 32,
    monthlySpendUsd: 142.50,
    riskScore: 'LOW' as const,
    drFailoverReadiness: 'READY' as const
  },
  {
    id: 'vend-02',
    vendorName: 'Ollama Local Sovereign Cluster',
    status: 'active' as const,
    modelsCount: 4,
    pricingTier: 'On-Premise Infrastructure',
    slaTargetPercent: 99.99,
    actualAvailabilityPercent: 100.0,
    dpaSigned: true,
    securityCertifications: ['Sovereign POPIA Certified', 'ISO 27001'],
    dataResidency: 'Johannesburg, South Africa',
    concentrationRiskExposurePercent: 48,
    monthlySpendUsd: 0.00,
    riskScore: 'LOW' as const,
    drFailoverReadiness: 'READY' as const
  },
  {
    id: 'vend-03',
    vendorName: 'OpenAI API Cloud Services',
    status: 'active' as const,
    modelsCount: 2,
    pricingTier: 'Pay-As-You-Go API',
    slaTargetPercent: 99.9,
    actualAvailabilityPercent: 99.85,
    dpaSigned: true,
    securityCertifications: ['SOC 2 Type II', 'HIPAA Compliant BAA'],
    dataResidency: 'US Sovereign Region',
    concentrationRiskExposurePercent: 20,
    monthlySpendUsd: 1339.90,
    riskScore: 'MEDIUM' as const,
    drFailoverReadiness: 'READY' as const
  }
];

export const initialBcdrStatus = {
  rtoTargetHours: 1,
  rpoTargetMinutes: 15,
  backupStatus: 'HEALTHY' as const,
  replicationStatus: 'ACTIVE_ACTIVE' as const,
  drRegion: 'South Africa West (Cape Town DR Node)',
  failoverReadiness: '100% READY' as const,
  lastDrTestDate: '2026-08-15',
  lastDrTestResult: 'PASSED' as const,
  recoverySuccessPercent: 100,
  outstandingDrIssuesCount: 0,
  exerciseInProgress: false
};

export const initialChangeRequests = [
  {
    id: 'CHG-2026-089',
    title: 'Deploy Groq Llama 3.3 70B Fallback Node in EU Region',
    requestor: 'Tebogo Molefe',
    tenantId: 'cust-discovery',
    service: 'ALTIL AI Gateway',
    type: 'Normal' as const,
    riskLevel: 'LOW' as const,
    impactDescription: 'Adds zero-downtime secondary failover for Discovery Health workloads.',
    plannedStart: '2026-08-30 02:00:00',
    plannedCompletion: '2026-08-30 03:00:00',
    backoutPlan: 'Revert ALTIL Router routing table v2.4 to v2.3.',
    testPlan: 'Run synthetic load test of 500 requests/sec via Ollama sandbox.',
    approvalStatus: 'approved' as const,
    implementationNotes: 'Pre-flight checks passed in staging.',
    relatedIncidentId: 'INC-2026-042'
  },
  {
    id: 'CHG-2026-090',
    title: 'Update POPIA PII Redactor Regex for SA ID Card Numbers',
    requestor: 'Elena Rostova',
    service: 'Policy Engine',
    type: 'Standard' as const,
    riskLevel: 'LOW' as const,
    impactDescription: 'Enhances automated Luhn algorithm validation on 13-digit SA ID numbers.',
    plannedStart: '2026-08-28 10:00:00',
    plannedCompletion: '2026-08-28 10:15:00',
    backoutPlan: 'Hot-swap policy module ruleset',
    testPlan: 'Unit test suite with 50 synthetic test ID numbers.',
    approvalStatus: 'implemented' as const,
    implementationNotes: 'Successfully deployed in production without disruption.'
  }
];

export const initialServiceDeskTickets = [
  {
    id: 'REQ-2026-104',
    requestType: 'Quota Limit Increase' as const,
    requestorName: 'Dr. Andre Marais',
    tenantName: 'Discovery Health SA',
    description: 'Requesting token monthly quota increase from 500M to 1B tokens for Q4 clinical trial processing.',
    priority: 'HIGH' as const,
    approvalStage: 'Commercial Approval' as const,
    status: 'in_approval' as const,
    createdAt: '2026-08-28 14:20:00'
  },
  {
    id: 'REQ-2026-105',
    requestType: 'IP Whitelist' as const,
    requestorName: 'Sipho Nkosi',
    tenantName: 'Standard Bank Group',
    description: 'Add new CIDR range 196.25.1.0/24 to tenant IP whitelist for direct core banking gateway integration.',
    priority: 'MEDIUM' as const,
    approvalStage: 'Security Review' as const,
    status: 'in_approval' as const,
    createdAt: '2026-08-29 07:15:00'
  }
];

export const initialSecurityPosture = {
  overallScore: 94,
  domainScores: {
    identityScore: 96,
    apiSecurityScore: 95,
    aiSecurityScore: 92,
    dataSecurityScore: 98,
    infrastructureScore: 94,
    vulnerabilityScore: 91,
    complianceScore: 97
  },
  topRisks: [
    { id: 'SEC-R1', risk: 'Potential prompt injection bypass on edge chat widget', owner: 'Dr. Michael Chen', dueDate: '2026-09-10', severity: 'HIGH' as const },
    { id: 'SEC-R2', risk: 'Unused API Key key-sec-08 requiring annual revocation', owner: 'Tebogo Molefe', dueDate: '2026-09-05', severity: 'MEDIUM' as const }
  ]
};

export const initialActivityFeed = [
  { id: 'act-01', timestamp: '09:41', severity: 'critical' as const, title: 'P1 Incident Declared', details: 'OpenAI US-East region experiencing high P99 latency (1.4s).' },
  { id: 'act-02', timestamp: '09:43', severity: 'success' as const, title: 'Groq & Ollama Fallback Activated', details: 'Traffic seamlessly redirected to local Ollama GPU cluster & Groq LPU.' },
  { id: 'act-03', timestamp: '09:44', severity: 'warning' as const, title: 'SLA Latency Warning Triggered', details: 'Tenant SLA threshold evaluated for Discovery Health SA.' },
  { id: 'act-04', timestamp: '09:46', severity: 'info' as const, title: 'Security Officer Notified', details: 'Dr. Michael Chen paged via automated PagerDuty integration.' },
  { id: 'act-05', timestamp: '09:52', severity: 'success' as const, title: 'System Normalization', details: 'Primary provider latency returned to baseline (<300ms).' }
];


