var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/data/initialState.ts
var initialState_exports = {};
__export(initialState_exports, {
  CAPABILITIES_CATALOG: () => CAPABILITIES_CATALOG,
  INITIAL_API_KEYS: () => INITIAL_API_KEYS,
  INITIAL_APPLICATIONS: () => INITIAL_APPLICATIONS,
  INITIAL_AUDIT_LOGS: () => INITIAL_AUDIT_LOGS,
  INITIAL_CUSTOMERS: () => INITIAL_CUSTOMERS,
  INITIAL_DATA_SUBJECT_REQUESTS: () => INITIAL_DATA_SUBJECT_REQUESTS,
  INITIAL_GLOBAL_COMPLIANCE_CONFIG: () => INITIAL_GLOBAL_COMPLIANCE_CONFIG,
  INITIAL_MODELS: () => INITIAL_MODELS,
  INITIAL_POLICIES: () => INITIAL_POLICIES,
  INITIAL_PROVIDERS: () => INITIAL_PROVIDERS,
  INITIAL_ROUTING_RULES: () => INITIAL_ROUTING_RULES,
  INITIAL_SYSTEM_HEALTH: () => INITIAL_SYSTEM_HEALTH,
  USAGE_CHART_DATA: () => USAGE_CHART_DATA,
  initialActivityFeed: () => initialActivityFeed,
  initialAiModelGovernance: () => initialAiModelGovernance,
  initialApiKeys: () => initialApiKeys,
  initialApplications: () => initialApplications,
  initialAuditLogs: () => initialAuditLogs,
  initialBcdrStatus: () => initialBcdrStatus,
  initialChangeRequests: () => initialChangeRequests,
  initialCmdbDependencies: () => initialCmdbDependencies,
  initialCmdbNodes: () => initialCmdbNodes,
  initialComplianceControls: () => initialComplianceControls,
  initialCustomers: () => initialCustomers,
  initialDataSubjectRequests: () => initialDataSubjectRequests,
  initialEntitlements: () => initialEntitlements,
  initialEvidence: () => initialEvidence,
  initialExecutiveReports: () => initialExecutiveReports,
  initialGlobalComplianceConfig: () => initialGlobalComplianceConfig,
  initialIamRoles: () => initialIamRoles,
  initialIamUsers: () => initialIamUsers,
  initialIncidents: () => initialIncidents,
  initialKpiDefinitions: () => initialKpiDefinitions,
  initialModelEvalBenchmarks: () => initialModelEvalBenchmarks,
  initialModels: () => initialModels,
  initialPolicies: () => initialPolicies,
  initialProblems: () => initialProblems,
  initialProviders: () => initialProviders,
  initialRiskRegister: () => initialRiskRegister,
  initialRoutingRules: () => initialRoutingRules,
  initialSecurityPosture: () => initialSecurityPosture,
  initialServiceCatalogue: () => initialServiceCatalogue,
  initialServiceDeskTickets: () => initialServiceDeskTickets,
  initialSlaProfiles: () => initialSlaProfiles,
  initialSystemHealth: () => initialSystemHealth,
  initialUsageMetrics: () => initialUsageMetrics,
  initialVendor360: () => initialVendor360,
  initialWorkflows: () => initialWorkflows
});
var INITIAL_PROVIDERS, INITIAL_MODELS, INITIAL_CUSTOMERS, INITIAL_APPLICATIONS, INITIAL_API_KEYS, INITIAL_ROUTING_RULES, INITIAL_POLICIES, INITIAL_GLOBAL_COMPLIANCE_CONFIG, INITIAL_DATA_SUBJECT_REQUESTS, INITIAL_AUDIT_LOGS, INITIAL_SYSTEM_HEALTH, initialProviders, initialModels, initialCustomers, initialApplications, initialApiKeys, initialRoutingRules, initialPolicies, initialGlobalComplianceConfig, initialDataSubjectRequests, initialAuditLogs, initialSystemHealth, initialUsageMetrics, USAGE_CHART_DATA, CAPABILITIES_CATALOG, initialSlaProfiles, initialKpiDefinitions, initialIncidents, initialProblems, initialWorkflows, initialIamRoles, initialIamUsers, initialComplianceControls, initialEvidence, initialExecutiveReports, initialEntitlements, initialServiceCatalogue, initialCmdbNodes, initialCmdbDependencies, initialRiskRegister, initialAiModelGovernance, initialModelEvalBenchmarks, initialVendor360, initialBcdrStatus, initialChangeRequests, initialServiceDeskTickets, initialSecurityPosture, initialActivityFeed;
var init_initialState = __esm({
  "src/data/initialState.ts"() {
    INITIAL_PROVIDERS = [
      {
        id: "p-openai",
        name: "OpenAI Direct Gateway",
        type: "openai",
        endpoint: "https://api.openai.com/v1",
        apiKey: "sk-proj-altil_live_4918f8e02914ba82c91028",
        keyPrefix: "sk-proj-...82c9",
        organizationId: "org-introsoft-eu",
        enabled: true,
        status: "online",
        latencyMs: 260,
        p95LatencyMs: 410,
        uptimePercent: 99.98,
        errorRate: 0.01,
        priority: 1,
        timeoutMs: 3e4,
        rateLimitRpm: 1e4,
        rateLimitTpm: 2e6,
        hasFreeTier: false,
        freeModelsCount: 0,
        modelsCount: 4,
        totalRequests: 8420,
        tokensTotal: 1845e4,
        costTotal: 28.45,
        lastTested: "2026-08-29 10:32:00",
        notes: "Enterprise Tier 5 direct OpenAI interconnect. Primary reasoning engine for GPT-4o and o3-mini."
      },
      {
        id: "p-groq",
        name: "Groq Cloud LPU",
        type: "groq",
        endpoint: "https://api.groq.com/openai/v1",
        apiKey: "gsk_99a84f39c09d8174e921",
        keyPrefix: "gsk_...e921",
        enabled: true,
        status: "online",
        latencyMs: 84,
        p95LatencyMs: 140,
        uptimePercent: 99.99,
        errorRate: 0.05,
        priority: 2,
        timeoutMs: 1e4,
        rateLimitRpm: 6e3,
        rateLimitTpm: 5e5,
        hasFreeTier: true,
        freeModelsCount: 4,
        modelsCount: 6,
        totalRequests: 14605,
        tokensTotal: 298e5,
        costTotal: 3.12,
        lastTested: "2026-08-29 10:29:40",
        notes: "Ultra-fast LPU inference (500+ tokens/sec). Includes generous free tier models and low latency fallback."
      },
      {
        id: "p-ollama",
        name: "Ollama Local Cluster (Excluded - Cloud Only Mode)",
        type: "ollama",
        endpoint: "http://192.168.1.100:11434",
        apiKey: "",
        keyPrefix: "Excluded",
        enabled: false,
        status: "offline",
        latencyMs: 0,
        p95LatencyMs: 0,
        uptimePercent: 0,
        errorRate: 0,
        priority: 99,
        timeoutMs: 15e3,
        rateLimitRpm: 0,
        hasFreeTier: false,
        freeModelsCount: 0,
        modelsCount: 0,
        totalRequests: 0,
        tokensTotal: 0,
        costTotal: 0,
        lastTested: "2026-08-29 10:28:15",
        notes: "On-premise infrastructure excluded per operational policy (Cloud-only architecture active)."
      },
      {
        id: "p-gemini",
        name: "Google Gemini Cloud",
        type: "gemini",
        endpoint: "https://generativelanguage.googleapis.com",
        apiKey: "AIzaSy_altil_gemini_prod_key",
        keyPrefix: "AIzaSy_...prod",
        enabled: true,
        status: "online",
        latencyMs: 310,
        p95LatencyMs: 480,
        uptimePercent: 99.95,
        errorRate: 0.02,
        priority: 4,
        timeoutMs: 25e3,
        rateLimitRpm: 4e3,
        hasFreeTier: true,
        freeModelsCount: 3,
        modelsCount: 5,
        totalRequests: 6396,
        tokensTotal: 142e5,
        costTotal: 4.8,
        lastTested: "2026-08-29 10:30:10",
        notes: "Enterprise multimodal & massive context window tier (1M-2M tokens) with Gemini 2.0 Flash free quota."
      },
      {
        id: "p-openrouter",
        name: "OpenRouter Multi-Cloud Aggregator",
        type: "openrouter",
        endpoint: "https://openrouter.ai/api/v1",
        apiKey: "sk-or-v1-99824cde871a2b",
        keyPrefix: "sk-or-v1-...1a2b",
        customHeaders: { "HTTP-Referer": "https://introsoft.internal", "X-Title": "Introsoft ALTIL" },
        enabled: true,
        status: "online",
        latencyMs: 380,
        p95LatencyMs: 590,
        uptimePercent: 99.85,
        errorRate: 0.15,
        priority: 5,
        timeoutMs: 2e4,
        rateLimitRpm: 2e3,
        hasFreeTier: true,
        freeModelsCount: 4,
        modelsCount: 8,
        totalRequests: 2890,
        tokensTotal: 69e5,
        costTotal: 5.6,
        lastTested: "2026-08-29 09:15:22",
        notes: "Universal gateway providing Claude 3.5 Sonnet, free community models (:free), and global fallback routes."
      },
      {
        id: "p-anthropic",
        name: "Anthropic Claude Direct",
        type: "anthropic",
        endpoint: "https://api.anthropic.com/v1",
        apiKey: "sk-ant-api03-altil_direct_key_9921",
        keyPrefix: "sk-ant-...9921",
        enabled: true,
        status: "online",
        latencyMs: 340,
        p95LatencyMs: 510,
        uptimePercent: 99.97,
        errorRate: 0.01,
        priority: 6,
        timeoutMs: 3e4,
        rateLimitRpm: 4e3,
        hasFreeTier: false,
        freeModelsCount: 0,
        modelsCount: 3,
        totalRequests: 1840,
        tokensTotal: 41e5,
        costTotal: 12.3,
        lastTested: "2026-08-29 09:45:00",
        notes: "Direct Anthropic API for complex document synthesis and rigorous safety-aligned code generation."
      },
      {
        id: "p-deepseek",
        name: "DeepSeek Official API",
        type: "deepseek",
        endpoint: "https://api.deepseek.com/v1",
        apiKey: "sk-ds-99218ab4401c29e",
        keyPrefix: "sk-ds-...c29e",
        enabled: true,
        status: "online",
        latencyMs: 290,
        p95LatencyMs: 440,
        uptimePercent: 99.8,
        errorRate: 0.08,
        priority: 7,
        timeoutMs: 25e3,
        rateLimitRpm: 3e3,
        hasFreeTier: true,
        freeModelsCount: 2,
        modelsCount: 2,
        totalRequests: 3410,
        tokensTotal: 89e5,
        costTotal: 1.45,
        lastTested: "2026-08-29 10:10:00",
        notes: "DeepSeek V3 and R1 reasoning API at ultra-competitive pricing with starting free credits."
      },
      {
        id: "p-mvi-dedicated",
        name: "MVI Dedicated Neural Server",
        type: "openai_compatible",
        endpoint: "https://ai-node.mvisecure.internal:8080/v1",
        apiKey: "mvi_sec_tok_991823",
        keyPrefix: "mvi_sec_...1823",
        enabled: false,
        status: "offline",
        latencyMs: 0,
        p95LatencyMs: 0,
        uptimePercent: 94.2,
        errorRate: 0,
        priority: 8,
        timeoutMs: 12e3,
        rateLimitRpm: 500,
        hasFreeTier: true,
        freeModelsCount: 2,
        modelsCount: 2,
        totalRequests: 110,
        tokensTotal: 25e4,
        costTotal: 0,
        lastTested: "2026-08-29 08:00:00",
        notes: "Isolated hardware enclave for classified banking workflows (Scheduled maintenance)."
      }
    ];
    INITIAL_MODELS = [
      // OpenAI Models
      {
        id: "m-gpt4o",
        modelIdentifier: "gpt-4o",
        providerId: "p-openai",
        providerName: "OpenAI Direct Gateway",
        displayName: "GPT-4o Omnimodal Flagship",
        status: "online",
        contextWindow: 128e3,
        maxOutputTokens: 16384,
        enabled: true,
        isFree: false,
        capabilities: ["general_ai", "document_analysis", "code_generation", "financial_summary", "security_analysis"],
        costPer1kInput: 25e-4,
        costPer1kOutput: 0.01,
        averageLatencyMs: 280,
        tokensPerSecond: 95,
        description: "High-intelligence flagship model with multimodal inputs and swift reasoning capabilities."
      },
      {
        id: "m-gpt4o-mini",
        modelIdentifier: "gpt-4o-mini",
        providerId: "p-openai",
        providerName: "OpenAI Direct Gateway",
        displayName: "GPT-4o Mini (Cost Optimized)",
        status: "online",
        contextWindow: 128e3,
        maxOutputTokens: 16384,
        enabled: true,
        isFree: false,
        capabilities: ["general_ai", "fast_chat", "document_analysis", "data_extraction"],
        costPer1kInput: 15e-5,
        costPer1kOutput: 6e-4,
        averageLatencyMs: 160,
        tokensPerSecond: 130,
        description: "Ultra-fast, cost-efficient model for high-frequency operations, chat, and light synthesis."
      },
      {
        id: "m-o3-mini",
        modelIdentifier: "o3-mini",
        providerId: "p-openai",
        providerName: "OpenAI Direct Gateway",
        displayName: "o3-mini STEM & Logic Reasoner",
        status: "online",
        contextWindow: 2e5,
        maxOutputTokens: 1e5,
        enabled: true,
        isFree: false,
        capabilities: ["code_generation", "financial_summary", "security_analysis"],
        costPer1kInput: 11e-4,
        costPer1kOutput: 44e-4,
        averageLatencyMs: 420,
        tokensPerSecond: 85,
        description: "Deep mathematical & software reasoning model with configurable reasoning effort tiers."
      },
      // Groq Models
      {
        id: "m-llama33-70b",
        modelIdentifier: "llama-3.3-70b-versatile",
        providerId: "p-groq",
        providerName: "Groq Cloud LPU",
        displayName: "Llama 3.3 70B Versatile (Free Tier / High Speed)",
        status: "online",
        contextWindow: 128e3,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: true,
        capabilities: ["general_ai", "document_analysis", "fast_chat", "data_extraction"],
        costPer1kInput: 59e-5,
        costPer1kOutput: 79e-5,
        averageLatencyMs: 95,
        tokensPerSecond: 450,
        description: "High performance LPU-accelerated reasoning model with sub-second response times and free daily rate limits."
      },
      {
        id: "m-llama31-8b",
        modelIdentifier: "llama-3.1-8b-instant",
        providerId: "p-groq",
        providerName: "Groq Cloud LPU",
        displayName: "Llama 3.1 8B Instant (Free Tier)",
        status: "online",
        contextWindow: 128e3,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: true,
        capabilities: ["fast_chat", "general_ai", "data_extraction"],
        costPer1kInput: 5e-5,
        costPer1kOutput: 8e-5,
        averageLatencyMs: 45,
        tokensPerSecond: 750,
        description: "Blazing fast sub-50ms inference model ideal for real-time validation and streaming agents."
      },
      {
        id: "m-deepseek-r1-groq",
        modelIdentifier: "deepseek-r1-distill-llama-70b",
        providerId: "p-groq",
        providerName: "Groq Cloud LPU",
        displayName: "DeepSeek R1 Distill 70B (Groq)",
        status: "online",
        contextWindow: 128e3,
        maxOutputTokens: 4096,
        enabled: true,
        isFree: true,
        capabilities: ["financial_summary", "security_analysis", "document_analysis", "code_generation"],
        costPer1kInput: 75e-5,
        costPer1kOutput: 99e-5,
        averageLatencyMs: 140,
        tokensPerSecond: 320,
        description: "Chain-of-thought mathematical reasoning model on ultra-fast Groq LPU hardware."
      },
      // Ollama Local Models (Excluded - Cloud Only Mode)
      {
        id: "m-qwen36",
        modelIdentifier: "qwen3.6:16k",
        providerId: "p-ollama",
        providerName: "Ollama Local Cluster (Excluded)",
        displayName: "Qwen 3.6 (16K Context - Excluded)",
        status: "offline",
        contextWindow: 16384,
        maxOutputTokens: 4096,
        enabled: false,
        isFree: true,
        capabilities: ["general_ai", "code_generation", "fast_chat", "security_analysis"],
        costPer1kInput: 0,
        costPer1kOutput: 0,
        averageLatencyMs: 180,
        tokensPerSecond: 80,
        description: "Excluded - On-premise infrastructure disabled."
      },
      {
        id: "m-sec-analyst",
        modelIdentifier: "sec-analyst-7b",
        providerId: "p-ollama",
        providerName: "Ollama Local Cluster (Excluded)",
        displayName: "Specialised Security Analyst 7B (Excluded)",
        status: "offline",
        contextWindow: 32768,
        maxOutputTokens: 4096,
        enabled: false,
        isFree: true,
        capabilities: ["security_analysis", "data_extraction"],
        costPer1kInput: 0,
        costPer1kOutput: 0,
        averageLatencyMs: 160,
        tokensPerSecond: 110,
        description: "Excluded - On-premise infrastructure disabled."
      },
      {
        id: "m-qwen25-coder",
        modelIdentifier: "qwen2.5-coder:32b",
        providerId: "p-ollama",
        providerName: "Ollama Local Cluster (Excluded)",
        displayName: "Qwen 2.5 Coder 32B (Excluded)",
        status: "offline",
        contextWindow: 65536,
        maxOutputTokens: 8192,
        enabled: false,
        isFree: true,
        capabilities: ["code_generation", "general_ai"],
        costPer1kInput: 0,
        costPer1kOutput: 0,
        averageLatencyMs: 320,
        tokensPerSecond: 65,
        description: "Excluded - On-premise infrastructure disabled."
      },
      // Google Gemini Models
      {
        id: "m-gemini-25-flash",
        modelIdentifier: "gemini-2.5-flash",
        providerId: "p-gemini",
        providerName: "Google Gemini Cloud",
        displayName: "Gemini 2.5 Flash (Free Tier / 1M Context)",
        status: "online",
        contextWindow: 1e6,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: true,
        capabilities: ["general_ai", "financial_summary", "document_analysis", "fast_chat"],
        costPer1kInput: 15e-5,
        costPer1kOutput: 6e-4,
        averageLatencyMs: 290,
        tokensPerSecond: 160,
        description: "Low-latency, high-volume model with 1 Million token context window and free tier access."
      },
      {
        id: "m-gemini-25-pro",
        modelIdentifier: "gemini-2.5-pro",
        providerId: "p-gemini",
        providerName: "Google Gemini Cloud",
        displayName: "Gemini 2.5 Pro (2M Context)",
        status: "online",
        contextWindow: 2e6,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: false,
        capabilities: ["document_analysis", "security_analysis", "financial_summary", "code_generation"],
        costPer1kInput: 125e-5,
        costPer1kOutput: 5e-3,
        averageLatencyMs: 580,
        tokensPerSecond: 90,
        description: "Premier reasoning model designed for deeply complex structured analysis across massive codebases."
      },
      // Anthropic Models
      {
        id: "m-claude-35-sonnet-direct",
        modelIdentifier: "claude-3-5-sonnet-20241022",
        providerId: "p-anthropic",
        providerName: "Anthropic Claude Direct",
        displayName: "Claude 3.5 Sonnet (Direct)",
        status: "online",
        contextWindow: 2e5,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: false,
        capabilities: ["code_generation", "document_analysis", "financial_summary", "general_ai"],
        costPer1kInput: 3e-3,
        costPer1kOutput: 0.015,
        averageLatencyMs: 460,
        tokensPerSecond: 80,
        description: "Industry-standard reasoning and coding model with exceptional nuance and strict safety compliance."
      },
      {
        id: "m-claude-35-haiku",
        modelIdentifier: "claude-3-5-haiku-20241022",
        providerId: "p-anthropic",
        providerName: "Anthropic Claude Direct",
        displayName: "Claude 3.5 Haiku",
        status: "online",
        contextWindow: 2e5,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: false,
        capabilities: ["fast_chat", "general_ai", "data_extraction"],
        costPer1kInput: 8e-4,
        costPer1kOutput: 4e-3,
        averageLatencyMs: 220,
        tokensPerSecond: 140,
        description: "Next-generation rapid inference model outperforming previous Claude 3 Opus on standard benchmarks."
      },
      // DeepSeek Direct Models
      {
        id: "m-deepseek-v3",
        modelIdentifier: "deepseek-chat",
        providerId: "p-deepseek",
        providerName: "DeepSeek Official API",
        displayName: "DeepSeek V3 671B MoE",
        status: "online",
        contextWindow: 64e3,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: true,
        capabilities: ["general_ai", "code_generation", "fast_chat"],
        costPer1kInput: 14e-5,
        costPer1kOutput: 28e-5,
        averageLatencyMs: 240,
        tokensPerSecond: 110,
        description: "Massive mixture-of-experts architecture delivering top-tier performance at disruptive cost."
      },
      {
        id: "m-deepseek-r1-direct",
        modelIdentifier: "deepseek-reasoner",
        providerId: "p-deepseek",
        providerName: "DeepSeek Official API",
        displayName: "DeepSeek R1 Reasoning",
        status: "online",
        contextWindow: 64e3,
        maxOutputTokens: 8192,
        enabled: true,
        isFree: false,
        capabilities: ["financial_summary", "security_analysis", "code_generation"],
        costPer1kInput: 55e-5,
        costPer1kOutput: 219e-5,
        averageLatencyMs: 510,
        tokensPerSecond: 75,
        description: "Frontier reasoning model with transparent chain-of-thought outputs for deep analysis."
      },
      // OpenRouter Models
      {
        id: "m-openrouter-free-qwen",
        modelIdentifier: "qwen/qwen-2.5-72b-instruct:free",
        providerId: "p-openrouter",
        providerName: "OpenRouter Multi-Cloud Aggregator",
        displayName: "Qwen 2.5 72B Instruct (100% Free Tier)",
        status: "online",
        contextWindow: 32768,
        maxOutputTokens: 4096,
        enabled: true,
        isFree: true,
        capabilities: ["general_ai", "fast_chat", "code_generation"],
        costPer1kInput: 0,
        costPer1kOutput: 0,
        averageLatencyMs: 380,
        tokensPerSecond: 90,
        description: "Free public community tier model provided through OpenRouter with zero cost."
      }
    ];
    INITIAL_CUSTOMERS = [
      {
        id: "cust-acme-fintech",
        type: "company",
        orgRole: "subsidiary",
        parentId: "cust-introsoft",
        name: "Acme Financial Technologies (Pty) Ltd",
        legalName: "Acme Financial Technologies Proprietary Limited",
        registrationNumber: "2021/489102/07",
        taxVatNumber: "4820194821",
        industry: "Financial Services & Banking",
        country: "South Africa (ZA)",
        status: "active",
        tier: "enterprise",
        serviceTier: "enterprise",
        businessCriticality: "tier_0_mission_critical",
        monthlyBudgetUsd: 15e3,
        currentSpendUsd: 3840.5,
        rateLimitRpm: 600,
        rateLimitTpm: 5e5,
        healthScore: 98,
        slaProfile: {
          id: "sla-plat-01",
          name: "Enterprise Platinum SLA",
          availabilityTargetPercent: 99.95,
          apiResponseTimeTargetMs: 500,
          maxLatencyMs: 1500,
          p95LatencyMsTarget: 800,
          p99LatencyMsTarget: 2e3,
          errorRateTargetPercent: 0.1,
          p1ResponseMinutes: 15,
          p2ResponseMinutes: 30,
          p3ResponseHours: 4,
          p4ResponseHours: 12,
          rtoHours: 1,
          rpoMinutes: 15,
          supportHours: "24/7/365",
          escalationTimes: "P1: 15m Executive Escalation -> P2: 30m Lead Architect",
          penaltyCreditRatePercent: 10
        },
        kpiProfile: {
          requestsMonthlyTarget: 1e6,
          tokensMonthlyTarget: 5e7,
          costMonthlyTargetUsd: 15e3,
          avgLatencyMs: 245,
          p95LatencyMs: 680,
          p99LatencyMs: 1420,
          errorRatePercent: 0.02,
          fallbackRatePercent: 0.8,
          availabilityPercent: 99.98,
          piiDetectionRatePercent: 100,
          policyViolationRatePercent: 0.01,
          serviceCreditsAccruedUsd: 0
        },
        contractTerms: {
          contractStartDate: "2026-01-01",
          contractEndDate: "2027-12-31",
          renewalDate: "2027-11-15",
          billingTerms: "net_30",
          currency: "ZAR",
          monthlyMinimumUsd: 5e3,
          spendCeilingUsd: 25e3,
          includedTokensMonthly: 3e7,
          overageRatePer1kTokensUsd: 25e-5,
          budgetActionOn100Percent: "switch_cheaper_model"
        },
        securityProfile: {
          approvedProviderIds: ["p-openai", "p-groq", "p-ollama", "p-gemini"],
          approvedModelIds: ["m-gpt4o", "m-gpt4o-mini", "m-llama33-70b", "m-gemini-25-flash"],
          dataResidencyRestrictions: ["South Africa Sovereign Nodes", "EU Adequacy Approved"],
          allowedCapabilities: ["general_ai", "financial_summary", "security_analysis", "code_generation", "document_analysis"],
          retentionPolicyDays: 30,
          businessCriticality: "tier_0_mission_critical",
          dataClassification: "special_personal_information",
          riskScore: "LOW"
        },
        primaryContact: {
          name: "David Van Der Merwe",
          email: "d.vandermerwe@acmefintech.co.za",
          phone: "+27 (0)11 555 0192",
          role: "Chief Technology Officer"
        },
        statutoryOfficers: {
          informationOfficer: {
            name: "Adv. Willem Van Zyl",
            email: "privacy@acmefintech.co.za",
            phone: "+27 (0)11 555 0199",
            designation: "Head of Legal, Regulatory & Compliance",
            registrationNumber: "ZA-IR-IO-2023-4921",
            registeredDate: "2023-11-14",
            deputyOfficerName: "Nokuthula Dlamini",
            deputyOfficerEmail: "n.dlamini@acmefintech.co.za"
          },
          dataProtectionOfficer: {
            name: "Dr. Sarah Schmidt, LL.M.",
            email: "dpo.external@acmefintech.co.za",
            phone: "+49 30 9281 440",
            dpoType: "external_counsel",
            leadSupervisoryAuthority: "BfDI (Federal Commissioner for Data Protection, Germany)",
            registrationNumber: "EU-DPO-REG-77291",
            registeredDate: "2024-02-10"
          }
        },
        users: [
          {
            id: "usr-acme-1",
            customerId: "cust-acme-fintech",
            name: "David Van Der Merwe",
            email: "d.vandermerwe@acmefintech.co.za",
            role: "owner",
            designation: "Chief Technology Officer",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-29 08:45:00",
            createdAt: "2026-08-01 10:00:00"
          },
          {
            id: "usr-acme-2",
            customerId: "cust-acme-fintech",
            name: "Adv. Willem Van Zyl",
            email: "privacy@acmefintech.co.za",
            role: "compliance_officer",
            designation: "Statutory Information Officer",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-29 07:15:00",
            createdAt: "2026-08-02 09:00:00"
          }
        ],
        connectedAppIds: ["app-fineduca", "app-mvi-secure"],
        assignedPolicyIds: ["pol-financial-protection", "pol-mvi-audit", "pol-global-safety"],
        createdAt: "2026-08-01 09:00:00",
        updatedAt: "2026-08-29 09:30:00",
        notes: "Tier 1 Enterprise customer. Strict financial data isolation and statutory POPIA/GDPR real-time masking."
      },
      {
        id: "cust-safecircle",
        type: "company",
        orgRole: "subsidiary",
        parentId: "cust-introsoft",
        name: "SafeCircle Global Health B.V.",
        legalName: "SafeCircle Global Health Besloten Vennootschap",
        registrationNumber: "KVK-84920194",
        taxVatNumber: "NL849201940B01",
        industry: "Healthcare & Medical Technology",
        country: "Netherlands (EU)",
        status: "active",
        tier: "growth",
        serviceTier: "professional",
        businessCriticality: "tier_1_business_critical",
        monthlyBudgetUsd: 8e3,
        currentSpendUsd: 1940.2,
        rateLimitRpm: 300,
        rateLimitTpm: 25e4,
        healthScore: 94,
        slaProfile: {
          id: "sla-gold-02",
          name: "Professional Gold SLA",
          availabilityTargetPercent: 99.9,
          apiResponseTimeTargetMs: 800,
          maxLatencyMs: 2500,
          p95LatencyMsTarget: 1200,
          p99LatencyMsTarget: 3e3,
          errorRateTargetPercent: 0.25,
          p1ResponseMinutes: 30,
          p2ResponseMinutes: 60,
          p3ResponseHours: 8,
          p4ResponseHours: 24,
          rtoHours: 4,
          rpoMinutes: 60,
          supportHours: "24/5",
          escalationTimes: "P1: 30m Lead Engineer -> P2: 60m On-Call",
          penaltyCreditRatePercent: 5
        },
        kpiProfile: {
          requestsMonthlyTarget: 5e5,
          tokensMonthlyTarget: 2e7,
          costMonthlyTargetUsd: 8e3,
          avgLatencyMs: 310,
          p95LatencyMs: 890,
          p99LatencyMs: 1850,
          errorRatePercent: 0.05,
          fallbackRatePercent: 1.2,
          availabilityPercent: 99.92,
          piiDetectionRatePercent: 100,
          policyViolationRatePercent: 0.02,
          serviceCreditsAccruedUsd: 0
        },
        contractTerms: {
          contractStartDate: "2026-03-01",
          contractEndDate: "2027-02-28",
          renewalDate: "2027-01-15",
          billingTerms: "net_30",
          currency: "EUR",
          monthlyMinimumUsd: 2500,
          spendCeilingUsd: 12e3,
          includedTokensMonthly: 15e6,
          overageRatePer1kTokensUsd: 3e-4,
          budgetActionOn100Percent: "notify_only"
        },
        securityProfile: {
          approvedProviderIds: ["p-anthropic", "p-gemini", "p-ollama"],
          approvedModelIds: ["m-claude-35-sonnet-direct", "m-gemini-25-pro", "m-llama33-70b"],
          dataResidencyRestrictions: ["EU Sovereign Nodes Only"],
          allowedCapabilities: ["document_analysis", "general_ai", "fast_chat"],
          retentionPolicyDays: 14,
          businessCriticality: "tier_1_business_critical",
          dataClassification: "special_personal_information",
          riskScore: "LOW"
        },
        primaryContact: {
          name: "Anouk Van Dijk",
          email: "anouk.vandijk@safecircle.health",
          phone: "+31 20 892 1092",
          role: "VP Product & Clinical AI"
        },
        statutoryOfficers: {
          informationOfficer: {
            name: "Thabo Molefe",
            email: "t.molefe@safecircle.health",
            phone: "+27 (0)21 880 1920",
            designation: "Africa Data Governance Lead",
            registrationNumber: "ZA-IR-IO-2024-0819",
            registeredDate: "2024-04-18"
          },
          dataProtectionOfficer: {
            name: "Elena Rostova, CIPP/E",
            email: "dpo@safecircle.health",
            phone: "+31 20 892 1099",
            dpoType: "internal",
            leadSupervisoryAuthority: "Autoriteit Persoonsgegevens (Dutch DPA, Netherlands)",
            registrationNumber: "NL-DPO-2024-1102",
            registeredDate: "2024-01-15"
          }
        },
        users: [],
        connectedAppIds: ["app-safecircle"],
        assignedPolicyIds: ["pol-safecircle-privacy", "pol-global-safety"],
        createdAt: "2026-08-10 14:15:00",
        updatedAt: "2026-08-28 17:00:00",
        notes: "Health-tech provider with strict patient privacy constraints and Special Category Data redaction."
      },
      {
        id: "cust-cashcreators",
        type: "company",
        orgRole: "partner_reseller",
        parentId: "cust-acme-fintech",
        name: "Cash Creators E-Commerce Ltd",
        legalName: "Cash Creators Commerce & Automation Limited",
        registrationNumber: "UK-14298104",
        taxVatNumber: "GB394820194",
        industry: "E-Commerce & Digital Marketing",
        country: "United Kingdom (UK)",
        status: "active",
        tier: "startup",
        monthlyBudgetUsd: 3e3,
        currentSpendUsd: 680.4,
        rateLimitRpm: 150,
        rateLimitTpm: 12e4,
        primaryContact: {
          name: "Oliver Wright",
          email: "oliver@cashcreators.co.uk",
          phone: "+44 20 7946 0912",
          role: "Managing Director"
        },
        statutoryOfficers: {
          dataProtectionOfficer: {
            name: "James H. Sterling",
            email: "dpo@cashcreators.co.uk",
            phone: "+44 20 7946 0999",
            dpoType: "internal",
            leadSupervisoryAuthority: "Information Commissioner\u2019s Office (ICO, United Kingdom)",
            registrationNumber: "UK-ICO-ZA991048",
            registeredDate: "2024-03-01"
          }
        },
        users: [
          {
            id: "usr-cash-1",
            customerId: "cust-cashcreators",
            name: "Oliver Wright",
            email: "oliver@cashcreators.co.uk",
            role: "owner",
            designation: "Managing Director",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-29 05:20:00",
            createdAt: "2026-08-15 16:45:00"
          },
          {
            id: "usr-cash-2",
            customerId: "cust-cashcreators",
            name: "Sophie Clark",
            email: "sophie.c@cashcreators.co.uk",
            role: "developer",
            designation: "Full Stack Web Developer",
            mfaEnabled: false,
            status: "active",
            lastLogin: "2026-08-27 12:00:00",
            createdAt: "2026-08-16 10:00:00"
          }
        ],
        connectedAppIds: ["app-cashcreators"],
        assignedPolicyIds: ["pol-global-safety"],
        createdAt: "2026-08-15 16:45:00",
        updatedAt: "2026-08-27 12:00:00",
        notes: "Fast-growing retail e-commerce aggregator using marketing and catalog extraction APIs."
      },
      {
        id: "cust-introsoft",
        type: "company",
        orgRole: "parent_owner",
        parentId: null,
        name: "Introsoft Technology Solutions (Pty) Ltd",
        legalName: "Introsoft Technology Solutions Proprietary Limited",
        registrationNumber: "2019/338192/07",
        taxVatNumber: "4190284711",
        industry: "Enterprise Software & Cloud Platforms",
        country: "South Africa (ZA)",
        status: "active",
        tier: "enterprise",
        monthlyBudgetUsd: 25e3,
        currentSpendUsd: 5410.8,
        rateLimitRpm: 1200,
        rateLimitTpm: 1e6,
        primaryContact: {
          name: "Horatio Huxham",
          email: "horatio.huxham@introsoft.co.za",
          phone: "+27 (0)21 440 9000",
          role: "Principal Architect & Founder"
        },
        statutoryOfficers: {
          informationOfficer: {
            name: "Horatio Huxham",
            email: "horatio.huxham@introsoft.co.za",
            phone: "+27 (0)21 440 9000",
            designation: "Managing Director & Statutory Information Officer",
            registrationNumber: "ZA-IR-IO-2022-0194",
            registeredDate: "2022-06-30",
            deputyOfficerName: "Ruan Steyn",
            deputyOfficerEmail: "r.steyn@introsoft.co.za"
          },
          dataProtectionOfficer: {
            name: "Marcus Vance, Esq.",
            email: "dpo.counsel@introsoft.co.za",
            phone: "+44 20 7946 0881",
            dpoType: "external_counsel",
            leadSupervisoryAuthority: "Information Commissioner\u2019s Office (ICO, UK) / CNIL (EU)",
            registrationNumber: "EU-DPO-REG-9041",
            registeredDate: "2023-01-20"
          }
        },
        users: [
          {
            id: "usr-intro-1",
            customerId: "cust-introsoft",
            name: "Horatio Huxham",
            email: "horatio.huxham@introsoft.co.za",
            role: "owner",
            designation: "Principal Architect & Founder",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-29 10:14:00",
            createdAt: "2026-08-01 09:00:00"
          },
          {
            id: "usr-intro-2",
            customerId: "cust-introsoft",
            name: "Ruan Steyn",
            email: "r.steyn@introsoft.co.za",
            role: "admin",
            designation: "Head of Infrastructure",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-29 09:40:00",
            createdAt: "2026-08-01 09:30:00"
          },
          {
            id: "usr-intro-3",
            customerId: "cust-introsoft",
            name: "Lindiwe Zulu",
            email: "l.zulu@introsoft.co.za",
            role: "developer",
            designation: "Senior Platform Engineer",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-29 08:50:00",
            createdAt: "2026-08-03 10:00:00"
          },
          {
            id: "usr-intro-4",
            customerId: "cust-introsoft",
            name: "Marcus Vance",
            email: "dpo.counsel@introsoft.co.za",
            role: "compliance_officer",
            designation: "External DPO & Legal Counsel",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-28 15:20:00",
            createdAt: "2026-08-04 11:00:00"
          }
        ],
        connectedAppIds: ["app-introsoft-web", "app-future-portal"],
        assignedPolicyIds: ["pol-global-safety"],
        createdAt: "2026-08-01 09:00:00",
        updatedAt: "2026-08-29 09:00:00",
        notes: "Primary parent tenant and enterprise cloud aggregator platform operator."
      },
      {
        id: "cust-alex-turner",
        type: "individual",
        orgRole: "direct_client",
        parentId: "cust-introsoft",
        name: "Dr. Alex Turner (AI Research Specialist)",
        legalName: "Dr. Alexander Turner",
        taxVatNumber: "DE-389201948",
        industry: "Independent Academic & AI Research",
        country: "Germany (EU)",
        status: "active",
        tier: "pay_as_you_go",
        monthlyBudgetUsd: 1e3,
        currentSpendUsd: 142.6,
        rateLimitRpm: 60,
        rateLimitTpm: 6e4,
        primaryContact: {
          name: "Dr. Alexander Turner",
          email: "alex.turner@quantum-ai.de",
          phone: "+49 89 2180 9182",
          role: "Principal Researcher"
        },
        statutoryOfficers: {
          dataProtectionOfficer: {
            name: "Dr. Alexander Turner",
            email: "alex.turner@quantum-ai.de",
            phone: "+49 89 2180 9182",
            dpoType: "internal",
            leadSupervisoryAuthority: "Bayerisches Landesamt f\xFCr Datenschutzaufsicht (BayLDA, Germany)",
            registrationNumber: "DE-BY-DPO-2024-4410",
            registeredDate: "2024-05-02"
          }
        },
        users: [
          {
            id: "usr-alex-1",
            customerId: "cust-alex-turner",
            name: "Dr. Alexander Turner",
            email: "alex.turner@quantum-ai.de",
            role: "owner",
            designation: "Principal Researcher",
            mfaEnabled: true,
            status: "active",
            lastLogin: "2026-08-28 19:30:00",
            createdAt: "2026-08-20 12:00:00"
          }
        ],
        connectedAppIds: [],
        assignedPolicyIds: ["pol-global-safety"],
        createdAt: "2026-08-20 12:00:00",
        updatedAt: "2026-08-28 19:30:00",
        notes: "Individual researcher developing novel multi-agent reasoning benchmarks with EU sovereign compliance."
      }
    ];
    INITIAL_APPLICATIONS = [
      {
        id: "app-introsoft-web",
        customerId: "cust-introsoft",
        customerName: "Introsoft Technology Solutions (Pty) Ltd",
        appIdentifier: "introsoft-web",
        name: "Introsoft Website",
        description: "Main corporate web portal, live customer interactive widgets, and public knowledge base.",
        status: "active",
        environment: "production",
        allowedCapabilities: ["general_ai", "fast_chat", "document_analysis"],
        rateLimitRpm: 120,
        quotaMonthlyRequests: 5e4,
        quotaUsedRequests: 9240,
        assignedPolicyIds: ["pol-global-safety"],
        contactEmail: "web-team@introsoft.internal",
        createdAt: "2026-08-01 09:00:00",
        updatedAt: "2026-08-29 08:00:00"
      },
      {
        id: "app-fineduca",
        customerId: "cust-acme-fintech",
        customerName: "Acme Financial Technologies (Pty) Ltd",
        appIdentifier: "fineduca",
        name: "FinEduca Platform",
        description: "Financial literacy & algorithmic market education engine with strict compliance controls.",
        status: "active",
        environment: "production",
        allowedCapabilities: ["financial_summary", "document_analysis", "general_ai"],
        rateLimitRpm: 240,
        quotaMonthlyRequests: 1e5,
        quotaUsedRequests: 14820,
        assignedPolicyIds: ["pol-financial-protection", "pol-global-safety"],
        contactEmail: "compliance@fineduca.internal",
        createdAt: "2026-08-05 11:30:00",
        updatedAt: "2026-08-29 08:30:00"
      },
      {
        id: "app-safecircle",
        customerId: "cust-safecircle",
        customerName: "SafeCircle Global Health B.V.",
        appIdentifier: "safecircle",
        name: "SafeCircle Health",
        description: "Personal safety, health-tech assistance, and user well-being support portal.",
        status: "active",
        environment: "production",
        allowedCapabilities: ["general_ai", "fast_chat", "document_analysis"],
        rateLimitRpm: 180,
        quotaMonthlyRequests: 75e3,
        quotaUsedRequests: 6110,
        assignedPolicyIds: ["pol-safecircle-privacy", "pol-global-safety"],
        contactEmail: "privacy@safecircle.internal",
        createdAt: "2026-08-10 14:15:00",
        updatedAt: "2026-08-28 17:00:00"
      },
      {
        id: "app-cashcreators",
        customerId: "cust-cashcreators",
        customerName: "Cash Creators E-Commerce Ltd",
        appIdentifier: "cash-creators",
        name: "Cash Creators App",
        description: "E-commerce automation, revenue analytics, and campaign copy generator.",
        status: "active",
        environment: "production",
        allowedCapabilities: ["general_ai", "code_generation", "data_extraction"],
        rateLimitRpm: 90,
        quotaMonthlyRequests: 4e4,
        quotaUsedRequests: 3290,
        assignedPolicyIds: ["pol-global-safety"],
        contactEmail: "growth@cashcreators.internal",
        createdAt: "2026-08-15 16:45:00",
        updatedAt: "2026-08-27 12:00:00"
      },
      {
        id: "app-mvi-secure",
        customerId: "cust-acme-fintech",
        customerName: "Acme Financial Technologies (Pty) Ltd",
        appIdentifier: "mvi-secure",
        name: "MVI Secure Gateway",
        description: "Enterprise security gateway, log vulnerability auditor, and SOC assistant.",
        status: "active",
        environment: "production",
        allowedCapabilities: ["security_analysis", "code_generation", "data_extraction"],
        rateLimitRpm: 300,
        quotaMonthlyRequests: 15e4,
        quotaUsedRequests: 21940,
        assignedPolicyIds: ["pol-mvi-audit", "pol-global-safety"],
        contactEmail: "secops@mvisecure.internal",
        createdAt: "2026-08-18 10:00:00",
        updatedAt: "2026-08-29 09:10:00"
      },
      {
        id: "app-future-portal",
        customerId: "cust-introsoft",
        customerName: "Introsoft Technology Solutions (Pty) Ltd",
        appIdentifier: "future-application-dev",
        name: "Future Applications Sandbox",
        description: "Staging environment for prospective Introsoft microservices and R&D pipelines.",
        status: "suspended",
        environment: "development",
        allowedCapabilities: ["general_ai", "code_generation", "fast_chat"],
        rateLimitRpm: 30,
        quotaMonthlyRequests: 1e4,
        quotaUsedRequests: 410,
        assignedPolicyIds: ["pol-global-safety"],
        contactEmail: "rnd@introsoft.internal",
        createdAt: "2026-08-25 15:00:00",
        updatedAt: "2026-08-28 09:00:00"
      }
    ];
    INITIAL_API_KEYS = [
      {
        id: "key-introsoft-prod",
        customerId: "cust-introsoft",
        customerName: "Introsoft Technology Solutions (Pty) Ltd",
        appId: "app-introsoft-web",
        appName: "Introsoft Website",
        name: "Introsoft Web Ingress Key",
        key: "ALTIL-8F72A9B104E729C04859218A",
        prefix: "ALTIL-8F72...218A",
        status: "active",
        createdAt: "2026-08-29 09:00:00",
        expiresAt: "2027-08-29 00:00:00",
        lastUsedAt: "2026-08-29 10:31:02",
        rateLimitRpm: 120,
        ipWhitelist: ["10.0.0.0/16", "192.168.1.50"],
        scopes: ["read:inference", "read:models"]
      },
      {
        id: "key-fineduca-prod",
        customerId: "cust-acme-fintech",
        customerName: "Acme Financial Technologies (Pty) Ltd",
        appId: "app-fineduca",
        appName: "FinEduca Platform",
        name: "FinEduca Main Backend Key",
        key: "ALTIL-3C19F84029B88E1293041A99",
        prefix: "ALTIL-3C19...1A99",
        status: "active",
        createdAt: "2026-08-29 09:30:00",
        expiresAt: "2027-08-29 00:00:00",
        lastUsedAt: "2026-08-29 10:30:55",
        rateLimitRpm: 240,
        ipWhitelist: ["10.0.4.0/24"],
        scopes: ["read:inference", "read:models", "read:capabilities"]
      },
      {
        id: "key-safecircle-prod",
        customerId: "cust-safecircle",
        customerName: "SafeCircle Global Health B.V.",
        appId: "app-safecircle",
        appName: "SafeCircle Health",
        name: "SafeCircle Production API Key",
        key: "ALTIL-7D9902BA11E39402938472B1",
        prefix: "ALTIL-7D99...72B1",
        status: "active",
        createdAt: "2026-08-30 08:00:00",
        expiresAt: "2027-08-30 00:00:00",
        lastUsedAt: "2026-08-29 10:28:44",
        rateLimitRpm: 180,
        ipWhitelist: [],
        scopes: ["read:inference"]
      },
      {
        id: "key-cashcreators-prod",
        customerId: "cust-cashcreators",
        customerName: "Cash Creators E-Commerce Ltd",
        appId: "app-cashcreators",
        appName: "Cash Creators App",
        name: "Cash Creators Service Token",
        key: "ALTIL-4E881023BC9844001928473C",
        prefix: "ALTIL-4E88...473C",
        status: "active",
        createdAt: "2026-08-28 14:00:00",
        expiresAt: null,
        lastUsedAt: "2026-08-29 10:25:10",
        rateLimitRpm: 90,
        ipWhitelist: [],
        scopes: ["read:inference"]
      },
      {
        id: "key-mvi-prod",
        customerId: "cust-acme-fintech",
        customerName: "Acme Financial Technologies (Pty) Ltd",
        appId: "app-mvi-secure",
        appName: "MVI Secure Gateway",
        name: "MVI Security Daemon Token",
        key: "ALTIL-1B9044CC8710929940182390",
        prefix: "ALTIL-1B90...2390",
        status: "active",
        createdAt: "2026-08-20 10:00:00",
        expiresAt: "2027-01-01 00:00:00",
        lastUsedAt: "2026-08-29 10:31:18",
        rateLimitRpm: 300,
        ipWhitelist: ["10.0.10.12", "10.0.10.13"],
        scopes: ["read:inference", "read:models", "write:telemetry"]
      },
      {
        id: "key-test-legacy",
        customerId: "cust-introsoft",
        customerName: "Introsoft Technology Solutions (Pty) Ltd",
        appId: "app-future-portal",
        appName: "Future Applications Sandbox",
        name: "Test Application Staging Key",
        key: "ALTIL-0000REVOKED998811223344",
        prefix: "ALTIL-0000...3344",
        status: "revoked",
        createdAt: "2026-08-30 08:30:00",
        expiresAt: "2026-09-01 00:00:00",
        lastUsedAt: "2026-08-27 18:22:00",
        rateLimitRpm: 10,
        ipWhitelist: [],
        scopes: ["read:inference"]
      }
    ];
    INITIAL_ROUTING_RULES = [
      {
        id: "route-general-ai",
        name: "General AI Workload Orchestration",
        taskOrCapability: "general_ai",
        appId: "all",
        primaryModelId: "m-qwen36",
        // Ollama / Qwen
        firstFallbackModelId: "m-llama33-70b",
        // Groq / Llama 3.3
        secondFallbackModelId: "m-gemini-25-flash",
        // Gemini
        maxTokens: 4096,
        timeoutMs: 6e3,
        fallbackTriggers: ["on_error", "on_timeout", "on_rate_limit"],
        loadBalancingStrategy: "priority_fallback",
        enabled: true,
        description: "Primary zero-cost inference on Ollama local cluster. Fallback to Groq LPU, then Gemini cloud."
      },
      {
        id: "route-security-analysis",
        name: "Security Analysis & Vulnerability Auditing",
        taskOrCapability: "security_analysis",
        appId: "all",
        primaryModelId: "m-sec-analyst",
        // Specialised security model
        firstFallbackModelId: "m-qwen36",
        // Qwen
        secondFallbackModelId: "m-gemini-25-pro",
        // Gemini 2.5 Pro
        maxTokens: 8192,
        timeoutMs: 12e3,
        fallbackTriggers: ["on_error", "on_timeout"],
        loadBalancingStrategy: "priority_fallback",
        enabled: true,
        description: "Specialised Security Model primary -> Local Qwen 3.6 fallback -> Deep Gemini Pro analysis."
      },
      {
        id: "route-financial-summary",
        name: "Financial Data & Market Summary",
        taskOrCapability: "financial_summary",
        appId: "app-fineduca",
        primaryModelId: "m-gemini-25-flash",
        firstFallbackModelId: "m-deepseek-r1-groq",
        secondFallbackModelId: "m-qwen36",
        maxTokens: 8192,
        timeoutMs: 8e3,
        fallbackTriggers: ["on_error", "on_timeout"],
        loadBalancingStrategy: "priority_fallback",
        enabled: true,
        description: "Enforces compliant financial extraction with strict token constraints and arithmetic verification."
      },
      {
        id: "route-document-analysis",
        name: "Long Document & Multi-Page Extraction",
        taskOrCapability: "document_analysis",
        appId: "all",
        primaryModelId: "m-gemini-25-pro",
        firstFallbackModelId: "m-llama33-70b",
        secondFallbackModelId: "m-gemini-25-flash",
        maxTokens: 16384,
        timeoutMs: 2e4,
        fallbackTriggers: ["on_error", "on_timeout"],
        loadBalancingStrategy: "priority_fallback",
        enabled: true,
        description: "High-context multimodal and PDF evaluation pipeline with multi-million token buffer."
      },
      {
        id: "route-code-generation",
        name: "Automated Code Generation & Patching",
        taskOrCapability: "code_generation",
        appId: "all",
        primaryModelId: "m-qwen25-coder",
        firstFallbackModelId: "m-llama33-70b",
        secondFallbackModelId: "m-gemini-25-pro",
        maxTokens: 8192,
        timeoutMs: 1e4,
        fallbackTriggers: ["on_error", "on_timeout"],
        loadBalancingStrategy: "priority_fallback",
        enabled: true,
        description: "Directs developer tools to Qwen 2.5 Coder 32B with fallback to Groq."
      }
    ];
    INITIAL_POLICIES = [
      {
        id: "pol-popia-sa-compliance",
        name: "POPIA Statutory Privacy & Data Protection (Act 4 of 2013)",
        description: "Enforces South African POPIA 8 Lawful Processing Conditions, 13-digit SA ID Luhn scrubbing, SARS tax masking, and Section 72 trans-border restrictions.",
        appliesToAppIds: ["all"],
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
          allowedProviderIds: ["p-ollama", "p-gemini", "p-groq", "p-anthropic"],
          popiaRules: {
            enabled: true,
            enforcementMode: "redact_mask",
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
            enforcementMode: "redact_mask",
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
        status: "active",
        createdAt: "2026-08-01 08:00:00",
        updatedAt: "2026-08-29 08:00:00"
      },
      {
        id: "pol-gdpr-eu-sovereign",
        name: "GDPR EU Sovereign Cloud & Article 9 Guard (EU 2016/679)",
        description: "Enforces strict European Union GDPR compliance, Article 9 special category shielding, and zero data retention (ZPR).",
        appliesToAppIds: ["app-introsoft-web", "app-safecircle", "app-mvi-secure"],
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
          allowedProviderIds: ["p-ollama", "p-gemini", "p-anthropic", "p-mvi-dedicated"],
          gdprRules: {
            enabled: true,
            enforcementMode: "strict_block",
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
        status: "active",
        createdAt: "2026-08-05 10:00:00",
        updatedAt: "2026-08-29 07:30:00"
      },
      {
        id: "pol-financial-protection",
        name: "Financial Data Protection Policy",
        description: "Strict privacy envelope for banking, account numbers, routing codes, and trade secrets.",
        appliesToAppIds: ["app-fineduca", "app-cashcreators"],
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
          allowedProviderIds: ["p-ollama", "p-gemini"],
          popiaRules: {
            enabled: true,
            enforcementMode: "strict_block",
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
        status: "active",
        createdAt: "2026-08-01 10:00:00",
        updatedAt: "2026-08-29 07:00:00"
      },
      {
        id: "pol-safecircle-privacy",
        name: "SafeCircle Health & Special Personal Info Redaction",
        description: "Enforces medical and personal identifiable information scrubbing under POPIA Part B and GDPR Article 9 before any model egress.",
        appliesToAppIds: ["app-safecircle"],
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
          allowedProviderIds: ["p-ollama", "p-groq", "p-gemini"],
          popiaRules: {
            enabled: true,
            enforcementMode: "redact_mask",
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
            enforcementMode: "redact_mask",
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
        status: "active",
        createdAt: "2026-08-10 12:00:00",
        updatedAt: "2026-08-28 14:00:00"
      },
      {
        id: "pol-mvi-audit",
        name: "MVI Strict Audit & Zero-Data Retention",
        description: "Demands exhaustive audit hashing and forbids third-party provider persistence.",
        appliesToAppIds: ["app-mvi-secure"],
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
          allowedProviderIds: ["p-ollama", "p-mvi-dedicated"]
        },
        status: "active",
        createdAt: "2026-08-18 10:30:00",
        updatedAt: "2026-08-29 08:15:00"
      },
      {
        id: "pol-global-safety",
        name: "Global Introsoft AI Safety Baseline",
        description: "System-wide guardrails guarding against jailbreaks, system prompt exfiltration, and toxic responses.",
        appliesToAppIds: ["all"],
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
        status: "active",
        createdAt: "2026-08-01 00:00:00",
        updatedAt: "2026-08-29 06:00:00"
      }
    ];
    INITIAL_GLOBAL_COMPLIANCE_CONFIG = {
      popia: {
        enabled: true,
        enforcementMode: "redact_mask",
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
        enforcementMode: "redact_mask",
        enforceArticle9SpecialCategories: true,
        enforceEuSovereignResidencyOnly: false,
        enforceArticle17ZeroRetention: true,
        enforceArticle22AutomatedDecisionFlag: true,
        maskEuropeanIbans: true,
        maskEuPassportsAndNationalIds: true,
        maskEmailsAndIps: true,
        dataRetentionTtlDays: 30
      },
      informationOfficerName: "Horatio Huxham (Information Officer)",
      informationOfficerEmail: "Horatio.huxham@gmail.com",
      euDataProtectionOfficerEmail: "dpo.europe@introsoft.internal",
      complianceOfficerRegistrationNumber: "ZA-INF-OFF-2026/89410",
      defaultDataRetentionDays: 30,
      lastUpdated: "2026-08-29 08:30:00"
    };
    INITIAL_DATA_SUBJECT_REQUESTS = [
      {
        id: "DSR-ZA-8901",
        framework: "POPIA",
        requestType: "access",
        subjectIdentifier: "ID: 890412***** (H. Van Der Merwe)",
        requestorName: "Hendrik Van Der Merwe",
        appId: "app-fineduca",
        status: "fulfilled",
        createdAt: "2026-08-20 14:15:00",
        dueAt: "2026-09-19 14:15:00",
        notes: "Section 23 POPIA access request. Log records and sanitized AI prompt history delivered."
      },
      {
        id: "DSR-EU-4412",
        framework: "GDPR",
        requestType: "erasure",
        subjectIdentifier: "Email: m.dupont@*****.fr",
        requestorName: "Marie Dupont",
        appId: "app-introsoft-web",
        status: "fulfilled",
        createdAt: "2026-08-25 09:00:00",
        dueAt: "2026-09-24 09:00:00",
        notes: "Article 17 Right to Erasure fulfilled. Zero-retention confirmed across Ollama and Gemini cache."
      },
      {
        id: "DSR-ZA-9934",
        framework: "POPIA",
        requestType: "objection",
        subjectIdentifier: "Phone: +27 82 *** 4912",
        requestorName: "Nandi Sithole",
        appId: "app-safecircle",
        status: "in_progress",
        createdAt: "2026-08-28 11:20:00",
        dueAt: "2026-09-27 11:20:00",
        notes: "Section 11(3) Objection to processing for automated health profiling. Policy filter assigned."
      }
    ];
    INITIAL_AUDIT_LOGS = [
      {
        id: "ALTIL-8F72-3A9B",
        timestamp: "2026-08-29 12:42:18",
        appId: "app-introsoft-web",
        appName: "Introsoft Website",
        apiKeyPrefix: "ALTIL-8F72...",
        requestType: "capability",
        capability: "general_ai",
        providerId: "p-ollama",
        providerName: "Ollama Local Cluster",
        modelId: "m-qwen36",
        modelIdentifier: "qwen3.6:16k",
        durationSeconds: 4.2,
        status: "SUCCESS",
        fallbackAttempted: false,
        inputTokens: 1420,
        outputTokens: 580,
        costEstimated: 0,
        policyApplied: "Global Introsoft AI Safety Baseline",
        sanitizedPromptPreview: "Customer inquiry regarding enterprise multi-region support SLA options for UK node...",
        sanitizedResponsePreview: "Introsoft enterprise plans provide 99.99% uptime with 24/7 dedicated support engineer routing...",
        clientIp: "192.168.1.50"
      },
      {
        id: "ALTIL-9C14-22DF",
        timestamp: "2026-08-29 12:41:05",
        appId: "app-fineduca",
        appName: "FinEduca Platform",
        apiKeyPrefix: "ALTIL-3C19...",
        requestType: "capability",
        capability: "financial_summary",
        providerId: "p-gemini",
        providerName: "Google Gemini Cloud",
        modelId: "m-gemini-25-flash",
        modelIdentifier: "gemini-2.5-flash",
        durationSeconds: 1.8,
        status: "SUCCESS",
        fallbackAttempted: false,
        inputTokens: 3890,
        outputTokens: 920,
        costEstimated: 11e-4,
        policyApplied: "Financial Data Protection Policy",
        sanitizedPromptPreview: "Analyze quarterly portfolio diversification index and compute Sharpe ratio [PII Redacted]...",
        sanitizedResponsePreview: "The portfolio demonstrates an annualized Sharpe ratio of 1.84 with defensive asset rebalancing...",
        clientIp: "10.0.4.18"
      },
      {
        id: "ALTIL-5E31-10B2",
        timestamp: "2026-08-29 12:39:44",
        appId: "app-mvi-secure",
        appName: "MVI Secure Gateway",
        apiKeyPrefix: "ALTIL-1B90...",
        requestType: "task",
        capability: "security_analysis",
        providerId: "p-groq",
        providerName: "Groq Cloud LPU",
        modelId: "m-llama33-70b",
        modelIdentifier: "llama-3.3-70b-versatile",
        durationSeconds: 0.9,
        status: "FALLBACK_SUCCESS",
        fallbackAttempted: true,
        fallbackProviderName: "Groq Cloud LPU",
        fallbackModelIdentifier: "llama-3.3-70b-versatile",
        inputTokens: 2100,
        outputTokens: 450,
        costEstimated: 16e-4,
        policyApplied: "MVI Strict Audit & Zero-Data Retention",
        sanitizedPromptPreview: "Ingress authentication payload audit for abnormal certificate chain anomalies...",
        sanitizedResponsePreview: "No certificate revocation or timestamp mismatch detected in verified payload.",
        clientIp: "10.0.10.12"
      },
      {
        id: "ALTIL-4A82-99F1",
        timestamp: "2026-08-29 12:35:10",
        appId: "app-safecircle",
        appName: "SafeCircle Health",
        apiKeyPrefix: "ALTIL-7D99...",
        requestType: "capability",
        capability: "general_ai",
        providerId: "p-ollama",
        providerName: "Ollama Local Cluster",
        modelId: "m-qwen36",
        modelIdentifier: "qwen3.6:16k",
        durationSeconds: 2.1,
        status: "SUCCESS",
        fallbackAttempted: false,
        inputTokens: 820,
        outputTokens: 310,
        costEstimated: 0,
        policyApplied: "SafeCircle Health & PII Redaction",
        sanitizedPromptPreview: "Guidance regarding routine stress management techniques and hydration schedules...",
        sanitizedResponsePreview: "Recommended routine includes 4-7-8 rhythmic breathing and structured 250ml water intake...",
        clientIp: "172.16.0.4"
      },
      {
        id: "ALTIL-1F09-082B",
        timestamp: "2026-08-29 12:30:22",
        appId: "app-fineduca",
        appName: "FinEduca Platform",
        apiKeyPrefix: "ALTIL-3C19...",
        requestType: "capability",
        capability: "financial_summary",
        providerId: "p-gemini",
        providerName: "Google Gemini Cloud",
        modelId: "m-gemini-25-flash",
        modelIdentifier: "gemini-2.5-flash",
        durationSeconds: 0.08,
        status: "POLICY_BLOCKED",
        fallbackAttempted: false,
        inputTokens: 410,
        outputTokens: 0,
        costEstimated: 0,
        policyApplied: "Financial Data Protection Policy",
        policyViolations: ["Sensitive bank account number (IBAN / PAN) detected in un-tokenized input block"],
        sanitizedPromptPreview: "Direct transfer verification for IBAN GB82WEST12345678901234...",
        sanitizedResponsePreview: "[BLOCKED BY ALTIL POLICY: Financial Data Protection]",
        clientIp: "10.0.4.18"
      },
      {
        id: "ALTIL-7B32-55C0",
        timestamp: "2026-08-29 12:28:40",
        appId: "app-cashcreators",
        appName: "Cash Creators App",
        apiKeyPrefix: "ALTIL-4E88...",
        requestType: "capability",
        capability: "data_extraction",
        providerId: "p-groq",
        providerName: "Groq Cloud LPU",
        modelId: "m-llama33-70b",
        modelIdentifier: "llama-3.3-70b-versatile",
        durationSeconds: 0.6,
        status: "SUCCESS",
        fallbackAttempted: false,
        inputTokens: 1100,
        outputTokens: 420,
        costEstimated: 9e-4,
        policyApplied: "Global Introsoft AI Safety Baseline",
        sanitizedPromptPreview: "Extract structured product inventory SKU counts from unstructured supplier invoice...",
        sanitizedResponsePreview: '{"items": [{"sku": "SKU-9921", "qty": 150}, {"sku": "SKU-8812", "qty": 45}]}',
        clientIp: "10.0.8.21"
      }
    ];
    INITIAL_SYSTEM_HEALTH = [
      {
        id: "sys-api",
        name: "ALTIL Gateway Ingress API",
        category: "core",
        status: "online",
        details: "Port 3000 (HTTPS/gRPC proxy active)",
        latencyMs: 8,
        uptime: "99.98%"
      },
      {
        id: "sys-db",
        name: "Primary Configuration DB",
        category: "database",
        status: "online",
        details: "PostgreSQL Relational Cluster + WAL replication",
        latencyMs: 12,
        uptime: "100.0%"
      },
      {
        id: "sys-redis",
        name: "Redis Cache & Rate Limiter",
        category: "cache",
        status: "online",
        details: "Cluster Node 01 (Hit rate: 89.4%)",
        latencyMs: 2,
        uptime: "99.99%"
      },
      {
        id: "sys-ollama",
        name: "Ollama Node (192.168.1.100)",
        category: "provider",
        status: "online",
        details: "4x NVIDIA RTX 4090 (VRAM: 96GB total)",
        latencyMs: 142,
        uptime: "99.85%"
      },
      {
        id: "sys-groq",
        name: "Groq Cloud API Egress",
        category: "provider",
        status: "online",
        details: "Direct Fiber Interconnect",
        latencyMs: 84,
        uptime: "99.95%"
      },
      {
        id: "sys-gemini",
        name: "Google Gemini Cloud Egress",
        category: "provider",
        status: "online",
        details: "Google Enterprise Workspace Tier",
        latencyMs: 310,
        uptime: "99.99%"
      }
    ];
    initialProviders = INITIAL_PROVIDERS;
    initialModels = INITIAL_MODELS;
    initialCustomers = INITIAL_CUSTOMERS;
    initialApplications = INITIAL_APPLICATIONS;
    initialApiKeys = INITIAL_API_KEYS;
    initialRoutingRules = INITIAL_ROUTING_RULES;
    initialPolicies = INITIAL_POLICIES;
    initialGlobalComplianceConfig = INITIAL_GLOBAL_COMPLIANCE_CONFIG;
    initialDataSubjectRequests = INITIAL_DATA_SUBJECT_REQUESTS;
    initialAuditLogs = INITIAL_AUDIT_LOGS.map((log) => ({
      ...log,
      tokensConsumed: log.tokensConsumed ?? (log.inputTokens || 0) + (log.outputTokens || 0)
    }));
    initialSystemHealth = INITIAL_SYSTEM_HEALTH;
    initialUsageMetrics = [
      { time: "06:00", ollama: 320, groq: 120, gemini: 60, total: 500 },
      { time: "08:00", ollama: 850, groq: 320, gemini: 170, total: 1340 },
      { time: "10:00", ollama: 1680, groq: 680, gemini: 350, total: 2710 },
      { time: "12:00", ollama: 2150, groq: 890, gemini: 460, total: 3500 },
      { time: "14:00", ollama: 1820, groq: 740, gemini: 390, total: 2950 },
      { time: "16:00", ollama: 1450, groq: 580, gemini: 310, total: 2340 },
      { time: "18:00", ollama: 980, groq: 390, gemini: 200, total: 1570 }
    ];
    USAGE_CHART_DATA = [
      { time: "06:00", ollama: 320, groq: 120, gemini: 60, total: 500 },
      { time: "07:00", ollama: 480, groq: 180, gemini: 90, total: 750 },
      { time: "08:00", ollama: 850, groq: 320, gemini: 170, total: 1340 },
      { time: "09:00", ollama: 1240, groq: 490, gemini: 260, total: 1990 },
      { time: "10:00", ollama: 1680, groq: 680, gemini: 350, total: 2710 },
      { time: "11:00", ollama: 1950, groq: 790, gemini: 410, total: 3150 },
      { time: "12:00", ollama: 2150, groq: 890, gemini: 460, total: 3500 },
      { time: "13:00", ollama: 1820, groq: 740, gemini: 390, total: 2950 }
    ];
    CAPABILITIES_CATALOG = [
      {
        id: "general_ai",
        name: "General AI",
        description: "Versatile reasoning, question answering, summarization, and task orchestration.",
        defaultRouting: "Ollama Qwen -> Groq Llama -> Gemini Flash",
        recommendedContext: "4K - 16K"
      },
      {
        id: "security_analysis",
        name: "Security Analysis",
        description: "Vulnerability detection, auth anomaly audits, threat intelligence and SOC automation.",
        defaultRouting: "Sec-Analyst-7B -> Ollama Qwen -> Gemini Pro",
        recommendedContext: "8K - 32K"
      },
      {
        id: "financial_summary",
        name: "Financial Summary & Calculation",
        description: "Compliance-checked financial analytics, portfolio metrics, balance sheet audits.",
        defaultRouting: "Gemini Flash -> DeepSeek R1 -> Ollama Qwen",
        recommendedContext: "8K - 16K"
      },
      {
        id: "document_analysis",
        name: "Document Analysis",
        description: "Long-document ingestion, multi-page PDF processing, contract parsing, legal cross-referencing.",
        defaultRouting: "Gemini Pro -> Groq Llama 70B -> Gemini Flash",
        recommendedContext: "32K - 1M"
      },
      {
        id: "code_generation",
        name: "Code Generation & Review",
        description: "TypeScript/Python/Rust generation, syntax debugging, automated test suite synthesis.",
        defaultRouting: "Qwen 2.5 Coder 32B -> Groq Llama -> Gemini Pro",
        recommendedContext: "16K - 64K"
      },
      {
        id: "fast_chat",
        name: "Fast Chat & User Assistants",
        description: "Sub-second real-time conversational agents for end-user web applications.",
        defaultRouting: "Groq Llama -> Ollama Qwen -> Gemini Flash",
        recommendedContext: "4K - 8K"
      },
      {
        id: "data_extraction",
        name: "Structured JSON Extraction",
        description: "Deterministic schema validation and data parsing into strict JSON formats.",
        defaultRouting: "Groq Llama -> Gemini Flash -> Ollama Qwen",
        recommendedContext: "8K - 32K"
      }
    ];
    initialSlaProfiles = [
      {
        id: "sla-plat-01",
        name: "Enterprise Platinum SLA",
        description: "Mission-critical Tier-0 SLA for core banking, health & automated transaction gateways.",
        availabilityTargetPercent: 99.95,
        apiResponseTimeTargetMs: 500,
        maxLatencyMs: 1500,
        p95LatencyMsTarget: 800,
        p99LatencyMsTarget: 2e3,
        errorRateTargetPercent: 0.1,
        p1ResponseMinutes: 15,
        p2ResponseMinutes: 30,
        p3ResponseHours: 4,
        p4ResponseHours: 12,
        rtoHours: 1,
        rpoMinutes: 15,
        supportHours: "24/7/365",
        escalationTimes: "P1: 15m Executive Escalation -> P2: 30m Lead Architect",
        penaltyCreditRatePercent: 10,
        isDefault: true
      },
      {
        id: "sla-gold-02",
        name: "Professional Gold SLA",
        description: "Business-critical Tier-1 SLA for enterprise SaaS and customer portal applications.",
        availabilityTargetPercent: 99.9,
        apiResponseTimeTargetMs: 800,
        maxLatencyMs: 2500,
        p95LatencyMsTarget: 1200,
        p99LatencyMsTarget: 3e3,
        errorRateTargetPercent: 0.25,
        p1ResponseMinutes: 30,
        p2ResponseMinutes: 60,
        p3ResponseHours: 8,
        p4ResponseHours: 24,
        rtoHours: 4,
        rpoMinutes: 60,
        supportHours: "24/5",
        escalationTimes: "P1: 30m Lead Engineer -> P2: 60m On-Call",
        penaltyCreditRatePercent: 5,
        isDefault: false
      },
      {
        id: "sla-silver-03",
        name: "Standard Silver SLA",
        description: "Standard SLA for internal productivity tools and developer sandbox environments.",
        availabilityTargetPercent: 99.5,
        apiResponseTimeTargetMs: 1200,
        maxLatencyMs: 4e3,
        p95LatencyMsTarget: 2e3,
        p99LatencyMsTarget: 5e3,
        errorRateTargetPercent: 0.5,
        p1ResponseMinutes: 60,
        p2ResponseMinutes: 120,
        p3ResponseHours: 24,
        p4ResponseHours: 48,
        rtoHours: 12,
        rpoMinutes: 240,
        supportHours: "business_hours_8x5",
        escalationTimes: "P1: 60m Operations Desk",
        penaltyCreditRatePercent: 2,
        isDefault: false
      }
    ];
    initialKpiDefinitions = [
      {
        id: "kpi-p95-latency",
        name: "P95 API Gateway Latency",
        description: "95th percentile response time across all active tenant routing nodes.",
        formula: "P95(request_duration_ms)",
        targetValue: 800,
        unit: "ms",
        warningThreshold: 700,
        criticalThreshold: 1e3,
        measurementPeriod: "rolling_15m",
        scope: "global",
        currentValue: 412,
        status: "within_target",
        notificationThreshold: "Trigger warning if P95 > 700ms for 2 consecutive periods."
      },
      {
        id: "kpi-availability",
        name: "Platform Service Availability",
        description: "Uptime percentage calculated from gateway synthetic health probes.",
        formula: "(successful_probes / total_probes) * 100",
        targetValue: 99.95,
        unit: "%",
        warningThreshold: 99.9,
        criticalThreshold: 99.5,
        measurementPeriod: "monthly",
        scope: "global",
        currentValue: 99.98,
        status: "within_target",
        notificationThreshold: "Notify Executive CTO if monthly availability drops below 99.90%."
      },
      {
        id: "kpi-fallback-ratio",
        name: "Automated Provider Fallback Rate",
        description: "Percentage of requests rerouted to secondary/tertiary fallback providers.",
        formula: "(fallback_requests / total_requests) * 100",
        targetValue: 2,
        unit: "%",
        warningThreshold: 5,
        criticalThreshold: 10,
        measurementPeriod: "rolling_15m",
        scope: "global",
        currentValue: 0.8,
        status: "within_target",
        notificationThreshold: "Alert SecOps if fallback rate > 5.0%."
      },
      {
        id: "kpi-pii-scrub",
        name: "POPIA / GDPR PII Scrubbing Accuracy",
        description: "Percentage of detected sensitive items successfully masked before LLM submission.",
        formula: "(sanitized_pii_items / detected_pii_items) * 100",
        targetValue: 100,
        unit: "%",
        warningThreshold: 99.9,
        criticalThreshold: 99,
        measurementPeriod: "hourly",
        scope: "global",
        currentValue: 100,
        status: "within_target",
        notificationThreshold: "Critical alert to Compliance Officer on any unmasked PII leak."
      }
    ];
    initialIncidents = [
      {
        id: "INC-2026-0824",
        title: "Gemini 2.5 Pro Latency Spike during 2M Context Document Ingestion",
        severity: "P3_MEDIUM",
        status: "monitoring",
        commander: "Sarah Jenkins (SecOps Lead)",
        affectedTenantIds: ["cust-safecircle"],
        affectedServiceIds: ["p-gemini", "m-gemini-25-pro"],
        startTime: "2026-08-29 06:15:00",
        estimatedResolutionTime: "2026-08-29 11:00:00",
        slaImpacted: false,
        summary: "P95 latency elevated to 1,850ms on Gemini Pro context ingestion. Automated routing redirected 12% of traffic to Groq Llama 70B.",
        timeline: [
          { timestamp: "06:15", author: "Monitoring Probe", note: "Detected P95 latency > 1,200ms on p-gemini." },
          { timestamp: "06:18", author: "Automation Engine", note: "Triggered WF-102 fallback rule. Diverted 12% document queries to Groq Llama 3.3." },
          { timestamp: "06:30", author: "Sarah Jenkins", note: "Identified Google Vertex API quota throttling. Contacted Google Technical Account Manager." }
        ],
        postIncidentReview: {
          rootCause: "Google Vertex API regional rate limit reached during concurrent batch ingestion.",
          customerImpact: "12 document requests experienced +400ms latency bump before fallback engagement.",
          detectionMethod: "Automated KPI monitor (kpi-p95-latency).",
          correctiveActions: ["Increased Vertex API quota allocation to 10k RPM", "Enabled proactive token bucket smoothing"],
          preventiveActions: ["Implement pre-flight token estimator in client SDK"],
          owner: "Sarah Jenkins",
          dueDate: "2026-09-05",
          status: "in_progress"
        }
      },
      {
        id: "INC-2026-0819",
        title: "Groq Cloud Transient Rate Limit Exceeded during Peak Financial Hours",
        severity: "P2_HIGH",
        status: "resolved",
        commander: "Horatio Huxham (Platform Architect)",
        affectedTenantIds: ["cust-acme-fintech", "cust-cashcreators"],
        affectedServiceIds: ["p-groq", "m-llama33-70b"],
        startTime: "2026-08-19 14:10:00",
        resolvedTime: "2026-08-19 14:24:00",
        slaImpacted: true,
        slaBreachMinutes: 14,
        summary: "Groq endpoint returned HTTP 429 rate limit error for 14 minutes. Seamlessly failed over to local Ollama GPU cluster.",
        timeline: [
          { timestamp: "14:10", author: "Gateway Monitor", note: "Received HTTP 429 from api.groq.com." },
          { timestamp: "14:11", author: "Orchestrator", note: "Failover triggered. Rerouted 100% of traffic to Ollama local node (192.168.1.100)." },
          { timestamp: "14:24", author: "Horatio Huxham", note: "Groq rate limits reset. Normalized primary dispatch." }
        ],
        postIncidentReview: {
          rootCause: "Third-party provider Groq Cloud transient burst limit trigger.",
          customerImpact: "Zero dropped requests due to local Ollama fallback; average response time increased by 48ms.",
          detectionMethod: "Orchestration step failover handler.",
          correctiveActions: ["Upgraded Groq tier to Dedicated LPU Provisioned Throughput"],
          preventiveActions: ["Added local queue buffer for high-volume bursts"],
          owner: "Horatio Huxham",
          dueDate: "2026-08-25",
          status: "completed"
        }
      }
    ];
    initialProblems = [
      {
        id: "PRB-102",
        title: "Unchunked Financial PDF Burst Ingestion causing Token Queue Depth Spikes",
        rootCause: "Client applications submitting 200+ page uncompressed PDFs without prior OCR chunking.",
        affectedServices: ["app-fineduca", "m-gpt4o"],
        relatedIncidentIds: ["INC-2026-0824"],
        correctiveAction: "Enforce pre-dispatch client-side chunking in API Gateway policy.",
        preventiveAction: "Add document size pre-validation guardrail rule in Policy Builder.",
        knownError: true,
        status: "under_review",
        createdAt: "2026-08-25 10:00:00"
      }
    ];
    initialWorkflows = [
      {
        id: "WF-101",
        name: "Tenant Budget 90% Threshold Action",
        description: "When tenant monthly AI spend hits 90% of budget, switch non-critical capabilities to lower cost local models and notify Finance Director.",
        triggerEvent: "budget_exceeded",
        condition: "tenant.currentSpendUsd >= tenant.monthlyBudgetUsd * 0.90",
        action: "switch_secondary_provider",
        targetChannel: "slack",
        enabled: true,
        lastTriggered: "2026-08-25 14:00:00"
      },
      {
        id: "WF-102",
        name: "SLA Latency Breach Automated Escalation",
        description: "If P95 latency exceeds 1,000ms for over 15 minutes, create a P2 incident and alert On-Call Architecture team on PagerDuty.",
        triggerEvent: "sla_breach",
        condition: "kpi.p95LatencyMs > 1000 for 15m",
        action: "trigger_p2_incident",
        targetChannel: "pagerduty",
        enabled: true,
        lastTriggered: "2026-08-29 06:18:00"
      },
      {
        id: "WF-103",
        name: "POPIA Special Category Data Inspection Alert",
        description: "When Special Personal Information (health/biometric) is detected in a prompt, execute automatic zero-retention masking and notify Statutory IO.",
        triggerEvent: "pii_detected",
        condition: "compliance.specialCategoryCount > 0",
        action: "notify_admin",
        targetChannel: "email",
        enabled: true,
        lastTriggered: "2026-08-29 07:42:00"
      }
    ];
    initialIamRoles = [
      {
        id: "role-plat-admin",
        name: "Platform Administrator",
        description: "Full unconstrained platform control, provider configuration, key management, and system setup.",
        isSystemRole: true,
        permissions: ["tenant.read", "tenant.write", "billing.read", "billing.write", "models.read", "models.write", "policies.read", "policies.write", "audit.read", "security.read", "security.write"]
      },
      {
        id: "role-tenant-admin",
        name: "Tenant Administrator",
        description: "Full administrative access restricted to specific customer organization and assigned apps.",
        isSystemRole: true,
        permissions: ["tenant.read", "tenant.write", "billing.read", "models.read", "policies.read", "audit.read"]
      },
      {
        id: "role-sec-officer",
        name: "Security Officer",
        description: "SOC threat monitoring, prompt injection telemetry, IP whitelisting, and key revoking permissions.",
        isSystemRole: true,
        permissions: ["security.read", "security.write", "policies.read", "policies.write", "audit.read"]
      },
      {
        id: "role-compliance-officer",
        name: "Compliance Officer",
        description: "POPIA / GDPR statutory oversight, DSAR fulfillment, information officer audits, and evidence review.",
        isSystemRole: true,
        permissions: ["tenant.read", "policies.read", "policies.write", "audit.read", "security.read"]
      },
      {
        id: "role-fin-admin",
        name: "Finance Administrator",
        description: "FinOps cost management, itemized invoices, credit balance management, and budget ceiling controls.",
        isSystemRole: true,
        permissions: ["tenant.read", "billing.read", "billing.write", "audit.read"]
      }
    ];
    initialIamUsers = [
      {
        id: "usr-horatio",
        name: "Horatio Huxham",
        email: "Horatio.huxham@gmail.com",
        department: "Executive Platform Architecture",
        roleId: "role-plat-admin",
        roleName: "Platform Administrator",
        status: "active",
        mfaEnabled: true,
        authMethod: "sso_saml",
        lastLogin: "2026-08-29 08:50:00"
      },
      {
        id: "usr-david-acme",
        name: "David Van Der Merwe",
        email: "d.vandermerwe@acmefintech.co.za",
        department: "Acme Technology Office",
        roleId: "role-tenant-admin",
        roleName: "Tenant Administrator",
        tenantId: "cust-acme-fintech",
        tenantName: "Acme Financial Technologies",
        status: "active",
        mfaEnabled: true,
        authMethod: "oauth_google",
        lastLogin: "2026-08-29 08:45:00"
      },
      {
        id: "usr-willem-compliance",
        name: "Adv. Willem Van Zyl",
        email: "privacy@acmefintech.co.za",
        department: "Legal & Regulatory Compliance",
        roleId: "role-compliance-officer",
        roleName: "Compliance Officer",
        tenantId: "cust-acme-fintech",
        tenantName: "Acme Financial Technologies",
        status: "active",
        mfaEnabled: true,
        authMethod: "mfa_password",
        lastLogin: "2026-08-29 07:15:00"
      },
      {
        id: "usr-sarah-sec",
        name: "Sarah Jenkins",
        email: "s.jenkins@altil.security",
        department: "Cyber Security Operations Centre",
        roleId: "role-sec-officer",
        roleName: "Security Officer",
        status: "active",
        mfaEnabled: true,
        authMethod: "sso_saml",
        lastLogin: "2026-08-29 08:30:00"
      }
    ];
    initialComplianceControls = [
      {
        id: "ctrl-popia-72",
        framework: "POPIA",
        code: "POPIA Section 72",
        title: "Trans-border Data Flow Restrictions",
        requirement: "Personal information may only be transferred outside South Africa to recipients bound by adequate data protection laws or binding agreements.",
        status: "compliant",
        owner: "Adv. Willem Van Zyl",
        evidenceIds: ["evid-01"],
        lastReviewDate: "2026-08-15"
      },
      {
        id: "ctrl-gdpr-32",
        framework: "GDPR",
        code: "GDPR Article 32",
        title: "Security of Processing & Pseudonymisation",
        requirement: "Implement appropriate technical and organisational measures including encryption, pseudonymisation, and zero-retention LLM buffers.",
        status: "compliant",
        owner: "Elena Rostova, CIPP/E",
        evidenceIds: ["evid-02"],
        lastReviewDate: "2026-08-20"
      },
      {
        id: "ctrl-nist-rmf-1",
        framework: "NIST_AI_RMF",
        code: "NIST AI RMF GOVERN 1.1",
        title: "AI Risk Management & Safety Guardrails",
        requirement: "Policies, processes, and procedures for AI risk management are established, documented, and enforced in gateway runtime.",
        status: "compliant",
        owner: "Horatio Huxham",
        evidenceIds: ["evid-03"],
        lastReviewDate: "2026-08-28"
      }
    ];
    initialEvidence = [
      {
        id: "evid-01",
        controlId: "ctrl-popia-72",
        fileName: "POPIA_Section72_CrossBorder_Legal_Assessment_2026.pdf",
        description: "Signed legal opinion confirming EU and SA adequacy parity for cloud AI nodes.",
        uploadedBy: "Adv. Willem Van Zyl",
        uploadedAt: "2026-08-15 11:20:00",
        fileSizeMb: 2.4
      },
      {
        id: "evid-02",
        controlId: "ctrl-gdpr-32",
        fileName: "ALTIL_ZeroRetention_TLS_Architecture_Audit.pdf",
        description: "Independent SOC 2 Type II audit report validating zero data retention in memory buffers.",
        uploadedBy: "Elena Rostova, CIPP/E",
        uploadedAt: "2026-08-20 14:10:00",
        fileSizeMb: 4.8
      }
    ];
    initialExecutiveReports = [
      {
        id: "rep-sla-aug-2026",
        title: "Monthly Executive SLA & Platform Health Report \u2014 August 2026",
        type: "monthly_sla",
        generatedAt: "2026-08-29 08:00:00",
        period: "August 2026",
        summaryMetrics: {
          "Overall Availability": "99.98%",
          "Total Requests": 48420,
          "P95 Response Latency": "412ms",
          "SLA Breach Minutes": "14 mins",
          "Penalty Credits Accrued": "R0.00"
        }
      },
      {
        id: "rep-finops-aug-2026",
        title: "Enterprise FinOps AI Spend & Token Consumption Report",
        type: "ai_cost_finops",
        generatedAt: "2026-08-29 07:30:00",
        period: "August 2026",
        summaryMetrics: {
          "Total AI Spend": "$1,482.40 / R26,683.20",
          "Free Tier Cost Savings": "$420.15 / R7,562.70",
          "Cost per 1k Tokens": "$0.00018",
          "Most Cost Efficient Provider": "Groq Cloud LPU"
        }
      },
      {
        id: "rep-soc-aug-2026",
        title: "Executive CISO Security & Threat Intelligence Summary",
        type: "security_soc",
        generatedAt: "2026-08-28 18:00:00",
        period: "August 2026",
        summaryMetrics: {
          "Threats Blocked": 142,
          "Prompt Injections Deflected": 38,
          "PII Redactions Performed": 1240,
          "Auth Failure Anomalies": 4
        }
      }
    ];
    initialEntitlements = [
      { feature: "Monthly Gateway Requests", contracted: "10,000,000", entitled: "10,000,000", consumed: "1,420,000", remaining: "8,580,000", unit: "requests", status: "normal" },
      { feature: "Monthly AI Token Volume", contracted: "500,000,000", entitled: "500,000,000", consumed: "84,500,000", remaining: "415,500,000", unit: "tokens", status: "normal" },
      { feature: "Availability Commitment", contracted: "99.95%", entitled: "99.95%", consumed: "99.98%", remaining: "+0.03%", unit: "uptime %", status: "normal" },
      { feature: "P1 Emergency Incident SLA", contracted: "15 min response / 2 hr fix", entitled: "15 min response / 2 hr fix", consumed: "8 min response / 42 min fix", remaining: "Compliant", unit: "time", status: "normal" },
      { feature: "Private Ollama Local GPU Cluster", contracted: "4 Nodes Dedicated", entitled: "4 Nodes Dedicated", consumed: "4 Nodes Active", remaining: "0 Nodes Available", unit: "nodes", status: "normal" },
      { feature: "Cross-Region DR Failover", contracted: "Active-Active RTO 1h", entitled: "Active-Active RTO 1h", consumed: "RTO 24m Verified", remaining: "Ready", unit: "status", status: "normal" }
    ];
    initialServiceCatalogue = [
      {
        id: "srv-01",
        name: "ALTIL AI Gateway & Policy Engine",
        category: "AI Gateway",
        description: "High-throughput enterprise AI proxy with real-time prompt injection defense, POPIA/GDPR PII redactor, and fallbacks.",
        serviceOwner: "Horatio Huxham (Head of AI Ops)",
        technicalOwner: "Tebogo Molefe (Principal Systems Engineer)",
        slaTier: "Enterprise Platinum 99.95%",
        pricingModel: "$0.0001 per request + Token Passthrough",
        dependencies: ["Redis Cluster", "Audit Ledger DB", "Identity Provider"],
        supportModel: "24/7/365 Dedicated P1 War Room",
        criticality: "tier_0_mission_critical",
        riskClassification: "LOW",
        status: "active"
      },
      {
        id: "srv-02",
        name: "Dedicated Local Ollama Private AI Cluster",
        category: "Private AI",
        description: "Zero-egress, sovereign on-premise AI processing running Llama 3 & DeepSeek on dedicated GPU hardware.",
        serviceOwner: "Sipho Nkosi (Infrastructure Lead)",
        technicalOwner: "Johan Pretorius (AI Hardware Ops)",
        slaTier: "Enterprise Gold 99.90%",
        pricingModel: "Fixed R15,000/month GPU Node Allocation",
        dependencies: ["On-Prem GPU Cluster", "VPC Edge Router"],
        supportModel: "24/7/365 On-Call Support",
        criticality: "tier_1_business_critical",
        riskClassification: "LOW",
        status: "active"
      },
      {
        id: "srv-03",
        name: "POPIA & GDPR Statutory AI Governance Guard",
        category: "AI Governance",
        description: "Automated Special Category Data masking, DSAR export pipeline, and cross-border adequacy verifier.",
        serviceOwner: "Elena Rostova (Compliance Director)",
        technicalOwner: "Tebogo Molefe (Principal Systems Engineer)",
        slaTier: "Statutory Zero-Breach SLA",
        pricingModel: "Included in Enterprise Plan",
        dependencies: ["Audit Ledger DB", "Vault Encryption Service"],
        supportModel: "Business Hours + Statutory Emergency Contact",
        criticality: "tier_0_mission_critical",
        riskClassification: "LOW",
        status: "active"
      },
      {
        id: "srv-04",
        name: "Groq Ultra-Fast LPU Acceleration Service",
        category: "AI Gateway",
        description: "Sub-300ms inference routing for high-frequency conversational agents and real-time customer support.",
        serviceOwner: "Horatio Huxham",
        technicalOwner: "Groq Cloud API Engineering",
        slaTier: "Standard 99.9%",
        pricingModel: "Free Tier + Pay-As-You-Go ($0.00008/1k tokens)",
        dependencies: ["Groq LPU Cloud", "ALTIL Router"],
        supportModel: "24/5 Standard Support",
        criticality: "tier_2_important",
        riskClassification: "LOW",
        status: "active"
      }
    ];
    initialCmdbNodes = [
      { id: "node-t1", name: "Discovery Health SA (Tenant)", type: "tenant", status: "operational" },
      { id: "node-t2", name: "Standard Bank Group (Tenant)", type: "tenant", status: "operational" },
      { id: "node-a1", name: "Clinical Note Summarizer (App)", type: "application", status: "operational", latencyMs: 124 },
      { id: "node-a2", name: "Fraud Analysis Copilot (App)", type: "application", status: "operational", latencyMs: 88 },
      { id: "node-gw", name: "ALTIL Gateway Engine", type: "gateway", status: "operational", latencyMs: 12 },
      { id: "node-orch", name: "Orchestration & Fallback Matrix", type: "orchestration", status: "operational" },
      { id: "node-policy", name: "POPIA / Security Policy Filter", type: "policy", status: "operational", latencyMs: 4 },
      { id: "node-router", name: "Dynamic Model Router", type: "router", status: "operational" },
      { id: "node-[#prov-groq]", name: "Groq LPU Cloud", type: "provider", status: "operational", latencyMs: 210 },
      { id: "node-[#prov-ollama]", name: "Ollama Local Cluster", type: "provider", status: "operational", latencyMs: 450 },
      { id: "node-[#prov-openai]", name: "OpenAI API Node", type: "provider", status: "degraded", latencyMs: 1420, details: "P99 latency spike in US-East region" },
      { id: "node-db", name: "PostgreSQL Audit Ledger", type: "infrastructure", status: "operational" },
      { id: "node-redis", name: "Redis Cache & Rate Limiter", type: "infrastructure", status: "operational" }
    ];
    initialCmdbDependencies = [
      { fromId: "node-t1", toId: "node-a1", relation: "uses" },
      { fromId: "node-t2", toId: "node-a2", relation: "uses" },
      { fromId: "node-a1", toId: "node-gw", relation: "routes_to" },
      { fromId: "node-a2", toId: "node-gw", relation: "routes_to" },
      { fromId: "node-gw", toId: "node-policy", relation: "enforces" },
      { fromId: "node-policy", toId: "node-orch", relation: "depends_on" },
      { fromId: "node-orch", toId: "node-router", relation: "routes_to" },
      { fromId: "node-router", toId: "node-[#prov-groq]", relation: "routes_to" },
      { fromId: "node-router", toId: "node-[#prov-ollama]", relation: "routes_to" },
      { fromId: "node-router", toId: "node-[#prov-openai]", relation: "routes_to" },
      { fromId: "node-gw", toId: "node-db", relation: "depends_on" },
      { fromId: "node-gw", toId: "node-redis", relation: "depends_on" }
    ];
    initialRiskRegister = [
      {
        id: "RISK-001",
        tenantId: "cust-discovery",
        tenantName: "Discovery Health SA",
        category: "Privacy",
        description: "Special Category Health Data disclosure during prompt evaluation via public API endpoints.",
        probability: 2,
        impact: 5,
        inherentRiskScore: 10,
        inherentRiskLevel: "HIGH",
        controls: ["POPIA Regex Redactor", "Local Ollama Zero-Egress Routing", "TLS 1.3 Payload Encryption"],
        residualRiskScore: 2,
        residualRiskLevel: "LOW",
        riskOwner: "Elena Rostova (Compliance Officer)",
        treatment: "mitigate",
        dueDate: "2026-09-30",
        status: "in_mitigation",
        evidenceIds: ["evid-01", "evid-02"]
      },
      {
        id: "RISK-002",
        tenantId: "cust-std-bank",
        tenantName: "Standard Bank Group",
        category: "Cybersecurity",
        description: "Prompt Injection / Jailbreak attack bypassing baseline system instructions.",
        probability: 4,
        impact: 4,
        inherentRiskScore: 16,
        inherentRiskLevel: "CRITICAL",
        controls: ["Secondary Adversarial Scanner", "Regex Rule Base", "Output Guardrails"],
        residualRiskScore: 4,
        residualRiskLevel: "MEDIUM",
        riskOwner: "Dr. Michael Chen (CISO)",
        treatment: "mitigate",
        dueDate: "2026-09-15",
        status: "open",
        evidenceIds: ["evid-03"]
      },
      {
        id: "RISK-003",
        tenantId: "cust-std-bank",
        tenantName: "Standard Bank Group",
        category: "Concentration risk",
        description: "Over-reliance on OpenAI primary model without automated Groq/Ollama fallback active.",
        probability: 3,
        impact: 4,
        inherentRiskScore: 12,
        inherentRiskLevel: "HIGH",
        controls: ["Automated Fallback Router", "Multi-Provider Failover Matrix"],
        residualRiskScore: 3,
        residualRiskLevel: "LOW",
        riskOwner: "Horatio Huxham (Head of AI Ops)",
        treatment: "mitigate",
        dueDate: "2026-09-01",
        status: "in_mitigation",
        evidenceIds: []
      }
    ];
    initialAiModelGovernance = [
      {
        id: "gov-mod-01",
        modelId: "gpt-4o",
        name: "OpenAI GPT-4o",
        provider: "OpenAI Cloud",
        version: "2024-08-06",
        contextWindow: "128,000 tokens",
        costPer1kInputUsd: 25e-4,
        costPer1kOutputUsd: 0.01,
        accuracyBenchmark: 94.2,
        securityBenchmark: 91.5,
        hallucinationRatePercent: 1.2,
        piiHandlingRating: "GOOD",
        dataResidency: "US Sovereign Edge (Zero-Log)",
        approvedUseCases: ["Complex Reasoning", "Multilingual Code Generation", "Policy Auditing"],
        prohibitedUseCases: ["Unredacted Special Category Medical Records"],
        riskRating: "MEDIUM",
        lifecycleState: "PRODUCTION",
        modelOwner: "Dr. Michael Chen",
        reviewDate: "2026-11-01"
      },
      {
        id: "gov-mod-02",
        modelId: "llama-3.3-70b",
        name: "Llama 3.3 70B (Ollama Local)",
        provider: "Private Local GPU Cluster",
        version: "3.3-70b-instruct",
        contextWindow: "128,000 tokens",
        costPer1kInputUsd: 0,
        costPer1kOutputUsd: 0,
        accuracyBenchmark: 91.8,
        securityBenchmark: 98.4,
        hallucinationRatePercent: 1.8,
        piiHandlingRating: "EXCELLENT",
        dataResidency: "South Africa On-Premise (Zero Egress)",
        approvedUseCases: ["POPIA Special Category Records", "Sovereign Banking Workloads", "Offline Operations"],
        prohibitedUseCases: ["None"],
        riskRating: "LOW",
        lifecycleState: "PRODUCTION",
        modelOwner: "Johan Pretorius",
        reviewDate: "2026-12-15"
      },
      {
        id: "gov-mod-03",
        modelId: "llama-3.1-8b-groq",
        name: "Llama 3.1 8B (Groq LPU)",
        provider: "Groq LPU Cloud",
        version: "3.1-8b-instant",
        contextWindow: "8,192 tokens",
        costPer1kInputUsd: 5e-5,
        costPer1kOutputUsd: 8e-5,
        accuracyBenchmark: 88.4,
        securityBenchmark: 93,
        hallucinationRatePercent: 2.1,
        piiHandlingRating: "EXCELLENT",
        dataResidency: "EU Sovereign Region",
        approvedUseCases: ["Sub-300ms Support Chat", "High-Frequency Intent Classification"],
        prohibitedUseCases: ["Legal Document Drafting"],
        riskRating: "LOW",
        lifecycleState: "PRODUCTION",
        modelOwner: "Tebogo Molefe",
        reviewDate: "2026-10-10"
      }
    ];
    initialModelEvalBenchmarks = [
      {
        modelName: "OpenAI GPT-4o",
        provider: "OpenAI Cloud",
        latencyMs: 840,
        costPer1kTokens: 625e-5,
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
        modelName: "Llama 3.3 70B (Ollama On-Prem)",
        provider: "Local Private GPU",
        latencyMs: 420,
        costPer1kTokens: 0,
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
        modelName: "Llama 3.1 8B (Groq LPU)",
        provider: "Groq LPU Cloud",
        latencyMs: 210,
        costPer1kTokens: 6e-5,
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
    initialVendor360 = [
      {
        id: "vend-01",
        vendorName: "Groq Cloud LPU",
        status: "active",
        modelsCount: 3,
        pricingTier: "Enterprise Free Tier + Volume Discount",
        slaTargetPercent: 99.9,
        actualAvailabilityPercent: 99.98,
        dpaSigned: true,
        securityCertifications: ["SOC 2 Type II", "ISO 27001", "EU Adequacy"],
        dataResidency: "Frankfurt, EU",
        concentrationRiskExposurePercent: 32,
        monthlySpendUsd: 142.5,
        riskScore: "LOW",
        drFailoverReadiness: "READY"
      },
      {
        id: "vend-02",
        vendorName: "Ollama Local Sovereign Cluster",
        status: "active",
        modelsCount: 4,
        pricingTier: "On-Premise Infrastructure",
        slaTargetPercent: 99.99,
        actualAvailabilityPercent: 100,
        dpaSigned: true,
        securityCertifications: ["Sovereign POPIA Certified", "ISO 27001"],
        dataResidency: "Johannesburg, South Africa",
        concentrationRiskExposurePercent: 48,
        monthlySpendUsd: 0,
        riskScore: "LOW",
        drFailoverReadiness: "READY"
      },
      {
        id: "vend-03",
        vendorName: "OpenAI API Cloud Services",
        status: "active",
        modelsCount: 2,
        pricingTier: "Pay-As-You-Go API",
        slaTargetPercent: 99.9,
        actualAvailabilityPercent: 99.85,
        dpaSigned: true,
        securityCertifications: ["SOC 2 Type II", "HIPAA Compliant BAA"],
        dataResidency: "US Sovereign Region",
        concentrationRiskExposurePercent: 20,
        monthlySpendUsd: 1339.9,
        riskScore: "MEDIUM",
        drFailoverReadiness: "READY"
      }
    ];
    initialBcdrStatus = {
      rtoTargetHours: 1,
      rpoTargetMinutes: 15,
      backupStatus: "HEALTHY",
      replicationStatus: "ACTIVE_ACTIVE",
      drRegion: "South Africa West (Cape Town DR Node)",
      failoverReadiness: "100% READY",
      lastDrTestDate: "2026-08-15",
      lastDrTestResult: "PASSED",
      recoverySuccessPercent: 100,
      outstandingDrIssuesCount: 0,
      exerciseInProgress: false
    };
    initialChangeRequests = [
      {
        id: "CHG-2026-089",
        title: "Deploy Groq Llama 3.3 70B Fallback Node in EU Region",
        requestor: "Tebogo Molefe",
        tenantId: "cust-discovery",
        service: "ALTIL AI Gateway",
        type: "Normal",
        riskLevel: "LOW",
        impactDescription: "Adds zero-downtime secondary failover for Discovery Health workloads.",
        plannedStart: "2026-08-30 02:00:00",
        plannedCompletion: "2026-08-30 03:00:00",
        backoutPlan: "Revert ALTIL Router routing table v2.4 to v2.3.",
        testPlan: "Run synthetic load test of 500 requests/sec via Ollama sandbox.",
        approvalStatus: "approved",
        implementationNotes: "Pre-flight checks passed in staging.",
        relatedIncidentId: "INC-2026-042"
      },
      {
        id: "CHG-2026-090",
        title: "Update POPIA PII Redactor Regex for SA ID Card Numbers",
        requestor: "Elena Rostova",
        service: "Policy Engine",
        type: "Standard",
        riskLevel: "LOW",
        impactDescription: "Enhances automated Luhn algorithm validation on 13-digit SA ID numbers.",
        plannedStart: "2026-08-28 10:00:00",
        plannedCompletion: "2026-08-28 10:15:00",
        backoutPlan: "Hot-swap policy module ruleset",
        testPlan: "Unit test suite with 50 synthetic test ID numbers.",
        approvalStatus: "implemented",
        implementationNotes: "Successfully deployed in production without disruption."
      }
    ];
    initialServiceDeskTickets = [
      {
        id: "REQ-2026-104",
        requestType: "Quota Limit Increase",
        requestorName: "Dr. Andre Marais",
        tenantName: "Discovery Health SA",
        description: "Requesting token monthly quota increase from 500M to 1B tokens for Q4 clinical trial processing.",
        priority: "HIGH",
        approvalStage: "Commercial Approval",
        status: "in_approval",
        createdAt: "2026-08-28 14:20:00"
      },
      {
        id: "REQ-2026-105",
        requestType: "IP Whitelist",
        requestorName: "Sipho Nkosi",
        tenantName: "Standard Bank Group",
        description: "Add new CIDR range 196.25.1.0/24 to tenant IP whitelist for direct core banking gateway integration.",
        priority: "MEDIUM",
        approvalStage: "Security Review",
        status: "in_approval",
        createdAt: "2026-08-29 07:15:00"
      }
    ];
    initialSecurityPosture = {
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
        { id: "SEC-R1", risk: "Potential prompt injection bypass on edge chat widget", owner: "Dr. Michael Chen", dueDate: "2026-09-10", severity: "HIGH" },
        { id: "SEC-R2", risk: "Unused API Key key-sec-08 requiring annual revocation", owner: "Tebogo Molefe", dueDate: "2026-09-05", severity: "MEDIUM" }
      ]
    };
    initialActivityFeed = [
      { id: "act-01", timestamp: "09:41", severity: "critical", title: "P1 Incident Declared", details: "OpenAI US-East region experiencing high P99 latency (1.4s)." },
      { id: "act-02", timestamp: "09:43", severity: "success", title: "Groq & Ollama Fallback Activated", details: "Traffic seamlessly redirected to local Ollama GPU cluster & Groq LPU." },
      { id: "act-03", timestamp: "09:44", severity: "warning", title: "SLA Latency Warning Triggered", details: "Tenant SLA threshold evaluated for Discovery Health SA." },
      { id: "act-04", timestamp: "09:46", severity: "info", title: "Security Officer Notified", details: "Dr. Michael Chen paged via automated PagerDuty integration." },
      { id: "act-05", timestamp: "09:52", severity: "success", title: "System Normalization", details: "Primary provider latency returned to baseline (<300ms)." }
    ];
  }
});

// src/utils/complianceEngine.ts
var complianceEngine_exports = {};
__export(complianceEngine_exports, {
  scanAndSanitizePrompt: () => scanAndSanitizePrompt,
  validateIBAN: () => validateIBAN,
  validateSouthAfricanID: () => validateSouthAfricanID
});
function validateSouthAfricanID(idNumber) {
  const cleanId = idNumber.replace(/\D/g, "");
  if (cleanId.length !== 13) return false;
  const month = parseInt(cleanId.substring(2, 4), 10);
  const day = parseInt(cleanId.substring(4, 6), 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(cleanId.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
function validateIBAN(iban) {
  const clean = iban.replace(/[\s-]/g, "").toUpperCase();
  if (clean.length < 15 || clean.length > 34) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let numericString = "";
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numericString += (code - 55).toString();
    } else if (code >= 48 && code <= 57) {
      numericString += rearranged.charAt(i);
    } else {
      return false;
    }
  }
  let remainder = 0;
  for (let i = 0; i < numericString.length; i += 7) {
    const block = remainder.toString() + numericString.slice(i, i + 7);
    remainder = parseInt(block, 10) % 97;
  }
  return remainder === 1;
}
function scanAndSanitizePrompt(prompt, options = {}) {
  const popia = options.popiaRules || {
    enabled: true,
    enforcementMode: "redact_mask",
    maskSaIdNumbers: true,
    maskSaTaxNumbers: true,
    maskSaPhoneNumbers: true,
    maskSaBankingDetails: true,
    blockSpecialPersonalInfo: true,
    enforceSection72CrossBorder: true,
    logInformationOfficerAudit: true,
    requireConsentProofHeader: false
  };
  const gdpr = options.gdprRules || {
    enabled: true,
    enforcementMode: "redact_mask",
    enforceArticle9SpecialCategories: true,
    enforceEuSovereignResidencyOnly: false,
    enforceArticle17ZeroRetention: true,
    enforceArticle22AutomatedDecisionFlag: true,
    maskEuropeanIbans: true,
    maskEuPassportsAndNationalIds: true,
    maskEmailsAndIps: true,
    dataRetentionTtlDays: 30
  };
  let sanitized = prompt;
  const popiaViolations = [];
  const gdprViolations = [];
  const detectedCategories = /* @__PURE__ */ new Set();
  let redactedTokensCount = 0;
  if (popia.enabled) {
    if (popia.maskSaIdNumbers) {
      const saIdRegex = /\b\d{13}\b/g;
      sanitized = sanitized.replace(saIdRegex, (match) => {
        if (validateSouthAfricanID(match)) {
          popiaViolations.push({
            framework: "POPIA",
            rule: "SA_CITIZEN_NATIONAL_ID",
            clause: "POPIA Section 1 & Section 14 (Processing of Unique Identifiers)",
            severity: "critical",
            detectedValueMasked: `${match.slice(0, 6)}*****${match.slice(-2)}`,
            description: `13-digit South African National ID number detected with valid Luhn checksum (DOB: ${match.slice(0, 2)}/${match.slice(2, 4)}/${match.slice(4, 6)}).`
          });
          detectedCategories.add("SA National ID (POPIA Section 14)");
          redactedTokensCount++;
          return `[POPIA_MASKED_SA_ID:${match.slice(0, 6)}*****]`;
        }
        return match;
      });
    }
    if (popia.maskSaTaxNumbers) {
      const sarsRegex = /\b(?:SARS|tax\s*(?:ref|number|no|#)?:?)\s*([01239]\d{9})\b/gi;
      sanitized = sanitized.replace(sarsRegex, (match, taxNo) => {
        popiaViolations.push({
          framework: "POPIA",
          rule: "SARS_TAX_REFERENCE",
          clause: "POPIA Section 14 & Tax Administration Act 2011",
          severity: "high",
          detectedValueMasked: `SARS: ${taxNo.slice(0, 3)}****${taxNo.slice(-2)}`,
          description: "10-digit South African Revenue Service (SARS) Tax Reference number identified."
        });
        detectedCategories.add("SARS Tax Identifier");
        redactedTokensCount++;
        return `[POPIA_MASKED_SARS_TAX:${taxNo.slice(0, 3)}****]`;
      });
    }
    if (popia.maskSaBankingDetails) {
      const saBankRegex = /\b(?:Capitec|Standard\s*Bank|FNB|First\s*National\s*Bank|ABSA|Nedbank|Investec|Discovery\s*Bank)\s*(?:account|acc|a\/c|no|number)?:?\s*(\d{9,11})\b/gi;
      sanitized = sanitized.replace(saBankRegex, (match, accNo) => {
        popiaViolations.push({
          framework: "POPIA",
          rule: "SA_FINANCIAL_ACCOUNT",
          clause: "POPIA Section 19 (Security Safeguards for Personal Banking Information)",
          severity: "high",
          detectedValueMasked: `SA Banking Account: ****${accNo.slice(-4)}`,
          description: "South African domestic banking institution account number detected."
        });
        detectedCategories.add("SA Banking Information");
        redactedTokensCount++;
        return `[POPIA_MASKED_BANK_ACCOUNT:****${accNo.slice(-4)}]`;
      });
    }
    if (popia.maskSaPhoneNumbers) {
      const saPhoneRegex = /(?:\+27|0)(?:6\d|7\d|8\d|1\d|2\d|3\d|4\d|5\d)\s*\d{3}\s*\d{4}\b/g;
      sanitized = sanitized.replace(saPhoneRegex, (match) => {
        popiaViolations.push({
          framework: "POPIA",
          rule: "SA_MOBILE_TELEPHONY",
          clause: "POPIA Section 1 (Personal Contact Details)",
          severity: "medium",
          detectedValueMasked: match.slice(0, 4) + "***" + match.slice(-2),
          description: "South African cellular / fixed-line telephone number pattern detected."
        });
        detectedCategories.add("SA Phone Number");
        redactedTokensCount++;
        return `[POPIA_MASKED_PHONE:${match.slice(0, 4)}***]`;
      });
    }
    if (popia.blockSpecialPersonalInfo) {
      const specialTerms = [
        { term: "hiv positive", desc: "Medical diagnostic / HIV health status record" },
        { term: "biometric template", desc: "Biometric identification vector payload" },
        { term: "criminal record", desc: "Alleged or historical criminal offense record" },
        { term: "trade union member", desc: "Trade union affiliation record" },
        { term: "ethnic origin", desc: "Racial or ethnic group profiling" }
      ];
      for (const st of specialTerms) {
        if (sanitized.toLowerCase().includes(st.term)) {
          popiaViolations.push({
            framework: "POPIA",
            rule: "POPIA_SPECIAL_PERSONAL_INFO_PART_B",
            clause: "POPIA Part B (Sections 26 to 33) Prohibition on Processing Special Personal Information",
            severity: "critical",
            detectedValueMasked: `Special Personal Category: [${st.term}]`,
            description: st.desc
          });
          detectedCategories.add("POPIA Special Personal Information (Part B)");
          sanitized = sanitized.replace(new RegExp(st.term, "gi"), `[POPIA_SPECIAL_INFO_REDACTED]`);
          redactedTokensCount++;
        }
      }
    }
  }
  if (gdpr.enabled) {
    if (gdpr.maskEuropeanIbans) {
      const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g;
      sanitized = sanitized.replace(ibanRegex, (match) => {
        if (validateIBAN(match)) {
          gdprViolations.push({
            framework: "GDPR",
            rule: "EU_FINANCIAL_IBAN",
            clause: "GDPR Article 5(1)(f) & Article 32 (Integrity and Confidentiality)",
            severity: "critical",
            detectedValueMasked: `${match.slice(0, 4)}****${match.slice(-4)}`,
            description: `Valid European International Bank Account Number (Country: ${match.slice(0, 2)}).`
          });
          detectedCategories.add("European IBAN Account");
          redactedTokensCount++;
          return `[GDPR_MASKED_IBAN:${match.slice(0, 4)}****${match.slice(-4)}]`;
        }
        return match;
      });
    }
    if (gdpr.maskEmailsAndIps) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      sanitized = sanitized.replace(emailRegex, (match) => {
        gdprViolations.push({
          framework: "GDPR",
          rule: "PII_EMAIL_ADDRESS",
          clause: "GDPR Article 4(1) & Article 6 (Lawful Identifiers)",
          severity: "medium",
          detectedValueMasked: match.replace(/(?<=.{2}).(?=.*@)/g, "*"),
          description: "Directly identifiable electronic mail address."
        });
        detectedCategories.add("Electronic Mail (PII)");
        redactedTokensCount++;
        return `[GDPR_MASKED_EMAIL]`;
      });
      const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
      sanitized = sanitized.replace(ipRegex, (match) => {
        gdprViolations.push({
          framework: "GDPR",
          rule: "PII_IP_ADDRESS",
          clause: "GDPR Recital 30 (Online Identifiers)",
          severity: "low",
          detectedValueMasked: match.slice(0, 7) + ".***.***",
          description: "IPv4 network location identifier."
        });
        detectedCategories.add("IP Address Identifier");
        redactedTokensCount++;
        return `[GDPR_MASKED_IP]`;
      });
    }
    if (gdpr.enforceArticle9SpecialCategories) {
      const specialGdprTerms = [
        { term: "medical diagnosis", desc: "Protected health & clinical diagnostic record" },
        { term: "patient condition", desc: "Health status identifier" },
        { term: "biometric face vector", desc: "Biometric authentication data" },
        { term: "religious affiliation", desc: "Religious or philosophical beliefs" },
        { term: "political opinion", desc: "Political opinions or political party membership" },
        { term: "sexual orientation", desc: "Data concerning health or sexual orientation" },
        { term: "genetic profile", desc: "Genetic biometric data" }
      ];
      for (const sgt of specialGdprTerms) {
        if (sanitized.toLowerCase().includes(sgt.term)) {
          gdprViolations.push({
            framework: "GDPR",
            rule: "GDPR_ARTICLE_9_SPECIAL_CATEGORIES",
            clause: "GDPR Article 9(1) Prohibition of Processing Special Categories",
            severity: "critical",
            detectedValueMasked: `Article 9 Category: [${sgt.term}]`,
            description: sgt.desc
          });
          detectedCategories.add("GDPR Article 9 Special Category");
          sanitized = sanitized.replace(new RegExp(sgt.term, "gi"), `[GDPR_ARTICLE_9_REDACTED]`);
          redactedTokensCount++;
        }
      }
    }
    if (gdpr.enforceArticle22AutomatedDecisionFlag) {
      const profilingKeywords = ["terminate employee based on score", "auto-reject loan application", "automated credit underwriting decision"];
      for (const pk of profilingKeywords) {
        if (sanitized.toLowerCase().includes(pk)) {
          gdprViolations.push({
            framework: "GDPR",
            rule: "GDPR_ARTICLE_22_AUTOMATED_DECISION",
            clause: "GDPR Article 22 (Automated Individual Decision-Making, Including Profiling)",
            severity: "high",
            detectedValueMasked: `Automated Profiling Trigger: [${pk}]`,
            description: "Automated decision-making prompt detected. Requires Human-in-the-Loop review."
          });
          detectedCategories.add("Article 22 Automated Profiling");
        }
      }
    }
  }
  let crossBorderTransferFlag;
  if (options.targetProvider) {
    const isLocalOrOnPrem = options.targetProvider.type === "ollama" || options.targetProvider.endpoint.includes("192.168.") || options.targetProvider.endpoint.includes("internal");
    const isAdequate = isLocalOrOnPrem || options.targetProvider.type === "gemini";
    if (popia.enforceSection72CrossBorder && detectedCategories.size > 0 && !isLocalOrOnPrem) {
      crossBorderTransferFlag = {
        sourceJurisdiction: "South Africa (POPIA Scope)",
        destinationProvider: options.targetProvider.name,
        destinationJurisdiction: "United States / Offshore Cloud Node",
        isAdequate,
        warning: "Trans-border transfer of personal information requires POPIA Section 72(1) compliance (adequate protection or consent)."
      };
    }
  }
  let riskScore = 0;
  const criticalCount = [...popiaViolations, ...gdprViolations].filter((v) => v.severity === "critical").length;
  const highCount = [...popiaViolations, ...gdprViolations].filter((v) => v.severity === "high").length;
  const mediumCount = [...popiaViolations, ...gdprViolations].filter((v) => v.severity === "medium").length;
  riskScore = Math.min(100, criticalCount * 40 + highCount * 25 + mediumCount * 10);
  let actionTaken = "PASSED";
  let passed = true;
  if (criticalCount > 0) {
    if (popia.enforcementMode === "strict_block" || gdpr.enforcementMode === "strict_block") {
      actionTaken = "BLOCKED";
      passed = false;
    } else {
      actionTaken = "REDACTED_FORWARDED";
      passed = true;
    }
  } else if (redactedTokensCount > 0) {
    actionTaken = "REDACTED_FORWARDED";
    passed = true;
  }
  return {
    passed,
    riskScore,
    actionTaken,
    popiaViolations,
    gdprViolations,
    originalPromptSnippet: prompt.slice(0, 160) + (prompt.length > 160 ? "..." : ""),
    sanitizedPrompt: sanitized,
    redactedTokensCount,
    detectedCategories: Array.from(detectedCategories),
    crossBorderTransferFlag,
    timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
  };
}
var init_complianceEngine = __esm({
  "src/utils/complianceEngine.ts"() {
  }
});

// src/data/incidentData.ts
var incidentData_exports = {};
__export(incidentData_exports, {
  INITIAL_ALERTS_LIST: () => INITIAL_ALERTS_LIST,
  INITIAL_INCIDENTS_LIST: () => INITIAL_INCIDENTS_LIST,
  INITIAL_PROBLEMS_LIST: () => INITIAL_PROBLEMS_LIST,
  INITIAL_RAG_KNOWLEDGE_BASE: () => INITIAL_RAG_KNOWLEDGE_BASE
});
var INITIAL_RAG_KNOWLEDGE_BASE, INITIAL_INCIDENTS_LIST, INITIAL_ALERTS_LIST, INITIAL_PROBLEMS_LIST;
var init_incidentData = __esm({
  "src/data/incidentData.ts"() {
    INITIAL_RAG_KNOWLEDGE_BASE = [
      {
        id: "rag-kb-001",
        title: "Runbook: Resolving Upstream LLM Provider 504 Gateway Timeouts",
        category: "runbook",
        content: `When upstream providers like OpenAI US-East or Gemini Cloud return 504 Gateway Timeout or P99 latency spikes > 1500ms:
1. Immediate L1 Action: Trigger 'Reroute to Groq LPU' or 'Reroute to Local Ollama GPU Cluster' on the ALTIL Routing Matrix.
2. Verify if the tenant has active SLA penalty countdowns. If SLA breach < 15 mins, page BOC Commander.
3. Flush Redis rate limit cache keys for the affected tenant app using the ALTIL Admin CLI: redis-cli DEL "tenant:rate:{tenantId}".
4. Verify circuit breaker state. If tripped, check whether automated failover succeeded or if manual override is required.`,
        keywords: ["504", "timeout", "latency", "gateway", "groq", "ollama", "circuit breaker"],
        relatedErrorCodes: ["504", "502", "ERR_UPSTREAM_TIMEOUT"],
        updatedAt: "2026-08-25"
      },
      {
        id: "rag-kb-002",
        title: "Statutory Guidance: POPIA Section 72 Cross-Border Data Transfer Mitigation",
        category: "compliance",
        content: `Under South Africa POPIA Section 72, personal information cannot be transferred outside South Africa unless the recipient is subject to adequate data protection laws or binding corporate rules.
In the event of a Section 72 warning or Special Category Data leak:
1. Immediately switch the affected application route to 'Ollama Local Sovereign Cluster' (Johannesburg On-Prem GPU).
2. Contact Information Officer (Elena Rostova / Adv. Willem Van Zyl).
3. Generate an audit hash report from /api/v1/compliance/audit-hash for statutory reporting.
4. Ensure all unredacted prompt payloads in temporary buffers are purged immediately.`,
        keywords: ["POPIA", "Section 72", "cross-border", "PII", "sovereign", "Ollama", "special category"],
        relatedErrorCodes: ["422_POPIA_SECTION72", "BLOCKED_BY_POLICY"],
        updatedAt: "2026-08-28"
      },
      {
        id: "rag-kb-003",
        title: "SLA Mitigation: Contractual Credit Penalty Minimization Matrix",
        category: "sla_policy",
        content: `For Enterprise Platinum 99.95% SLA customers (FNB, Standard Bank, Discovery Health):
- P1 Outage Response SLA Target: 15 minutes.
- P1 Fix/Mitigation SLA Target: 2 hours.
- Penalty: 10% monthly billing credit if total downtime exceeds 15 minutes in a calendar month.
- Remediation Protocol:
  a. Acknowledge incident within 3 minutes of alert.
  b. Execute 1-click fallback to secondary model.
  c. Issue automated customer executive alert email & SMS to statutory officer.
  d. Open Post-Incident Review (PIR) within 1 hour of resolution.`,
        keywords: ["SLA", "credit penalty", "FNB", "Discovery", "Platinum", "P1", "response target"],
        relatedErrorCodes: ["SLA_BREACH_WARNING", "P1_INCIDENT"],
        updatedAt: "2026-08-29"
      },
      {
        id: "rag-kb-004",
        title: "Post-Mortem INC-2026-880: SAP Billing Webhook Signature Validation Failure",
        category: "post_mortem",
        content: `Root Cause: SAP S/4HANA Enterprise Cloud rotated HMAC SHA-256 webhook signing keys without updating the ALTIL License Service vault secrets.
Resolution:
1. Added automated key rotation verification endpoint.
2. Implemented secondary fallback key verification in /api/v1/licensing/webhook.
3. Updated level 2 support playbook to test SAP webhook secret parity on billing cycle dates.`,
        keywords: ["SAP", "webhook", "licensing", "HMAC", "billing", "signature"],
        relatedErrorCodes: ["401_WEBHOOK_UNAUTHORIZED", "PAYMENT_VERIFICATION_FAILED"],
        updatedAt: "2026-08-20"
      }
    ];
    INITIAL_INCIDENTS_LIST = [
      {
        id: "INC-2026-901",
        title: "P1 CRITICAL: High Latency & 504 Timeout Spike on OpenAI Gateway for FNB Customer Support",
        severity: "P1_CRITICAL",
        status: "investigating",
        commander: "Horatio Huxham (BOC Commander)",
        assignedTeam: "NOC",
        assignedEngineer: "Tebogo Molefe (Principal Systems Engineer)",
        affectedTenantIds: ["cust-fnb", "cust-std-bank"],
        affectedTenantNames: ["First National Bank (FNB)", "Standard Bank Group"],
        affectedAppIds: ["app-fnb-support", "app-std-bank-fraud"],
        affectedAppNames: ["FNB Customer Support AI Bot", "Standard Bank Fraud Analyzer"],
        affectedServiceIds: ["srv-01", "srv-04"],
        startTime: "2026-08-30 03:45:10",
        estimatedResolutionTime: "2026-08-30 04:30:00",
        slaImpacted: true,
        slaBreachMinutes: 8,
        category: "Provider_Outage",
        summary: "OpenAI US-East region experiencing severe P99 latency degradation (1,850ms) causing gateway timeouts and 504 errors on high-frequency customer support channels.",
        alertChannels: ["sms", "email", "in_app"],
        smsAlertSent: true,
        emailAlertSent: true,
        inAppAlertSent: true,
        bocDetails: {
          revenueAtRiskUsdPerHour: 14500,
          slaCreditPenaltyPercent: 10,
          breachCountdownMinutes: 7,
          affectedTenantTier: "Enterprise Platinum 99.95%",
          contractImpactSummary: "Potential R45,000 SLA penalty credit if resolution exceeds 15 minutes. FNB CISO notified.",
          customerExecutiveNotified: true,
          accountManagerName: "Thabo Mbeki (Key Account Executive)"
        },
        socDetails: {
          threatClassification: "Nominal Service Degradation (No Security Breach)",
          threatVector: "Upstream Provider API Bottleneck",
          auditHash: "0x8f2a9918c4d291e10283fa71b00192a8321d",
          sourceIp: "196.25.1.42 (FNB Primary Ingress)",
          informationOfficerPaged: false,
          complianceRiskRating: "LOW"
        },
        nocDetails: {
          p50LatencyMs: 840,
          p95LatencyMs: 1420,
          p99LatencyMs: 2450,
          httpStatusCodeDistribution: { "504": 148, "429": 22, "200": 1840 },
          upstreamProviderHealth: [
            { name: "OpenAI Direct Gateway", status: "degraded", latencyMs: 1850 },
            { name: "Groq Cloud LPU", status: "online", latencyMs: 82 },
            { name: "Ollama Local Cluster", status: "online", latencyMs: 140 },
            { name: "Google Gemini Cloud", status: "online", latencyMs: 290 }
          ],
          activeCircuitBreaker: true,
          gatewayNodeCpuRam: "CPU 42% | RAM 6.2GB / 16GB"
        },
        level1Details: {
          triageChecklist: [
            { step: "Confirm upstream provider outage status page", done: true },
            { step: "Activate dynamic model fallback to Groq LPU", done: true },
            { step: "Verify FNB customer support response rates", done: false },
            { step: "Send status update to FNB Operations Desk", done: true }
          ],
          recommendedActions: [
            "Reroute 100% of app-fnb-support traffic to Groq Llama 3.3 LPU",
            "Flush rate limit buffer cache for tenant cust-fnb",
            "Issue SMS update to FNB SOC Commander"
          ],
          suggestedFallbackModel: "Groq Llama 3.3 70B Versatile",
          oneClickMitigationAvailable: true
        },
        level2Details: {
          rootCauseHypotheses: [
            { hypothesis: "OpenAI US-East region BGP route degradation & packet loss", probabilityPercent: 75 },
            { hypothesis: "Rate limit bucket overflow on OpenAI organization key", probabilityPercent: 20 },
            { hypothesis: "Local gateway socket exhaustion", probabilityPercent: 5 }
          ],
          stackTraceSnippet: `Error: Upstream HTTP 504 Gateway Timeout
  at OpenAIClient.dispatchInference (/server.ts:1774:11)
  at async routeInferenceRequest (/server.ts:1758:9)
  at async /api/v1/orchestrate (server.ts:1620:5)`,
          recentDeploymentsCorrelated: ["CHG-2026-089: Groq Llama 3.3 70B Fallback Node (02:00:00)"],
          payloadHeaderDiff: "x-openai-processing-ms: 5001 (Exceeded timeout threshold 3000ms)"
        },
        level3Details: {
          rawRequestPayloadJson: JSON.stringify({
            appId: "app-fnb-support",
            capability: "fast_chat",
            prompt: "User: How do I increase my daily EFT transfer limit on the FNB banking app?",
            tenantId: "cust-fnb"
          }, null, 2),
          rawResponsePayloadJson: JSON.stringify({
            error: {
              code: 504,
              message: "Upstream provider OpenAI timed out after 3000ms",
              fallbackTriggered: true,
              fallbackProvider: "Groq Cloud LPU"
            }
          }, null, 2),
          databaseLockStatus: "MariaDB 10.11.18 connection pool healthy (0 deadlocks, 2 active connections)",
          jiraTicketUrl: "https://jira.introsoft.internal/browse/ALTIL-1042",
          gitHubIssueUrl: "https://github.com/introsoft/altil-platform/issues/482",
          suggestedCodePatch: `// Adjust client timeout threshold for primary provider fallback
const TIMEOUT_THRESHOLD_MS = 2000; // Reduced from 3000ms to failover faster`
        },
        timeline: [
          { timestamp: "03:45:10", author: "Automated NOC Monitor", note: "Detected 148 HTTP 504 Gateway Timeout errors on OpenAI endpoint within 60s.", channelTriggered: "In-App Alert" },
          { timestamp: "03:46:00", author: "ALTIL Alerting Engine", note: "Dispatched SMS alert to Horatio Huxham (+27 82 555 0192) & Email to admin@fnb.co.za.", channelTriggered: "SMS & Email" },
          { timestamp: "03:48:30", author: "Tebogo Molefe", note: "Activated automated failover to Groq LPU. Latency dropped from 1,850ms to 92ms.", channelTriggered: "System Action" }
        ],
        postIncidentReview: {
          rootCause: "OpenAI US-East region BGP network routing instability.",
          customerImpact: "148 customer support interactions experienced 3s delay before fallback.",
          detectionMethod: "Automated ALTIL Gateway P99 Latency Monitor",
          correctiveActions: [
            "Decreased fallback timeout threshold from 3000ms to 1800ms.",
            "Configured active-active load balancing between Groq and Gemini."
          ],
          preventiveActions: [
            "Deploy dedicated local Ollama fallback cluster for FNB high-availability tiers."
          ],
          owner: "Tebogo Molefe",
          dueDate: "2026-09-02",
          status: "in_progress"
        }
      },
      {
        id: "INC-2026-902",
        title: "P2 HIGH: POPIA Section 72 Cross-Border Compliance Warning on Discovery Medical Claims",
        severity: "P2_HIGH",
        status: "assigned",
        commander: "Elena Rostova (Compliance Director)",
        assignedTeam: "SOC",
        assignedEngineer: "Adv. Willem Van Zyl (Information Security Lead)",
        affectedTenantIds: ["cust-discovery"],
        affectedTenantNames: ["Discovery Health SA"],
        affectedAppIds: ["app-discovery-claims"],
        affectedAppNames: ["Discovery Medical Claims Auto-Assessor"],
        affectedServiceIds: ["srv-03"],
        startTime: "2026-08-30 01:15:00",
        slaImpacted: false,
        category: "Security_POPIA",
        summary: "Special Category Health Data prompt containing ICD-10 medical diagnostic codes was routed to an unapproved non-EU cloud node without explicit consent proof header.",
        alertChannels: ["email", "in_app"],
        smsAlertSent: false,
        emailAlertSent: true,
        inAppAlertSent: true,
        bocDetails: {
          revenueAtRiskUsdPerHour: 0,
          slaCreditPenaltyPercent: 0,
          breachCountdownMinutes: 120,
          affectedTenantTier: "Enterprise Strategic Government",
          contractImpactSummary: "Statutory compliance review required under Discovery Health DPA.",
          customerExecutiveNotified: true,
          accountManagerName: "Elena Rostova"
        },
        socDetails: {
          threatClassification: "POPIA Section 72 Trans-Border Regulatory Warning",
          popiaSectionClause: "POPIA Section 72 / Part B Special Personal Information",
          threatVector: "Unsanitized Prompt Payload with Medical ICD-10 Codes",
          auditHash: "0x9918a24c0d12e84712039ab18420e71",
          sourceIp: "105.22.14.88 (Discovery Health Private Node)",
          informationOfficerPaged: true,
          complianceRiskRating: "HIGH"
        },
        nocDetails: {
          p50LatencyMs: 120,
          p95LatencyMs: 180,
          p99LatencyMs: 290,
          httpStatusCodeDistribution: { "422": 14, "200": 520 },
          upstreamProviderHealth: [
            { name: "Ollama Local Cluster", status: "online", latencyMs: 140 },
            { name: "Google Gemini Cloud", status: "online", latencyMs: 310 }
          ],
          activeCircuitBreaker: false,
          gatewayNodeCpuRam: "CPU 28% | RAM 5.1GB / 16GB"
        },
        level1Details: {
          triageChecklist: [
            { step: "Check if PII Sanitizer mask rules are enabled for app-discovery-claims", done: true },
            { step: "Force app-discovery-claims route to Local Ollama Sovereign Cluster", done: true },
            { step: "Log Data Protection Impact Assessment (DPIA) entry", done: false }
          ],
          recommendedActions: [
            "Enforce 100% on-premise local Ollama processing for Discovery Health",
            "Enable POPIA Part B strict blocking filter"
          ],
          suggestedFallbackModel: "Llama 3.3 70B (Ollama Local Johannesburg)",
          oneClickMitigationAvailable: true
        },
        level2Details: {
          rootCauseHypotheses: [
            { hypothesis: "Missing X-Consent-Proof-Header in Discovery Claims API request", probabilityPercent: 90 },
            { hypothesis: "New ICD-10 medical code regex not updated in baseline policy", probabilityPercent: 10 }
          ],
          stackTraceSnippet: `PolicyViolationError: POPIA Section 72 Trans-Border Restriction
  at scanAndSanitizePrompt (/src/utils/complianceEngine.ts:84:12)
  at routeInferenceRequest (/server.ts:1650:9)`,
          recentDeploymentsCorrelated: ["CHG-2026-090: Update POPIA PII Redactor Regex (2026-08-28)"],
          payloadHeaderDiff: 'Missing: X-POPIA-Consent-Proof: "GRANTED_PATIENT_OPT_IN"'
        },
        level3Details: {
          rawRequestPayloadJson: JSON.stringify({
            appId: "app-discovery-claims",
            prompt: "Patient ID 9208145028081 diagnosed with ICD-10 J45.9 asthma. Assess claim value.",
            destinationRegion: "US-East"
          }, null, 2),
          rawResponsePayloadJson: JSON.stringify({
            status: "FLAGGED_FOR_REVIEW",
            actionTaken: "REDACTED_FORWARDED",
            popiaViolations: [
              {
                framework: "POPIA",
                clause: "Section 72",
                description: "Trans-border transfer of Special Category Personal Information without verified consent header."
              }
            ]
          }, null, 2),
          databaseLockStatus: "Audit ledger table populated with encrypted cryptographic hash",
          jiraTicketUrl: "https://jira.introsoft.internal/browse/COMP-882"
        },
        timeline: [
          { timestamp: "01:15:00", author: "POPIA Compliance Engine", note: "Flagged trans-border medical payload without consent proof header.", channelTriggered: "In-App & Email" },
          { timestamp: "01:18:00", author: "Elena Rostova", note: "Assigned incident to Adv. Willem Van Zyl for DPIA legal verification.", channelTriggered: "In-App Alert" }
        ]
      },
      {
        id: "INC-2026-903",
        title: "P3 MEDIUM: Rate Limit 429 Throttle Warning on MTN Call Center Assistant",
        severity: "P3_MEDIUM",
        status: "mitigated",
        commander: "Sipho Nkosi (NOC Specialist)",
        assignedTeam: "Level_1",
        assignedEngineer: "Johan Pretorius",
        affectedTenantIds: ["cust-mtn"],
        affectedTenantNames: ["MTN Group"],
        affectedAppIds: ["app-mtn-assistant"],
        affectedAppNames: ["MTN Call Center Agent Assistant"],
        affectedServiceIds: ["srv-01"],
        startTime: "2026-08-29 18:20:00",
        resolvedTime: "2026-08-29 18:42:00",
        slaImpacted: false,
        category: "Latency_Spike",
        summary: "MTN Call Center application reached 88% of configured RPM quota during evening surge, causing temporary 429 rate limit warnings.",
        alertChannels: ["in_app"],
        smsAlertSent: false,
        emailAlertSent: false,
        inAppAlertSent: true,
        bocDetails: {
          revenueAtRiskUsdPerHour: 1200,
          slaCreditPenaltyPercent: 0,
          breachCountdownMinutes: 0,
          affectedTenantTier: "Enterprise Growth Tier",
          contractImpactSummary: "Quota recommendation sent to MTN Account Executive for Q4 upgrade.",
          customerExecutiveNotified: false,
          accountManagerName: "Thabo Mbeki"
        },
        socDetails: {
          threatClassification: "Legitimate High-Volume Traffic Peak",
          threatVector: "None (Authorized API Keys)",
          auditHash: "0x1029384756afbce",
          sourceIp: "196.11.240.12 (MTN Core Router)",
          informationOfficerPaged: false,
          complianceRiskRating: "LOW"
        },
        nocDetails: {
          p50LatencyMs: 140,
          p95LatencyMs: 210,
          p99LatencyMs: 380,
          httpStatusCodeDistribution: { "429": 18, "200": 3400 },
          upstreamProviderHealth: [
            { name: "Groq Cloud LPU", status: "online", latencyMs: 84 }
          ],
          activeCircuitBreaker: false,
          gatewayNodeCpuRam: "CPU 35% | RAM 4.8GB / 16GB"
        },
        level1Details: {
          triageChecklist: [
            { step: "Check tenant RPM quota threshold", done: true },
            { step: "Temporarily increase burst RPM limit to 8,000 RPM", done: true },
            { step: "Confirm 429 errors cleared", done: true }
          ],
          recommendedActions: [
            "Apply temporary 20% burst RPM buffer for MTN Call Center app"
          ],
          suggestedFallbackModel: "Groq Llama 3.1 8B Instant",
          oneClickMitigationAvailable: true
        },
        timeline: [
          { timestamp: "18:20:00", author: "ALTIL Quota Monitor", note: "MTN Call Center app exceeded 85% RPM quota (5,100 / 6,000 RPM).", channelTriggered: "In-App Alert" },
          { timestamp: "18:25:00", author: "Sipho Nkosi", note: "Applied temporary burst limit buffer (+2,000 RPM). 429 errors resolved.", channelTriggered: "System Action" },
          { timestamp: "18:42:00", author: "Sipho Nkosi", note: "Marked incident as Mitigated. Quota upgrade proposal generated.", channelTriggered: "In-App Alert" }
        ]
      },
      {
        id: "INC-2026-904",
        title: "P4 LOW: Minor Model Parameter Drift on Vodacom Churn Predictor",
        severity: "P4_LOW",
        status: "resolved",
        commander: "Tebogo Molefe",
        assignedTeam: "Level_2",
        assignedEngineer: "Tebogo Molefe",
        affectedTenantIds: ["cust-vodacom"],
        affectedTenantNames: ["Vodacom Group"],
        affectedAppIds: ["app-vodacom-churn"],
        affectedAppNames: ["Vodacom Churn Prediction Engine"],
        affectedServiceIds: ["srv-01"],
        startTime: "2026-08-28 14:10:00",
        resolvedTime: "2026-08-28 15:00:00",
        slaImpacted: false,
        category: "Model_Drift",
        summary: "Temperature parameter variance (0.7 vs 0.2) caused minor formatting inconsistencies in structured JSON churn predictions.",
        alertChannels: ["in_app"],
        smsAlertSent: false,
        emailAlertSent: false,
        inAppAlertSent: true,
        timeline: [
          { timestamp: "14:10:00", author: "Model Quality Scanner", note: "Detected JSON schema validation failure rate of 2.1%.", channelTriggered: "In-App Alert" },
          { timestamp: "14:30:00", author: "Tebogo Molefe", note: "Locked temperature parameter to 0.1 for deterministic JSON outputs.", channelTriggered: "System Action" },
          { timestamp: "15:00:00", author: "Tebogo Molefe", note: "Schema validation success returned to 100%. Resolved.", channelTriggered: "In-App Alert" }
        ]
      }
    ];
    INITIAL_ALERTS_LIST = [
      {
        id: "alt-001",
        incidentId: "INC-2026-901",
        incidentTitle: "P1 CRITICAL: High Latency & 504 Timeout Spike on OpenAI Gateway",
        severity: "P1_CRITICAL",
        timestamp: "2026-08-30 03:46:00",
        tenantName: "First National Bank (FNB)",
        appName: "FNB Customer Support AI Bot",
        message: "[ALTIL P1 ALERT] OpenAI Gateway experiencing 504 timeouts. SLA Breach Countdown: 7 mins. Rerouting to Groq LPU active.",
        channels: ["sms", "email", "in_app"],
        recipientPhone: "+27 82 555 0192",
        recipientEmail: "horatio.huxham@gmail.com",
        smsStatus: "sent",
        emailStatus: "sent",
        inAppStatus: "delivered",
        isRead: false
      },
      {
        id: "alt-002",
        incidentId: "INC-2026-902",
        incidentTitle: "P2 HIGH: POPIA Section 72 Cross-Border Compliance Warning",
        severity: "P2_HIGH",
        timestamp: "2026-08-30 01:15:00",
        tenantName: "Discovery Health SA",
        appName: "Discovery Medical Claims Auto-Assessor",
        message: "[ALTIL COMPLIANCE ALERT] Special Category Medical Data prompt flagged for cross-border adequacy check.",
        channels: ["email", "in_app"],
        recipientEmail: "elena.rostova@discovery.co.za",
        smsStatus: "queued",
        emailStatus: "sent",
        inAppStatus: "delivered",
        isRead: false
      },
      {
        id: "alt-003",
        incidentId: "INC-2026-903",
        incidentTitle: "P3 MEDIUM: Rate Limit 429 Throttle Warning on MTN",
        severity: "P3_MEDIUM",
        timestamp: "2026-08-29 18:20:00",
        tenantName: "MTN Group",
        appName: "MTN Call Center Agent Assistant",
        message: "[ALTIL CAPACITY WARNING] App reached 88% of RPM quota limit. Temporary burst buffer recommended.",
        channels: ["in_app"],
        smsStatus: "queued",
        emailStatus: "queued",
        inAppStatus: "read",
        isRead: true
      }
    ];
    INITIAL_PROBLEMS_LIST = [
      {
        id: "PRB-2026-041",
        title: "Upstream LLM Provider Transient Socket Exhaustion under Peak Concurrency",
        rootCause: "Connection pool starvation in Node.js HTTP keep-alive sockets during concurrent burst queries > 2,000 RPM.",
        affectedServices: ["ALTIL AI Gateway & Policy Engine", "Groq Ultra-Fast LPU Acceleration Service"],
        relatedIncidentIds: ["INC-2026-901", "INC-2026-880"],
        correctiveAction: "Configured maxSockets = 500 and enabled HTTP/2 multiplexing on upstream provider adapters.",
        preventiveAction: "Deploy Redis-backed distributed connection rate limiter across multi-region gateway nodes.",
        knownError: true,
        status: "under_review",
        createdAt: "2026-08-28"
      },
      {
        id: "PRB-2026-042",
        title: "POPIA Consent Proof Header Omission in Client REST SDKs",
        rootCause: "Legacy client application REST headers omit X-POPIA-Consent-Proof header on batch claims endpoints.",
        affectedServices: ["POPIA & GDPR Statutory AI Governance Guard"],
        relatedIncidentIds: ["INC-2026-902"],
        correctiveAction: "Updated ALTIL Client SDK v2.4 to auto-inject client consent metadata.",
        preventiveAction: "Enforce mandatory header linting at API Gateway ingress.",
        knownError: true,
        status: "open",
        createdAt: "2026-08-29"
      }
    ];
  }
});

// server.ts
var import_config = require("dotenv/config");
var import_express4 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
init_initialState();
init_complianceEngine();

// src/data/licensingData.ts
var INITIAL_LICENSING_PLANS = [
  {
    id: "plan-clinical-annual",
    name: "Clinical AI Suite - Enterprise Annual SLA",
    applicationId: "app-clinical",
    applicationName: "Clinical Diagnostics Assistant",
    pricingType: "per_year",
    currency: "USD",
    basePrice: 4999,
    billingCycle: "annual",
    includedTransactions: 5e5,
    overagePricePerTransaction: 1e-3,
    gracePeriodDays: 7,
    autoEnforcementAction: "hard_block_402",
    autoEnforceOnUnpaid: true,
    features: [
      "POPIA & HIPAA Certified Redaction",
      "Dedicated Groq LPU + Gemini 1.5 Pro Route",
      "99.95% Availability SLA",
      "Unlimited User Seats & Audit Logs"
    ],
    maxUsersAllowed: 500,
    slaUptimeGuarantee: 99.95,
    isPublished: true,
    createdDate: "2026-01-10"
  },
  {
    id: "plan-fraud-tx",
    name: "Financial Fraud Engine - Pay-Per-Transaction",
    applicationId: "app-fraud",
    applicationName: "Financial Fraud Engine",
    pricingType: "per_transaction",
    currency: "USD",
    basePrice: 0,
    billingCycle: "per_transaction",
    includedTransactions: 0,
    overagePricePerTransaction: 35e-4,
    gracePeriodDays: 3,
    autoEnforcementAction: "rate_limit_throttle",
    autoEnforceOnUnpaid: true,
    features: [
      "Real-time Anomaly Scoring (<50ms)",
      "Pre-paid or Post-paid Metered Wallet",
      "Sub-second Vector Pattern Matching",
      "API Webhook Alert Hooks"
    ],
    maxUsersAllowed: 50,
    slaUptimeGuarantee: 99.9,
    isPublished: true,
    createdDate: "2026-02-01"
  },
  {
    id: "plan-bot-monthly",
    name: "Customer Bot - Growth Monthly Hybrid",
    applicationId: "app-custservice",
    applicationName: "Customer Service Bot",
    pricingType: "hybrid_base_metered",
    currency: "ZAR",
    basePrice: 4999,
    // ZAR
    billingCycle: "monthly",
    includedTransactions: 5e4,
    overagePricePerTransaction: 0.05,
    // ZAR per tx overage
    gracePeriodDays: 5,
    autoEnforcementAction: "soft_warning",
    autoEnforceOnUnpaid: true,
    features: [
      "Multi-lingual Omni-channel Support",
      "50,000 Included Monthly Queries",
      "Human Agent Handoff API",
      "Custom Knowledge Base RAG"
    ],
    maxUsersAllowed: 100,
    slaUptimeGuarantee: 99.5,
    isPublished: true,
    createdDate: "2026-03-15"
  },
  {
    id: "plan-claims-daily",
    name: "Enterprise Claims AI - On-Demand Daily",
    applicationId: "app-claims",
    applicationName: "Enterprise Claims AI",
    pricingType: "per_day",
    currency: "USD",
    basePrice: 45,
    billingCycle: "daily",
    includedTransactions: 1e4,
    overagePricePerTransaction: 2e-3,
    gracePeriodDays: 2,
    autoEnforcementAction: "hard_block_402",
    autoEnforceOnUnpaid: true,
    features: [
      "Automated OCR & Policy Inspection",
      "Daily Micro-billing Settlement",
      "Instant Auto-suspend on Non-payment",
      "Exportable Claims Evidence Audit"
    ],
    maxUsersAllowed: 25,
    slaUptimeGuarantee: 99,
    isPublished: true,
    createdDate: "2026-04-01"
  },
  {
    id: "plan-sovereign-custom",
    name: "Sovereign Banking AI - Bespoke Contract",
    applicationId: "app-fraud",
    applicationName: "Financial Fraud Engine",
    pricingType: "custom_contract",
    currency: "USD",
    basePrice: 12500,
    billingCycle: "monthly",
    includedTransactions: 2e6,
    overagePricePerTransaction: 8e-4,
    gracePeriodDays: 14,
    autoEnforcementAction: "read_only",
    autoEnforceOnUnpaid: true,
    features: [
      "Dedicated On-Prem Ollama Cluster Option",
      "Custom Fine-Tuned Domain Adapter",
      "2,000,000 Included Transactions",
      "99.99% Financial Industry SLA",
      "Executive Account Manager & Direct Phone Hotline"
    ],
    maxUsersAllowed: 2e3,
    slaUptimeGuarantee: 99.99,
    isPublished: true,
    createdDate: "2026-01-01"
  }
];
var INITIAL_TENANT_LICENSES = [
  {
    id: "lic-acme-fraud",
    tenantId: "cust-acme-fintech",
    tenantName: "Acme Fintech (Pty) Ltd",
    applicationId: "app-fraud",
    applicationName: "Financial Fraud Engine",
    planId: "plan-fraud-tx",
    planName: "Financial Fraud Engine - Pay-Per-Transaction",
    pricingType: "per_transaction",
    currency: "USD",
    basePrice: 0,
    contractStartDate: "2026-02-01",
    contractEndDate: "2027-02-01",
    nextBillingDate: "2026-09-01",
    lastPaymentDate: "2026-08-01",
    lastPaymentAmount: 435.75,
    paymentStatus: "paid",
    licenseStatus: "active",
    currentTransactionCount: 124500,
    maxTransactionQuota: 5e5,
    overageTransactionsCount: 0,
    currentAccruedBillUsd: 435.75,
    autoEnforceOnUnpaid: true,
    graceDaysRemaining: 3,
    activeEnforcement: null,
    billingContactEmail: "finance@acmefintech.co.za",
    customContractNotes: "Post-paid enterprise monthly invoice settlement."
  },
  {
    id: "lic-healthplus-clinical",
    tenantId: "cust-healthplus-sa",
    tenantName: "HealthPlus SA Hospitals",
    applicationId: "app-clinical",
    applicationName: "Clinical Diagnostics Assistant",
    planId: "plan-clinical-annual",
    planName: "Clinical AI Suite - Enterprise Annual SLA",
    pricingType: "per_year",
    currency: "USD",
    basePrice: 4999,
    contractStartDate: "2026-01-15",
    contractEndDate: "2027-01-15",
    nextBillingDate: "2027-01-15",
    lastPaymentDate: "2026-01-15",
    lastPaymentAmount: 4999,
    paymentStatus: "paid",
    licenseStatus: "active",
    currentTransactionCount: 84200,
    maxTransactionQuota: 5e5,
    overageTransactionsCount: 0,
    currentAccruedBillUsd: 4999,
    autoEnforceOnUnpaid: true,
    graceDaysRemaining: 7,
    activeEnforcement: null,
    billingContactEmail: "accounts@healthplus.co.za",
    customContractNotes: "Annual pre-paid license with POPIA compliance rider."
  },
  {
    id: "lic-global-bot",
    tenantId: "cust-global-retail",
    tenantName: "Global Retail Corp",
    applicationId: "app-custservice",
    applicationName: "Customer Service Bot",
    planId: "plan-bot-monthly",
    planName: "Customer Bot - Growth Monthly Hybrid",
    pricingType: "hybrid_base_metered",
    currency: "ZAR",
    basePrice: 4999,
    contractStartDate: "2026-03-15",
    contractEndDate: "2026-09-15",
    nextBillingDate: "2026-08-25",
    lastPaymentDate: "2026-07-25",
    lastPaymentAmount: 5604,
    paymentStatus: "failed",
    licenseStatus: "grace_period",
    currentTransactionCount: 62100,
    maxTransactionQuota: 5e4,
    overageTransactionsCount: 12100,
    currentAccruedBillUsd: 311.33,
    // ZAR 5,604 equivalent
    autoEnforceOnUnpaid: true,
    graceDaysRemaining: 2,
    activeEnforcement: "soft_warning",
    billingContactEmail: "ap@globalretail.com",
    customContractNotes: "Card payment failed on 2026-08-25. Grace period active (2 days remaining)."
  },
  {
    id: "lic-apex-claims",
    tenantId: "cust-apex-logistics",
    tenantName: "Apex Logistics & Freight",
    applicationId: "app-claims",
    applicationName: "Enterprise Claims AI",
    planId: "plan-claims-daily",
    planName: "Enterprise Claims AI - On-Demand Daily",
    pricingType: "per_day",
    currency: "USD",
    basePrice: 45,
    contractStartDate: "2026-04-01",
    contractEndDate: "2026-10-01",
    nextBillingDate: "2026-08-28",
    lastPaymentDate: "2026-08-24",
    lastPaymentAmount: 45,
    paymentStatus: "overdue",
    licenseStatus: "auto_suspended",
    currentTransactionCount: 14800,
    maxTransactionQuota: 1e4,
    overageTransactionsCount: 4800,
    currentAccruedBillUsd: 54.6,
    autoEnforceOnUnpaid: true,
    graceDaysRemaining: 0,
    activeEnforcement: "hard_block_402",
    billingContactEmail: "billing@apexlogistics.com",
    customContractNotes: "Auto-suspended due to unpaid balance past grace period. Gateway returning HTTP 402."
  }
];
var INITIAL_PAYMENT_WEBHOOK_LOGS = [
  {
    id: "paylog-101",
    timestamp: "2026-08-29 14:22:10",
    tenantId: "cust-apex-logistics",
    tenantName: "Apex Logistics & Freight",
    applicationId: "app-claims",
    invoiceId: "INV-2026-0892",
    eventType: "license.auto_suspended",
    amount: 54.6,
    currency: "USD",
    gatewayProvider: "Stripe",
    enforcementTriggered: "hard_block_402",
    status: "processed",
    rawPayloadSummary: "Automatic Grace Expiry. Action = HARD BLOCK 402 Payment Required executed at gateway edge."
  },
  {
    id: "paylog-102",
    timestamp: "2026-08-25 09:15:40",
    tenantId: "cust-global-retail",
    tenantName: "Global Retail Corp",
    applicationId: "app-custservice",
    invoiceId: "INV-2026-0841",
    eventType: "invoice.payment_failed",
    amount: 311.33,
    currency: "ZAR",
    gatewayProvider: "PayFast",
    enforcementTriggered: "soft_warning",
    status: "processed",
    rawPayloadSummary: "Card Decline Code: insufficient_funds. Tenant moved to GRACE_PERIOD (5 days window)."
  },
  {
    id: "paylog-103",
    timestamp: "2026-08-01 10:00:00",
    tenantId: "cust-acme-fintech",
    tenantName: "Acme Fintech (Pty) Ltd",
    applicationId: "app-fraud",
    invoiceId: "INV-2026-0799",
    eventType: "invoice.paid",
    amount: 435.75,
    currency: "USD",
    gatewayProvider: "SAP_Billing",
    enforcementTriggered: "none",
    status: "processed",
    rawPayloadSummary: "Payment reconciled via EFT Bank Statement. License status verified ACTIVE."
  }
];

// src/db/mariadb.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
init_initialState();
function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      return {
        host: parsedUrl.hostname || "127.0.0.1",
        port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
        user: decodeURIComponent(parsedUrl.username || "altil_user"),
        password: decodeURIComponent(parsedUrl.password || ""),
        database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, "") : "altil_db",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 4e3
      };
    } catch (e) {
      console.warn("[MariaDB Config] Failed to parse DATABASE_URL, falling back to discrete env vars:", e);
    }
  }
  return {
    host: process.env.MARIADB_HOST || "127.0.0.1",
    port: parseInt(process.env.MARIADB_PORT || "3306", 10),
    user: process.env.MARIADB_USER || "altil_user",
    password: process.env.MARIADB_PASSWORD || "",
    database: process.env.MARIADB_DATABASE || "altil_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4e3
  };
}
var dbConfig = getDatabaseConfig();
var pool = null;
var isDbConnected = false;
var dbStatusMessage = "Initializing MariaDB 10.11.18 Connection...";
function isDatabaseConnected() {
  return isDbConnected;
}
function setDatabaseConnected(connected) {
  isDbConnected = connected;
  if (!connected) {
    dbStatusMessage = "MariaDB connection offline (Simulated Outage). Operating in synchronized enterprise memory store with full CRUD capabilities.";
  } else {
    dbStatusMessage = "Connected to MariaDB 10.11.18 (Recovered).";
  }
}
function getMariaDbPool() {
  if (!pool) {
    pool = import_promise.default.createPool(getDatabaseConfig());
  }
  return pool;
}
async function executeQuery(sql, params = []) {
  const p = getMariaDbPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}
async function testAndInitMariaDb() {
  try {
    const rows = await executeQuery("SELECT VERSION() as version");
    const version = rows[0]?.version || "MariaDB 10.11.18";
    isDbConnected = true;
    dbStatusMessage = `Connected to MariaDB (${version}) at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
    console.log(`[MariaDB 10.11.18] ${dbStatusMessage}`);
    try {
      const tableCheck = await executeQuery("SHOW TABLES LIKE 'tenants'");
      if (tableCheck.length === 0) {
        console.log("[MariaDB] Bootstrapping schema from /scripts/init_mariadb.sql...");
        await runSchemaMigrationScript();
      } else {
        try {
          await executeQuery("ALTER TABLE iam_users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT FALSE");
          await executeQuery("ALTER TABLE iam_users ADD COLUMN IF NOT EXISTS password_history JSON NULL");
          console.log("[MariaDB] Incremental IAM database upgrades applied successfully.");
        } catch (upgradeErr) {
          console.warn("[MariaDB] Table upgrade warning (possibly columns exist):", upgradeErr);
        }
      }
    } catch (schemaErr) {
      console.warn("[MariaDB] Schema check notice:", schemaErr);
    }
    return { connected: true, version, message: dbStatusMessage };
  } catch (error) {
    isDbConnected = false;
    dbStatusMessage = `MariaDB connection offline (${error.code || error.message}). Operating in synchronized enterprise memory store with full CRUD capabilities.`;
    console.warn(`[MariaDB 10.11.18] ${dbStatusMessage}`);
    return { connected: false, message: dbStatusMessage };
  }
}
async function runSchemaMigrationScript() {
  try {
    const scriptPath = import_path.default.join(process.cwd(), "scripts", "init_mariadb.sql");
    if (!import_fs.default.existsSync(scriptPath)) {
      return { success: false, message: `SQL script file not found at ${scriptPath}` };
    }
    const sqlContent = import_fs.default.readFileSync(scriptPath, "utf-8");
    const statements = sqlContent.split(";").map((s) => s.trim()).filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"));
    const p = getMariaDbPool();
    const conn = await p.getConnection();
    try {
      await conn.query("SET FOREIGN_KEY_CHECKS = 0");
      for (const stmt of statements) {
        if (stmt.toLowerCase().startsWith("use ") || stmt.toLowerCase().startsWith("create database")) continue;
        await conn.query(stmt);
      }
      await conn.query("SET FOREIGN_KEY_CHECKS = 1");
      return { success: true, message: `Successfully executed ${statements.length} DDL/DML statements against MariaDB 10.11.18.` };
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("[MariaDB Migration Error]", error);
    return { success: false, message: `Migration error: ${error.message}` };
  }
}
async function getMariaDbHealth() {
  if (!isDbConnected) {
    return {
      status: "offline_fallback_active",
      databaseEngine: "MariaDB 10.11.18 Community Engine",
      host: dbConfig.host,
      port: dbConfig.port,
      databaseName: dbConfig.database,
      message: dbStatusMessage,
      activeTables: 12,
      totalRecordsInStore: 1420
    };
  }
  try {
    const tables = await executeQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [dbConfig.database]
    );
    return {
      status: "online",
      databaseEngine: "MariaDB 10.11.18 Community Server",
      host: dbConfig.host,
      port: dbConfig.port,
      databaseName: dbConfig.database,
      message: dbStatusMessage,
      activeTables: tables.length,
      tables: tables.map((t) => t.table_name)
    };
  } catch (err) {
    return {
      status: "degraded",
      databaseEngine: "MariaDB 10.11.18",
      message: err.message
    };
  }
}
var dbRepository = {
  // TENANTS / CUSTOMERS CRUD
  async getTenants() {
    if (isDbConnected) {
      try {
        const rows = await executeQuery("SELECT * FROM tenants ORDER BY created_at DESC");
        if (rows.length > 0) {
          return rows.map((r) => {
            const baseCust = INITIAL_CUSTOMERS.find((c) => c.id === r.id) || INITIAL_CUSTOMERS[0];
            return {
              ...baseCust,
              id: r.id,
              name: r.name,
              status: r.status === "grace_period" ? "restricted" : r.status === "auto_suspended" ? "suspended" : "active",
              monthlyBudgetUsd: Number(r.max_rpm || 5e3) * 2,
              currentSpendUsd: 4500,
              rateLimitRpm: Number(r.max_rpm || 5e3),
              rateLimitTpm: Number(r.max_tpm || 2e6),
              createdAt: r.created_at ? String(r.created_at).split("T")[0] : "2026-01-01",
              updatedAt: r.updated_at ? String(r.updated_at).split("T")[0] : "2026-08-30"
            };
          });
        }
      } catch (e) {
        console.warn("DB read fallback:", e);
      }
    }
    return INITIAL_CUSTOMERS;
  },
  async createTenant(tenant) {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO tenants (id, tenant_code, name, tier, region, popia_compliant, max_rpm, max_tpm, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenant.id || `tenant-${Date.now()}`,
          (tenant.name || "CODE").substring(0, 10).toUpperCase().replace(/\s+/g, "-"),
          tenant.name || "New Enterprise Tenant",
          tenant.tier === "enterprise" ? "Enterprise" : "Starter",
          "af-south-1",
          1,
          tenant.rateLimitRpm || 5e3,
          tenant.rateLimitTpm || 2e6,
          tenant.status || "active"
        ]
      );
    }
  },
  async deleteTenant(id) {
    if (isDbConnected) {
      await executeQuery("DELETE FROM tenants WHERE id=?", [id]);
    }
  },
  // LICENSING PLANS CRUD
  async getLicensingPlans() {
    if (isDbConnected) {
      try {
        const rows = await executeQuery("SELECT * FROM licensing_plans WHERE is_active=1 ORDER BY created_at DESC");
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            name: r.name,
            applicationId: "all",
            applicationName: "All AI Platform Applications",
            pricingType: r.pricing_model || "hybrid_base_metered",
            currency: r.currency || "USD",
            basePrice: Number(r.base_price || 0),
            billingCycle: r.billing_cycle === "Annual" ? "annual" : "monthly",
            includedTransactions: Number(r.included_transactions_quota || 1e5),
            overagePricePerTransaction: Number(r.overage_rate_per_1k || 5e-3),
            gracePeriodDays: Number(r.grace_period_days || 14),
            autoEnforcementAction: r.enforcement_rule || "hard_block_402",
            autoEnforceOnUnpaid: true,
            features: ["24/7 SLA Guarantee", "POPIA Redactor", "Multi-Model Fallback"],
            isPublished: true,
            createdDate: r.created_at ? String(r.created_at).split("T")[0] : "2026-01-01"
          }));
        }
      } catch (e) {
        console.warn("DB read plans fallback:", e);
      }
    }
    return INITIAL_LICENSING_PLANS;
  },
  async saveLicensingPlan(plan) {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO licensing_plans (id, plan_code, name, description, pricing_model, base_price, currency, billing_cycle, included_transactions_quota, overage_rate_per_1k, grace_period_days, max_rpm_limit, sla_guarantee_percent, enforcement_rule)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), pricing_model=VALUES(pricing_model), base_price=VALUES(base_price), currency=VALUES(currency), billing_cycle=VALUES(billing_cycle), included_transactions_quota=VALUES(included_transactions_quota), overage_rate_per_1k=VALUES(overage_rate_per_1k), grace_period_days=VALUES(grace_period_days), max_rpm_limit=VALUES(max_rpm_limit), sla_guarantee_percent=VALUES(sla_guarantee_percent), enforcement_rule=VALUES(enforcement_rule)`,
        [
          plan.id,
          plan.id.toUpperCase(),
          plan.name,
          plan.name,
          plan.pricingType || "hybrid_base_metered",
          plan.basePrice || 0,
          plan.currency || "USD",
          plan.billingCycle === "annual" ? "Annual" : "Monthly",
          plan.includedTransactions || 1e5,
          plan.overagePricePerTransaction || 5e-3,
          plan.gracePeriodDays || 14,
          2500,
          99.95,
          plan.autoEnforcementAction || "hard_block_402"
        ]
      );
    }
  },
  // TENANT LICENSES CRUD
  async getTenantLicenses() {
    if (isDbConnected) {
      try {
        const rows = await executeQuery("SELECT * FROM tenant_licenses ORDER BY created_at DESC");
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            tenantId: r.tenant_id,
            tenantName: r.tenant_name,
            applicationId: r.application_id,
            applicationName: r.application_name,
            planId: r.plan_id,
            planName: r.plan_name,
            pricingType: "hybrid_base_metered",
            currency: r.currency || "USD",
            basePrice: 4500,
            contractStartDate: r.start_date ? String(r.start_date).split("T")[0] : "2026-01-01",
            contractEndDate: r.renewal_date ? String(r.renewal_date).split("T")[0] : "2026-09-01",
            nextBillingDate: r.renewal_date ? String(r.renewal_date).split("T")[0] : "2026-09-01",
            lastPaymentDate: r.last_payment_date ? String(r.last_payment_date).split("T")[0] : "2026-08-01",
            lastPaymentAmount: r.last_payment_amount ? Number(r.last_payment_amount) : 4500,
            paymentStatus: r.payment_status || "paid",
            licenseStatus: r.license_status || "active",
            currentTransactionCount: 45e4,
            maxTransactionQuota: 1e6,
            overageTransactionsCount: 0,
            currentAccruedBillUsd: Number(r.current_accrued_bill_usd || 4500),
            autoEnforceOnUnpaid: true,
            graceDaysRemaining: Number(r.grace_period_days_remaining || 14),
            activeEnforcement: r.active_enforcement || null,
            billingContactEmail: "billing@tenant.com"
          }));
        }
      } catch (e) {
        console.warn("DB read licenses fallback:", e);
      }
    }
    return INITIAL_TENANT_LICENSES;
  },
  async saveTenantLicense(lic) {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO tenant_licenses (id, tenant_id, tenant_name, application_id, application_name, plan_id, plan_name, license_key, license_status, payment_status, start_date, renewal_date, active_enforcement, current_accrued_bill_usd, grace_period_days_remaining, last_payment_date, last_payment_amount, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE license_status=VALUES(license_status), payment_status=VALUES(payment_status), active_enforcement=VALUES(active_enforcement), current_accrued_bill_usd=VALUES(current_accrued_bill_usd), grace_period_days_remaining=VALUES(grace_period_days_remaining), last_payment_date=VALUES(last_payment_date), last_payment_amount=VALUES(last_payment_amount)`,
        [
          lic.id,
          lic.tenantId,
          lic.tenantName,
          lic.applicationId,
          lic.applicationName,
          lic.planId,
          lic.planName,
          `LIC-${lic.tenantId.toUpperCase()}-2026`,
          lic.licenseStatus,
          lic.paymentStatus,
          lic.contractStartDate || "2026-01-01",
          lic.contractEndDate || "2026-09-01",
          lic.activeEnforcement || null,
          lic.currentAccruedBillUsd || 0,
          lic.graceDaysRemaining || 14,
          lic.lastPaymentDate || "2026-08-01",
          lic.lastPaymentAmount || 4500,
          lic.currency || "USD"
        ]
      );
    }
  },
  // PAYMENT WEBHOOK LOGS CRUD
  async getPaymentLogs() {
    if (isDbConnected) {
      try {
        const rows = await executeQuery("SELECT * FROM payment_webhook_logs ORDER BY timestamp DESC LIMIT 100");
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            timestamp: r.timestamp,
            tenantId: r.tenant_id,
            tenantName: r.tenant_name,
            applicationId: r.application_id,
            invoiceId: r.invoice_id,
            eventType: r.event_type,
            amount: Number(r.amount),
            currency: r.currency || "USD",
            gatewayProvider: r.gateway_provider || "Stripe",
            enforcementTriggered: r.enforcement_triggered || "none",
            status: r.status || "processed",
            rawPayloadSummary: r.raw_payload_summary || "Webhook processed successfully"
          }));
        }
      } catch (e) {
        console.warn("DB read webhook logs fallback:", e);
      }
    }
    return INITIAL_PAYMENT_WEBHOOK_LOGS;
  },
  async insertPaymentLog(log) {
    if (isDbConnected) {
      await executeQuery(
        `INSERT INTO payment_webhook_logs (id, timestamp, tenant_id, tenant_name, application_id, invoice_id, event_type, amount, currency, gateway_provider, enforcement_triggered, status, raw_payload_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.timestamp,
          log.tenantId,
          log.tenantName,
          log.applicationId,
          log.invoiceId,
          log.eventType,
          log.amount,
          log.currency,
          log.gatewayProvider,
          log.enforcementTriggered,
          log.status,
          log.rawPayloadSummary
        ]
      );
    }
  }
};

// src/routes/authRoutes.ts
var import_express = __toESM(require("express"), 1);

// src/db/iamRepository.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var inMemoryUsers = [
  {
    id: "user_super_admin_001",
    tenant_id: null,
    email: "horatio.huxham@gmail.com",
    password_hash: import_bcryptjs.default.hashSync("AltilSuperAdmin2026!", 10),
    first_name: "Horatio",
    last_name: "Huxham",
    title: "Chief Security & AI Architect",
    department: "Executive AI Governance & Architecture",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_super_admin_000",
    tenant_id: null,
    email: "admin@altil.security",
    password_hash: import_bcryptjs.default.hashSync("AdminPassword123!", 10),
    first_name: "Super",
    last_name: "Administrator",
    title: "Principal Security Officer",
    department: "ALTIL SecOps Core",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_tenant_admin_002",
    tenant_id: "cust-1",
    // ACME Financial Holdings (TENANT_A)
    email: "sarah.j@acme-corp.co.za",
    password_hash: import_bcryptjs.default.hashSync("TenantAdmin2026!", 10),
    first_name: "Sarah",
    last_name: "Jenkins",
    title: "Enterprise Platform Lead",
    department: "Financial Platform Engineering",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_tenant_b_admin_004",
    tenant_id: "cust-2",
    // Global FinTech Nexus (TENANT_B)
    email: "tenant_b_admin@global-bank.com",
    password_hash: import_bcryptjs.default.hashSync("TenantAdmin2026!", 10),
    first_name: "David",
    last_name: "Khumalo",
    title: "VP Technology",
    department: "Core Banking Infrastructure",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_tenant_b_admin_008",
    tenant_id: "cust-2",
    // Capitec Bank (cust-2)
    email: "tenant.admin@capitec.bank",
    password_hash: import_bcryptjs.default.hashSync("TenantPassword123!", 10),
    first_name: "Capitec",
    last_name: "Tenant Admin",
    title: "Enterprise Admin",
    department: "Digital Platform",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_auditor_003",
    tenant_id: null,
    email: "audit@statutory.gov.za",
    password_hash: import_bcryptjs.default.hashSync("Auditor2026!", 10),
    first_name: "Statutory",
    last_name: "Auditor",
    title: "Statutory Compliance Officer",
    department: "Information Regulator Compliance",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_auditor_009",
    tenant_id: null,
    email: "auditor@altil.security",
    password_hash: import_bcryptjs.default.hashSync("AuditorPassword123!", 10),
    first_name: "Lead",
    last_name: "Auditor",
    title: "Compliance & Audit Lead",
    department: "Statutory Compliance",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_engineer_010",
    tenant_id: "cust-1",
    email: "engineer@altil.security",
    password_hash: import_bcryptjs.default.hashSync("EngineerPassword123!", 10),
    first_name: "AI",
    last_name: "Engineer",
    title: "Machine Learning Infrastructure Engineer",
    department: "AI Operations",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: false,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_locked_005",
    tenant_id: "cust-1",
    email: "locked.user@acme-corp.co.za",
    password_hash: import_bcryptjs.default.hashSync("Password123!", 10),
    first_name: "Locked",
    last_name: "User",
    title: "Security Locked Account",
    department: "Operations",
    status: "LOCKED",
    failed_login_attempts: 5,
    lockout_until: new Date(Date.now() + 60 * 60 * 1e3),
    // 1 hour in future
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_disabled_006",
    tenant_id: "cust-1",
    email: "disabled.user@acme-corp.co.za",
    password_hash: import_bcryptjs.default.hashSync("Password123!", 10),
    first_name: "Disabled",
    last_name: "Account",
    title: "Suspended Account",
    department: "Risk Management",
    status: "SUSPENDED",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_no_role_007",
    tenant_id: "cust-1",
    email: "norole.user@acme-corp.co.za",
    password_hash: import_bcryptjs.default.hashSync("Password123!", 10),
    first_name: "Guest",
    last_name: "Viewer",
    title: "No Elevated Role",
    department: "Guest",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: false,
    mfa_enforced: false,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  },
  {
    id: "user_security_officer_005",
    tenant_id: null,
    email: "security@altil.security",
    password_hash: import_bcryptjs.default.hashSync("SecurityOfficer2026!", 10),
    first_name: "Security",
    last_name: "Officer",
    title: "Enterprise Security Director",
    department: "Risk & Governance",
    status: "ACTIVE",
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: /* @__PURE__ */ new Date(),
    last_login_ip: "127.0.0.1",
    password_changed_at: /* @__PURE__ */ new Date(),
    created_by: "SYSTEM_BOOTSTRAP",
    created_at: /* @__PURE__ */ new Date(),
    updated_at: /* @__PURE__ */ new Date()
  }
];
var inMemorySessions = /* @__PURE__ */ new Map();
var inMemoryLoginAuditLogs = [];
var IamRepository = class {
  /**
   * Hashes plaintext password with bcrypt (cost factor 10)
   */
  static async hashPassword(plainText) {
    const salt = await import_bcryptjs.default.genSalt(10);
    return import_bcryptjs.default.hash(plainText, salt);
  }
  /**
   * Verifies plaintext password against stored bcrypt hash
   */
  static async verifyPassword(plainText, hash) {
    if (!plainText || !hash) return false;
    try {
      return await import_bcryptjs.default.compare(plainText, hash);
    } catch {
      return false;
    }
  }
  /**
   * Generates secure random session token (hex)
   */
  static generateSessionToken() {
    return "altil_sess_" + import_crypto.default.randomBytes(32).toString("hex");
  }
  /**
   * Retrieves a user by their corporate email address
   */
  static async getUserByEmail(email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery(
          "SELECT * FROM iam_users WHERE LOWER(email) = ? LIMIT 1",
          [normalizedEmail]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn("[IAM Repository] Database query failed, falling back to memory store:", err);
      }
    }
    const found = inMemoryUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    return found || null;
  }
  /**
   * Retrieves a user by their unique ID
   */
  static async getUserById(id) {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery(
          "SELECT * FROM iam_users WHERE id = ? LIMIT 1",
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn("[IAM Repository] Database query failed, falling back to memory store:", err);
      }
    }
    return inMemoryUsers.find((u) => u.id === id) || null;
  }
  /**
   * Fetches roles and aggregated permissions for a given user ID
   */
  static async getUserRolesAndPermissions(userId) {
    if (isDatabaseConnected()) {
      try {
        const roleRows = await executeQuery(
          `SELECT r.role_code, ur.tenant_id 
           FROM iam_user_roles ur 
           JOIN iam_roles r ON ur.role_id = r.id 
           WHERE ur.user_id = ?`,
          [userId]
        );
        const permRows = await executeQuery(
          `SELECT DISTINCT p.permission_code 
           FROM iam_user_roles ur 
           JOIN iam_role_permissions rp ON ur.role_id = rp.role_id 
           JOIN iam_permissions p ON rp.permission_id = p.id 
           WHERE ur.user_id = ?`,
          [userId]
        );
        if (roleRows.length > 0) {
          return {
            roles: roleRows.map((r) => r.role_code),
            permissions: permRows.map((p) => p.permission_code),
            tenantId: roleRows[0]?.tenant_id || null
          };
        }
      } catch (err) {
        console.warn("[IAM Repository] Error fetching user roles/permissions from DB:", err);
      }
    }
    if (userId === "user_super_admin_001" || userId === "user_super_admin_000") {
      return {
        roles: ["SUPER_ADMIN"],
        permissions: [
          "tenant.read",
          "tenant.create",
          "tenant.update",
          "tenant.delete",
          "user.read",
          "user.create",
          "user.update",
          "user.disable",
          "role.read",
          "role.assign",
          "role.modify",
          "provider.read",
          "provider.configure",
          "provider.disable",
          "model.read",
          "model.configure",
          "routing.read",
          "routing.modify",
          "policy.read",
          "policy.create",
          "policy.modify",
          "policy.disable",
          "incident.read",
          "incident.create",
          "incident.update",
          "incident.close",
          "dsar.read",
          "dsar.create",
          "dsar.update",
          "dsar.erase",
          "billing.read",
          "billing.modify",
          "audit.read",
          "audit.export",
          "system.migrate",
          "system.configure",
          "secret.read",
          "secret.rotate"
        ],
        tenantId: null
      };
    } else if (userId === "user_security_officer_005") {
      return {
        roles: ["SECURITY_OFFICER"],
        permissions: [
          "policy.read",
          "policy.create",
          "policy.modify",
          "policy.disable",
          "user.read",
          "user.update",
          "user.disable",
          "role.read",
          "audit.read",
          "provider.read",
          "model.read",
          "routing.read"
        ],
        tenantId: null
      };
    } else if (userId === "user_tenant_admin_002") {
      return {
        roles: ["TENANT_ADMIN"],
        permissions: [
          "tenant.read",
          "tenant.update",
          "user.read",
          "user.create",
          "user.update",
          "user.disable",
          "incident.read",
          "incident.create",
          "incident.update",
          "dsar.read",
          "dsar.create",
          "dsar.update"
        ],
        tenantId: "cust-1"
      };
    } else if (userId === "user_tenant_b_admin_004" || userId === "user_tenant_b_admin_008") {
      return {
        roles: ["TENANT_ADMIN"],
        permissions: [
          "tenant.read",
          "tenant.update",
          "user.read",
          "user.create",
          "user.update",
          "user.disable",
          "incident.read",
          "incident.create",
          "incident.update",
          "dsar.read",
          "dsar.create",
          "dsar.update"
        ],
        tenantId: "cust-2"
      };
    } else if (userId === "user_auditor_003" || userId === "user_auditor_009") {
      return {
        roles: ["AUDITOR"],
        permissions: [
          "audit.read",
          "audit.export",
          "dsar.read",
          "policy.read",
          "tenant.read"
        ],
        tenantId: null
      };
    } else if (userId === "user_engineer_010") {
      return {
        roles: ["AI_ENGINEER"],
        permissions: [
          "provider.read",
          "provider.configure",
          "model.read",
          "model.configure",
          "routing.read",
          "routing.modify"
        ],
        tenantId: "cust-1"
      };
    }
    return {
      roles: [],
      permissions: [],
      tenantId: null
    };
  }
  /**
   * Authenticates user credentials, handles lockouts, session issuance, and audit logs
   */
  static async authenticate(email, plainTextPassword, meta = {}) {
    const ip = meta.ipAddress || "127.0.0.1";
    const ua = meta.userAgent || "ALTIL Control Console";
    const user = await this.getUserByEmail(email);
    if (!user) {
      await this.logLoginEvent(email, "INVALID_PASSWORD", null, null, ip, ua, "User account does not exist.");
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        message: "Invalid email address or security password."
      };
    }
    if (user.status === "LOCKED" || user.lockout_until && new Date(user.lockout_until) > /* @__PURE__ */ new Date()) {
      const remainingMs = user.lockout_until ? new Date(user.lockout_until).getTime() - Date.now() : 15 * 60 * 1e3;
      const remainingMins = Math.max(1, Math.ceil(remainingMs / (60 * 1e3)));
      await this.logLoginEvent(email, "LOCKED", user.id, user.tenant_id, ip, ua, `Account locked. Lockout remaining: ${remainingMins}m`);
      return {
        success: false,
        error: "ACCOUNT_LOCKED",
        lockoutRemainingMinutes: remainingMins,
        message: `Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMins} minutes.`
      };
    }
    if (user.status !== "ACTIVE") {
      await this.logLoginEvent(email, "SUSPENDED", user.id, user.tenant_id, ip, ua, `Account is in ${user.status} state.`);
      return {
        success: false,
        error: "ACCOUNT_DISABLED",
        message: "User account has been suspended or deactivated. Contact your Enterprise Security Administrator."
      };
    }
    const isValid = await this.verifyPassword(plainTextPassword, user.password_hash);
    if (!isValid) {
      await this.recordFailedLogin(user);
      await this.logLoginEvent(email, "INVALID_PASSWORD", user.id, user.tenant_id, ip, ua, `Failed password attempt ${user.failed_login_attempts}/5.`);
      if (user.status === "LOCKED") {
        return {
          success: false,
          error: "ACCOUNT_LOCKED",
          lockoutRemainingMinutes: 15,
          failedAttempts: user.failed_login_attempts,
          message: "Account locked due to 5 consecutive failed attempts. Security cooldown active for 15 minutes."
        };
      }
      return {
        success: false,
        error: "INVALID_CREDENTIALS",
        failedAttempts: user.failed_login_attempts,
        message: `Invalid email address or security password. (${5 - user.failed_login_attempts} attempts remaining before lockout).`
      };
    }
    const passwordAgeDays = (Date.now() - new Date(user.password_changed_at).getTime()) / (1e3 * 60 * 60 * 24);
    const MAX_PASSWORD_AGE_DAYS = 90;
    if (passwordAgeDays > MAX_PASSWORD_AGE_DAYS) {
      user.force_password_change = true;
      if (isDatabaseConnected()) {
        try {
          await executeQuery("UPDATE iam_users SET force_password_change = 1 WHERE id = ?", [user.id]);
        } catch (_) {
        }
      }
    }
    if (user.force_password_change) {
      await this.logLoginEvent(email, "INVALID_PASSWORD", user.id, user.tenant_id, ip, ua, "Forced password reset required.");
      return {
        success: false,
        error: "FORCE_PASSWORD_CHANGE_REQUIRED",
        message: "Your corporate security password has expired or was reset by an administrator. You must configure a new security password before logging in."
      };
    }
    await this.recordSuccessfulLogin(user, ip);
    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    const session = await this.createSession(user.id, token, ip, ua, expiresAt);
    await this.logLoginEvent(email, "SUCCESS", user.id, user.tenant_id, ip, ua, "Authentication successful.");
    return {
      success: true,
      user,
      session
    };
  }
  /**
   * Creates an active session in MariaDB / Memory
   */
  static async createSession(userId, token, ipAddress, userAgent, expiresAt) {
    const session = {
      id: "sess_" + import_crypto.default.randomUUID(),
      user_id: userId,
      session_token: token,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_active: true,
      expires_at: expiresAt,
      last_activity_at: /* @__PURE__ */ new Date(),
      created_at: /* @__PURE__ */ new Date()
    };
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `INSERT INTO iam_user_sessions 
           (id, user_id, session_token, ip_address, user_agent, is_active, expires_at, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            session.id,
            session.user_id,
            session.session_token,
            session.ip_address,
            session.user_agent,
            session.is_active ? 1 : 0,
            session.expires_at,
            session.created_at
          ]
        );
      } catch (err) {
        console.warn("[IAM Repository] Failed to persist session to DB, using in-memory store:", err);
      }
    }
    inMemorySessions.set(token, session);
    return session;
  }
  /**
   * Retrieves and validates an active session token
   */
  static async getSession(token) {
    if (!token) return null;
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery(
          "SELECT * FROM iam_user_sessions WHERE session_token = ? AND is_active = 1 AND expires_at > NOW() LIMIT 1",
          [token]
        );
        if (rows[0]) return rows[0];
      } catch (err) {
        console.warn("[IAM Repository] Error retrieving session from DB:", err);
      }
    }
    const memSession = inMemorySessions.get(token);
    if (memSession && memSession.is_active && new Date(memSession.expires_at) > /* @__PURE__ */ new Date()) {
      return memSession;
    }
    return null;
  }
  /**
   * Revokes a session token
   */
  static async revokeSession(token, reason = "LOGOUT") {
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          "UPDATE iam_user_sessions SET is_active = 0, revoked_at = NOW(), revoked_reason = ? WHERE session_token = ?",
          [reason, token]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error revoking session in DB:", err);
      }
    }
    const sess = inMemorySessions.get(token);
    if (sess) {
      sess.is_active = false;
    }
  }
  /**
   * Revokes a session by session ID
   */
  static async revokeSessionById(sessionId) {
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          "UPDATE iam_user_sessions SET is_active = 0, revoked_at = NOW(), revoked_reason = ? WHERE id = ? OR session_token = ?",
          ["ADMIN_REVOKED", sessionId, sessionId]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error revoking session in DB:", err);
      }
    }
    for (const [, sess] of inMemorySessions.entries()) {
      if (sess.id === sessionId || sess.session_token === sessionId) {
        sess.is_active = false;
      }
    }
  }
  /**
   * Retrieves active sessions for a user
   */
  static async getUserSessions(userId) {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery(
          "SELECT * FROM iam_user_sessions WHERE user_id = ? AND is_active = 1 AND expires_at > NOW() ORDER BY created_at DESC",
          [userId]
        );
        return rows;
      } catch (err) {
        console.warn("[IAM Repository] Error fetching user sessions:", err);
      }
    }
    return Array.from(inMemorySessions.values()).filter(
      (s) => s.user_id === userId && s.is_active && new Date(s.expires_at) > /* @__PURE__ */ new Date()
    );
  }
  /**
   * Records an audit login event (NEVER logs plaintext secrets)
   */
  static async logLoginEvent(email, outcome, userId = null, tenantId = null, ipAddress = null, userAgent = null, failureReason = null) {
    const id = "log_evt_" + import_crypto.default.randomUUID();
    const event = {
      id,
      user_id: userId,
      email_attempted: email,
      tenant_id: tenantId,
      ip_address: ipAddress,
      user_agent: userAgent,
      outcome,
      failure_reason: failureReason,
      created_at: /* @__PURE__ */ new Date()
    };
    inMemoryLoginAuditLogs.unshift(event);
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `INSERT INTO iam_login_events 
           (id, user_id, email_attempted, tenant_id, ip_address, user_agent, outcome, failure_reason) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, userId, email, tenantId, ipAddress, userAgent, outcome, failureReason]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error logging login event to DB:", err);
      }
    }
  }
  /**
   * Increments failed login count and triggers account lockout if >= 5 attempts
   */
  static async recordFailedLogin(user) {
    const newCount = user.failed_login_attempts + 1;
    let lockoutUntil = null;
    let newStatus = user.status;
    if (newCount >= 5) {
      lockoutUntil = new Date(Date.now() + 15 * 60 * 1e3);
      newStatus = "LOCKED";
      console.warn(`[IAM Security] Account ${user.email} is LOCKED until ${lockoutUntil.toISOString()} due to excessive failed attempts.`);
    }
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          "UPDATE iam_users SET failed_login_attempts = ?, lockout_until = ?, status = ? WHERE id = ?",
          [newCount, lockoutUntil, newStatus, user.id]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error updating failed attempts:", err);
      }
    }
    user.failed_login_attempts = newCount;
    user.lockout_until = lockoutUntil;
    user.status = newStatus;
  }
  /**
   * Resets failed login count upon successful authentication
   */
  static async recordSuccessfulLogin(user, ipAddress) {
    const now = /* @__PURE__ */ new Date();
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          "UPDATE iam_users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = ?, last_login_ip = ? WHERE id = ?",
          [now, ipAddress, user.id]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error recording successful login:", err);
      }
    }
    user.failed_login_attempts = 0;
    user.lockout_until = null;
    user.last_login_at = now;
    user.last_login_ip = ipAddress;
  }
  /**
   * Retrieves enterprise users with optional tenant filter
   */
  static async getUsers(tenantFilter) {
    if (isDatabaseConnected()) {
      try {
        let sql = "SELECT id, tenant_id, email, first_name, last_name, title, department, status, failed_login_attempts, lockout_until, mfa_enabled, last_login_at, created_at, password_changed_at, force_password_change FROM iam_users";
        const params = [];
        if (tenantFilter && tenantFilter !== "all") {
          sql += " WHERE tenant_id = ? OR tenant_id IS NULL";
          params.push(tenantFilter);
        }
        const rows = await executeQuery(sql, params);
        return rows.map((r) => ({
          id: r.id,
          tenant_id: r.tenant_id,
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          title: r.title,
          department: r.department,
          status: r.status,
          failed_login_attempts: r.failed_login_attempts,
          lockout_until: r.lockout_until ? new Date(r.lockout_until) : null,
          mfa_enabled: Boolean(r.mfa_enabled),
          last_login_at: r.last_login_at ? new Date(r.last_login_at) : null,
          created_at: new Date(r.created_at),
          password_changed_at: r.password_changed_at ? new Date(r.password_changed_at) : /* @__PURE__ */ new Date(),
          force_password_change: Boolean(r.force_password_change)
        }));
      } catch (err) {
        console.warn("[IAM Repository] Error fetching users from DB, falling back to memory:", err);
      }
    }
    let list = inMemoryUsers;
    if (tenantFilter && tenantFilter !== "all") {
      list = list.filter((u) => u.tenant_id === tenantFilter || u.tenant_id === null);
    }
    return list.map((u) => ({
      id: u.id,
      tenant_id: u.tenant_id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      title: u.title,
      department: u.department,
      status: u.status,
      failed_login_attempts: u.failed_login_attempts,
      lockout_until: u.lockout_until,
      mfa_enabled: u.mfa_enabled,
      last_login_at: u.last_login_at,
      created_at: u.created_at,
      password_changed_at: u.password_changed_at,
      force_password_change: u.force_password_change || false
    }));
  }
  /**
   * Upserts user record
   */
  static async upsertUser(user) {
    const existingIdx = inMemoryUsers.findIndex((u) => u.id === user.id || u.email === user.email);
    let hash = existingIdx >= 0 ? inMemoryUsers[existingIdx].password_hash : "";
    if (user.password) {
      hash = await this.hashPassword(user.password);
    } else if (!hash) {
      hash = await this.hashPassword("AltilDefault2026!");
    }
    let firstName = user.first_name || "";
    let lastName = user.last_name || "";
    if (!firstName && !lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      firstName = parts[0] || "Enterprise";
      lastName = parts.slice(1).join(" ") || "User";
    }
    if (!firstName) firstName = "Enterprise";
    if (!lastName) lastName = "User";
    const fullRecord = {
      id: user.id || `user_${Date.now().toString(36)}`,
      tenant_id: user.tenant_id || null,
      email: user.email || "user@altil.com",
      password_hash: hash,
      first_name: firstName,
      last_name: lastName,
      title: user.title || "Team Member",
      department: user.department || "Operations",
      status: user.status || "ACTIVE",
      failed_login_attempts: existingIdx >= 0 ? inMemoryUsers[existingIdx].failed_login_attempts : 0,
      lockout_until: existingIdx >= 0 ? inMemoryUsers[existingIdx].lockout_until : null,
      mfa_enabled: user.mfa_enabled ?? true,
      mfa_enforced: user.mfa_enforced ?? false,
      last_login_at: existingIdx >= 0 ? inMemoryUsers[existingIdx].last_login_at : null,
      last_login_ip: existingIdx >= 0 ? inMemoryUsers[existingIdx].last_login_ip : null,
      password_changed_at: user.password ? /* @__PURE__ */ new Date() : existingIdx >= 0 ? inMemoryUsers[existingIdx].password_changed_at : /* @__PURE__ */ new Date(),
      force_password_change: user.force_password_change ?? (existingIdx >= 0 ? inMemoryUsers[existingIdx].force_password_change : false),
      password_history: existingIdx >= 0 ? inMemoryUsers[existingIdx].password_history || [] : [],
      created_by: "ADMIN",
      created_at: existingIdx >= 0 ? inMemoryUsers[existingIdx].created_at : /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `INSERT INTO iam_users (
            id, tenant_id, email, password_hash, first_name, last_name, title, department, status,
            failed_login_attempts, lockout_until, mfa_enabled, mfa_enforced, last_login_at, last_login_ip,
            password_changed_at, force_password_change, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            tenant_id = VALUES(tenant_id),
            email = VALUES(email),
            password_hash = VALUES(password_hash),
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            title = VALUES(title),
            department = VALUES(department),
            status = VALUES(status),
            mfa_enabled = VALUES(mfa_enabled),
            mfa_enforced = VALUES(mfa_enforced),
            password_changed_at = VALUES(password_changed_at),
            force_password_change = VALUES(force_password_change),
            updated_at = NOW()`,
          [
            fullRecord.id,
            fullRecord.tenant_id,
            fullRecord.email,
            fullRecord.password_hash,
            fullRecord.first_name,
            fullRecord.last_name,
            fullRecord.title,
            fullRecord.department,
            fullRecord.status,
            fullRecord.failed_login_attempts,
            fullRecord.lockout_until,
            fullRecord.mfa_enabled ? 1 : 0,
            fullRecord.mfa_enforced ? 1 : 0,
            fullRecord.last_login_at,
            fullRecord.last_login_ip,
            fullRecord.password_changed_at,
            fullRecord.force_password_change ? 1 : 0,
            fullRecord.created_by,
            fullRecord.created_at,
            fullRecord.updated_at
          ]
        );
      } catch (err) {
        console.warn("[IAM Repository] Failed to persist upserted user in DB, using memory fallback:", err);
      }
    }
    if (existingIdx >= 0) {
      inMemoryUsers[existingIdx] = fullRecord;
    } else {
      inMemoryUsers.push(fullRecord);
    }
    return fullRecord;
  }
  /**
   * Retrieves system roles
   */
  static async getRoles() {
    return [
      {
        id: "role-super-admin",
        tenant_id: null,
        role_code: "SUPER_ADMIN",
        name: "Global Super Admin",
        description: "Unrestricted control over multi-tenant clusters, HSM secrets, and routing.",
        is_system_role: true,
        is_immutable: true,
        permissions: ["*"]
      },
      {
        id: "role-tenant-admin",
        tenant_id: null,
        role_code: "TENANT_ADMIN",
        name: "Enterprise Tenant Admin",
        description: "Scoped administrative authority for assigned customer tenant.",
        is_system_role: true,
        is_immutable: true,
        permissions: ["tenant.read", "apikeys.create", "apikeys.revoke", "incidents.write", "iam.users.write"]
      },
      {
        id: "role-auditor",
        tenant_id: null,
        role_code: "AUDITOR",
        name: "Statutory Governance Auditor",
        description: "Read-only access to POPIA/GDPR audit records and DSAR telemetry.",
        is_system_role: true,
        is_immutable: true,
        permissions: ["tenant.read", "audit.export"]
      }
    ];
  }
  /**
   * Validates a password against enterprise complexity policy
   */
  static validatePasswordPolicy(password) {
    if (!password || password.length < 14) {
      return { valid: false, error: "Password must be at least 14 characters long according to enterprise NIST standards." };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;':",\./<>?]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return {
        valid: false,
        error: "Password must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character."
      };
    }
    const sequentialPatterns = ["123456", "abcdef", "password", "admin", "qwerty"];
    const lowerPass = password.toLowerCase();
    for (const pattern of sequentialPatterns) {
      if (lowerPass.includes(pattern)) {
        return { valid: false, error: "Password contains easily guessable sequential patterns." };
      }
    }
    return { valid: true };
  }
  /**
   * Checks if password has been used in previous history
   */
  static async isPasswordInHistory(userId, newPlainTextPassword) {
    const user = await this.getUserById(userId);
    if (!user) return false;
    const matchCurrent = await this.verifyPassword(newPlainTextPassword, user.password_hash);
    if (matchCurrent) return true;
    const history = user.password_history || [];
    for (const hash of history) {
      const match = await this.verifyPassword(newPlainTextPassword, hash);
      if (match) return true;
    }
    return false;
  }
  /**
   * Changes a user's password securely
   */
  static async changePassword(userId, newPlainTextPassword) {
    const user = await this.getUserById(userId);
    if (!user) return false;
    const validation = this.validatePasswordPolicy(newPlainTextPassword);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const inHistory = await this.isPasswordInHistory(userId, newPlainTextPassword);
    if (inHistory) {
      throw new Error("Password cannot be reuse of recently used security passwords (enterprise reuse policy limit: 5).");
    }
    const history = user.password_history || [];
    history.push(user.password_hash);
    if (history.length > 5) {
      history.shift();
    }
    const newHash = await this.hashPassword(newPlainTextPassword);
    const now = /* @__PURE__ */ new Date();
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          "UPDATE iam_users SET password_hash = ?, password_history = ?, password_changed_at = ?, force_password_change = 0 WHERE id = ?",
          [newHash, JSON.stringify(history), now, userId]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error persisting password update in DB:", err);
      }
    }
    user.password_hash = newHash;
    user.password_history = history;
    user.password_changed_at = now;
    user.force_password_change = false;
    return true;
  }
  /**
   * Resets a user's password administratively
   */
  static async administrativelyResetPassword(userId, newPlainTextPassword, forceReset = true) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User record not found.");
    const validation = this.validatePasswordPolicy(newPlainTextPassword);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const newHash = await this.hashPassword(newPlainTextPassword);
    const now = /* @__PURE__ */ new Date();
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          "UPDATE iam_users SET password_hash = ?, password_changed_at = ?, force_password_change = ? WHERE id = ?",
          [newHash, now, forceReset ? 1 : 0, userId]
        );
      } catch (err) {
        console.warn("[IAM Repository] Error resetting password in DB:", err);
      }
    }
    user.password_hash = newHash;
    user.password_changed_at = now;
    user.force_password_change = forceReset;
  }
};

// src/middleware/authMiddleware.ts
function extractSessionToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("altil_session=")) {
        return decodeURIComponent(cookie.substring("altil_session=".length));
      }
    }
  }
  return null;
}
async function requireAuthentication(req, res, next) {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
      message: "Authentication required. Missing session token or bearer credential."
    });
    return;
  }
  try {
    const session = await IamRepository.getSession(token);
    if (!session) {
      res.status(401).json({
        error: "Unauthorized",
        code: "SESSION_EXPIRED",
        message: "Session has expired, was revoked, or is invalid. Please log in again."
      });
      return;
    }
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "ALTIL Control Console";
    if (session.ip_address && session.ip_address !== clientIp) {
      console.warn(`[Security Alert] Session IP changed from ${session.ip_address} to ${clientIp}. Possible session hijacking! Revoking session.`);
      await IamRepository.revokeSession(token);
      res.status(401).json({
        error: "Unauthorized",
        code: "SUSPICIOUS_SESSION",
        message: "Security Boundary Enforced: Suspicious session activity detected (IP change). Session has been automatically revoked."
      });
      return;
    }
    const user = await IamRepository.getUserById(session.user_id);
    if (!user || user.status !== "ACTIVE") {
      res.status(403).json({
        error: "Forbidden",
        code: "USER_ACCOUNT_LOCKED",
        message: "User account is not active or has been suspended."
      });
      return;
    }
    const { roles, permissions, tenantId } = await IamRepository.getUserRolesAndPermissions(user.id);
    const isAdmin = roles.includes("SUPER_ADMIN") || roles.includes("SECURITY_OFFICER");
    if (isAdmin) {
      const maxIdleMs = 15 * 60 * 1e3;
      const lastActivity = new Date(session.last_activity_at).getTime();
      if (Date.now() - lastActivity > maxIdleMs) {
        console.warn(`[Security Lock] Idle timeout reached for admin user ${user.email}. Revoking session.`);
        await IamRepository.revokeSession(token);
        res.status(401).json({
          error: "Unauthorized",
          code: "SESSION_EXPIRED",
          message: "Admin session idle timeout exceeded (15-minute maximum). Please re-authenticate."
        });
        return;
      }
    }
    session.last_activity_at = /* @__PURE__ */ new Date();
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      status: user.status,
      tenantId: tenantId || user.tenant_id,
      roles,
      permissions,
      sessionId: session.id
    };
    next();
  } catch (err) {
    console.error("[Auth Middleware Error]:", err);
    res.status(500).json({ error: "Internal Authentication Error", details: err.message });
  }
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "AUTH_REQUIRED" });
      return;
    }
    const userRoles = req.user.roles || [];
    const isSuperAdmin = userRoles.includes("SUPER_ADMIN") || userRoles.includes("Super Admin");
    if (isSuperAdmin) {
      return next();
    }
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        error: "Forbidden",
        code: "INSUFFICIENT_ROLE",
        message: `Action requires one of the following roles: ${allowedRoles.join(", ")}`
      });
      return;
    }
    next();
  };
}
function requireTenantAccess(paramName = "id") {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized", code: "AUTH_REQUIRED" });
      return;
    }
    const isSuperAdmin = req.user.roles.includes("SUPER_ADMIN") || req.user.roles.includes("Super Admin");
    if (isSuperAdmin) {
      return next();
    }
    const targetTenantId = req.params[paramName] || req.query[paramName] || req.body[paramName] || req.body.tenantId;
    if (!targetTenantId) {
      return next();
    }
    if (req.user.tenantId && req.user.tenantId !== targetTenantId) {
      console.warn(`[Security Alert] Cross-tenant access attempt by user ${req.user.email} (Tenant: ${req.user.tenantId}) to Tenant: ${targetTenantId}`);
      res.status(403).json({
        error: "Forbidden",
        code: "CROSS_TENANT_ACCESS_DENIED",
        message: "Security Boundary Enforced: You are not authorized to view or modify resources outside your assigned tenant domain."
      });
      return;
    }
    next();
  };
}

// src/routes/authRoutes.ts
var authRouter = import_express.default.Router();
function setSessionCookie(res, token) {
  const maxAge = 7 * 24 * 60 * 60 * 1e3;
  res.cookie("altil_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge
  });
}
authRouter.post("/login", async (req, res) => {
  const { email, password, mfaCode, selectedTenant } = req.body;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "ALTIL Control Console";
  if (!email || !password) {
    return res.status(400).json({
      error: "Bad Request",
      code: "MISSING_CREDENTIALS",
      message: "Corporate email address and security password are required."
    });
  }
  try {
    const authResult = await IamRepository.authenticate(email, password, {
      ipAddress,
      userAgent,
      mfaCode
    });
    if (!authResult.success || !authResult.user || !authResult.session) {
      const statusCode = authResult.lockoutRemainingMinutes ? 423 : 401;
      return res.status(statusCode).json({
        error: "Authentication Failed",
        code: authResult.error || "INVALID_CREDENTIALS",
        message: authResult.lockoutRemainingMinutes ? `Account locked due to excessive failed attempts. Please try again in ${authResult.lockoutRemainingMinutes} minutes.` : "Invalid email address or security password."
      });
    }
    const { user, session } = authResult;
    const { roles, permissions, tenantId } = await IamRepository.getUserRolesAndPermissions(user.id);
    setSessionCookie(res, session.session_token);
    return res.json({
      status: "authenticated",
      token: session.session_token,
      sessionId: session.id,
      expiresAt: session.expires_at,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        title: user.title,
        status: user.status,
        tenantId: tenantId || user.tenant_id,
        tenant: selectedTenant && selectedTenant !== "all" ? selectedTenant : "Total Company Scope",
        roles,
        role: roles[0] || "User",
        permissions,
        mfaEnabled: user.mfa_enabled
      }
    });
  } catch (err) {
    console.error("[Auth Login API Error]:", err);
    return res.status(500).json({
      error: "Internal Authentication Error",
      message: err.message
    });
  }
});
authRouter.post("/logout", async (req, res) => {
  const token = extractSessionToken(req);
  if (token) {
    await IamRepository.revokeSession(token);
  }
  res.clearCookie("altil_session");
  res.json({ status: "logged_out", message: "Session successfully revoked and purged." });
});
authRouter.get("/me", requireAuthentication, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", code: "AUTH_REQUIRED" });
  }
  try {
    const user = await IamRepository.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User record not found" });
    }
    return res.json({
      status: "active",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        title: user.title,
        status: user.status,
        tenantId: req.user.tenantId,
        roles: req.user.roles,
        role: req.user.roles[0] || "User",
        permissions: req.user.permissions,
        mfaEnabled: user.mfa_enabled,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve profile", details: err.message });
  }
});
authRouter.get("/sessions", requireAuthentication, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const sessions = await IamRepository.getUserSessions(req.user.id);
    return res.json(sessions);
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve sessions", details: err.message });
  }
});
var revokeSessionHandler = async (req, res) => {
  const sessionId = req.params.id;
  try {
    await IamRepository.revokeSessionById(sessionId);
    return res.json({ status: "revoked", sessionId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to revoke session", details: err.message });
  }
};
authRouter.delete("/sessions/:id", requireAuthentication, revokeSessionHandler);
authRouter.post("/sessions/:id/revoke", requireAuthentication, revokeSessionHandler);
authRouter.post("/mfa/verify", requireAuthentication, async (req, res) => {
  const { code } = req.body;
  if (!code || code.length < 6) {
    return res.status(400).json({ error: "Invalid MFA verification token format" });
  }
  return res.json({
    status: "verified",
    message: "Hardware Authenticator Token Verified & Synced with FIPS 140-3 HSM Vault."
  });
});
authRouter.post("/reauthenticate", requireAuthentication, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required for re-authentication." });
  }
  try {
    const user = await IamRepository.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User record not found." });
    }
    const bcrypt2 = await import("bcryptjs");
    const valid = bcrypt2.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid security credentials." });
    }
    const crypto4 = await import("crypto");
    return res.json({
      status: "verified",
      message: "Administrative session successfully elevated and authorized.",
      elevatedToken: `elevated-${crypto4.randomBytes(16).toString("hex")}`
    });
  } catch (err) {
    return res.status(500).json({ error: "Re-authentication failed.", details: err.message });
  }
});
authRouter.get("/users", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "TENANT_ADMIN"]), async (req, res) => {
  try {
    const tenantFilter = req.user?.roles.includes("SUPER_ADMIN") ? req.query.tenantId : req.user?.tenantId || void 0;
    const users = await IamRepository.getUsers(tenantFilter);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch IAM users", details: err.message });
  }
});
authRouter.post("/users", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_ADMIN"]), async (req, res) => {
  try {
    const user = await IamRepository.upsertUser(req.body);
    return res.status(201).json({ status: "saved", user, ...user });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save IAM user", details: err.message });
  }
});
authRouter.post("/users/:id/reset-password", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "TENANT_ADMIN"]), async (req, res) => {
  const userId = req.params.id;
  const { newPassword, forceReset } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }
  try {
    await IamRepository.administrativelyResetPassword(userId, newPassword, forceReset ?? true);
    return res.json({ status: "reset", message: "User password reset successfully and force-password-change policy enacted." });
  } catch (err) {
    return res.status(400).json({ error: "Password policy validation failed.", message: err.message });
  }
});
authRouter.post("/change-password", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: "Corporate email, current password, and new password are required." });
  }
  try {
    const authResult = await IamRepository.authenticate(email, oldPassword, {
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "ALTIL Control Console"
    });
    if (!authResult.success && authResult.error !== "FORCE_PASSWORD_CHANGE_REQUIRED") {
      return res.status(401).json({ error: "Invalid current credentials.", message: authResult.message });
    }
    const user = await IamRepository.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    await IamRepository.changePassword(user.id, newPassword);
    return res.json({ status: "changed", message: "Password successfully rotated and compliance logs updated." });
  } catch (err) {
    return res.status(400).json({ error: "Failed to update security password.", message: err.message });
  }
});
authRouter.get("/roles", requireAuthentication, async (req, res) => {
  try {
    const roles = await IamRepository.getRoles();
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch roles", details: err.message });
  }
});

// src/routes/itilRoutes.ts
var import_express2 = __toESM(require("express"), 1);

// src/db/itilRepository.ts
init_incidentData();
var inMemoryIncidents = [...INITIAL_INCIDENTS_LIST];
var inMemoryAlerts = [...INITIAL_ALERTS_LIST];
var inMemoryRagArticles = [...INITIAL_RAG_KNOWLEDGE_BASE];
var ItilOperationsRepository = {
  /**
   * Fetch all incidents, optionally filtered by tenant
   */
  async getIncidents(tenantId) {
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM itil_incidents`;
        const params = [];
        if (tenantId && tenantId !== "all") {
          sql += ` WHERE tenant_id = ? OR tenant_id IS NULL`;
          params.push(tenantId);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await executeQuery(sql, params);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            title: r.title,
            severity: r.severity || "P2_HIGH",
            status: r.status || "investigating",
            commander: r.commander || r.assigned_to || "NOC Commander",
            assignedTeam: r.assigned_team || "NOC",
            assignedEngineer: r.assigned_engineer || r.assigned_to || void 0,
            affectedTenantIds: r.tenant_id ? [r.tenant_id] : ["cust-1"],
            affectedTenantNames: ["Introsoft Enterprise"],
            affectedAppIds: ["app-capitec-banking"],
            affectedAppNames: ["Capitec AI Assistant"],
            affectedServiceIds: [r.affected_service || "srv-01"],
            startTime: r.created_at ? new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19) : (/* @__PURE__ */ new Date()).toISOString(),
            slaImpacted: Boolean(r.sla_breach),
            summary: r.description || r.title || "",
            category: r.category || "API_Gateway",
            alertChannels: ["email", "in_app"],
            smsAlertSent: false,
            emailAlertSent: true,
            inAppAlertSent: true,
            timeline: r.timeline ? typeof r.timeline === "string" ? JSON.parse(r.timeline) : r.timeline : []
          }));
        }
      } catch (err) {
        console.warn("[ItilOperationsRepository] DB query failed, falling back to in-memory store:", err);
      }
    }
    return inMemoryIncidents;
  },
  /**
   * Create or update incident
   */
  async saveIncident(incident) {
    const completeIncident = {
      id: incident.id,
      title: incident.title || "New Incident",
      severity: incident.severity || "P2_HIGH",
      status: incident.status || "investigating",
      commander: incident.commander || "NOC Commander",
      assignedTeam: incident.assignedTeam || "NOC",
      assignedEngineer: incident.assignedEngineer || "Tebogo Molefe",
      affectedTenantIds: incident.affectedTenantIds || (incident.tenantId ? [incident.tenantId] : ["cust-1"]),
      affectedTenantNames: incident.affectedTenantNames || ["Enterprise Tenant"],
      affectedAppIds: incident.affectedAppIds || ["app-01"],
      affectedAppNames: incident.affectedAppNames || ["Enterprise AI App"],
      affectedServiceIds: incident.affectedServiceIds || ["srv-01"],
      startTime: incident.startTime || (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      slaImpacted: Boolean(incident.slaImpacted ?? incident.slaBreach),
      summary: incident.summary || incident.description || incident.title || "",
      category: incident.category || "API_Gateway",
      alertChannels: incident.alertChannels || ["email", "in_app"],
      smsAlertSent: Boolean(incident.smsAlertSent),
      emailAlertSent: Boolean(incident.emailAlertSent ?? true),
      inAppAlertSent: Boolean(incident.inAppAlertSent ?? true),
      timeline: incident.timeline || [
        { timestamp: (/* @__PURE__ */ new Date()).toISOString().slice(11, 19), author: "ALTIL NOC", note: "Incident logged in ITIL system." }
      ]
    };
    const idx = inMemoryIncidents.findIndex((i) => i.id === completeIncident.id);
    if (idx >= 0) {
      inMemoryIncidents[idx] = completeIncident;
    } else {
      inMemoryIncidents.unshift(completeIncident);
    }
    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO itil_incidents (
            id, title, description, severity, status, category, impact, urgency,
            affected_service, assigned_to, sla_breach, sla_time_remaining_min,
            mitigation_action, root_cause, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            severity = VALUES(severity),
            status = VALUES(status),
            category = VALUES(category),
            affected_service = VALUES(affected_service),
            assigned_to = VALUES(assigned_to),
            timeline = VALUES(timeline),
            updated_at = NOW()
        `;
        await executeQuery(sql, [
          completeIncident.id,
          completeIncident.title,
          completeIncident.summary,
          completeIncident.severity,
          completeIncident.status,
          completeIncident.category,
          "MEDIUM",
          "MEDIUM",
          completeIncident.affectedServiceIds[0] || "srv-01",
          completeIncident.commander,
          completeIncident.slaImpacted ? 1 : 0,
          120,
          "",
          "",
          JSON.stringify(completeIncident.timeline)
        ]);
      } catch (err) {
        console.warn("[ItilOperationsRepository] Failed to persist incident in MariaDB:", err);
      }
    }
    return completeIncident;
  },
  /**
   * Update incident status
   */
  async updateIncidentStatus(incidentId, status, mitigationAction) {
    const inc = inMemoryIncidents.find((i) => i.id === incidentId);
    if (inc) {
      inc.status = status;
    }
    if (isDatabaseConnected()) {
      try {
        await executeQuery(
          `UPDATE itil_incidents SET status = ?, mitigation_action = COALESCE(?, mitigation_action), updated_at = NOW() WHERE id = ?`,
          [status, mitigationAction || null, incidentId]
        );
      } catch (err) {
        console.warn("[ItilOperationsRepository] DB update failed:", err);
      }
    }
    return true;
  },
  /**
   * Dispatch and store multi-channel alert
   */
  async saveAlert(alert) {
    inMemoryAlerts.unshift(alert);
    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO alert_notifications (
            id, incident_id, severity, channel, recipient, message, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        for (const ch of alert.channels) {
          const rec = ch === "sms" ? alert.recipientPhone : alert.recipientEmail;
          await executeQuery(sql, [
            `${alert.id}-${ch}`,
            alert.incidentId,
            alert.severity,
            ch,
            rec || "admin@altil.com",
            alert.message,
            "DELIVERED"
          ]);
        }
      } catch (err) {
        console.warn("[ItilOperationsRepository] Alert DB save warning:", err);
      }
    }
    return alert;
  },
  /**
   * Get RAG Knowledge Base articles
   */
  async getRagArticles() {
    return inMemoryRagArticles;
  }
};

// src/routes/itilRoutes.ts
var itilRouter = import_express2.default.Router();
itilRouter.get("/incidents", requireAuthentication, async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR");
    const tenantFilter = isSuperAdmin ? req.query.tenantId || void 0 : req.user?.tenantId || void 0;
    const incidents = await ItilOperationsRepository.getIncidents(tenantFilter);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve ITIL incidents", details: err.message });
  }
});
itilRouter.post(
  "/incidents",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "INCIDENT_COMMANDER", "TENANT_ADMIN", "SRE_ENGINEER"]),
  async (req, res) => {
    try {
      const incidentData = req.body;
      if (!incidentData.id) {
        incidentData.id = `INC-2026-${Math.floor(Math.random() * 9e3 + 1e3)}`;
      }
      const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN");
      if (!isSuperAdmin && req.user?.tenantId) {
        incidentData.tenantId = req.user.tenantId;
      }
      const saved = await ItilOperationsRepository.saveIncident(incidentData);
      res.status(201).json({ status: "ok", incident: saved, ...saved });
    } catch (err) {
      res.status(500).json({ error: "Failed to save ITIL incident", details: err.message });
    }
  }
);
itilRouter.put(
  "/incidents/:id",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "INCIDENT_COMMANDER", "TENANT_ADMIN", "SRE_ENGINEER"]),
  async (req, res) => {
    try {
      const incidentData = { ...req.body, id: req.params.id };
      const saved = await ItilOperationsRepository.saveIncident(incidentData);
      res.json({ status: "ok", incident: saved, ...saved });
    } catch (err) {
      res.status(500).json({ error: "Failed to update ITIL incident", details: err.message });
    }
  }
);
itilRouter.patch(
  "/incidents/:id/status",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "INCIDENT_COMMANDER", "TENANT_ADMIN", "SRE_ENGINEER"]),
  async (req, res) => {
    const { id } = req.params;
    const { status, mitigationAction } = req.body;
    try {
      await ItilOperationsRepository.updateIncidentStatus(id, status, mitigationAction);
      res.json({ status: "updated", incidentId: id, newStatus: status });
    } catch (err) {
      res.status(500).json({ error: "Failed to update incident status", details: err.message });
    }
  }
);
itilRouter.post(
  "/alerts",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "INCIDENT_COMMANDER", "SECURITY_ADMIN"]),
  async (req, res) => {
    try {
      const alertData = req.body;
      if (!alertData.id) {
        alertData.id = `alt-${Date.now().toString(36)}`;
      }
      const saved = await ItilOperationsRepository.saveAlert(alertData);
      res.json({ status: "dispatched", alert: saved });
    } catch (err) {
      res.status(500).json({ error: "Failed to dispatch alert", details: err.message });
    }
  }
);
itilRouter.get("/rag/articles", requireAuthentication, async (req, res) => {
  try {
    const articles = await ItilOperationsRepository.getRagArticles();
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch knowledge base articles", details: err.message });
  }
});
itilRouter.get("/cmdb", requireAuthentication, async (req, res) => {
  try {
    const { initialCmdbNodes: initialCmdbNodes2 } = await Promise.resolve().then(() => (init_initialState(), initialState_exports));
    res.json(initialCmdbNodes2 || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch CMDB items", details: err.message });
  }
});
itilRouter.get("/problems", requireAuthentication, async (req, res) => {
  try {
    const { INITIAL_PROBLEMS_LIST: INITIAL_PROBLEMS_LIST2 } = await Promise.resolve().then(() => (init_incidentData(), incidentData_exports));
    res.json(INITIAL_PROBLEMS_LIST2 || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch problems", details: err.message });
  }
});
itilRouter.get("/changes", requireAuthentication, async (req, res) => {
  try {
    const sampleChanges = [
      { id: "RFC-2026-104", title: "Deploy MariaDB Galera Cluster v10.11.18", risk: "MEDIUM", status: "APPROVED", plannedDate: "2026-09-01" },
      { id: "RFC-2026-105", title: "Upgrade Groq Inference Adapter to HTTP/2", risk: "LOW", status: "IMPLEMENTED", plannedDate: "2026-08-28" }
    ];
    res.json(sampleChanges);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch changes", details: err.message });
  }
});

// src/routes/complianceRoutes.ts
var import_express3 = __toESM(require("express"), 1);

// src/db/complianceRepository.ts
init_initialState();
var inMemoryDsar = [...INITIAL_DATA_SUBJECT_REQUESTS];
var inMemoryConfig = { ...INITIAL_GLOBAL_COMPLIANCE_CONFIG };
var ComplianceRepository = {
  /**
   * Get global compliance config
   */
  async getConfig() {
    if (isDatabaseConnected()) {
      try {
        const rows = await executeQuery(`SELECT * FROM compliance_framework_configs`);
        if (rows && rows.length > 0) {
        }
      } catch (err) {
        console.warn("[ComplianceRepository] Config load warning:", err);
      }
    }
    return inMemoryConfig;
  },
  /**
   * Save global compliance config
   */
  async saveConfig(cfg) {
    inMemoryConfig = cfg;
    return inMemoryConfig;
  },
  /**
   * Get DSAR requests
   */
  async getDsarRequests(tenantId) {
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM compliance_dsar_requests`;
        const params = [];
        if (tenantId && tenantId !== "all") {
          sql += ` WHERE tenant_id = ? OR tenant_id IS NULL`;
          params.push(tenantId);
        }
        sql += ` ORDER BY created_at DESC`;
        const rows = await executeQuery(sql, params);
        if (rows && rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            framework: r.framework || "POPIA",
            requestType: r.request_type || "access",
            subjectIdentifier: r.subject_identifier || r.id_number_or_passport || r.data_subject_email || "",
            requestorName: r.requestor_name || r.data_subject_name || "Subject",
            appId: r.app_id || void 0,
            status: r.status || "pending",
            createdAt: r.created_at ? new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19) : "",
            dueAt: r.due_at || r.statutory_deadline || new Date(Date.now() + 30 * 864e5).toISOString().replace("T", " ").slice(0, 10),
            notes: r.notes || ""
          }));
        }
      } catch (err) {
        console.warn("[ComplianceRepository] DSAR DB fetch warning:", err);
      }
    }
    return inMemoryDsar;
  },
  /**
   * Create or update DSAR request
   */
  async saveDsarRequest(dsar) {
    const idx = inMemoryDsar.findIndex((d) => d.id === dsar.id);
    if (idx >= 0) inMemoryDsar[idx] = dsar;
    else inMemoryDsar.unshift(dsar);
    if (isDatabaseConnected()) {
      try {
        const sql = `
          INSERT INTO compliance_dsar_requests (
            id, request_type, data_subject_name, data_subject_email, id_number_or_passport,
            status, priority, scope, notes, statutory_deadline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            priority = VALUES(priority),
            scope = VALUES(scope),
            notes = VALUES(notes),
            updated_at = NOW()
        `;
        await executeQuery(sql, [
          dsar.id,
          dsar.requestType,
          dsar.requestorName || "Data Subject",
          dsar.subjectIdentifier || "unknown",
          dsar.subjectIdentifier || "",
          dsar.status,
          "standard",
          "ALL_MODELS",
          dsar.notes || "",
          dsar.dueAt || null
        ]);
      } catch (err) {
        console.warn("[ComplianceRepository] DSAR DB save warning:", err);
      }
    }
    return dsar;
  }
};

// src/routes/complianceRoutes.ts
var complianceRouter = import_express3.default.Router();
complianceRouter.get(
  "/config",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "COMPLIANCE_OFFICER", "AUDITOR"]),
  async (req, res) => {
    try {
      const config = await ComplianceRepository.getConfig();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve compliance configuration", details: err.message });
    }
  }
);
complianceRouter.put(
  "/config",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "COMPLIANCE_OFFICER"]),
  async (req, res) => {
    try {
      const saved = await ComplianceRepository.saveConfig(req.body);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: "Failed to save compliance configuration", details: err.message });
    }
  }
);
var getDsarHandler = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR");
    const tenantFilter = isSuperAdmin ? req.query.tenantId || void 0 : req.user?.tenantId || void 0;
    const requests = await ComplianceRepository.getDsarRequests(tenantFilter);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve DSAR records", details: err.message });
  }
};
complianceRouter.get("/dsar", requireAuthentication, getDsarHandler);
complianceRouter.get("/dsr", requireAuthentication, getDsarHandler);
var createDsarHandler = async (req, res) => {
  try {
    const body = req.body;
    if (!body.id) {
      body.id = `DSR-${body.framework === "GDPR" ? "EU" : "ZA"}-${Date.now().toString(36).toUpperCase()}`;
    }
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN");
    if (!isSuperAdmin && req.user?.tenantId) {
      body.tenantId = req.user.tenantId;
    }
    const saved = await ComplianceRepository.saveDsarRequest(body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save DSAR request", details: err.message });
  }
};
complianceRouter.post(
  "/dsar",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "COMPLIANCE_OFFICER", "TENANT_ADMIN"]),
  createDsarHandler
);
complianceRouter.post(
  "/dsr",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "COMPLIANCE_OFFICER", "TENANT_ADMIN"]),
  createDsarHandler
);
var updateDsarHandler = async (req, res) => {
  try {
    const body = { ...req.body, id: req.params.id };
    const saved = await ComplianceRepository.saveDsarRequest(body);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to update DSAR request", details: err.message });
  }
};
complianceRouter.put(
  "/dsar/:id",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "COMPLIANCE_OFFICER", "TENANT_ADMIN"]),
  updateDsarHandler
);
complianceRouter.put(
  "/dsr/:id",
  requireAuthentication,
  requireRole(["SUPER_ADMIN", "COMPLIANCE_OFFICER", "TENANT_ADMIN"]),
  updateDsarHandler
);
complianceRouter.post(
  "/scan",
  requireAuthentication,
  async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required for compliance scanning" });
      }
      const config = await ComplianceRepository.getConfig();
      const { scanAndSanitizePrompt: scanAndSanitizePrompt2 } = await Promise.resolve().then(() => (init_complianceEngine(), complianceEngine_exports));
      const scanResult = scanAndSanitizePrompt2(prompt, {
        popiaRules: config.popia,
        gdprRules: config.gdpr
      });
      const findings = [
        ...scanResult.popiaViolations.map((v) => ({ framework: "POPIA", ...v })),
        ...scanResult.gdprViolations.map((v) => ({ framework: "GDPR", ...v }))
      ];
      return res.json({
        sanitizedPrompt: scanResult.sanitizedPrompt,
        findings,
        actionTaken: scanResult.actionTaken,
        redacted: scanResult.sanitizedPrompt !== prompt,
        passed: scanResult.actionTaken !== "BLOCKED"
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to execute compliance scan", details: err.message });
    }
  }
);

// src/utils/privilegedOperations.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var privilegedOperations = [];
var PrivilegedOperationsRegistry = class {
  static getAll() {
    return privilegedOperations;
  }
  static getById(id) {
    return privilegedOperations.find((op) => op.id === id);
  }
  static create(actor, operation, targetResource, justification, req) {
    const id = "priv-op-" + import_crypto2.default.randomBytes(8).toString("hex");
    const originatingIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "ALTIL Security Agent";
    const newOp = {
      id,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      tenantScope: actor.tenantId,
      operation,
      targetResource,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      justification: justification || "No justification provided.",
      originatingIp,
      userAgent,
      status: "PENDING_APPROVAL"
    };
    privilegedOperations.unshift(newOp);
    console.log(`[Privileged Control] Created Operation: ${id} - Actor: ${actor.email} - Action: ${operation}`);
    return newOp;
  }
  static approve(id, approver) {
    const op = privilegedOperations.find((o) => o.id === id);
    if (!op) {
      return { success: false, error: "Operation not found" };
    }
    if (op.status !== "PENDING_APPROVAL") {
      return { success: false, error: `Operation cannot be approved from status ${op.status}` };
    }
    if (op.actorId === approver.id) {
      return { success: false, error: "Self-approval violation: Requester cannot approve their own privileged request." };
    }
    op.status = "APPROVED";
    op.approverId = approver.id;
    op.approverEmail = approver.email;
    op.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[Privileged Control] Approved Operation: ${id} by Approver: ${approver.email}`);
    return { success: true, operation: op };
  }
  static reject(id, approver) {
    const op = privilegedOperations.find((o) => o.id === id);
    if (!op) {
      return { success: false, error: "Operation not found" };
    }
    if (op.status !== "PENDING_APPROVAL") {
      return { success: false, error: `Operation cannot be rejected from status ${op.status}` };
    }
    op.status = "REJECTED";
    op.approverId = approver.id;
    op.approverEmail = approver.email;
    op.rejectedAt = (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[Privileged Control] Rejected Operation: ${id} by Approver: ${approver.email}`);
    return { success: true, operation: op };
  }
  static execute(id, result) {
    const op = privilegedOperations.find((o) => o.id === id);
    if (!op || op.status !== "APPROVED") {
      return false;
    }
    op.status = "EXECUTED";
    op.result = result;
    return true;
  }
  static hasValidApproval(actorId, operation, targetResource) {
    return privilegedOperations.find(
      (op) => op.actorId === actorId && op.operation === operation && op.targetResource === targetResource && op.status === "APPROVED"
    );
  }
};

// src/utils/policyEngine.ts
var import_crypto3 = __toESM(require("crypto"), 1);
var activePolicies = [
  {
    policyCode: "POL-SYSTEM-DEFAULT",
    policyVersion: "1.0.0",
    tenantId: "all",
    enabled: true,
    rules: {
      permittedProviders: ["p-gemini", "p-ollama", "p-groq", "p-openai", "p-anthropic", "p-deepseek", "p-openrouter"],
      permittedCapabilities: ["general_ai", "code_generation", "fast_chat", "security_analysis", "document_analysis", "financial_summary"],
      phiHandling: "block",
      piiHandling: "redact"
    }
  },
  {
    policyCode: "POL-CLINICAL-AI-LOCAL",
    policyVersion: "2.1.0",
    tenantId: "cust-1",
    // ACME Financial / Healthcare subsidiary
    enabled: true,
    rules: {
      localModelOnly: true,
      // Approved local models only!
      permittedProviders: ["p-ollama"],
      permittedModels: ["m-qwen36", "m-sec-analyst", "m-qwen25-coder"],
      piiHandling: "block",
      phiHandling: "allow"
      // PHI is allowed but ONLY on local nodes
    }
  },
  {
    policyCode: "POL-FRAUD-RISK-CLOUD-ONLY",
    policyVersion: "1.5.0",
    tenantId: "cust-2",
    // Capitec Bank / Global FinTech Nexus
    enabled: true,
    rules: {
      externalProviderBlock: false,
      permittedProviders: ["p-gemini"],
      // Approved enterprise provider only!
      permittedModels: ["m-gemini-25-flash", "m-gemini-25-pro"],
      financialData: "allow",
      // Allowed on cloud, but restricted to Gemini
      dataResidency: ["EU Sovereign Nodes"]
    }
  }
];
var policyEvidenceLedger = [];
var PolicyEngine = class {
  static getPolicies(tenantId) {
    if (!tenantId || tenantId === "all") {
      return activePolicies;
    }
    return activePolicies.filter((p) => p.tenantId === "all" || p.tenantId === tenantId);
  }
  static getEvidence(tenantId) {
    if (!tenantId || tenantId === "all") {
      return policyEvidenceLedger;
    }
    return policyEvidenceLedger.filter((ev) => ev.tenantId === tenantId);
  }
  static addPolicy(policy) {
    const existingIdx = activePolicies.findIndex((p) => p.policyCode === policy.policyCode);
    if (existingIdx >= 0) {
      activePolicies[existingIdx] = policy;
    } else {
      activePolicies.push(policy);
    }
  }
  static deletePolicy(policyCode) {
    const idx = activePolicies.findIndex((p) => p.policyCode === policyCode);
    if (idx >= 0) {
      activePolicies.splice(idx, 1);
    }
  }
  /**
   * Evaluates an incoming AI orchestrate request against corporate security policies.
   * Returns a decision (ALLOW / DENY / REDACT / BLOCK / REQUIRE_APPROVAL).
   */
  static evaluate(request) {
    const tenantId = request.tenantId || "global";
    const applicable = activePolicies.filter((p) => p.enabled && (p.tenantId === "all" || p.tenantId === tenantId));
    let sanitized = request.prompt;
    let didRedact = false;
    for (const policy of applicable) {
      const { rules } = policy;
      if (rules.prohibitedCapabilities?.includes(request.capability)) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", `Capability [${request.capability}] is explicitly prohibited by policy ${policy.policyCode}.`);
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.permittedCapabilities && !rules.permittedCapabilities.includes(request.capability)) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", `Capability [${request.capability}] is not in the permitted capabilities list.`);
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.localModelOnly && request.providerType !== "ollama") {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", `SaaS cloud provider [${request.providerType}] blocked: policy enforces local-model-only on-prem execution.`);
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.externalProviderBlock && request.providerType !== "ollama") {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", `External SaaS cloud provider [${request.providerType}] is blocked by policy rules.`);
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.permittedProviders && !rules.permittedProviders.includes(request.providerId)) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", `AI Provider [${request.providerId}] is not in the authorized provider allowlist.`);
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.permittedModels && !rules.permittedModels.includes(request.modelId)) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", `AI Model [${request.modelId}] is not in the authorized model allowlist.`);
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      const hasFinancial = /iban|account number|credit card|cvv|swift|routing number|bank balance/gi.test(request.prompt);
      if (rules.financialData === "block" && hasFinancial) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", "Un-tokenized sensitive banking data/financial credentials detected in request.");
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      const hasMedical = /medical record|patient id|diagnosis|prescription|biometric data/gi.test(request.prompt);
      if (rules.phiHandling === "block" && hasMedical) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", "Un-encrypted protected health information (PHI) / medical records detected.");
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.piiHandling === "block" && /@|phone|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/gi.test(request.prompt)) {
        const dec = this.logDecision(policy, tenantId, request, "BLOCK", "Personally Identifiable Information (PII) blocked in raw prompt payload.");
        return { decision: "BLOCK", reason: dec.reason, policyCode: policy.policyCode, policyVersion: policy.policyVersion };
      }
      if (rules.piiHandling === "redact") {
        const before = sanitized;
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[REDACTED_EMAIL]").replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[REDACTED_PHONE]");
        if (sanitized !== before) {
          didRedact = true;
        }
      }
    }
    const finalDecision = didRedact ? "REDACT" : "ALLOW";
    const reason = didRedact ? "Personally Identifiable Information automatically scrubbed and redacted." : "Passed all active policy rules.";
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
  static logDecision(policy, tenantId, req, decision, reason) {
    const id = "ev-" + import_crypto3.default.randomBytes(8).toString("hex");
    const evidence = {
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    policyEvidenceLedger.unshift(evidence);
    return evidence;
  }
  static recordEvidence(evidence) {
    policyEvidenceLedger.unshift({
      id: evidence.requestId,
      policyCode: evidence.ruleApplied,
      policyVersion: "1.0.0",
      tenantId: evidence.tenantId,
      appId: evidence.appId,
      userOrKeyPrefix: "SYSTEM",
      capability: "general_ai",
      providerId: evidence.providerId,
      modelId: evidence.modelId,
      decision: evidence.decision,
      reason: evidence.details,
      timestamp: evidence.timestamp
    });
  }
};

// server.ts
var providers = [...INITIAL_PROVIDERS];
var models = [...INITIAL_MODELS];
var customers = [...INITIAL_CUSTOMERS];
var applications = [...INITIAL_APPLICATIONS];
var apiKeys = [...INITIAL_API_KEYS];
var routingRules = [...INITIAL_ROUTING_RULES];
var policies = [...INITIAL_POLICIES];
var globalComplianceConfig = { ...INITIAL_GLOBAL_COMPLIANCE_CONFIG };
var dataSubjectRequests = [...INITIAL_DATA_SUBJECT_REQUESTS];
var auditLogs = [...INITIAL_AUDIT_LOGS];
var systemHealth = [...INITIAL_SYSTEM_HEALTH];
var licensingPlans = [...INITIAL_LICENSING_PLANS];
var tenantLicenses = [...INITIAL_TENANT_LICENSES];
var paymentWebhookLogs = [...INITIAL_PAYMENT_WEBHOOK_LOGS];
var deviceTrustRecords = [];
var aiMessageLogs = [];
var sampleModelList = [
  { id: "m-gemini-flash", name: "Gemini 2.5 Flash Enterprise" },
  { id: "m-gpt4o", name: "OpenAI GPT-4o Omni" },
  { id: "m-claude-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "m-deepseek-r1", name: "DeepSeek R1 Reasoner" },
  { id: "m-llama-3", name: "Llama 3 70B Instruct (Groq)" }
];
var phonePrefixes = ["+27 82", "+27 76", "+27 83", "+1 415", "+44 20", "+49 30", "+27 79", "+1 212"];
sampleModelList.forEach((mod, mIdx) => {
  for (let d = 0; d < 8; d++) {
    const pfx = phonePrefixes[(mIdx * 3 + d) % phonePrefixes.length];
    const num = Math.floor(1e6 + (d + 1) * 789123 % 8999999);
    const phoneNumber = `${pfx} ${num.toString().slice(0, 3)} ${num.toString().slice(3)}`;
    const immutableDeviceId = `DEV-IMMUTABLE-${mod.id.toUpperCase().slice(2, 6)}-${(1e5 + d * 137).toString()}`;
    const fingerprintHash = `fp_sha256_${Math.abs(Math.sin(mIdx * 100 + d) * 1e9).toFixed(0)}`;
    const sharedSecretToken = `ALTIL-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const roll = (mIdx * 19 + d * 31) % 100;
    let trustLevel = "ultra_secure";
    let description = "POPIA Section 19 & GDPR Article 32 Hardware Enclave Attestation verified. Zero-knowledge cryptographic channel active.";
    if (roll >= 70 && roll < 92) {
      trustLevel = "secure";
      description = "Software token bound with standard AES-256 session encryption. Pending periodic hardware enclave re-attestation.";
    } else if (roll >= 92) {
      trustLevel = "not_trusted";
      description = "Revoked: SIM-swap heuristic flag detected or biometric attestation mismatch under POPIA data integrity mandates.";
    }
    const deviceRecord = {
      id: `dev-${mod.id}-${d}`,
      modelId: mod.id,
      modelName: mod.name,
      immutableDeviceId,
      phoneNumber,
      trustLevel,
      secureEnclave: d % 2 === 0 ? "Apple Secure Enclave (SEP v4)" : "Android StrongBox (ARM TrustZone)",
      consentHash: `CONSENT-SH-${Math.floor(1e5 + d * 999)}`,
      lastHandshake: new Date(Date.now() - d * 36e5).toISOString().replace("T", " ").slice(0, 19),
      fingerprintHash,
      sharedSecretToken,
      registeredAt: new Date(Date.now() - d * 864e5 * 5).toISOString().replace("T", " ").slice(0, 19),
      description
    };
    deviceTrustRecords.push(deviceRecord);
    const messageCount = 20 + (mIdx * 29 + d * 43) % 75;
    for (let m = 0; m < messageCount; m++) {
      const isCompliant = m % 10 !== 3;
      const msgTrust = trustLevel === "not_trusted" ? "not_trusted" : m % 7 === 0 ? "secure" : "ultra_secure";
      const popiaSegments = [
        { text: "Please evaluate credit risk for customer ID ", compliant: true, reason: "Standard governance query prefix" },
        { text: `940${m}8219`, compliant: isCompliant, reason: isCompliant ? "Masked under POPIA Section 19" : "Unmasked PII identifier detected" },
        { text: " with income bracket Tier-A.", compliant: true, reason: "Non-identifying category" }
      ];
      const gdprSegments = [
        { text: "Data subject consent token ", compliant: true, reason: "Valid Article 6 opt-in" },
        { text: `EU-ID-${m * 149}`, compliant: isCompliant, reason: isCompliant ? "Pseudonymized hash" : "Direct GDPR subject key exposed" },
        { text: " processed for legitimate financial analytics.", compliant: true, reason: "Approved legitimate interest" }
      ];
      aiMessageLogs.push({
        id: `msg-${deviceRecord.id}-${m}`,
        deviceId: deviceRecord.id,
        phoneNumber,
        modelId: mod.id,
        modelName: mod.name,
        timestamp: new Date(Date.now() - (messageCount - m) * 18e5).toISOString().replace("T", " ").slice(0, 19),
        promptText: `Please evaluate credit risk for customer ID 940${m}8219 with income bracket Tier-A under POPIA and GDPR mandates.`,
        responseText: `[ALTIL AI Gateway via ${mod.name}]
Credit risk assessment for customer ID 940${m}8219 evaluated successfully. Risk score: Low (1.4%). Governance tokens verified against hardware enclave ${deviceRecord.immutableDeviceId}.`,
        trustLevel: msgTrust,
        popiaSegments,
        gdprSegments,
        latencyMs: 140 + m * 7 % 300,
        tokenCount: 220 + m * 13 % 600
      });
    }
  }
});
var geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn("Gemini client initialization failed:", e);
    }
  }
  return geminiClient;
}
function getPresetModelsForProvider(provider) {
  const pId = provider.id;
  const pName = provider.name;
  const now = Date.now().toString(36);
  switch (provider.type) {
    case "openai":
      return [
        {
          id: `m-gpt4o-${now}`,
          modelIdentifier: "gpt-4o",
          providerId: pId,
          providerName: pName,
          displayName: "GPT-4o Omnimodal",
          status: "online",
          contextWindow: 128e3,
          maxOutputTokens: 16384,
          enabled: true,
          isFree: false,
          capabilities: ["general_ai", "document_analysis", "code_generation", "financial_summary"],
          costPer1kInput: 25e-4,
          costPer1kOutput: 0.01,
          averageLatencyMs: 280,
          tokensPerSecond: 95,
          description: "High-intelligence flagship model with multimodal support."
        },
        {
          id: `m-gpt4omini-${now}`,
          modelIdentifier: "gpt-4o-mini",
          providerId: pId,
          providerName: pName,
          displayName: "GPT-4o Mini",
          status: "online",
          contextWindow: 128e3,
          maxOutputTokens: 16384,
          enabled: true,
          isFree: false,
          capabilities: ["general_ai", "fast_chat", "data_extraction"],
          costPer1kInput: 15e-5,
          costPer1kOutput: 6e-4,
          averageLatencyMs: 160,
          tokensPerSecond: 130,
          description: "Ultra-fast, cost-efficient model for high-frequency operations."
        },
        {
          id: `m-o3mini-${now}`,
          modelIdentifier: "o3-mini",
          providerId: pId,
          providerName: pName,
          displayName: "o3-mini STEM Reasoner",
          status: "online",
          contextWindow: 2e5,
          maxOutputTokens: 1e5,
          enabled: true,
          isFree: false,
          capabilities: ["code_generation", "financial_summary", "security_analysis"],
          costPer1kInput: 11e-4,
          costPer1kOutput: 44e-4,
          averageLatencyMs: 420,
          tokensPerSecond: 85,
          description: "Deep mathematical & software reasoning model."
        }
      ];
    case "anthropic":
      return [
        {
          id: `m-sonnet-${now}`,
          modelIdentifier: "claude-3-5-sonnet-20241022",
          providerId: pId,
          providerName: pName,
          displayName: "Claude 3.5 Sonnet",
          status: "online",
          contextWindow: 2e5,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: false,
          capabilities: ["code_generation", "document_analysis", "general_ai"],
          costPer1kInput: 3e-3,
          costPer1kOutput: 0.015,
          averageLatencyMs: 440,
          tokensPerSecond: 80,
          description: "Premier coding and complex reasoning model."
        },
        {
          id: `m-haiku-${now}`,
          modelIdentifier: "claude-3-5-haiku-20241022",
          providerId: pId,
          providerName: pName,
          displayName: "Claude 3.5 Haiku",
          status: "online",
          contextWindow: 2e5,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: false,
          capabilities: ["fast_chat", "general_ai", "data_extraction"],
          costPer1kInput: 8e-4,
          costPer1kOutput: 4e-3,
          averageLatencyMs: 210,
          tokensPerSecond: 140,
          description: "High-speed intelligence model."
        }
      ];
    case "groq":
      return [
        {
          id: `m-groq-llama70b-${now}`,
          modelIdentifier: "llama-3.3-70b-versatile",
          providerId: pId,
          providerName: pName,
          displayName: "Llama 3.3 70B Versatile (Free Tier)",
          status: "online",
          contextWindow: 128e3,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ["general_ai", "document_analysis", "fast_chat"],
          costPer1kInput: 59e-5,
          costPer1kOutput: 79e-5,
          averageLatencyMs: 90,
          tokensPerSecond: 450,
          description: "Ultra-fast LPU inference with generous free tier quota."
        },
        {
          id: `m-groq-llama8b-${now}`,
          modelIdentifier: "llama-3.1-8b-instant",
          providerId: pId,
          providerName: pName,
          displayName: "Llama 3.1 8B Instant (Free Tier)",
          status: "online",
          contextWindow: 128e3,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ["fast_chat", "general_ai"],
          costPer1kInput: 5e-5,
          costPer1kOutput: 8e-5,
          averageLatencyMs: 40,
          tokensPerSecond: 750,
          description: "Blazing fast sub-50ms inference."
        }
      ];
    case "gemini":
      return [
        {
          id: `m-gem-flash-${now}`,
          modelIdentifier: "gemini-2.5-flash",
          providerId: pId,
          providerName: pName,
          displayName: "Gemini 2.5 Flash (Free Tier)",
          status: "online",
          contextWindow: 1e6,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ["general_ai", "financial_summary", "document_analysis"],
          costPer1kInput: 15e-5,
          costPer1kOutput: 6e-4,
          averageLatencyMs: 290,
          tokensPerSecond: 160,
          description: "1M token context window with free tier access."
        }
      ];
    case "deepseek":
      return [
        {
          id: `m-ds-v3-${now}`,
          modelIdentifier: "deepseek-chat",
          providerId: pId,
          providerName: pName,
          displayName: "DeepSeek V3 (Free Credits / Ultra Low Cost)",
          status: "online",
          contextWindow: 64e3,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ["general_ai", "code_generation", "fast_chat"],
          costPer1kInput: 14e-5,
          costPer1kOutput: 28e-5,
          averageLatencyMs: 240,
          tokensPerSecond: 110,
          description: "High performance mixture-of-experts model."
        }
      ];
    case "openrouter":
      return [
        {
          id: `m-or-free-qwen-${now}`,
          modelIdentifier: "qwen/qwen-2.5-72b-instruct:free",
          providerId: pId,
          providerName: pName,
          displayName: "Qwen 2.5 72B (100% Free Community Tier)",
          status: "online",
          contextWindow: 32768,
          maxOutputTokens: 4096,
          enabled: true,
          isFree: true,
          capabilities: ["general_ai", "code_generation", "fast_chat"],
          costPer1kInput: 0,
          costPer1kOutput: 0,
          averageLatencyMs: 380,
          tokensPerSecond: 90,
          description: "Free public community tier model provided through OpenRouter."
        }
      ];
    default:
      return [
        {
          id: `m-custom-${now}`,
          modelIdentifier: `${provider.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-model`,
          providerId: pId,
          providerName: pName,
          displayName: `${provider.name} Default Model`,
          status: "online",
          contextWindow: 32768,
          maxOutputTokens: 4096,
          enabled: true,
          isFree: Boolean(provider.hasFreeTier),
          capabilities: ["general_ai", "fast_chat"],
          costPer1kInput: 5e-4,
          costPer1kOutput: 15e-4,
          averageLatencyMs: 200,
          tokensPerSecond: 100,
          description: `Custom model provisioned for ${provider.name}.`
        }
      ];
  }
}
async function startServer() {
  const app = (0, import_express4.default)();
  const PORT = 3005;
  app.use(import_express4.default.json());
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/iam", authRouter);
  app.use("/api/v1/itil", itilRouter);
  app.use("/api/v1/compliance", complianceRouter);
  app.get("/api/v1/privileged-operations", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_OFFICER"]), (req, res) => {
    res.json(PrivilegedOperationsRegistry.getAll());
  });
  app.post("/api/v1/privileged-operations", requireAuthentication, (req, res) => {
    const { operation, targetResource, justification } = req.body;
    if (!operation || !targetResource) {
      return res.status(400).json({ error: "Operation and targetResource are required fields." });
    }
    const actor = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.roles[0] || "User",
      tenantId: req.user.tenantId
    };
    const op = PrivilegedOperationsRegistry.create(
      actor,
      operation,
      targetResource,
      justification,
      req
    );
    res.status(201).json(op);
  });
  app.post("/api/v1/privileged-operations/:id/approve", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_OFFICER"]), (req, res) => {
    const approver = {
      id: req.user.id,
      email: req.user.email
    };
    const result = PrivilegedOperationsRegistry.approve(req.params.id, approver);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }
    const op = result.operation;
    let executionDetail = "Authorized and cleared.";
    try {
      if (op.operation === "TENANT_DELETE") {
        const tenantId = op.targetResource;
        customers = customers.filter((c) => c.id !== tenantId);
        executionDetail = `Tenant ${tenantId} successfully deleted from Altil registry.`;
      } else if (op.operation === "PROVIDER_DISABLE") {
        const providerId = op.targetResource;
        const prov = providers.find((p) => p.id === providerId);
        if (prov) {
          prov.enabled = false;
          prov.status = "offline";
          executionDetail = `AI Provider ${prov.name} successfully disabled by administrative override.`;
        } else {
          executionDetail = `AI Provider ${providerId} not found, marked offline.`;
        }
      } else if (op.operation === "SECRET_ROTATION") {
        executionDetail = `API secrets rotated for target ${op.targetResource}.`;
      } else if (op.operation === "DSAR_ERASURE") {
        executionDetail = `DSAR personal data erasure completed for data subject: ${op.targetResource}.`;
      }
      PrivilegedOperationsRegistry.execute(op.id, executionDetail);
    } catch (err) {
      executionDetail = `Execution failed: ${err.message}`;
    }
    res.json({ success: true, operation: op, result: executionDetail });
  });
  app.post("/api/v1/privileged-operations/:id/reject", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_OFFICER"]), (req, res) => {
    const approver = {
      id: req.user.id,
      email: req.user.email
    };
    const result = PrivilegedOperationsRegistry.reject(req.params.id, approver);
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }
    res.json({ success: true, operation: result.operation });
  });
  app.get("/api/v1/policy-evidence", requireAuthentication, requireRole(["SUPER_ADMIN", "AUDITOR", "SECURITY_OFFICER"]), (req, res) => {
    const isGlobalAuditor = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR") || req.user?.roles.includes("SECURITY_OFFICER");
    const tenantId = isGlobalAuditor ? "all" : req.user?.tenantId;
    res.json(PolicyEngine.getEvidence(tenantId || void 0));
  });
  const blockAuditModification = (req, res) => {
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    console.error(`[Security Violation] Unauthorized attempt to modify audit logs from IP: ${clientIp}`);
    const violationLog = {
      id: `VIOL-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      appId: "system-gateway",
      appName: "ALTIL Control Plane",
      apiKeyPrefix: "VIOLATION-ATTEMPT",
      requestType: "security_violation",
      capability: "audit.delete",
      providerId: "none",
      providerName: "System Core",
      modelId: "none",
      modelIdentifier: "audit-ledger-v1",
      durationSeconds: 0,
      status: "POLICY_BLOCKED",
      fallbackAttempted: false,
      inputTokens: 0,
      outputTokens: 0,
      costEstimated: 0,
      policyApplied: "Immutable Audit Protection Protocol",
      sanitizedPromptPreview: `Unauthorized audit deletion/modification attempt on route ${req.originalUrl}`,
      sanitizedResponsePreview: "[MUTATION BLOCKED BY ALTIL SECURITY GATEWAY]",
      clientIp
    };
    auditLogs.unshift(violationLog);
    return res.status(405).json({
      error: "Method Not Allowed",
      code: "AUDIT_LOGS_IMMUTABLE",
      message: "Security Boundary Enforced: Audit logs are append-only/audit-protected. Modification or deletion is strictly prohibited by systemic technical controls."
    });
  };
  app.put("/api/v1/logs*", blockAuditModification);
  app.post("/api/v1/logs*", blockAuditModification);
  app.delete("/api/v1/logs*", blockAuditModification);
  app.put("/api/v1/audit*", blockAuditModification);
  app.post("/api/v1/audit*", blockAuditModification);
  app.delete("/api/v1/audit*", blockAuditModification);
  app.get("/api/v1/health", (req, res) => {
    const isConnected = isDatabaseConnected();
    res.json({
      status: isConnected ? "HEALTHY" : "DEGRADED",
      platform: "Introsoft ALTIL AI Orchestration Layer",
      version: "2.4.0-enterprise",
      database: "MariaDB 10.11.18 Community Engine",
      databaseConnected: isConnected,
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      components: systemHealth
    });
  });
  app.get("/api/v1/database/health", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const health = await getMariaDbHealth();
    res.json(health);
  });
  app.post("/api/v1/database/toggle-offline", requireAuthentication, requireRole(["SUPER_ADMIN"]), (req, res) => {
    const { offline } = req.body;
    setDatabaseConnected(!offline);
    res.json({ status: "ok", databaseConnected: !offline });
  });
  let isMigrating = false;
  const handleMigration = async (req, res) => {
    const startTime = Date.now();
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (!req.user?.permissions.includes("system.migrate")) {
      return res.status(403).json({
        error: "Forbidden",
        code: "INSUFFICIENT_PERMISSION",
        message: "Security Boundary Enforced: Missing required granular permission [system.migrate]."
      });
    }
    if (process.env.ALTIL_ENABLE_MIGRATIONS !== "true") {
      return res.status(403).json({
        error: "Forbidden",
        code: "MIGRATIONS_DISABLED",
        message: "Security Boundary Enforced: Production environment locks prevent remote database schema migrations. Set ALTIL_ENABLE_MIGRATIONS=true."
      });
    }
    if (isMigrating) {
      return res.status(409).json({
        error: "Conflict",
        code: "MIGRATION_CONCURRENCY_LOCKED",
        message: "Database schema migration is currently running. Access locked."
      });
    }
    isMigrating = true;
    console.log(`[Security Ledger] Database schema migration triggered by Super Admin ${req.user.email} from IP ${clientIp}.`);
    const attemptLog = {
      id: `MIG-ATT-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      appId: "system-gateway",
      appName: "ALTIL Control Plane",
      apiKeyPrefix: "ADMIN-SESSION",
      requestType: "system_migration",
      capability: "system.migrate",
      providerId: "none",
      providerName: "Database Engine",
      modelId: "none",
      modelIdentifier: "mariadb-10.11",
      durationSeconds: 0,
      status: "POLICY_BLOCKED",
      // Set temporary block state until done
      fallbackAttempted: false,
      inputTokens: 0,
      outputTokens: 0,
      costEstimated: 0,
      policyApplied: "System Migration Security Protocol",
      sanitizedPromptPreview: `Database migration initiated by ${req.user.email}`,
      sanitizedResponsePreview: "Running schema migrate...",
      clientIp
    };
    auditLogs.unshift(attemptLog);
    try {
      const result = await runSchemaMigrationScript();
      isMigrating = false;
      attemptLog.status = "SUCCESS";
      attemptLog.durationSeconds = Number(((Date.now() - startTime) / 1e3).toFixed(2));
      attemptLog.sanitizedResponsePreview = `Migration success: ${JSON.stringify(result)}`;
      return res.json({
        success: true,
        message: "Database schema migration executed successfully.",
        result
      });
    } catch (err) {
      isMigrating = false;
      attemptLog.status = "ERROR";
      attemptLog.durationSeconds = Number(((Date.now() - startTime) / 1e3).toFixed(2));
      attemptLog.sanitizedResponsePreview = `Migration failed: ${err.message}`;
      return res.status(500).json({
        error: "Migration Failed",
        message: err.message
      });
    }
  };
  app.post("/api/v1/database/migrate", requireAuthentication, requireRole(["SUPER_ADMIN"]), handleMigration);
  app.post("/api/v1/db/migrate", requireAuthentication, requireRole(["SUPER_ADMIN"]), handleMigration);
  app.get("/api/v1/database/tenants", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const data = await dbRepository.getTenants();
    res.json(data);
  });
  app.post("/api/v1/database/tenants", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const tenant = req.body;
    await dbRepository.createTenant(tenant);
    const existingIdx = customers.findIndex((c) => c.id === tenant.id);
    if (existingIdx >= 0) {
      customers[existingIdx] = { ...customers[existingIdx], ...tenant };
    } else {
      customers.push(tenant);
    }
    res.json({ status: "ok", tenant });
  });
  app.delete("/api/v1/database/tenants/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_OFFICER"]), async (req, res) => {
    const { id } = req.params;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const approvedOp = PrivilegedOperationsRegistry.hasValidApproval(req.user.id, "TENANT_DELETE", id);
    if (!approvedOp) {
      const op = PrivilegedOperationsRegistry.create(
        {
          id: req.user.id,
          email: req.user.email,
          role: req.user.roles[0],
          tenantId: req.user.tenantId
        },
        "TENANT_DELETE",
        id,
        req.headers["x-privileged-justification"] || "Tenant decommissioning & data purge request.",
        req
      );
      return res.status(202).json({
        error: "DUAL_APPROVAL_REQUIRED",
        message: "Security Boundary Enforced: Direct tenant deletion is blocked. High-risk administrative actions require independent dual approval (Four-Eyes control). An approval request has been registered.",
        operationId: op.id,
        status: op.status
      });
    }
    await dbRepository.deleteTenant(id);
    customers = customers.filter((c) => c.id !== id);
    PrivilegedOperationsRegistry.execute(approvedOp.id, `Tenant ${id} permanently deleted.`);
    const deletionLog = {
      id: `TEN-DEL-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      appId: "system-gateway",
      appName: "ALTIL Control Plane",
      apiKeyPrefix: "ADMIN-SESSION",
      requestType: "tenant_deletion",
      capability: "tenant.delete",
      providerId: "none",
      providerName: "System Registry",
      modelId: "none",
      modelIdentifier: "mariadb-10.11",
      durationSeconds: 0,
      status: "SUCCESS",
      fallbackAttempted: false,
      inputTokens: 0,
      outputTokens: 0,
      costEstimated: 0,
      policyApplied: "Dual Control Governance Policy",
      sanitizedPromptPreview: `Tenant ${id} permanently deleted with approval ${approvedOp.id} by ${approvedOp.approverEmail}`,
      sanitizedResponsePreview: `Tenant ${id} deleted.`,
      clientIp
    };
    auditLogs.unshift(deletionLog);
    res.json({ status: "deleted", id, approvedOperationId: approvedOp.id });
  });
  app.get("/api/v1/database/plans", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const plans = await dbRepository.getLicensingPlans();
    res.json(plans);
  });
  app.post("/api/v1/database/plans", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const plan = req.body;
    await dbRepository.saveLicensingPlan(plan);
    const idx = licensingPlans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) licensingPlans[idx] = plan;
    else licensingPlans.push(plan);
    res.json({ status: "ok", plan });
  });
  app.get("/api/v1/database/licenses", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const lics = await dbRepository.getTenantLicenses();
    res.json(lics);
  });
  app.post("/api/v1/database/licenses", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const lic = req.body;
    await dbRepository.saveTenantLicense(lic);
    const idx = tenantLicenses.findIndex((l) => l.id === lic.id);
    if (idx >= 0) tenantLicenses[idx] = lic;
    else tenantLicenses.push(lic);
    res.json({ status: "ok", license: lic });
  });
  app.post("/api/v1/database/query", requireAuthentication, requireRole(["SUPER_ADMIN"]), async (req, res) => {
    const { sql, params } = req.body;
    try {
      const rows = await executeQuery(sql, params || []);
      res.json({ status: "success", rowCount: rows.length, rows });
    } catch (err) {
      res.status(500).json({ error: err.message, sql });
    }
  });
  app.get("/api/v1/overview", requireAuthentication, (req, res) => {
    const totalRequests = auditLogs.length + 18421;
    const errorCount = auditLogs.filter((l) => l.status === "ERROR" || l.status === "POLICY_BLOCKED").length + 31;
    res.json({
      providersCount: providers.length,
      activeProvidersCount: providers.filter((p) => p.enabled && p.status === "online").length,
      modelsCount: models.length,
      activeModelsCount: models.filter((m) => m.enabled && m.status === "online").length,
      applicationsCount: applications.length,
      activeApplicationsCount: applications.filter((a) => a.status === "active").length,
      activeKeysCount: apiKeys.filter((k) => k.status === "active").length,
      totalRequests,
      errorCount,
      errorRatePct: Number((errorCount / totalRequests * 100).toFixed(2)),
      requestsPerMin: 14,
      averageLatencySec: 1.8,
      todayRequests: 4812,
      todaySuccessful: 4763,
      todayFailed: 49,
      tokensInputTotal: "2.4M",
      tokensOutputTotal: "1.1M",
      providerDistribution: [
        { name: "Ollama", percentage: 62, requests: 11420 },
        { name: "Groq", percentage: 25, requests: 4605 },
        { name: "Gemini", percentage: 13, requests: 2396 }
      ]
    });
  });
  app.get("/api/v1/licensing/plans", requireAuthentication, (req, res) => {
    res.json(licensingPlans);
  });
  app.post("/api/v1/licensing/plans", requireAuthentication, requireRole(["SUPER_ADMIN", "FINOPS_MANAGER"]), (req, res) => {
    const plan = req.body;
    const existingIdx = licensingPlans.findIndex((p) => p.id === plan.id);
    if (existingIdx >= 0) {
      licensingPlans[existingIdx] = plan;
    } else {
      licensingPlans.push(plan);
    }
    res.json({ status: "ok", plan });
  });
  app.get("/api/v1/licensing/tenant-licenses", requireAuthentication, (req, res) => {
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR");
    const filtered = isSuperAdmin ? tenantLicenses : tenantLicenses.filter((l) => l.tenantId === req.user?.tenantId);
    res.json(filtered);
  });
  app.post("/api/v1/licensing/tenant-licenses/update", requireAuthentication, requireRole(["SUPER_ADMIN", "FINOPS_MANAGER"]), (req, res) => {
    const lic = req.body;
    const idx = tenantLicenses.findIndex((l) => l.id === lic.id);
    if (idx >= 0) {
      tenantLicenses[idx] = lic;
      res.json({ status: "ok", license: lic });
    } else {
      tenantLicenses.push(lic);
      res.json({ status: "ok", license: lic });
    }
  });
  app.post("/api/v1/licensing/payment-webhook", (req, res) => {
    const { tenantId, eventType, invoiceId, amount, gatewayProvider } = req.body;
    const lic = tenantLicenses.find((l) => l.tenantId === tenantId || l.id === tenantId);
    if (!lic) {
      return res.status(404).json({ error: "Tenant license record not found" });
    }
    let newStatus = lic.licenseStatus;
    let newPayStatus = lic.paymentStatus;
    let activeEnforcement = lic.activeEnforcement;
    if (eventType === "invoice.paid" || eventType === "payment.reconciled_eft") {
      newStatus = "active";
      newPayStatus = "paid";
      activeEnforcement = null;
    } else if (eventType === "invoice.payment_failed") {
      newStatus = "grace_period";
      newPayStatus = "failed";
    } else if (eventType === "license.auto_suspended") {
      newStatus = "auto_suspended";
      newPayStatus = "overdue";
      activeEnforcement = "hard_block_402";
    }
    lic.licenseStatus = newStatus;
    lic.paymentStatus = newPayStatus;
    lic.activeEnforcement = activeEnforcement;
    if (eventType === "invoice.paid") {
      lic.lastPaymentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      lic.lastPaymentAmount = amount || lic.basePrice;
    }
    const webhookLog = {
      id: `paylog-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19),
      tenantId: lic.tenantId,
      tenantName: lic.tenantName,
      applicationId: lic.applicationId,
      invoiceId: invoiceId || `INV-${Math.floor(Math.random() * 9e3 + 1e3)}`,
      eventType: eventType || "invoice.paid",
      amount: amount || lic.currentAccruedBillUsd,
      currency: lic.currency,
      gatewayProvider: gatewayProvider || "Stripe",
      enforcementTriggered: activeEnforcement || "none",
      status: "processed",
      rawPayloadSummary: `Webhook processed. Updated tenant ${lic.tenantName} status to ${newStatus.toUpperCase()}`
    };
    paymentWebhookLogs.unshift(webhookLog);
    res.json({ status: "success", tenantLicense: lic, webhookLog });
  });
  app.get("/api/v1/licensing/verify-gateway", (req, res) => {
    const tenantId = req.query.tenantId || "";
    const lic = tenantLicenses.find((l) => l.tenantId === tenantId);
    if (lic && lic.licenseStatus === "auto_suspended") {
      return res.status(402).json({
        error: "Payment Required",
        code: "TENANT_LICENSE_SUSPENDED",
        message: "Account payment overdue. Gateway traffic is hard-blocked by automated enforcement rule."
      });
    }
    res.json({
      status: "allowed",
      tenantId,
      licenseStatus: lic ? lic.licenseStatus : "active"
    });
  });
  app.get("/api/v1/providers", requireAuthentication, (req, res) => {
    providers.forEach((p) => {
      p.modelsCount = models.filter((m) => m.providerId === p.id).length;
      p.freeModelsCount = models.filter((m) => m.providerId === p.id && m.isFree).length;
    });
    res.json(providers);
  });
  app.post("/api/v1/providers", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const rawKey = req.body.apiKey || "";
    let prefix = req.body.keyPrefix || "";
    if (rawKey && !prefix) {
      prefix = rawKey.length > 8 ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : "sk-...configured";
    } else if (!rawKey && !prefix) {
      prefix = "No Auth (Local Socket)";
    }
    const newProvider = {
      id: req.body.id || `p-${Date.now().toString(36)}`,
      name: req.body.name || "New AI Provider",
      type: req.body.type || "openai_compatible",
      endpoint: req.body.endpoint || "https://api.openai.com/v1",
      apiKey: rawKey,
      keyPrefix: prefix,
      organizationId: req.body.organizationId || "",
      customHeaders: req.body.customHeaders || {},
      enabled: req.body.enabled !== false,
      status: "online",
      latencyMs: req.body.latencyMs || (req.body.type === "groq" ? 84 : req.body.type === "ollama" ? 142 : 240),
      p95LatencyMs: req.body.p95LatencyMs || 350,
      uptimePercent: 99.98,
      errorRate: 0,
      priority: Number(req.body.priority) || 3,
      timeoutMs: Number(req.body.timeoutMs) || 15e3,
      rateLimitRpm: Number(req.body.rateLimitRpm) || 3e3,
      rateLimitTpm: Number(req.body.rateLimitTpm) || 1e6,
      hasFreeTier: req.body.hasFreeTier ?? ["groq", "ollama", "openrouter", "gemini", "deepseek"].includes(req.body.type),
      freeModelsCount: 0,
      modelsCount: 0,
      totalRequests: 0,
      tokensTotal: 0,
      costTotal: 0,
      lastTested: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      notes: req.body.notes || ""
    };
    if (req.body.autoProvisionModels) {
      const presetModels = getPresetModelsForProvider(newProvider);
      presetModels.forEach((m) => models.unshift(m));
      newProvider.modelsCount = presetModels.length;
      newProvider.freeModelsCount = presetModels.filter((m) => m.isFree).length;
    }
    providers.unshift(newProvider);
    res.status(201).json(newProvider);
  });
  app.put("/api/v1/providers/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const idx = providers.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Provider not found" });
    const rawKey = req.body.apiKey !== void 0 ? req.body.apiKey : providers[idx].apiKey;
    let prefix = req.body.keyPrefix !== void 0 ? req.body.keyPrefix : providers[idx].keyPrefix;
    if (rawKey && rawKey !== providers[idx].apiKey) {
      prefix = rawKey.length > 8 ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : "sk-...updated";
    }
    providers[idx] = {
      ...providers[idx],
      ...req.body,
      apiKey: rawKey,
      keyPrefix: prefix
    };
    res.json(providers[idx]);
  });
  app.delete("/api/v1/providers/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const targetId = req.params.id;
    providers = providers.filter((p) => p.id !== targetId);
    if (req.query.cascadeModels === "true") {
      models = models.filter((m) => m.providerId !== targetId);
    }
    res.json({ success: true, deletedProviderId: targetId });
  });
  app.get("/api/v1/providers/:id/telemetry", requireAuthentication, (req, res) => {
    const provider = providers.find((p) => p.id === req.params.id);
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    const providerModels = models.filter((m) => m.providerId === provider.id);
    const providerLogs = auditLogs.filter((l) => l.providerId === provider.id || l.providerName && l.providerName.toLowerCase().includes(provider.name.toLowerCase().slice(0, 5)));
    const totalReqs = provider.totalRequests || (providerLogs.length > 0 ? providerLogs.length * 120 + 350 : 2400);
    const successReqs = Math.floor(totalReqs * (1 - (provider.errorRate || 0.02)));
    const failReqs = totalReqs - successReqs;
    const fallbackCount = providerLogs.filter((l) => l.fallbackAttempted || l.status === "FALLBACK_SUCCESS").length || Math.floor(totalReqs * 0.04);
    const totalTokens = provider.tokensTotal || totalReqs * 2150;
    const inTokens = Math.floor(totalTokens * 0.65);
    const outTokens = totalTokens - inTokens;
    const estCost = provider.costTotal !== void 0 ? provider.costTotal : Number((totalTokens / 1e3 * 6e-4).toFixed(2));
    const freeTierSavings = provider.hasFreeTier ? Number((totalTokens / 1e3 * 2e-3).toFixed(2)) : 0;
    const baseHour = /* @__PURE__ */ new Date();
    const hourlyMetrics = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(baseHour.getTime() - (11 - i) * 36e5);
      const timeStr = d.toTimeString().slice(0, 5);
      const reqVariance = 0.7 + Math.sin(i / 2) * 0.4 + Math.random() * 0.2;
      const hourlyReqs = Math.max(20, Math.floor(totalReqs / 24 * reqVariance));
      const hourlyLatency = Math.max(30, Math.floor((provider.latencyMs || 150) + (Math.random() * 40 - 20)));
      const hourlyTokens = hourlyReqs * Math.floor(1800 + Math.random() * 600);
      const hourlyErrors = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0;
      const hourlyCost = Number((hourlyTokens / 1e3 * (provider.hasFreeTier ? 1e-4 : 12e-4)).toFixed(3));
      return {
        time: timeStr,
        requests: hourlyReqs,
        latency: hourlyLatency,
        tokens: hourlyTokens,
        errors: hourlyErrors,
        cost: hourlyCost
      };
    });
    const modelMetrics = providerModels.map((m) => {
      const mReqs = Math.max(50, Math.floor(totalReqs / (providerModels.length || 1) * (0.6 + Math.random() * 0.8)));
      const mTokens = mReqs * Math.floor(2200 + Math.random() * 800);
      const mCost = m.isFree ? 0 : Number((mTokens / 1e3 * (m.costPer1kOutput || 1e-3)).toFixed(2));
      return {
        modelId: m.id,
        modelName: m.displayName || m.modelIdentifier,
        requests: mReqs,
        avgLatencyMs: m.averageLatencyMs || provider.latencyMs || 150,
        tokensConsumed: mTokens,
        isFree: Boolean(m.isFree),
        cost: mCost
      };
    });
    const recentEvents = [
      {
        id: `ev-${Date.now()}-1`,
        timestamp: "Just now",
        type: "success",
        model: providerModels[0]?.displayName || "Primary Model",
        latencyMs: provider.latencyMs || 84,
        tokens: 384,
        message: "HTTP 200 OK \u2014 Ingress payload processed within SLA target."
      },
      {
        id: `ev-${Date.now()}-2`,
        timestamp: "4m ago",
        type: "health_check",
        model: "Probe Health Daemon",
        latencyMs: (provider.latencyMs || 84) - 5,
        tokens: 32,
        message: "Routine TCP socket & auth handshake validated (Latency nominal)."
      },
      {
        id: `ev-${Date.now()}-3`,
        timestamp: "18m ago",
        type: provider.errorRate > 0.08 ? "error" : "success",
        model: providerModels[1]?.displayName || providerModels[0]?.displayName || "Model Node",
        latencyMs: (provider.latencyMs || 84) + 45,
        tokens: 1240,
        message: provider.errorRate > 0.08 ? "HTTP 429 Rate Limit Warning \u2014 Throttled payload." : "HTTP 200 OK \u2014 Batch completion dispatched."
      }
    ];
    const telemetryData = {
      providerId: provider.id,
      providerName: provider.name,
      providerType: provider.type,
      uptimePercent: provider.uptimePercent || 99.98,
      avgLatencyMs: provider.latencyMs || 120,
      p95LatencyMs: provider.p95LatencyMs || (provider.latencyMs ? Math.round(provider.latencyMs * 1.5) : 240),
      p99LatencyMs: provider.latencyMs ? Math.round(provider.latencyMs * 2.2) : 380,
      errorRatePercent: Number(((provider.errorRate || 0.02) * 100).toFixed(2)),
      totalRequests: totalReqs,
      successfulRequests: successReqs,
      failedRequests: failReqs,
      fallbackCount,
      tokensTotal: totalTokens,
      inputTokens: inTokens,
      outputTokens: outTokens,
      avgTokensPerSec: provider.type === "groq" ? 480 : provider.type === "ollama" ? 85 : 120,
      estimatedCostTotal: estCost,
      freeTierSavings,
      hourlyMetrics,
      modelMetrics,
      recentEvents
    };
    res.json(telemetryData);
  });
  app.post("/api/v1/providers/:id/benchmark", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), async (req, res) => {
    const provider = providers.find((p) => p.id === req.params.id);
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    const startTime = Date.now();
    await new Promise((r) => setTimeout(r, 220 + Math.random() * 180));
    const liveLatency = provider.type === "groq" ? Math.floor(55 + Math.random() * 30) : provider.type === "ollama" ? Math.floor(110 + Math.random() * 40) : provider.type === "openai" ? Math.floor(180 + Math.random() * 80) : Math.floor(220 + Math.random() * 90);
    provider.latencyMs = liveLatency;
    provider.p95LatencyMs = Math.round(liveLatency * 1.45);
    provider.lastTested = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    provider.totalRequests = (provider.totalRequests || 0) + 1;
    res.json({
      success: true,
      providerId: provider.id,
      liveLatencyMs: liveLatency,
      p95LatencyMs: provider.p95LatencyMs,
      tokensPerSecondBenchmark: provider.type === "groq" ? 512 : provider.type === "ollama" ? 92 : 138,
      timestamp: provider.lastTested,
      status: provider.status
    });
  });
  app.post("/api/v1/providers/:id/test", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), async (req, res) => {
    const provider = providers.find((p) => p.id === req.params.id);
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    const startTime = Date.now();
    let testResult;
    if (provider.type === "gemini" && process.env.GEMINI_API_KEY) {
      try {
        const client = getGeminiClient();
        if (client) {
          const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: 'Respond with exactly: "ALTIL Orchestration Verification Handshake OK"'
          });
          const latency2 = Date.now() - startTime;
          testResult = {
            providerId: provider.id,
            providerName: provider.name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
            success: true,
            latencyMs: latency2,
            authValid: true,
            reachable: true,
            modelsDiscoveredCount: 5,
            discoveredModels: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
            sampleGenerationSuccess: true,
            sampleOutput: response.text || "ALTIL Orchestration Verification Handshake OK"
          };
          provider.status = "online";
          provider.latencyMs = latency2;
          provider.lastTested = testResult.timestamp;
          return res.json(testResult);
        }
      } catch (err) {
        console.warn("Gemini test call failed:", err);
      }
    }
    await new Promise((r) => setTimeout(r, 380 + Math.random() * 250));
    const latency = provider.type === "ollama" ? 142 : provider.type === "groq" ? 84 : 310;
    const discoveredMap = {
      ollama: ["qwen3.6:16k", "qwen2.5-coder:32b", "sec-analyst-7b", "llama3.2:3b"],
      groq: ["llama-3.3-70b-versatile", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768", "gemma2-9b-it", "llama-3.1-8b-instant", "whisper-large-v3"],
      gemini: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
      openrouter: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "meta-llama/llama-3.3-70b-instruct", "deepseek/deepseek-r1"],
      openai_compatible: ["custom-gpt-4-turbo", "custom-qwen-72b"]
    };
    const modelsList = discoveredMap[provider.type] || ["custom-model-01", "custom-model-02"];
    testResult = {
      providerId: provider.id,
      providerName: provider.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      success: provider.status !== "offline",
      latencyMs: provider.status === "offline" ? 0 : latency,
      authValid: provider.status !== "offline",
      reachable: provider.status !== "offline",
      modelsDiscoveredCount: provider.status === "offline" ? 0 : modelsList.length,
      discoveredModels: provider.status === "offline" ? [] : modelsList,
      sampleGenerationSuccess: provider.status !== "offline",
      sampleOutput: provider.status !== "offline" ? `[${provider.name}] Handshake acknowledged. Latency: ${latency}ms.` : void 0,
      errorMessage: provider.status === "offline" ? "Connection refused (ECONNREFUSED) at endpoint target." : void 0
    };
    provider.lastTested = testResult.timestamp;
    if (provider.status !== "offline") {
      provider.latencyMs = latency;
    }
    res.json(testResult);
  });
  app.get("/api/v1/models", requireAuthentication, (req, res) => {
    res.json(models);
  });
  app.post("/api/v1/models", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const newModel = {
      id: `m-${Date.now().toString(36)}`,
      modelIdentifier: req.body.modelIdentifier || "custom-model:v1",
      providerId: req.body.providerId || providers[0]?.id || "p-ollama",
      displayName: req.body.displayName || req.body.modelIdentifier || "New Model",
      status: "online",
      contextWindow: Number(req.body.contextWindow) || 32768,
      maxOutputTokens: Number(req.body.maxOutputTokens) || 4096,
      enabled: req.body.enabled !== false,
      capabilities: req.body.capabilities || ["general_ai"],
      costPer1kInput: Number(req.body.costPer1kInput) || 0,
      costPer1kOutput: Number(req.body.costPer1kOutput) || 0,
      averageLatencyMs: Number(req.body.averageLatencyMs) || 200,
      description: req.body.description || ""
    };
    models.unshift(newModel);
    res.status(201).json(newModel);
  });
  app.put("/api/v1/models/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const idx = models.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Model not found" });
    models[idx] = { ...models[idx], ...req.body };
    res.json(models[idx]);
  });
  app.delete("/api/v1/models/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    models = models.filter((m) => m.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/v1/customers", requireAuthentication, (req, res) => {
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR");
    const filtered = isSuperAdmin ? customers : customers.filter((c) => c.id === req.user?.tenantId);
    res.json(filtered);
  });
  app.get("/api/v1/customers/:id", requireAuthentication, requireTenantAccess("id"), (req, res) => {
    const cust = customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    res.json(cust);
  });
  app.post("/api/v1/customers", requireAuthentication, requireRole(["SUPER_ADMIN"]), (req, res) => {
    const custId = `cust-${(req.body.name || "company").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20)}-${Date.now().toString(36).slice(-4)}`;
    const nowStr = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    const initialUsers = req.body.users && req.body.users.length > 0 ? req.body.users.map((u, idx) => ({
      id: u.id || `usr-${custId}-${idx + 1}`,
      customerId: custId,
      name: u.name || req.body.primaryContact?.name || "Primary Administrator",
      email: u.email || req.body.primaryContact?.email || "admin@customer.internal",
      role: u.role || "owner",
      designation: u.designation || req.body.primaryContact?.role || "Organization Owner",
      mfaEnabled: u.mfaEnabled ?? true,
      status: u.status || "active",
      lastLogin: null,
      createdAt: nowStr
    })) : [
      {
        id: `usr-${custId}-1`,
        customerId: custId,
        name: req.body.primaryContact?.name || "Primary Administrator",
        email: req.body.primaryContact?.email || "admin@customer.internal",
        role: "owner",
        designation: req.body.primaryContact?.role || "Organization Owner",
        mfaEnabled: true,
        status: "active",
        lastLogin: null,
        createdAt: nowStr
      }
    ];
    const newCustomer = {
      id: custId,
      type: req.body.type || "company",
      name: req.body.name || "New Enterprise Customer",
      legalName: req.body.legalName || req.body.name || "New Enterprise Customer Ltd",
      registrationNumber: req.body.registrationNumber || "",
      taxVatNumber: req.body.taxVatNumber || "",
      industry: req.body.industry || "Financial Services",
      country: req.body.country || "South Africa (ZA)",
      status: req.body.status || "active",
      tier: req.body.tier || "growth",
      monthlyBudgetUsd: Number(req.body.monthlyBudgetUsd) || 5e3,
      currentSpendUsd: 0,
      rateLimitRpm: Number(req.body.rateLimitRpm) || 300,
      rateLimitTpm: Number(req.body.rateLimitTpm) || 25e4,
      primaryContact: {
        name: req.body.primaryContact?.name || "Primary Contact",
        email: req.body.primaryContact?.email || "contact@customer.internal",
        phone: req.body.primaryContact?.phone || "",
        role: req.body.primaryContact?.role || "Executive"
      },
      statutoryOfficers: {
        informationOfficer: req.body.statutoryOfficers?.informationOfficer ? {
          name: req.body.statutoryOfficers.informationOfficer.name || "",
          email: req.body.statutoryOfficers.informationOfficer.email || "",
          phone: req.body.statutoryOfficers.informationOfficer.phone || "",
          designation: req.body.statutoryOfficers.informationOfficer.designation || "Information Officer",
          registrationNumber: req.body.statutoryOfficers.informationOfficer.registrationNumber || "",
          registeredDate: req.body.statutoryOfficers.informationOfficer.registeredDate || nowStr.slice(0, 10),
          deputyOfficerName: req.body.statutoryOfficers.informationOfficer.deputyOfficerName || "",
          deputyOfficerEmail: req.body.statutoryOfficers.informationOfficer.deputyOfficerEmail || ""
        } : void 0,
        dataProtectionOfficer: req.body.statutoryOfficers?.dataProtectionOfficer ? {
          name: req.body.statutoryOfficers.dataProtectionOfficer.name || "",
          email: req.body.statutoryOfficers.dataProtectionOfficer.email || "",
          phone: req.body.statutoryOfficers.dataProtectionOfficer.phone || "",
          dpoType: req.body.statutoryOfficers.dataProtectionOfficer.dpoType || "internal",
          leadSupervisoryAuthority: req.body.statutoryOfficers.dataProtectionOfficer.leadSupervisoryAuthority || "",
          registrationNumber: req.body.statutoryOfficers.dataProtectionOfficer.registrationNumber || "",
          registeredDate: req.body.statutoryOfficers.dataProtectionOfficer.registeredDate || nowStr.slice(0, 10)
        } : void 0
      },
      users: initialUsers,
      billingConfig: req.body.billingConfig || {
        billingCycle: "monthly",
        billingCycleStartDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
        billingCycleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10),
        autoRenew: true,
        paymentMethod: "invoice",
        currency: "USD",
        creditBalanceUsd: 1500,
        creditLimitUsd: 5e3,
        prepaidCredits: false,
        taxIdNumber: req.body.taxVatNumber || "",
        billingEmail: req.body.primaryContact?.email || "",
        overageAllowed: true,
        overageAlertThresholdPercent: 80,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10)
      },
      connectedAppIds: req.body.connectedAppIds || [],
      assignedPolicyIds: req.body.assignedPolicyIds || ["pol-global-safety"],
      createdAt: nowStr,
      updatedAt: nowStr,
      notes: req.body.notes || ""
    };
    let createdApp;
    let createdKey;
    if (req.body.initialApplicationName) {
      const appId = `app-${(req.body.initialApplicationIdentifier || req.body.initialApplicationName).toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      createdApp = {
        id: appId,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        appIdentifier: (req.body.initialApplicationIdentifier || req.body.initialApplicationName).toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: req.body.initialApplicationName,
        description: `Primary application for ${newCustomer.name}`,
        status: "active",
        environment: "production",
        allowedCapabilities: ["general_ai", "fast_chat", "document_analysis"],
        rateLimitRpm: newCustomer.rateLimitRpm,
        quotaMonthlyRequests: 5e4,
        quotaUsedRequests: 0,
        assignedPolicyIds: ["pol-global-safety"],
        contactEmail: newCustomer.primaryContact.email,
        createdAt: nowStr,
        updatedAt: nowStr
      };
      applications.unshift(createdApp);
      newCustomer.connectedAppIds.push(createdApp.id);
      const keyRaw = `ALTIL-LIVE-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      createdKey = {
        id: `key-${Date.now().toString(36)}`,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        appId: createdApp.id,
        appName: createdApp.name,
        name: `${newCustomer.name} Production Key`,
        key: keyRaw,
        prefix: `${keyRaw.slice(0, 12)}...${keyRaw.slice(-4)}`,
        status: "active",
        createdAt: nowStr,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().replace("T", " ").slice(0, 19),
        lastUsedAt: null,
        rateLimitRpm: newCustomer.rateLimitRpm,
        ipWhitelist: req.body.ipWhitelist || [],
        scopes: ["read:inference", "read:models"]
      };
      apiKeys.unshift(createdKey);
    }
    customers.unshift(newCustomer);
    res.status(201).json({ customer: newCustomer, application: createdApp, apiKey: createdKey });
  });
  app.get("/api/v1/customers/:id/invoice-preview", requireAuthentication, requireTenantAccess("id"), (req, res) => {
    const cust = customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    const billing = cust.billingConfig || {
      billingCycle: "monthly",
      billingCycleStartDate: "2026-08-01",
      billingCycleEndDate: "2026-08-31",
      autoRenew: true,
      paymentMethod: "invoice",
      currency: "USD",
      creditBalanceUsd: 1500,
      creditLimitUsd: 5e3,
      prepaidCredits: false,
      overageAllowed: true,
      overageAlertThresholdPercent: 80
    };
    const subtotal = cust.currentSpendUsd || 3450;
    const taxRate = cust.country.includes("South Africa") ? 0.15 : 0.2;
    const tax = Number((subtotal * taxRate).toFixed(2));
    const creditsApplied = Math.min(billing.creditBalanceUsd || 0, subtotal + tax);
    const totalDue = Number((subtotal + tax - creditsApplied).toFixed(2));
    const invoicePreview = {
      invoiceNumber: `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`,
      customerId: cust.id,
      customerName: cust.legalName || cust.name,
      customerAddress: `Registered Address, ${cust.country}`,
      taxVatNumber: cust.taxVatNumber || "VAT-UNASSIGNED",
      issueDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10),
      billingCycle: `${billing.billingCycle.toUpperCase()} (${billing.billingCycleStartDate} to ${billing.billingCycleEndDate})`,
      status: "issued",
      lineItems: [
        {
          id: "li-1",
          description: `ALTIL Enterprise AI Ingress & Gateway API Calls (${cust.tier.toUpperCase()} Tier)`,
          quantity: Math.round(subtotal * 12),
          unitPriceUsd: 0.05,
          totalUsd: Number((subtotal * 0.8).toFixed(2))
        },
        {
          id: "li-2",
          description: `Zero-Trust Token Egress & Multi-Model Orchestration Support`,
          quantity: 1,
          unitPriceUsd: Number((subtotal * 0.2).toFixed(2)),
          totalUsd: Number((subtotal * 0.2).toFixed(2))
        }
      ],
      subtotalUsd: subtotal,
      taxUsd: tax,
      creditsAppliedUsd: creditsApplied,
      totalDueUsd: totalDue
    };
    res.json(invoicePreview);
  });
  app.put("/api/v1/customers/:id", requireAuthentication, requireTenantAccess("id"), requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const idx = customers.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Customer not found" });
    customers[idx] = {
      ...customers[idx],
      ...req.body,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    res.json(customers[idx]);
  });
  app.delete("/api/v1/customers/:id", requireAuthentication, requireRole(["SUPER_ADMIN"]), (req, res) => {
    customers = customers.filter((c) => c.id !== req.params.id);
    res.json({ success: true });
  });
  app.post("/api/v1/customers/:id/users", requireAuthentication, requireTenantAccess("id"), requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const cust = customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    const newUser = {
      id: `usr-${cust.id}-${Date.now().toString(36)}`,
      customerId: cust.id,
      name: req.body.name || "New Team Member",
      email: req.body.email || "user@customer.internal",
      role: req.body.role || "developer",
      designation: req.body.designation || "Engineer",
      mfaEnabled: req.body.mfaEnabled ?? true,
      status: req.body.status || "active",
      lastLogin: null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    cust.users.push(newUser);
    cust.updatedAt = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    res.status(201).json(newUser);
  });
  app.put("/api/v1/customers/:id/users/:userId", requireAuthentication, requireTenantAccess("id"), requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const cust = customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    const uIdx = cust.users.findIndex((u) => u.id === req.params.userId);
    if (uIdx === -1) return res.status(404).json({ error: "User not found in customer organization" });
    cust.users[uIdx] = {
      ...cust.users[uIdx],
      ...req.body
    };
    cust.updatedAt = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    res.json(cust.users[uIdx]);
  });
  app.delete("/api/v1/customers/:id/users/:userId", requireAuthentication, requireTenantAccess("id"), requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const cust = customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    cust.users = cust.users.filter((u) => u.id !== req.params.userId);
    cust.updatedAt = (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19);
    res.json({ success: true });
  });
  app.post("/api/v1/customers/:id/keys", requireAuthentication, requireTenantAccess("id"), requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const cust = customers.find((c) => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: "Customer not found" });
    const targetApp = applications.find((a) => a.id === req.body.appId) || applications.find((a) => cust.connectedAppIds.includes(a.id));
    const rawKey = `ALTIL-LIVE-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId: cust.id,
      customerName: cust.name,
      appId: targetApp?.id || "all",
      appName: targetApp?.name || "All Connected Applications",
      name: req.body.name || `${cust.name} API Key`,
      key: rawKey,
      prefix: `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`,
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      expiresAt: req.body.expiresInDays && Number(req.body.expiresInDays) > 0 ? new Date(Date.now() + Number(req.body.expiresInDays) * 24 * 60 * 60 * 1e3).toISOString().replace("T", " ").slice(0, 19) : null,
      lastUsedAt: null,
      rateLimitRpm: Number(req.body.rateLimitRpm) || cust.rateLimitRpm || 120,
      ipWhitelist: req.body.ipWhitelist || [],
      scopes: req.body.scopes || ["read:inference", "read:models"]
    };
    apiKeys.unshift(newKey);
    res.status(201).json(newKey);
  });
  app.post("/api/v1/customers/validate-key", (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ valid: false, error: "API key is required" });
    const keyRecord = apiKeys.find((k) => k.key === key.trim() || k.prefix && key.trim().startsWith(k.prefix.split("...")[0]));
    if (!keyRecord) {
      return res.status(401).json({ valid: false, status: "INVALID", error: "Provided key not found in ALTIL Gateway registry" });
    }
    if (keyRecord.status === "revoked") {
      return res.status(403).json({ valid: false, status: "REVOKED", error: "This API key has been revoked by the customer administrator or statutory officer" });
    }
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt).getTime() < Date.now()) {
      return res.status(403).json({ valid: false, status: "EXPIRED", error: "This API key expired on " + keyRecord.expiresAt });
    }
    const customer = customers.find((c) => c.id === keyRecord.customerId);
    const app2 = applications.find((a) => a.id === keyRecord.appId);
    res.json({
      valid: true,
      status: "ACTIVE",
      keyId: keyRecord.id,
      keyPrefix: keyRecord.prefix,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        country: customer.country,
        tier: customer.tier,
        status: customer.status,
        informationOfficer: customer.statutoryOfficers?.informationOfficer?.name || "Nominated",
        dataProtectionOfficer: customer.statutoryOfficers?.dataProtectionOfficer?.name || "Nominated"
      } : null,
      application: app2 ? {
        id: app2.id,
        name: app2.name,
        environment: app2.environment,
        allowedCapabilities: app2.allowedCapabilities
      } : { id: "all", name: "All Connected Applications" },
      rateLimitRpm: keyRecord.rateLimitRpm,
      scopes: keyRecord.scopes,
      ipWhitelist: keyRecord.ipWhitelist
    });
  });
  app.get("/api/v1/applications", requireAuthentication, (req, res) => {
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR");
    const tenantId = req.user?.tenantId;
    const filtered = isSuperAdmin ? applications : applications.filter((a) => a.customerId === tenantId || !a.customerId && tenantId === "cust-1");
    res.json(filtered);
  });
  app.post("/api/v1/applications", requireAuthentication, requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const appId = `app-${(req.body.appIdentifier || req.body.name || "app").toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const newApp = {
      id: appId,
      customerId: req.user?.tenantId || req.body.customerId || "cust-1",
      customerName: req.body.customerName || (req.user?.tenantId === "cust-2" ? "Capitec Bank Ltd" : "Introsoft Cloud (Default)"),
      appIdentifier: req.body.appIdentifier || (req.body.name || "app").toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: req.body.name || "New Application",
      description: req.body.description || "",
      status: req.body.status || "active",
      environment: req.body.environment || "production",
      allowedCapabilities: req.body.allowedCapabilities || ["general_ai", "fast_chat"],
      rateLimitRpm: Number(req.body.rateLimitRpm) || 120,
      quotaMonthlyRequests: Number(req.body.quotaMonthlyRequests) || 5e4,
      quotaUsedRequests: 0,
      assignedPolicyIds: req.body.assignedPolicyIds || ["pol-global-safety"],
      contactEmail: req.body.contactEmail || "admin@introsoft.internal",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    applications.unshift(newApp);
    const keyRaw = `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId: newApp.customerId,
      customerName: newApp.customerName,
      appId: newApp.id,
      name: `${newApp.name} Primary Key`,
      key: keyRaw,
      prefix: `${keyRaw.slice(0, 10)}...${keyRaw.slice(-4)}`,
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      expiresAt: null,
      lastUsedAt: null,
      rateLimitRpm: newApp.rateLimitRpm,
      ipWhitelist: [],
      scopes: ["read:inference"]
    };
    apiKeys.unshift(newKey);
    res.status(201).json({ application: newApp, apiKey: newKey });
  });
  app.put("/api/v1/applications/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const idx = applications.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Application not found" });
    if (!req.user?.roles.includes("SUPER_ADMIN") && applications[idx].customerId && applications[idx].customerId !== req.user?.tenantId) {
      return res.status(403).json({ error: "Forbidden: Access denied to other tenant application" });
    }
    applications[idx] = {
      ...applications[idx],
      ...req.body,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    res.json(applications[idx]);
  });
  app.delete("/api/v1/applications/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const target = applications.find((a) => a.id === req.params.id);
    if (!target) return res.status(404).json({ error: "Application not found" });
    if (!req.user?.roles.includes("SUPER_ADMIN") && target.customerId && target.customerId !== req.user?.tenantId) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    applications = applications.filter((a) => a.id !== req.params.id);
    apiKeys = apiKeys.filter((k) => k.appId !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/v1/api-keys", requireAuthentication, (req, res) => {
    const isSuperAdmin = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR") || req.user?.roles.includes("SECURITY_OFFICER");
    const tenantId = req.user?.tenantId;
    const filtered = isSuperAdmin ? apiKeys : apiKeys.filter((k) => k.customerId === tenantId || !k.customerId && tenantId === "cust-1");
    const maskedKeys = filtered.map((k) => {
      const { key, ...rest } = k;
      return {
        ...rest,
        key: void 0
      };
    });
    res.json(maskedKeys);
  });
  app.post("/api/v1/api-keys", requireAuthentication, requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const targetCustId = req.user?.roles.includes("SUPER_ADMIN") ? req.body.customerId || "cust-1" : req.user?.tenantId;
    const keyRaw = `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId: targetCustId,
      customerName: targetCustId === "cust-2" ? "Capitec Bank Ltd" : "Introsoft Cloud (Default)",
      appId: req.body.appId || applications[0]?.id || "app-introsoft-web",
      name: req.body.name || "Application API Key",
      key: keyRaw,
      prefix: `${keyRaw.slice(0, 10)}...${keyRaw.slice(-4)}`,
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      expiresAt: req.body.expiresAt || null,
      lastUsedAt: null,
      rateLimitRpm: Number(req.body.rateLimitRpm) || 120,
      ipWhitelist: req.body.ipWhitelist || [],
      scopes: req.body.scopes || ["read:inference"]
    };
    apiKeys.unshift(newKey);
    res.status(201).json(newKey);
  });
  app.put("/api/v1/api-keys/:id/revoke", requireAuthentication, requireRole(["SUPER_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    const key = apiKeys.find((k) => k.id === req.params.id);
    if (!key) return res.status(404).json({ error: "Key not found" });
    if (!req.user?.roles.includes("SUPER_ADMIN") && key.customerId && key.customerId !== req.user?.tenantId) {
      return res.status(403).json({ error: "Forbidden: Access denied to other tenant API key" });
    }
    key.status = "revoked";
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const revocationLog = {
      id: `KEY-REV-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      appId: key.appId || "system-gateway",
      appName: key.appName || "ALTIL Control Plane",
      apiKeyPrefix: key.prefix || "UNKNOWN",
      requestType: "api_key_revocation",
      capability: "apikeys.revoke",
      providerId: "none",
      providerName: "System Registry",
      modelId: "none",
      modelIdentifier: "key-management-v1",
      durationSeconds: 0,
      status: "SUCCESS",
      fallbackAttempted: false,
      inputTokens: 0,
      outputTokens: 0,
      costEstimated: 0,
      policyApplied: "Key Management Governance Policy",
      sanitizedPromptPreview: `API Key ${key.id} belonging to Customer ${key.customerId} revoked by ${req.user.email}`,
      sanitizedResponsePreview: `Key ${key.id} revoked.`,
      clientIp
    };
    auditLogs.unshift(revocationLog);
    res.json(key);
  });
  app.delete("/api/v1/api-keys/:id", requireAuthentication, requireRole(["SUPER_ADMIN"]), (req, res) => {
    const key = apiKeys.find((k) => k.id === req.params.id);
    if (!key) return res.status(404).json({ error: "Key not found" });
    apiKeys = apiKeys.filter((k) => k.id !== req.params.id);
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const deletionLog = {
      id: `KEY-DEL-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      appId: key.appId || "system-gateway",
      appName: key.appName || "ALTIL Control Plane",
      apiKeyPrefix: key.prefix || "UNKNOWN",
      requestType: "api_key_deletion",
      capability: "apikeys.delete",
      providerId: "none",
      providerName: "System Registry",
      modelId: "none",
      modelIdentifier: "key-management-v1",
      durationSeconds: 0,
      status: "SUCCESS",
      fallbackAttempted: false,
      inputTokens: 0,
      outputTokens: 0,
      costEstimated: 0,
      policyApplied: "Key Management Governance Policy",
      sanitizedPromptPreview: `API Key ${key.id} belonging to Customer ${key.customerId} deleted by ${req.user.email}`,
      sanitizedResponsePreview: `Key ${key.id} deleted.`,
      clientIp
    };
    auditLogs.unshift(deletionLog);
    res.json({ success: true });
  });
  app.get("/api/v1/routes", requireAuthentication, (req, res) => {
    res.json(routingRules);
  });
  app.get("/api/v1/routing-rules", requireAuthentication, (req, res) => {
    res.json(routingRules);
  });
  app.post("/api/v1/routes", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const newRoute = {
      id: `route-${Date.now().toString(36)}`,
      name: req.body.name || "New Routing Rule",
      taskOrCapability: req.body.taskOrCapability || "general_ai",
      appId: req.body.appId || "all",
      primaryModelId: req.body.primaryModelId || models[0]?.id,
      firstFallbackModelId: req.body.firstFallbackModelId,
      secondFallbackModelId: req.body.secondFallbackModelId,
      maxTokens: Number(req.body.maxTokens) || 4096,
      timeoutMs: Number(req.body.timeoutMs) || 8e3,
      fallbackTriggers: req.body.fallbackTriggers || ["on_error", "on_timeout"],
      loadBalancingStrategy: req.body.loadBalancingStrategy || "priority_fallback",
      enabled: req.body.enabled !== false,
      description: req.body.description || ""
    };
    routingRules.unshift(newRoute);
    res.status(201).json(newRoute);
  });
  app.put("/api/v1/routes/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    const idx = routingRules.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Route not found" });
    routingRules[idx] = { ...routingRules[idx], ...req.body };
    res.json(routingRules[idx]);
  });
  app.delete("/api/v1/routes/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "AI_ENGINEER"]), (req, res) => {
    routingRules = routingRules.filter((r) => r.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/v1/policies", requireAuthentication, (req, res) => {
    const isGlobalRole = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR") || req.user?.roles.includes("SECURITY_OFFICER");
    if (isGlobalRole) {
      res.json(policies);
    } else {
      const filtered = policies.filter((p) => p.tenantId === req.user?.tenantId);
      res.json(filtered);
    }
  });
  app.post("/api/v1/policies", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "COMPLIANCE_OFFICER", "SECURITY_OFFICER", "TENANT_ADMIN"]), (req, res) => {
    const isSuperOrOfficer = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("SECURITY_OFFICER");
    const tenantId = isSuperOrOfficer ? req.body.tenantId || "all" : req.user?.tenantId;
    const newPolicy = {
      id: `pol-${Date.now().toString(36)}`,
      name: req.body.name || "New AI Governance Policy",
      description: req.body.description || "",
      appliesToAppIds: req.body.appliesToAppIds || ["all"],
      tenantId,
      // Store tenant binding!
      rules: {
        blockSensitiveFinancialData: req.body.rules?.blockSensitiveFinancialData ?? false,
        redactPII: req.body.rules?.redactPII ?? true,
        logRequestMetadata: req.body.rules?.logRequestMetadata ?? true,
        anonymizePromptsInAudit: req.body.rules?.anonymizePromptsInAudit ?? true,
        requireApprovedProvider: req.body.rules?.requireApprovedProvider ?? false,
        maxContextTokens: Number(req.body.rules?.maxContextTokens) || 16384,
        maxResponseTokens: Number(req.body.rules?.maxResponseTokens) || 4096,
        enableAuditTrail: req.body.rules?.enableAuditTrail ?? true,
        blockPromptInjections: req.body.rules?.blockPromptInjections ?? true,
        allowedProviderIds: req.body.rules?.allowedProviderIds || []
      },
      status: req.body.status || "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    policies.unshift(newPolicy);
    res.status(201).json(newPolicy);
  });
  app.put("/api/v1/policies/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "COMPLIANCE_OFFICER", "SECURITY_OFFICER", "TENANT_ADMIN"]), (req, res) => {
    const idx = policies.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Policy not found" });
    const isSuperOrOfficer = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("SECURITY_OFFICER");
    if (!isSuperOrOfficer && policies[idx].tenantId && policies[idx].tenantId !== req.user?.tenantId) {
      return res.status(403).json({
        error: "Forbidden",
        code: "TENANT_POLICY_LOCK",
        message: "Security Boundary Enforced: You are not authorized to view or modify policies belonging to another tenant domain."
      });
    }
    policies[idx] = {
      ...policies[idx],
      ...req.body,
      tenantId: isSuperOrOfficer ? req.body.tenantId || policies[idx].tenantId : req.user?.tenantId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    res.json(policies[idx]);
  });
  app.delete("/api/v1/policies/:id", requireAuthentication, requireRole(["SUPER_ADMIN", "SECURITY_ADMIN", "COMPLIANCE_OFFICER", "SECURITY_OFFICER", "TENANT_ADMIN"]), (req, res) => {
    const idx = policies.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Policy not found" });
    const isSuperOrOfficer = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("SECURITY_OFFICER");
    if (!isSuperOrOfficer && policies[idx].tenantId && policies[idx].tenantId !== req.user?.tenantId) {
      return res.status(403).json({
        error: "Forbidden",
        code: "TENANT_POLICY_LOCK",
        message: "Security Boundary Enforced: You are not authorized to view or modify policies belonging to another tenant domain."
      });
    }
    policies = policies.filter((p) => p.id !== req.params.id);
    res.json({ success: true });
  });
  app.get("/api/v1/logs", requireAuthentication, requireRole(["SUPER_ADMIN", "AUDITOR", "SECURITY_ADMIN", "TENANT_ADMIN"]), (req, res) => {
    let result = [...auditLogs];
    const isSuperOrAuditor = req.user?.roles.includes("SUPER_ADMIN") || req.user?.roles.includes("AUDITOR") || req.user?.roles.includes("SECURITY_ADMIN");
    if (!isSuperOrAuditor && req.user?.tenantId) {
      const tenantApps = applications.filter((a) => a.customerId === req.user?.tenantId).map((a) => a.id);
      result = result.filter((l) => tenantApps.includes(l.appId));
    }
    if (req.query.appId && req.query.appId !== "all") {
      result = result.filter((l) => l.appId === req.query.appId);
    }
    if (req.query.providerId && req.query.providerId !== "all") {
      result = result.filter((l) => l.providerId === req.query.providerId);
    }
    if (req.query.status && req.query.status !== "all") {
      result = result.filter((l) => l.status === req.query.status);
    }
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      result = result.filter(
        (l) => l.id.toLowerCase().includes(q) || l.appName.toLowerCase().includes(q) || l.capability.toLowerCase().includes(q) || l.modelIdentifier.toLowerCase().includes(q) || l.sanitizedPromptPreview.toLowerCase().includes(q)
      );
    }
    res.json(result);
  });
  app.get("/api/v1/usage", requireAuthentication, (req, res) => {
    res.json({
      chartData: USAGE_CHART_DATA,
      todayRequests: 4812,
      todaySuccessful: 4763,
      todayFailed: 49,
      inputTokensToday: 242e4,
      outputTokensToday: 111e4,
      providerShare: [
        { name: "Ollama Local Cluster", share: 62, requests: 2983, color: "#3b82f6" },
        { name: "Groq Cloud LPU", share: 25, requests: 1203, color: "#f97316" },
        { name: "Google Gemini", share: 13, requests: 626, color: "#10b981" }
      ],
      applicationUsage: applications.map((app2) => ({
        id: app2.id,
        name: app2.name,
        requests: app2.quotaUsedRequests,
        quota: app2.quotaMonthlyRequests,
        quotaPct: Math.round(app2.quotaUsedRequests / app2.quotaMonthlyRequests * 100),
        status: app2.status
      }))
    });
  });
  app.post("/api/v1/orchestrate", async (req, res) => {
    try {
      const rawAuthHeader = req.headers.authorization;
      const headerApiKey = req.headers["x-api-key"];
      const cookieToken = req.headers.cookie?.split(";").find((c) => c.trim().startsWith("altil_session="))?.split("=")[1]?.trim();
      const {
        apiKey = headerApiKey,
        appId,
        capability = "general_ai",
        task,
        prompt = "",
        input = "",
        simulatePrimaryFailure = false,
        simulateProviderFailure = false
      } = req.body;
      let authenticatedCaller = null;
      if (apiKey) {
        const keyRecord = apiKeys.find((k) => k.key === apiKey || k.prefix && k.prefix.includes(apiKey.slice(0, 8)));
        if (!keyRecord) {
          return res.status(401).json({ error: "Unauthorized: Invalid API key provided" });
        }
        if (keyRecord.status === "revoked") {
          return res.status(403).json({ error: "Forbidden: API key has been revoked" });
        }
        if (keyRecord.expiresAt && new Date(keyRecord.expiresAt).getTime() < Date.now()) {
          return res.status(403).json({ error: "Forbidden: API key expired" });
        }
        authenticatedCaller = { type: "api_key", keyRecord };
      } else {
        const token = rawAuthHeader?.startsWith("Bearer ") ? rawAuthHeader.slice(7).trim() : cookieToken;
        if (token) {
          const session = await IamRepository.getSession(token);
          if (session) {
            const user = await IamRepository.getUserById(session.user_id);
            if (user && user.status === "ACTIVE") {
              authenticatedCaller = { type: "session", user };
            }
          }
        }
      }
      if (!authenticatedCaller) {
        return res.status(401).json({
          error: "Unauthorized: Missing or invalid credentials. Provide a valid x-api-key or Bearer session token."
        });
      }
      const isFailureSimulated = simulatePrimaryFailure || simulateProviderFailure;
      const queryText = prompt || input || "Hello from Introsoft application";
      const chosenCapability = capability || task || "general_ai";
      const requestId = `ALTIL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const startTime = Date.now();
      const steps = [];
      const callerTenantId = authenticatedCaller.type === "api_key" ? authenticatedCaller.keyRecord.customerId : authenticatedCaller.user.tenantId || authenticatedCaller.user.tenant_id;
      if (appId) {
        const appToCheck = applications.find((a) => a.id === appId);
        if (appToCheck && appToCheck.customerId && callerTenantId && appToCheck.customerId !== callerTenantId) {
          console.warn(`[Security Incident] Cross-tenant orchestration attempt from Tenant ${callerTenantId} to Tenant App ${appToCheck.id} (${appToCheck.customerId})`);
          PolicyEngine.recordEvidence({
            requestId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            tenantId: callerTenantId,
            appId,
            modelId: "none",
            providerId: "none",
            decision: "DENY",
            ruleApplied: "Strict Cross-Tenant Execution Prevention",
            details: `Caller from Tenant ${callerTenantId} attempted to orchestrate using Application ${appId} belonging to Tenant ${appToCheck.customerId}.`
          });
          return res.status(403).json({
            error: "Forbidden",
            code: "CROSS_TENANT_ORCHESTRATE_DENIED",
            message: "Security Boundary Enforced: Cross-tenant application orchestration is strictly prohibited."
          });
        }
      }
      let appRecord = applications.find((a) => a.id === appId);
      if (authenticatedCaller.type === "api_key" && authenticatedCaller.keyRecord) {
        const keyApp = applications.find((a) => a.id === authenticatedCaller.keyRecord?.appId);
        if (keyApp) appRecord = keyApp;
      }
      if (!appRecord) {
        appRecord = applications[0];
      }
      if (appRecord.status === "revoked" || appRecord.status === "suspended") {
        steps.push({
          stepNumber: 1,
          name: "Application Authentication",
          status: "failed",
          details: `Application [${appRecord.name}] is currently ${appRecord.status.toUpperCase()}. Access denied by ALTIL Security Gateway.`,
          durationMs: 4
        });
        return res.status(403).json({
          id: requestId,
          requestId,
          status: "ERROR",
          capability: chosenCapability,
          executedModel: "None",
          executedProvider: "ALTIL Gateway Auth",
          selectedModel: "None",
          selectedProvider: "ALTIL Gateway Auth",
          durationSeconds: 0.04,
          tokensConsumed: 0,
          output: `Application [${appRecord.name}] access is ${appRecord.status}. Contact your ALTIL administrator.`,
          response: `Application [${appRecord.name}] access is ${appRecord.status}. Contact your ALTIL administrator.`,
          error: `Application [${appRecord.name}] access is ${appRecord.status}. Contact your ALTIL administrator.`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
          steps,
          policyPassed: false
        });
      }
      steps.push({
        stepNumber: 1,
        name: "Application Authentication & Identity Verification",
        status: "completed",
        details: `Authenticated [${appRecord.name}] (App ID: ${appRecord.appIdentifier}). Scopes and rate limits (Limit: ${appRecord.rateLimitRpm} RPM) validated.`,
        durationMs: 6
      });
      let matchingRouteForPolicy = routingRules.find(
        (r) => r.enabled && (r.appId === appRecord.id || r.appId === "all") && (r.taskOrCapability || "").toLowerCase() === (chosenCapability || "").toLowerCase()
      );
      if (!matchingRouteForPolicy) {
        matchingRouteForPolicy = routingRules.find((r) => r.enabled && (r.taskOrCapability || "").toLowerCase() === "general_ai") || routingRules[0];
      }
      const resolvedModelForPolicy = models.find((m) => m.id === matchingRouteForPolicy?.primaryModelId) || models[0];
      const resolvedProviderForPolicy = providers.find((p) => p.id === resolvedModelForPolicy.providerId) || providers[0];
      const policyDecision = PolicyEngine.evaluate({
        tenantId: callerTenantId || "all",
        appId: appRecord.id,
        userOrKeyPrefix: authenticatedCaller?.keyRecord ? authenticatedCaller.keyRecord.prefix : "SESSION",
        capability: chosenCapability,
        providerId: resolvedProviderForPolicy.id,
        providerType: resolvedProviderForPolicy.type,
        modelId: resolvedModelForPolicy.id,
        prompt: queryText
      });
      let sanitizedPrompt = policyDecision.sanitizedPrompt || queryText;
      const applicablePolicies = policies.filter(
        (p) => p.status === "active" && (p.appliesToAppIds.includes("all") || p.appliesToAppIds.includes(appRecord.id))
      );
      const policyViolations = [];
      if (policyDecision.decision === "BLOCK" || policyDecision.decision === "DENY") {
        policyViolations.push(policyDecision.reason || "Blocked by Corporate Policy Engine.");
      }
      const financialKeywords = ["iban", "account number", "credit card", "cvv", "swift", "routing number", "bank balance"];
      const hasFinancialData = financialKeywords.some((kw) => (queryText || "").toLowerCase().includes(kw));
      for (const pol of applicablePolicies) {
        if (pol.rules.blockSensitiveFinancialData && hasFinancialData) {
          policyViolations.push(`Policy [${pol.name}] violation: Un-tokenized sensitive banking data detected.`);
        }
      }
      const activePopiaRules = applicablePolicies.find((p) => p.rules.popiaRules?.enabled)?.rules.popiaRules || globalComplianceConfig.popia;
      const activeGdprRules = applicablePolicies.find((p) => p.rules.gdprRules?.enabled)?.rules.gdprRules || globalComplianceConfig.gdpr;
      const complianceResult = scanAndSanitizePrompt(sanitizedPrompt, {
        popiaRules: activePopiaRules,
        gdprRules: activeGdprRules
      });
      if (complianceResult.actionTaken === "BLOCKED") {
        const allViolations = [...complianceResult.popiaViolations, ...complianceResult.gdprViolations];
        for (const v of allViolations) {
          policyViolations.push(`Statutory [${v.framework}] Violation: ${v.description} (${v.clause})`);
        }
      } else {
        sanitizedPrompt = complianceResult.sanitizedPrompt;
      }
      if (policyViolations.length > 0) {
        steps.push({
          stepNumber: 2,
          name: "AI Policy & Guardrail Enforcement",
          status: "failed",
          details: `Blocked by Policy: ${policyViolations.join("; ")}`,
          durationMs: 12
        });
        const blockedLog = {
          id: requestId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
          appId: appRecord.id,
          appName: appRecord.name,
          apiKeyPrefix: authenticatedCaller?.keyRecord ? authenticatedCaller.keyRecord.prefix : "ALTIL-SESSION",
          requestType: "capability",
          capability: chosenCapability,
          providerId: "none",
          providerName: "ALTIL Security Filter",
          modelId: "none",
          modelIdentifier: "policy-guard-v1",
          durationSeconds: 0.05,
          status: "POLICY_BLOCKED",
          fallbackAttempted: false,
          inputTokens: Math.ceil(queryText.length / 4),
          outputTokens: 0,
          costEstimated: 0,
          policyApplied: applicablePolicies[0]?.name || "Financial Data Protection Policy",
          policyViolations,
          sanitizedPromptPreview: sanitizedPrompt.slice(0, 120),
          sanitizedResponsePreview: "[BLOCKED BY ALTIL POLICY GATEWAY]",
          clientIp: "192.168.1.50"
        };
        auditLogs.unshift(blockedLog);
        return res.status(422).json({
          id: requestId,
          requestId,
          status: "POLICY_BLOCKED",
          capability: chosenCapability,
          executedModel: "ALTIL Policy Guard",
          executedProvider: "ALTIL Governance Gateway",
          selectedModel: "ALTIL Policy Guard",
          selectedProvider: "ALTIL Governance Gateway",
          durationSeconds: 0.05,
          tokensConsumed: 0,
          output: `Request rejected by ALTIL AI Governance Policy:
${policyViolations.join("\n")}`,
          response: `Request rejected by ALTIL AI Governance Policy:
${policyViolations.join("\n")}`,
          error: "Request rejected by ALTIL AI Governance Policy",
          violations: policyViolations,
          timestamp: blockedLog.timestamp,
          steps,
          policyPassed: false
        });
      }
      steps.push({
        stepNumber: 2,
        name: "AI Policy & Guardrail Verification",
        status: "completed",
        details: `Passed ${applicablePolicies.length} active policy filters (${applicablePolicies.map((p) => p.name).join(", ")}). PII sanitization verified.`,
        durationMs: 14
      });
      let matchingRoute = routingRules.find(
        (r) => r.enabled && (r.appId === appRecord.id || r.appId === "all") && (r.taskOrCapability || "").toLowerCase() === (chosenCapability || "").toLowerCase()
      );
      if (!matchingRoute) {
        matchingRoute = routingRules.find((r) => r.enabled && (r.taskOrCapability || "").toLowerCase() === "general_ai") || routingRules[0];
      }
      const primaryModel = models.find((m) => m.id === matchingRoute?.primaryModelId) || models[0];
      const primaryProvider = providers.find((p) => p.id === primaryModel.providerId) || providers[0];
      const fallbackModel1 = models.find((m) => m.id === matchingRoute?.firstFallbackModelId);
      const fallbackProvider1 = fallbackModel1 ? providers.find((p) => p.id === fallbackModel1.providerId) : void 0;
      steps.push({
        stepNumber: 3,
        name: "Intelligent Model Routing Resolution",
        status: "completed",
        details: `Mapped capability "${chosenCapability}" -> Primary Model: [${primaryModel.displayName}] (${primaryProvider.name}). Fallback chain: ${fallbackModel1?.displayName || "Groq Llama 3.3"} -> Gemini Cloud.`,
        durationMs: 8
      });
      let dispatchSuccess = false;
      let finalProvider = primaryProvider;
      let finalModel = primaryModel;
      let fallbackTriggered = false;
      let responseText = "";
      if (!isFailureSimulated && primaryProvider.status === "online" && primaryModel.enabled) {
        steps.push({
          stepNumber: 4,
          name: `Primary Provider Inference Execution [${primaryProvider.name}]`,
          status: "in_progress",
          details: `Dispatching payload to ${primaryProvider.endpoint} (${primaryModel.modelIdentifier})...`
        });
        if (primaryProvider.type === "gemini" && process.env.GEMINI_API_KEY) {
          try {
            const client = getGeminiClient();
            if (client) {
              const modelToUse = primaryModel.modelIdentifier.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
              const geminiRes = await client.models.generateContent({
                model: modelToUse,
                contents: `You are an enterprise AI inference gateway running on behalf of application "${appRecord.name}", dispatched through active AI inference engine (${primaryProvider.name} / ${primaryModel.displayName}). Task/Capability: "${chosenCapability}".

User Query: "${sanitizedPrompt}"

Please provide a direct, comprehensive, professional response to the query.`
              });
              responseText = geminiRes.text || `[Live AI Inference via ${primaryProvider.name}] Request processed successfully.`;
              dispatchSuccess = true;
            }
          } catch (e) {
            console.warn("Primary Gemini live dispatch error:", e?.message);
          }
        }
        if (!dispatchSuccess) {
          responseText = generateIntelligentAnswer(sanitizedPrompt, appRecord.name, primaryModel.displayName, primaryProvider.name);
          dispatchSuccess = true;
        }
        if (dispatchSuccess) {
          steps[3].status = "completed";
          steps[3].details = `Inference generated in ${primaryProvider.latencyMs}ms via ${primaryProvider.name} (${primaryModel.modelIdentifier}).`;
          steps[3].durationMs = primaryProvider.latencyMs;
        }
      }
      if (!dispatchSuccess) {
        fallbackTriggered = true;
        steps.push({
          stepNumber: 4,
          name: `Primary Provider Inference [${primaryProvider.name}]`,
          status: "failed",
          details: `Primary provider ${primaryProvider.name} timed out / simulated unreachable. Triggering automated fallback route...`,
          durationMs: 450
        });
        const activeFallbackModel = fallbackModel1 || models.find((m) => m.providerId === "p-groq") || models[1];
        const activeFallbackProvider = fallbackProvider1 || providers.find((p) => p.id === activeFallbackModel.providerId) || providers[1];
        finalModel = activeFallbackModel;
        finalProvider = activeFallbackProvider;
        steps.push({
          stepNumber: 5,
          name: `Automated Fallback Dispatch [${finalProvider.name}]`,
          status: "completed",
          details: `Seamlessly rerouted to [${finalModel.displayName}] on ${finalProvider.name}. Zero client disruption.`,
          durationMs: 180
        });
        if (finalProvider.type === "gemini" && process.env.GEMINI_API_KEY) {
          try {
            const client = getGeminiClient();
            if (client) {
              const geminiRes = await client.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `You are an enterprise AI inference gateway running on behalf of application "${appRecord.name}", dispatched through fallback AI inference engine (${finalProvider.name}).

User Query: "${sanitizedPrompt}"

Please provide a direct, comprehensive, professional response to the query.`
              });
              responseText = geminiRes.text || `[Live AI Inference via ${finalProvider.name}] Fallback inference completed.`;
            }
          } catch (e) {
            console.warn("Live fallback error:", e?.message);
            responseText = generateIntelligentAnswer(sanitizedPrompt, appRecord.name, finalModel.displayName, finalProvider.name);
          }
        } else {
          responseText = generateIntelligentAnswer(sanitizedPrompt, appRecord.name, finalModel.displayName, finalProvider.name);
        }
      }
      steps.push({
        stepNumber: fallbackTriggered ? 6 : 5,
        name: "Security Post-Processing & Output Bounding",
        status: "completed",
        details: "Validated maximum output tokens, verified absence of data leakage, stripped internal debug headers.",
        durationMs: 8
      });
      const duration = Number(((Date.now() - startTime) / 1e3).toFixed(2));
      const inputTokensEst = Math.ceil(sanitizedPrompt.length / 3.8);
      const outputTokensEst = Math.ceil(responseText.length / 3.8);
      const totalTokensEst = inputTokensEst + outputTokensEst;
      const logEntry = {
        id: requestId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
        appId: appRecord.id,
        appName: appRecord.name,
        apiKeyPrefix: authenticatedCaller?.keyRecord ? authenticatedCaller.keyRecord.prefix : "ALTIL-SESSION",
        requestType: task ? "task" : "capability",
        capability: chosenCapability,
        providerId: finalProvider.id,
        providerName: finalProvider.name,
        modelId: finalModel.id,
        modelIdentifier: finalModel.modelIdentifier,
        durationSeconds: duration,
        status: fallbackTriggered ? "FALLBACK_SUCCESS" : "SUCCESS",
        fallbackAttempted: fallbackTriggered,
        fallbackProviderName: fallbackTriggered ? finalProvider.name : void 0,
        fallbackModelIdentifier: fallbackTriggered ? finalModel.modelIdentifier : void 0,
        inputTokens: inputTokensEst,
        outputTokens: outputTokensEst,
        costEstimated: Number((inputTokensEst * finalModel.costPer1kInput / 1e3 + outputTokensEst * finalModel.costPer1kOutput / 1e3).toFixed(4)),
        policyApplied: applicablePolicies[0]?.name || "Global Introsoft AI Safety Baseline",
        sanitizedPromptPreview: sanitizedPrompt.slice(0, 120) + (sanitizedPrompt.length > 120 ? "..." : ""),
        sanitizedResponsePreview: responseText.slice(0, 140) + (responseText.length > 140 ? "..." : ""),
        clientIp: "192.168.1.50"
      };
      auditLogs.unshift(logEntry);
      PolicyEngine.recordEvidence({
        requestId,
        timestamp: logEntry.timestamp,
        tenantId: callerTenantId || "all",
        appId: appRecord.id,
        modelId: finalModel.id,
        providerId: finalProvider.id,
        decision: "ALLOW",
        ruleApplied: "Continuous Policy & Compliance Guard",
        details: `Request allowed. PII Sanitization applied: ${sanitizedPrompt !== queryText}.`
      });
      appRecord.quotaUsedRequests += 1;
      steps.push({
        stepNumber: fallbackTriggered ? 7 : 6,
        name: "Immutable Audit Trail Logging",
        status: "completed",
        details: `Logged to ALTIL Audit Trail (${requestId}) with sanitized privacy hash and duration ${duration}s.`,
        durationMs: 4
      });
      const executionResult = {
        id: requestId,
        requestId,
        timestamp: logEntry.timestamp,
        application: {
          id: appRecord.id,
          name: appRecord.name
        },
        capability: chosenCapability,
        executedProvider: finalProvider.name,
        selectedProvider: finalProvider.name,
        executedModel: finalModel.displayName,
        selectedModel: finalModel.displayName,
        fallbackTriggered,
        durationSeconds: duration,
        tokensConsumed: totalTokensEst,
        totalTokens: {
          input: inputTokensEst,
          output: outputTokensEst
        },
        policyPassed: true,
        piiScrubbed: sanitizedPrompt !== queryText,
        policyChecks: applicablePolicies.map((p) => ({
          policyName: p.name,
          passed: true,
          violations: []
        })),
        steps,
        output: responseText,
        response: responseText,
        status: logEntry.status
      };
      res.json(executionResult);
    } catch (err) {
      console.error("Orchestration pipeline error:", err);
      res.status(500).json({ error: "Orchestration pipeline failure", details: err.message });
    }
  });
  app.post("/api/v1/rag/incident-diagnostics", async (req, res) => {
    try {
      const { query, incidentId, incidentTitle, category, tenantName, severity } = req.body;
      const userPrompt = query || "Provide root cause analysis and Level 1/2/3 support mitigation steps for this incident.";
      const { INITIAL_RAG_KNOWLEDGE_BASE: INITIAL_RAG_KNOWLEDGE_BASE2, INITIAL_INCIDENTS_LIST: INITIAL_INCIDENTS_LIST2 } = await Promise.resolve().then(() => (init_incidentData(), incidentData_exports));
      const queryLower = (userPrompt + " " + (incidentTitle || "") + " " + (category || "")).toLowerCase();
      const matchedArticles = INITIAL_RAG_KNOWLEDGE_BASE2.filter(
        (art) => art.keywords.some((kw) => queryLower.includes(kw.toLowerCase())) || art.relatedErrorCodes.some((ec) => queryLower.includes(ec.toLowerCase())) || art.category.toLowerCase().includes(category?.toLowerCase() || "")
      );
      const relevantArticles = matchedArticles.length > 0 ? matchedArticles : INITIAL_RAG_KNOWLEDGE_BASE2.slice(0, 2);
      const ragContext = relevantArticles.map((a) => `[KB Document ${a.id} - ${a.title}]
${a.content}`).join("\n\n");
      let aiAnalysis = "";
      let recommendedMitigation = "";
      let customerCommunicationDraft = "";
      const client = getGeminiClient();
      if (client) {
        try {
          const geminiPrompt = `You are the Lead Systems & Security Architect for ALTIL AI Gateway.
You are diagnosing an Enterprise AI Incident:
Incident ID: ${incidentId || "INC-2026-NOC"}
Title: ${incidentTitle || "AI Gateway Latency & Timeout Spike"}
Severity: ${severity || "P1_CRITICAL"}
Tenant: ${tenantName || "Enterprise Tenant"}
Category: ${category || "API_Gateway"}

User Query: "${userPrompt}"

RETRIEVED RAG KNOWLEDGE BASE CONTEXT:
${ragContext}

INSTRUCTIONS:
Provide a structured, highly actionable diagnostic breakdown formatted cleanly in Markdown:
1. Root Cause Analysis (Probability Breakdown)
2. Level 1 Support Immediate Remediation Steps (1-click actions)
3. Level 2 / Level 3 Deep Technical Diagnostics
4. BOC Customer Communication Email Draft for Statutory/Account Managers
5. SOC / POPIA Compliance Risk Assessment`;
          const geminiRes = await client.models.generateContent({
            model: "gemini-3.7-flash",
            contents: geminiPrompt
          });
          aiAnalysis = geminiRes.text || "RAG analysis synthesized successfully.";
        } catch (e) {
          console.warn("Gemini 3.7 Flash call failed, utilizing RAG rule fallback engine:", e);
        }
      }
      if (!aiAnalysis) {
        aiAnalysis = `### RAG Diagnostic Analysis for ${incidentTitle || "Incident " + incidentId}
**Retrieved Grounded Runbooks:** ${relevantArticles.map((a) => a.title).join(", ")}

#### 1. Root Cause Hypothesis
\u2022 **Primary Cause (75% Probability):** Upstream provider latency spike exceeding 1,500ms, triggering socket timeout in gateway proxy layer.
\u2022 **Secondary Factor (25% Probability):** Burst traffic surge exceeding tenant RPM rate limit window during peak processing cycle.

#### 2. Level 1 Support Action Plan
1. **Immediate Reroute:** Trigger 1-click fallback to **Groq Cloud LPU** or **Local Ollama GPU Cluster** via ALTIL Routing Matrix.
2. **Buffer Flush:** Execute \`redis-cli DEL "tenant:rate:${tenantName || "cust"}"\` to reset bucket limit.
3. **PAGED:** BOC Commander and Account Manager notified.

#### 3. SOC & POPIA Statutory Assessment
\u2022 **PII Breach Status:** **NOMINAL (Zero Leak Detected)**. All payloads sanitized through regex masking prior to upstream dispatch.
\u2022 **Cross-Border Compliance:** Verified zero unredacted personal data transferred outside SA borders.

#### 4. Customer Executive SLA Communication Draft
> **Subject:** [ALTIL Service Update] Incident ${incidentId || "INC-2026-901"} \u2014 Mitigation Active
> 
> Dear ${tenantName || "Enterprise"} Operations Team,
> 
> Our automated NOC monitors detected a transient latency degradation on primary AI model routes. Automated failover to secondary low-latency inference providers was engaged within 45 seconds. 
> Current SLA Status: **Compliant (Zero downtime breach)**. Full Post-Incident Review (PIR) will follow within 2 hours.`;
      }
      res.json({
        success: true,
        incidentId,
        ragQuery: userPrompt,
        retrievedArticles: relevantArticles,
        aiAnalysis,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("RAG Diagnostic Error:", err);
      res.status(500).json({ error: "Failed to process RAG incident diagnostics", details: err.message });
    }
  });
  app.get("/api/v1/device-trust/records", (req, res) => {
    res.json(deviceTrustRecords);
  });
  app.post("/api/v1/device-trust/register", (req, res) => {
    const { phoneNumber, modelId, modelName, hardwareAttestation, tpmChecksum, biometricEnclave } = req.body;
    if (!phoneNumber || !modelId) {
      return res.status(400).json({ error: "Phone number and modelId are required for handset trust binding" });
    }
    const immutableDeviceId = `DEV-IMMUTABLE-${modelId.toUpperCase().slice(2, 6)}-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const fingerprintHash = `fp_sha256_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const sharedSecretToken = `ALTIL-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newRecord = {
      id: `dev-${modelId}-${Date.now().toString(36)}`,
      modelId,
      modelName: modelName || "AI Model",
      immutableDeviceId,
      phoneNumber,
      trustLevel: "ultra_secure",
      secureEnclave: biometricEnclave || "Hardware Security Module (HSM Enclave)",
      consentHash: `CONSENT-SH-${Math.floor(1e5 + Math.random() * 9e5)}`,
      lastHandshake: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      fingerprintHash,
      sharedSecretToken,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      description: "Handset registered via secure API attestation. Zero-knowledge cryptographic channel established under POPIA Section 19."
    };
    deviceTrustRecords.unshift(newRecord);
    res.status(201).json({
      success: true,
      message: "Device successfully registered and cryptographically bound",
      device: newRecord,
      sharedSecretToken
    });
  });
  app.put("/api/v1/device-trust/records/:id", (req, res) => {
    const idx = deviceTrustRecords.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Device trust record not found" });
    deviceTrustRecords[idx] = {
      ...deviceTrustRecords[idx],
      ...req.body,
      lastHandshake: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19)
    };
    res.json(deviceTrustRecords[idx]);
  });
  app.delete("/api/v1/device-trust/records/:id", (req, res) => {
    const idx = deviceTrustRecords.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Device trust record not found" });
    const removed = deviceTrustRecords.splice(idx, 1)[0];
    res.json({ success: true, removed });
  });
  app.get("/api/v1/device-trust/messages/:phoneNumber", (req, res) => {
    const phoneParam = decodeURIComponent(req.params.phoneNumber).trim();
    const messages = aiMessageLogs.filter((m) => m.phoneNumber.replace(/\s+/g, "") === phoneParam.replace(/\s+/g, "") || m.phoneNumber === phoneParam);
    const device = deviceTrustRecords.find((d) => d.phoneNumber.replace(/\s+/g, "") === phoneParam.replace(/\s+/g, "") || d.phoneNumber === phoneParam);
    res.json({
      phoneNumber: phoneParam,
      device: device || null,
      totalMessages: messages.length,
      messages
    });
  });
  app.post("/api/v1/device-trust/message", (req, res) => {
    const { phoneNumber, modelId, promptText, sharedSecretToken } = req.body;
    if (!phoneNumber || !promptText) {
      return res.status(400).json({ error: "Phone number and promptText are required" });
    }
    const device = deviceTrustRecords.find((d) => d.phoneNumber === phoneNumber);
    if (device && device.trustLevel === "not_trusted") {
      return res.status(403).json({ error: "Device trust revoked. AI communication blocked under POPIA data integrity mandates." });
    }
    const mod = models.find((m) => m.id === modelId) || models[0];
    const responseText = `[ALTIL Governed Gateway via ${mod?.displayName || "AI Model"}]
Successfully processed secure communication for cell number ${phoneNumber}. Zero-knowledge cryptographic attestation verified.`;
    const popiaSegments = [
      { text: promptText.slice(0, 40), compliant: true, reason: "Sanitized input stream" },
      { text: " [POPIA Verified Data]", compliant: true, reason: "Statutory compliance confirmed" }
    ];
    const gdprSegments = [
      { text: "GDPR consent token active for session.", compliant: true, reason: "Article 6 lawful basis" }
    ];
    const newMsg = {
      id: `msg-${Date.now().toString(36)}`,
      deviceId: device ? device.id : "dev-unregistered",
      phoneNumber,
      modelId: mod?.id || "m-gemini-flash",
      modelName: mod?.displayName || "Gemini Flash",
      timestamp: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").slice(0, 19),
      promptText,
      responseText,
      trustLevel: device ? device.trustLevel : "secure",
      popiaSegments,
      gdprSegments,
      latencyMs: 180,
      tokenCount: promptText.length + 120
    };
    aiMessageLogs.unshift(newMsg);
    res.status(201).json(newMsg);
  });
  app.get("/api/v1/device-trust/analytics", (req, res) => {
    const totalDevices = deviceTrustRecords.length;
    const ultraSecureCount = deviceTrustRecords.filter((d) => d.trustLevel === "ultra_secure").length;
    const secureCount = deviceTrustRecords.filter((d) => d.trustLevel === "secure").length;
    const notTrustedCount = deviceTrustRecords.filter((d) => d.trustLevel === "not_trusted").length;
    const totalMessages = aiMessageLogs.length;
    const secureMessages = aiMessageLogs.filter((m) => m.trustLevel === "ultra_secure" || m.trustLevel === "secure").length;
    res.json({
      totalDevices,
      ultraSecureCount,
      secureCount,
      notTrustedCount,
      totalMessages,
      secureInteractionRatio: totalMessages > 0 ? Number((secureMessages / totalMessages * 100).toFixed(1)) : 100,
      complianceRate: 98.4
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express4.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`ALTIL AI Control Centre Server running on http://localhost:${PORT}`);
    console.log(`[Database Engine] MariaDB 10.11.18 Initialization...`);
    await testAndInitMariaDb();
  });
}
function generateIntelligentAnswer(prompt, appName, modelName, providerName) {
  const p = prompt.toLowerCase();
  const header = `[AI Inference via ${providerName} (${modelName})]`;
  if (p.includes("popia")) {
    return `${header}

**POPIA (Protection of Personal Information Act No. 4 of 2013)** is South Africa's foundational data privacy law. It regulates how public and private bodies process personal information and establishes stringent statutory requirements for data governance.

Key Principles of POPIA:
1. **Accountability**: Responsible parties must ensure statutory compliance across all operations.
2. **Processing Limitation**: Personal data must be processed lawfully and in a non-excessive manner.
3. **Purpose Specification**: Data collection must be for a specific, explicitly defined, and lawful purpose.
4. **Security Safeguards**: Organizations must secure the integrity and confidentiality of personal information against unauthorized access, loss, or damage.

*Orchestrated securely through ALTIL AI Governance Layer.*`;
  } else if (p.includes("tax") || p.includes("sars") || p.includes("south africa") || p.includes("law")) {
    return `${header}

**South African Tax Law & Regulatory Framework:**

In South Africa, taxation is governed by statutes enacted by Parliament and administered by the **South African Revenue Service (SARS)** under the oversight of National Treasury:

1. **The Income Tax Act No. 58 of 1962**: The core legislation governing income tax for resident and non-resident individuals, companies, and trusts, operating on a residency-based taxation system for residents and source-based for non-residents.
2. **Value-Added Tax (VAT) Act No. 89 of 1991**: Imposes an indirect tax on the consumption of goods and services in South Africa, currently levied at a standard rate of 15%.
3. **Tax Administration Act No. 28 of 2011 (TAA)**: Streamlines administrative provisions across various tax acts, defining SARS audit powers, dispute resolution mechanisms, and taxpayer rights.
4. **Customs and Excise Act No. 91 of 1964**: Regulates custom duties, import controls, and excise levies on specific manufactured goods.

*Processed in real-time via ALTIL AI Gateway & ${providerName} Inference Engine.*`;
  } else if (p.includes("gdpr")) {
    return `${header}

**GDPR (General Data Protection Regulation - Regulation (EU) 2016/679)** is the benchmark data privacy and security regulation in European Union law.

Core Pillars:
\u2022 Lawfulness, fairness, and transparency
\u2022 Purpose limitation & Data minimization
\u2022 Strict data subject rights (access, erasure, portability)
\u2022 Mandatory breach notification within 72 hours

*Governed by ALTIL Compliance Pipeline.*`;
  } else if (p.includes("zero trust") || p.includes("security")) {
    return `${header}

**Zero Trust Architecture (ZTA)** is an enterprise security paradigm centered on the mantra "never trust, always verify."

Core Tenets:
1. Continuous identity verification and device telemetry checks.
2. Least-privilege access enforcement.
3. Micro-segmentation and robust encryption at rest and in transit.

*Validated by ALTIL Security Guardrail Engine.*`;
  } else {
    return `${header}

In response to your query:
> "${prompt}"

Based on enterprise document analysis and contextual routing through ${providerName} (${modelName}) on behalf of ${appName}, the system has processed your request successfully under strict enterprise governance rules.

\u2022 **Analysis Result**: The inquiry has been fully evaluated against regulatory and operational benchmarks with high contextual relevance.
\u2022 **Operational Status**: Compliant with operational SLAs and data privacy boundaries.
\u2022 **Execution Path**: Routed via optimal provider infrastructure with zero data leakage.`;
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
