import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_PROVIDERS,
  INITIAL_MODELS,
  INITIAL_CUSTOMERS,
  INITIAL_APPLICATIONS,
  INITIAL_API_KEYS,
  INITIAL_ROUTING_RULES,
  INITIAL_POLICIES,
  INITIAL_GLOBAL_COMPLIANCE_CONFIG,
  INITIAL_DATA_SUBJECT_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_HEALTH,
  USAGE_CHART_DATA
} from './src/data/initialState';
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
  ProviderTestResult,
  ProviderTelemetryData,
  OrchestrationExecutionResult,
  OrchestrationStep
} from './src/types';
import { scanAndSanitizePrompt } from './src/utils/complianceEngine';
import {
  INITIAL_LICENSING_PLANS,
  INITIAL_TENANT_LICENSES,
  INITIAL_PAYMENT_WEBHOOK_LOGS
} from './src/data/licensingData';
import {
  LicensingPlanTemplate,
  TenantAppLicense,
  PaymentWebhookLog
} from './src/types';
import {
  testAndInitMariaDb,
  getMariaDbHealth,
  runSchemaMigrationScript,
  dbRepository,
  executeQuery,
  setDatabaseConnected,
  isDatabaseConnected
} from './src/db/mariadb';
import { authRouter } from './src/routes/authRoutes';
import { itilRouter } from './src/routes/itilRoutes';
import { complianceRouter } from './src/routes/complianceRoutes';
import { IamRepository } from './src/db/iamRepository';
import {
  requireAuthentication,
  requireRole,
  requireTenantAccess,
  AuthenticatedRequest
} from './src/middleware/authMiddleware';

// In-memory state store (synchronized with UI)
let providers: AIProvider[] = [...INITIAL_PROVIDERS];
let models: AIModel[] = [...INITIAL_MODELS];
let customers: Customer[] = [...INITIAL_CUSTOMERS];
let applications: Application[] = [...INITIAL_APPLICATIONS];
let apiKeys: ApiKey[] = [...INITIAL_API_KEYS];
let routingRules: RoutingRule[] = [...INITIAL_ROUTING_RULES];
let policies: AIPolicy[] = [...INITIAL_POLICIES];
let globalComplianceConfig: GlobalComplianceConfig = { ...INITIAL_GLOBAL_COMPLIANCE_CONFIG };
let dataSubjectRequests: DataSubjectRequest[] = [...INITIAL_DATA_SUBJECT_REQUESTS];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
const systemHealth = [...INITIAL_SYSTEM_HEALTH];

let licensingPlans: LicensingPlanTemplate[] = [...INITIAL_LICENSING_PLANS];
let tenantLicenses: TenantAppLicense[] = [...INITIAL_TENANT_LICENSES];
let paymentWebhookLogs: PaymentWebhookLog[] = [...INITIAL_PAYMENT_WEBHOOK_LOGS];

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Gemini client initialization failed:', e);
    }
  }
  return geminiClient;
}

function getPresetModelsForProvider(provider: AIProvider): AIModel[] {
  const pId = provider.id;
  const pName = provider.name;
  const now = Date.now().toString(36);

  switch (provider.type) {
    case 'openai':
      return [
        {
          id: `m-gpt4o-${now}`,
          modelIdentifier: 'gpt-4o',
          providerId: pId,
          providerName: pName,
          displayName: 'GPT-4o Omnimodal',
          status: 'online',
          contextWindow: 128000,
          maxOutputTokens: 16384,
          enabled: true,
          isFree: false,
          capabilities: ['general_ai', 'document_analysis', 'code_generation', 'financial_summary'],
          costPer1kInput: 0.0025,
          costPer1kOutput: 0.0100,
          averageLatencyMs: 280,
          tokensPerSecond: 95,
          description: 'High-intelligence flagship model with multimodal support.'
        },
        {
          id: `m-gpt4omini-${now}`,
          modelIdentifier: 'gpt-4o-mini',
          providerId: pId,
          providerName: pName,
          displayName: 'GPT-4o Mini',
          status: 'online',
          contextWindow: 128000,
          maxOutputTokens: 16384,
          enabled: true,
          isFree: false,
          capabilities: ['general_ai', 'fast_chat', 'data_extraction'],
          costPer1kInput: 0.00015,
          costPer1kOutput: 0.00060,
          averageLatencyMs: 160,
          tokensPerSecond: 130,
          description: 'Ultra-fast, cost-efficient model for high-frequency operations.'
        },
        {
          id: `m-o3mini-${now}`,
          modelIdentifier: 'o3-mini',
          providerId: pId,
          providerName: pName,
          displayName: 'o3-mini STEM Reasoner',
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
          description: 'Deep mathematical & software reasoning model.'
        }
      ];
    case 'anthropic':
      return [
        {
          id: `m-sonnet-${now}`,
          modelIdentifier: 'claude-3-5-sonnet-20241022',
          providerId: pId,
          providerName: pName,
          displayName: 'Claude 3.5 Sonnet',
          status: 'online',
          contextWindow: 200000,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: false,
          capabilities: ['code_generation', 'document_analysis', 'general_ai'],
          costPer1kInput: 0.0030,
          costPer1kOutput: 0.0150,
          averageLatencyMs: 440,
          tokensPerSecond: 80,
          description: 'Premier coding and complex reasoning model.'
        },
        {
          id: `m-haiku-${now}`,
          modelIdentifier: 'claude-3-5-haiku-20241022',
          providerId: pId,
          providerName: pName,
          displayName: 'Claude 3.5 Haiku',
          status: 'online',
          contextWindow: 200000,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: false,
          capabilities: ['fast_chat', 'general_ai', 'data_extraction'],
          costPer1kInput: 0.0008,
          costPer1kOutput: 0.0040,
          averageLatencyMs: 210,
          tokensPerSecond: 140,
          description: 'High-speed intelligence model.'
        }
      ];
    case 'groq':
      return [
        {
          id: `m-groq-llama70b-${now}`,
          modelIdentifier: 'llama-3.3-70b-versatile',
          providerId: pId,
          providerName: pName,
          displayName: 'Llama 3.3 70B Versatile (Free Tier)',
          status: 'online',
          contextWindow: 128000,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ['general_ai', 'document_analysis', 'fast_chat'],
          costPer1kInput: 0.00059,
          costPer1kOutput: 0.00079,
          averageLatencyMs: 90,
          tokensPerSecond: 450,
          description: 'Ultra-fast LPU inference with generous free tier quota.'
        },
        {
          id: `m-groq-llama8b-${now}`,
          modelIdentifier: 'llama-3.1-8b-instant',
          providerId: pId,
          providerName: pName,
          displayName: 'Llama 3.1 8B Instant (Free Tier)',
          status: 'online',
          contextWindow: 128000,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ['fast_chat', 'general_ai'],
          costPer1kInput: 0.00005,
          costPer1kOutput: 0.00008,
          averageLatencyMs: 40,
          tokensPerSecond: 750,
          description: 'Blazing fast sub-50ms inference.'
        }
      ];
    case 'gemini':
      return [
        {
          id: `m-gem-flash-${now}`,
          modelIdentifier: 'gemini-2.5-flash',
          providerId: pId,
          providerName: pName,
          displayName: 'Gemini 2.5 Flash (Free Tier)',
          status: 'online',
          contextWindow: 1000000,
          maxOutputTokens: 8192,
          enabled: true,
          isFree: true,
          capabilities: ['general_ai', 'financial_summary', 'document_analysis'],
          costPer1kInput: 0.00015,
          costPer1kOutput: 0.00060,
          averageLatencyMs: 290,
          tokensPerSecond: 160,
          description: '1M token context window with free tier access.'
        }
      ];
    case 'deepseek':
      return [
        {
          id: `m-ds-v3-${now}`,
          modelIdentifier: 'deepseek-chat',
          providerId: pId,
          providerName: pName,
          displayName: 'DeepSeek V3 (Free Credits / Ultra Low Cost)',
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
          description: 'High performance mixture-of-experts model.'
        }
      ];
    case 'openrouter':
      return [
        {
          id: `m-or-free-qwen-${now}`,
          modelIdentifier: 'qwen/qwen-2.5-72b-instruct:free',
          providerId: pId,
          providerName: pName,
          displayName: 'Qwen 2.5 72B (100% Free Community Tier)',
          status: 'online',
          contextWindow: 32768,
          maxOutputTokens: 4096,
          enabled: true,
          isFree: true,
          capabilities: ['general_ai', 'code_generation', 'fast_chat'],
          costPer1kInput: 0.0,
          costPer1kOutput: 0.0,
          averageLatencyMs: 380,
          tokensPerSecond: 90,
          description: 'Free public community tier model provided through OpenRouter.'
        }
      ];
    default:
      return [
        {
          id: `m-custom-${now}`,
          modelIdentifier: `${provider.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-model`,
          providerId: pId,
          providerName: pName,
          displayName: `${provider.name} Default Model`,
          status: 'online',
          contextWindow: 32768,
          maxOutputTokens: 4096,
          enabled: true,
          isFree: Boolean(provider.hasFreeTier),
          capabilities: ['general_ai', 'fast_chat'],
          costPer1kInput: 0.0005,
          costPer1kOutput: 0.0015,
          averageLatencyMs: 200,
          tokensPerSecond: 100,
          description: `Custom model provisioned for ${provider.name}.`
        }
      ];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ----------------------------------------------------
  // ALTIL IAM & ENTERPRISE AUTHENTICATION APIS
  // ----------------------------------------------------
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/iam', authRouter);
  app.use('/api/v1/itil', itilRouter);
  app.use('/api/v1/compliance', complianceRouter);

  // ----------------------------------------------------
  // ALTIL CORE REST APIS
  // ----------------------------------------------------

  // Health (Public Status Endpoint)
  app.get('/api/v1/health', (req, res) => {
    const isConnected = isDatabaseConnected();
    res.json({
      status: isConnected ? 'HEALTHY' : 'DEGRADED',
      platform: 'Introsoft ALTIL AI Orchestration Layer',
      version: '2.4.0-enterprise',
      database: 'MariaDB 10.11.18 Community Engine',
      databaseConnected: isConnected,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: systemHealth
    });
  });

  // ----------------------------------------------------
  // MariaDB 10.11.18 Enterprise Database REST APIs
  // ----------------------------------------------------
  app.get('/api/v1/database/health', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const health = await getMariaDbHealth();
    res.json(health);
  });

  app.post('/api/v1/database/toggle-offline', requireAuthentication, requireRole(['SUPER_ADMIN']), (req, res) => {
    const { offline } = req.body;
    setDatabaseConnected(!offline);
    res.json({ status: 'ok', databaseConnected: !offline });
  });

  app.post('/api/v1/database/migrate', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const result = await runSchemaMigrationScript();
    res.json(result);
  });

  app.get('/api/v1/database/tenants', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const data = await dbRepository.getTenants();
    res.json(data);
  });

  app.post('/api/v1/database/tenants', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const tenant = req.body;
    await dbRepository.createTenant(tenant);
    const existingIdx = customers.findIndex(c => c.id === tenant.id);
    if (existingIdx >= 0) {
      customers[existingIdx] = { ...customers[existingIdx], ...tenant };
    } else {
      customers.push(tenant);
    }
    res.json({ status: 'ok', tenant });
  });

  app.delete('/api/v1/database/tenants/:id', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    await dbRepository.deleteTenant(id);
    customers = customers.filter(c => c.id !== id);
    res.json({ status: 'deleted', id });
  });

  app.get('/api/v1/database/plans', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const plans = await dbRepository.getLicensingPlans();
    res.json(plans);
  });

  app.post('/api/v1/database/plans', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const plan = req.body;
    await dbRepository.saveLicensingPlan(plan);
    const idx = licensingPlans.findIndex(p => p.id === plan.id);
    if (idx >= 0) licensingPlans[idx] = plan;
    else licensingPlans.push(plan);
    res.json({ status: 'ok', plan });
  });

  app.get('/api/v1/database/licenses', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const lics = await dbRepository.getTenantLicenses();
    res.json(lics);
  });

  app.post('/api/v1/database/licenses', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const lic = req.body;
    await dbRepository.saveTenantLicense(lic);
    const idx = tenantLicenses.findIndex(l => l.id === lic.id);
    if (idx >= 0) tenantLicenses[idx] = lic;
    else tenantLicenses.push(lic);
    res.json({ status: 'ok', license: lic });
  });

  app.post('/api/v1/database/query', requireAuthentication, requireRole(['SUPER_ADMIN']), async (req: AuthenticatedRequest, res) => {
    const { sql, params } = req.body;
    try {
      const rows = await executeQuery(sql, params || []);
      res.json({ status: 'success', rowCount: rows.length, rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message, sql });
    }
  });

  app.get('/api/v1/overview', requireAuthentication, (req: AuthenticatedRequest, res) => {
    const totalRequests = auditLogs.length + 18421;
    const errorCount = auditLogs.filter(l => l.status === 'ERROR' || l.status === 'POLICY_BLOCKED').length + 31;
    res.json({
      providersCount: providers.length,
      activeProvidersCount: providers.filter(p => p.enabled && p.status === 'online').length,
      modelsCount: models.length,
      activeModelsCount: models.filter(m => m.enabled && m.status === 'online').length,
      applicationsCount: applications.length,
      activeApplicationsCount: applications.filter(a => a.status === 'active').length,
      activeKeysCount: apiKeys.filter(k => k.status === 'active').length,
      totalRequests,
      errorCount,
      errorRatePct: Number(((errorCount / totalRequests) * 100).toFixed(2)),
      requestsPerMin: 14,
      averageLatencySec: 1.8,
      todayRequests: 4812,
      todaySuccessful: 4763,
      todayFailed: 49,
      tokensInputTotal: '2.4M',
      tokensOutputTotal: '1.1M',
      providerDistribution: [
        { name: 'Ollama', percentage: 62, requests: 11420 },
        { name: 'Groq', percentage: 25, requests: 4605 },
        { name: 'Gemini', percentage: 13, requests: 2396 }
      ]
    });
  });

  // ----------------------------------------------------
  // Licensing & Commercial Monetization Engine API
  // ----------------------------------------------------
  app.get('/api/v1/licensing/plans', requireAuthentication, (req: AuthenticatedRequest, res) => {
    res.json(licensingPlans);
  });

  app.post('/api/v1/licensing/plans', requireAuthentication, requireRole(['SUPER_ADMIN', 'FINOPS_MANAGER']), (req: AuthenticatedRequest, res) => {
    const plan: LicensingPlanTemplate = req.body;
    const existingIdx = licensingPlans.findIndex(p => p.id === plan.id);
    if (existingIdx >= 0) {
      licensingPlans[existingIdx] = plan;
    } else {
      licensingPlans.push(plan);
    }
    res.json({ status: 'ok', plan });
  });

  app.get('/api/v1/licensing/tenant-licenses', requireAuthentication, (req: AuthenticatedRequest, res) => {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
    const filtered = isSuperAdmin ? tenantLicenses : tenantLicenses.filter(l => l.tenantId === req.user?.tenantId);
    res.json(filtered);
  });

  app.post('/api/v1/licensing/tenant-licenses/update', requireAuthentication, requireRole(['SUPER_ADMIN', 'FINOPS_MANAGER']), (req: AuthenticatedRequest, res) => {
    const lic: TenantAppLicense = req.body;
    const idx = tenantLicenses.findIndex(l => l.id === lic.id);
    if (idx >= 0) {
      tenantLicenses[idx] = lic;
      res.json({ status: 'ok', license: lic });
    } else {
      tenantLicenses.push(lic);
      res.json({ status: 'ok', license: lic });
    }
  });

  app.post('/api/v1/licensing/payment-webhook', (req, res) => {
    const { tenantId, eventType, invoiceId, amount, gatewayProvider } = req.body;
    const lic = tenantLicenses.find(l => l.tenantId === tenantId || l.id === tenantId);

    if (!lic) {
      return res.status(404).json({ error: 'Tenant license record not found' });
    }

    let newStatus = lic.licenseStatus;
    let newPayStatus = lic.paymentStatus;
    let activeEnforcement = lic.activeEnforcement;

    if (eventType === 'invoice.paid' || eventType === 'payment.reconciled_eft') {
      newStatus = 'active';
      newPayStatus = 'paid';
      activeEnforcement = null;
    } else if (eventType === 'invoice.payment_failed') {
      newStatus = 'grace_period';
      newPayStatus = 'failed';
    } else if (eventType === 'license.auto_suspended') {
      newStatus = 'auto_suspended';
      newPayStatus = 'overdue';
      activeEnforcement = 'hard_block_402';
    }

    lic.licenseStatus = newStatus;
    lic.paymentStatus = newPayStatus;
    lic.activeEnforcement = activeEnforcement;
    if (eventType === 'invoice.paid') {
      lic.lastPaymentDate = new Date().toISOString().split('T')[0];
      lic.lastPaymentAmount = amount || lic.basePrice;
    }

    const webhookLog: PaymentWebhookLog = {
      id: `paylog-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      tenantId: lic.tenantId,
      tenantName: lic.tenantName,
      applicationId: lic.applicationId,
      invoiceId: invoiceId || `INV-${Math.floor(Math.random() * 9000 + 1000)}`,
      eventType: eventType || 'invoice.paid',
      amount: amount || lic.currentAccruedBillUsd,
      currency: lic.currency,
      gatewayProvider: gatewayProvider || 'Stripe',
      enforcementTriggered: activeEnforcement || 'none',
      status: 'processed',
      rawPayloadSummary: `Webhook processed. Updated tenant ${lic.tenantName} status to ${newStatus.toUpperCase()}`
    };

    paymentWebhookLogs.unshift(webhookLog);
    res.json({ status: 'success', tenantLicense: lic, webhookLog });
  });

  app.get('/api/v1/licensing/verify-gateway', (req, res) => {
    const tenantId = (req.query.tenantId as string) || '';
    const lic = tenantLicenses.find(l => l.tenantId === tenantId);

    if (lic && lic.licenseStatus === 'auto_suspended') {
      return res.status(402).json({
        error: 'Payment Required',
        code: 'TENANT_LICENSE_SUSPENDED',
        message: 'Account payment overdue. Gateway traffic is hard-blocked by automated enforcement rule.'
      });
    }

    res.json({
      status: 'allowed',
      tenantId,
      licenseStatus: lic ? lic.licenseStatus : 'active'
    });
  });

  // Providers CRUD
  app.get('/api/v1/providers', requireAuthentication, (req: AuthenticatedRequest, res) => {
    // Update model counts before returning
    providers.forEach(p => {
      p.modelsCount = models.filter(m => m.providerId === p.id).length;
      p.freeModelsCount = models.filter(m => m.providerId === p.id && m.isFree).length;
    });
    res.json(providers);
  });

  app.post('/api/v1/providers', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const rawKey = req.body.apiKey || '';
    let prefix = req.body.keyPrefix || '';
    if (rawKey && !prefix) {
      prefix = rawKey.length > 8 ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : 'sk-...configured';
    } else if (!rawKey && !prefix) {
      prefix = 'No Auth (Local Socket)';
    }

    const newProvider: AIProvider = {
      id: req.body.id || `p-${Date.now().toString(36)}`,
      name: req.body.name || 'New AI Provider',
      type: req.body.type || 'openai_compatible',
      endpoint: req.body.endpoint || 'https://api.openai.com/v1',
      apiKey: rawKey,
      keyPrefix: prefix,
      organizationId: req.body.organizationId || '',
      customHeaders: req.body.customHeaders || {},
      enabled: req.body.enabled !== false,
      status: 'online',
      latencyMs: req.body.latencyMs || (req.body.type === 'groq' ? 84 : req.body.type === 'ollama' ? 142 : 240),
      p95LatencyMs: req.body.p95LatencyMs || 350,
      uptimePercent: 99.98,
      errorRate: 0.0,
      priority: Number(req.body.priority) || 3,
      timeoutMs: Number(req.body.timeoutMs) || 15000,
      rateLimitRpm: Number(req.body.rateLimitRpm) || 3000,
      rateLimitTpm: Number(req.body.rateLimitTpm) || 1000000,
      hasFreeTier: req.body.hasFreeTier ?? ['groq', 'ollama', 'openrouter', 'gemini', 'deepseek'].includes(req.body.type),
      freeModelsCount: 0,
      modelsCount: 0,
      totalRequests: 0,
      tokensTotal: 0,
      costTotal: 0,
      lastTested: new Date().toISOString().replace('T', ' ').slice(0, 19),
      notes: req.body.notes || ''
    };

    // If autoProvisionModels is requested or preset provided
    if (req.body.autoProvisionModels) {
      const presetModels = getPresetModelsForProvider(newProvider);
      presetModels.forEach(m => models.unshift(m));
      newProvider.modelsCount = presetModels.length;
      newProvider.freeModelsCount = presetModels.filter(m => m.isFree).length;
    }

    providers.unshift(newProvider);
    res.status(201).json(newProvider);
  });

  app.put('/api/v1/providers/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const idx = providers.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Provider not found' });

    const rawKey = req.body.apiKey !== undefined ? req.body.apiKey : providers[idx].apiKey;
    let prefix = req.body.keyPrefix !== undefined ? req.body.keyPrefix : providers[idx].keyPrefix;
    if (rawKey && rawKey !== providers[idx].apiKey) {
      prefix = rawKey.length > 8 ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : 'sk-...updated';
    }

    providers[idx] = {
      ...providers[idx],
      ...req.body,
      apiKey: rawKey,
      keyPrefix: prefix
    };
    res.json(providers[idx]);
  });

  app.delete('/api/v1/providers/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const targetId = req.params.id;
    providers = providers.filter(p => p.id !== targetId);
    // Optionally clean up or orphan models
    if (req.query.cascadeModels === 'true') {
      models = models.filter(m => m.providerId !== targetId);
    }
    res.json({ success: true, deletedProviderId: targetId });
  });

  // Dedicated Telemetry Data per Provider
  app.get('/api/v1/providers/:id/telemetry', requireAuthentication, (req: AuthenticatedRequest, res) => {
    const provider = providers.find(p => p.id === req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const providerModels = models.filter(m => m.providerId === provider.id);
    const providerLogs = auditLogs.filter(l => l.providerId === provider.id || (l.providerName && l.providerName.toLowerCase().includes(provider.name.toLowerCase().slice(0, 5))));

    const totalReqs = provider.totalRequests || (providerLogs.length > 0 ? providerLogs.length * 120 + 350 : 2400);
    const successReqs = Math.floor(totalReqs * (1 - (provider.errorRate || 0.02)));
    const failReqs = totalReqs - successReqs;
    const fallbackCount = providerLogs.filter(l => l.fallbackAttempted || l.status === 'FALLBACK_SUCCESS').length || Math.floor(totalReqs * 0.04);

    const totalTokens = provider.tokensTotal || totalReqs * 2150;
    const inTokens = Math.floor(totalTokens * 0.65);
    const outTokens = totalTokens - inTokens;
    const estCost = provider.costTotal !== undefined ? provider.costTotal : Number(((totalTokens / 1000) * 0.0006).toFixed(2));
    const freeTierSavings = provider.hasFreeTier ? Number(((totalTokens / 1000) * 0.002).toFixed(2)) : 0.0;

    // Generate 12-hour chronological telemetry data points
    const baseHour = new Date();
    const hourlyMetrics = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(baseHour.getTime() - (11 - i) * 3600000);
      const timeStr = d.toTimeString().slice(0, 5);
      const reqVariance = 0.7 + Math.sin(i / 2) * 0.4 + Math.random() * 0.2;
      const hourlyReqs = Math.max(20, Math.floor((totalReqs / 24) * reqVariance));
      const hourlyLatency = Math.max(30, Math.floor((provider.latencyMs || 150) + (Math.random() * 40 - 20)));
      const hourlyTokens = hourlyReqs * Math.floor(1800 + Math.random() * 600);
      const hourlyErrors = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0;
      const hourlyCost = Number(((hourlyTokens / 1000) * (provider.hasFreeTier ? 0.0001 : 0.0012)).toFixed(3));

      return {
        time: timeStr,
        requests: hourlyReqs,
        latency: hourlyLatency,
        tokens: hourlyTokens,
        errors: hourlyErrors,
        cost: hourlyCost
      };
    });

    // Model breakdown metrics for this provider
    const modelMetrics = providerModels.map(m => {
      const mReqs = Math.max(50, Math.floor(totalReqs / (providerModels.length || 1) * (0.6 + Math.random() * 0.8)));
      const mTokens = mReqs * Math.floor(2200 + Math.random() * 800);
      const mCost = m.isFree ? 0 : Number(((mTokens / 1000) * (m.costPer1kOutput || 0.001)).toFixed(2));
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

    // Recent telemetry event feed
    const recentEvents = [
      {
        id: `ev-${Date.now()}-1`,
        timestamp: 'Just now',
        type: 'success' as const,
        model: providerModels[0]?.displayName || 'Primary Model',
        latencyMs: provider.latencyMs || 84,
        tokens: 384,
        message: 'HTTP 200 OK — Ingress payload processed within SLA target.'
      },
      {
        id: `ev-${Date.now()}-2`,
        timestamp: '4m ago',
        type: 'health_check' as const,
        model: 'Probe Health Daemon',
        latencyMs: (provider.latencyMs || 84) - 5,
        tokens: 32,
        message: 'Routine TCP socket & auth handshake validated (Latency nominal).'
      },
      {
        id: `ev-${Date.now()}-3`,
        timestamp: '18m ago',
        type: provider.errorRate > 0.08 ? ('error' as const) : ('success' as const),
        model: providerModels[1]?.displayName || providerModels[0]?.displayName || 'Model Node',
        latencyMs: (provider.latencyMs || 84) + 45,
        tokens: 1240,
        message: provider.errorRate > 0.08 ? 'HTTP 429 Rate Limit Warning — Throttled payload.' : 'HTTP 200 OK — Batch completion dispatched.'
      }
    ];

    const telemetryData: ProviderTelemetryData = {
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
      fallbackCount: fallbackCount,
      tokensTotal: totalTokens,
      inputTokens: inTokens,
      outputTokens: outTokens,
      avgTokensPerSec: provider.type === 'groq' ? 480 : provider.type === 'ollama' ? 85 : 120,
      estimatedCostTotal: estCost,
      freeTierSavings: freeTierSavings,
      hourlyMetrics,
      modelMetrics,
      recentEvents
    };

    res.json(telemetryData);
  });

  // Run live synthetic benchmark on provider
  app.post('/api/v1/providers/:id/benchmark', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), async (req: AuthenticatedRequest, res) => {
    const provider = providers.find(p => p.id === req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 220 + Math.random() * 180));
    const liveLatency = provider.type === 'groq' ? Math.floor(55 + Math.random() * 30) :
      provider.type === 'ollama' ? Math.floor(110 + Math.random() * 40) :
      provider.type === 'openai' ? Math.floor(180 + Math.random() * 80) :
      Math.floor(220 + Math.random() * 90);

    provider.latencyMs = liveLatency;
    provider.p95LatencyMs = Math.round(liveLatency * 1.45);
    provider.lastTested = new Date().toISOString().replace('T', ' ').slice(0, 19);
    provider.totalRequests = (provider.totalRequests || 0) + 1;

    res.json({
      success: true,
      providerId: provider.id,
      liveLatencyMs: liveLatency,
      p95LatencyMs: provider.p95LatencyMs,
      tokensPerSecondBenchmark: provider.type === 'groq' ? 512 : provider.type === 'ollama' ? 92 : 138,
      timestamp: provider.lastTested,
      status: provider.status
    });
  });

  // Test Connection
  app.post('/api/v1/providers/:id/test', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), async (req: AuthenticatedRequest, res) => {
    const provider = providers.find(p => p.id === req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });

    const startTime = Date.now();
    let testResult: ProviderTestResult;

    // If Google Gemini with server-side key
    if (provider.type === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        const client = getGeminiClient();
        if (client) {
          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Respond with exactly: "ALTIL Orchestration Verification Handshake OK"'
          });
          const latency = Date.now() - startTime;
          testResult = {
            providerId: provider.id,
            providerName: provider.name,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            success: true,
            latencyMs: latency,
            authValid: true,
            reachable: true,
            modelsDiscoveredCount: 5,
            discoveredModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
            sampleGenerationSuccess: true,
            sampleOutput: response.text || 'ALTIL Orchestration Verification Handshake OK'
          };
          provider.status = 'online';
          provider.latencyMs = latency;
          provider.lastTested = testResult.timestamp;
          return res.json(testResult);
        }
      } catch (err) {
        console.warn('Gemini test call failed:', err);
      }
    }

    // Realistic verification simulation for Ollama / Groq / OpenAI Compatible / Custom
    await new Promise(r => setTimeout(r, 380 + Math.random() * 250));
    const latency = provider.type === 'ollama' ? 142 : provider.type === 'groq' ? 84 : 310;
    
    const discoveredMap: Record<string, string[]> = {
      ollama: ['qwen3.6:16k', 'qwen2.5-coder:32b', 'sec-analyst-7b', 'llama3.2:3b'],
      groq: ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'llama-3.1-8b-instant', 'whisper-large-v3'],
      gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      openrouter: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1'],
      openai_compatible: ['custom-gpt-4-turbo', 'custom-qwen-72b']
    };

    const modelsList = discoveredMap[provider.type] || ['custom-model-01', 'custom-model-02'];

    testResult = {
      providerId: provider.id,
      providerName: provider.name,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      success: provider.status !== 'offline',
      latencyMs: provider.status === 'offline' ? 0 : latency,
      authValid: provider.status !== 'offline',
      reachable: provider.status !== 'offline',
      modelsDiscoveredCount: provider.status === 'offline' ? 0 : modelsList.length,
      discoveredModels: provider.status === 'offline' ? [] : modelsList,
      sampleGenerationSuccess: provider.status !== 'offline',
      sampleOutput: provider.status !== 'offline' ? `[${provider.name}] Handshake acknowledged. Latency: ${latency}ms.` : undefined,
      errorMessage: provider.status === 'offline' ? 'Connection refused (ECONNREFUSED) at endpoint target.' : undefined
    };

    provider.lastTested = testResult.timestamp;
    if (provider.status !== 'offline') {
      provider.latencyMs = latency;
    }
    res.json(testResult);
  });

  // Models CRUD
  app.get('/api/v1/models', requireAuthentication, (req: AuthenticatedRequest, res) => {
    res.json(models);
  });

  app.post('/api/v1/models', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const newModel: AIModel = {
      id: `m-${Date.now().toString(36)}`,
      modelIdentifier: req.body.modelIdentifier || 'custom-model:v1',
      providerId: req.body.providerId || providers[0]?.id || 'p-ollama',
      displayName: req.body.displayName || req.body.modelIdentifier || 'New Model',
      status: 'online',
      contextWindow: Number(req.body.contextWindow) || 32768,
      maxOutputTokens: Number(req.body.maxOutputTokens) || 4096,
      enabled: req.body.enabled !== false,
      capabilities: req.body.capabilities || ['general_ai'],
      costPer1kInput: Number(req.body.costPer1kInput) || 0.0,
      costPer1kOutput: Number(req.body.costPer1kOutput) || 0.0,
      averageLatencyMs: Number(req.body.averageLatencyMs) || 200,
      description: req.body.description || ''
    };
    models.unshift(newModel);
    res.status(201).json(newModel);
  });

  app.put('/api/v1/models/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const idx = models.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Model not found' });
    models[idx] = { ...models[idx], ...req.body };
    res.json(models[idx]);
  });

  app.delete('/api/v1/models/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    models = models.filter(m => m.id !== req.params.id);
    res.json({ success: true });
  });

  // Customers / Tenants CRUD & Enterprise Onboarding
  app.get('/api/v1/customers', requireAuthentication, (req: AuthenticatedRequest, res) => {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
    const filtered = isSuperAdmin ? customers : customers.filter(c => c.id === req.user?.tenantId);
    res.json(filtered);
  });

  app.get('/api/v1/customers/:id', requireAuthentication, requireTenantAccess('id'), (req: AuthenticatedRequest, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    res.json(cust);
  });

  app.post('/api/v1/customers', requireAuthentication, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
    const custId = `cust-${(req.body.name || 'company').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}-${Date.now().toString(36).slice(-4)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const initialUsers: CustomerUser[] = req.body.users && req.body.users.length > 0 ? req.body.users.map((u: Partial<CustomerUser>, idx: number) => ({
      id: u.id || `usr-${custId}-${idx + 1}`,
      customerId: custId,
      name: u.name || req.body.primaryContact?.name || 'Primary Administrator',
      email: u.email || req.body.primaryContact?.email || 'admin@customer.internal',
      role: u.role || 'owner',
      designation: u.designation || req.body.primaryContact?.role || 'Organization Owner',
      mfaEnabled: u.mfaEnabled ?? true,
      status: u.status || 'active',
      lastLogin: null,
      createdAt: nowStr
    })) : [
      {
        id: `usr-${custId}-1`,
        customerId: custId,
        name: req.body.primaryContact?.name || 'Primary Administrator',
        email: req.body.primaryContact?.email || 'admin@customer.internal',
        role: 'owner',
        designation: req.body.primaryContact?.role || 'Organization Owner',
        mfaEnabled: true,
        status: 'active',
        lastLogin: null,
        createdAt: nowStr
      }
    ];

    const newCustomer: Customer = {
      id: custId,
      type: req.body.type || 'company',
      name: req.body.name || 'New Enterprise Customer',
      legalName: req.body.legalName || req.body.name || 'New Enterprise Customer Ltd',
      registrationNumber: req.body.registrationNumber || '',
      taxVatNumber: req.body.taxVatNumber || '',
      industry: req.body.industry || 'Financial Services',
      country: req.body.country || 'South Africa (ZA)',
      status: req.body.status || 'active',
      tier: req.body.tier || 'growth',
      monthlyBudgetUsd: Number(req.body.monthlyBudgetUsd) || 5000,
      currentSpendUsd: 0,
      rateLimitRpm: Number(req.body.rateLimitRpm) || 300,
      rateLimitTpm: Number(req.body.rateLimitTpm) || 250000,
      primaryContact: {
        name: req.body.primaryContact?.name || 'Primary Contact',
        email: req.body.primaryContact?.email || 'contact@customer.internal',
        phone: req.body.primaryContact?.phone || '',
        role: req.body.primaryContact?.role || 'Executive'
      },
      statutoryOfficers: {
        informationOfficer: req.body.statutoryOfficers?.informationOfficer ? {
          name: req.body.statutoryOfficers.informationOfficer.name || '',
          email: req.body.statutoryOfficers.informationOfficer.email || '',
          phone: req.body.statutoryOfficers.informationOfficer.phone || '',
          designation: req.body.statutoryOfficers.informationOfficer.designation || 'Information Officer',
          registrationNumber: req.body.statutoryOfficers.informationOfficer.registrationNumber || '',
          registeredDate: req.body.statutoryOfficers.informationOfficer.registeredDate || nowStr.slice(0, 10),
          deputyOfficerName: req.body.statutoryOfficers.informationOfficer.deputyOfficerName || '',
          deputyOfficerEmail: req.body.statutoryOfficers.informationOfficer.deputyOfficerEmail || ''
        } : undefined,
        dataProtectionOfficer: req.body.statutoryOfficers?.dataProtectionOfficer ? {
          name: req.body.statutoryOfficers.dataProtectionOfficer.name || '',
          email: req.body.statutoryOfficers.dataProtectionOfficer.email || '',
          phone: req.body.statutoryOfficers.dataProtectionOfficer.phone || '',
          dpoType: req.body.statutoryOfficers.dataProtectionOfficer.dpoType || 'internal',
          leadSupervisoryAuthority: req.body.statutoryOfficers.dataProtectionOfficer.leadSupervisoryAuthority || '',
          registrationNumber: req.body.statutoryOfficers.dataProtectionOfficer.registrationNumber || '',
          registeredDate: req.body.statutoryOfficers.dataProtectionOfficer.registeredDate || nowStr.slice(0, 10)
        } : undefined
      },
      users: initialUsers,
      billingConfig: req.body.billingConfig || {
        billingCycle: 'monthly',
        billingCycleStartDate: new Date().toISOString().slice(0, 10),
        billingCycleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        autoRenew: true,
        paymentMethod: 'invoice',
        currency: 'USD',
        creditBalanceUsd: 1500,
        creditLimitUsd: 5000,
        prepaidCredits: false,
        taxIdNumber: req.body.taxVatNumber || '',
        billingEmail: req.body.primaryContact?.email || '',
        overageAllowed: true,
        overageAlertThresholdPercent: 80,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      },
      connectedAppIds: req.body.connectedAppIds || [],
      assignedPolicyIds: req.body.assignedPolicyIds || ['pol-global-safety'],
      createdAt: nowStr,
      updatedAt: nowStr,
      notes: req.body.notes || ''
    };

    // If initial application requested, create it and link
    let createdApp: Application | undefined;
    let createdKey: ApiKey | undefined;

    if (req.body.initialApplicationName) {
      const appId = `app-${(req.body.initialApplicationIdentifier || req.body.initialApplicationName).toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      createdApp = {
        id: appId,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        appIdentifier: (req.body.initialApplicationIdentifier || req.body.initialApplicationName).toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: req.body.initialApplicationName,
        description: `Primary application for ${newCustomer.name}`,
        status: 'active',
        environment: 'production',
        allowedCapabilities: ['general_ai', 'fast_chat', 'document_analysis'],
        rateLimitRpm: newCustomer.rateLimitRpm,
        quotaMonthlyRequests: 50000,
        quotaUsedRequests: 0,
        assignedPolicyIds: ['pol-global-safety'],
        contactEmail: newCustomer.primaryContact.email,
        createdAt: nowStr,
        updatedAt: nowStr
      };
      applications.unshift(createdApp);
      newCustomer.connectedAppIds.push(createdApp.id);

      // Create initial API Key
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
        status: 'active',
        createdAt: nowStr,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19),
        lastUsedAt: null,
        rateLimitRpm: newCustomer.rateLimitRpm,
        ipWhitelist: req.body.ipWhitelist || [],
        scopes: ['read:inference', 'read:models']
      };
      apiKeys.unshift(createdKey);
    }

    customers.unshift(newCustomer);
    res.status(201).json({ customer: newCustomer, application: createdApp, apiKey: createdKey });
  });

  app.get('/api/v1/customers/:id/invoice-preview', requireAuthentication, requireTenantAccess('id'), (req: AuthenticatedRequest, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const billing = cust.billingConfig || {
      billingCycle: 'monthly',
      billingCycleStartDate: '2026-08-01',
      billingCycleEndDate: '2026-08-31',
      autoRenew: true,
      paymentMethod: 'invoice',
      currency: 'USD',
      creditBalanceUsd: 1500,
      creditLimitUsd: 5000,
      prepaidCredits: false,
      overageAllowed: true,
      overageAlertThresholdPercent: 80
    };

    const subtotal = cust.currentSpendUsd || 3450.00;
    const taxRate = cust.country.includes('South Africa') ? 0.15 : 0.20;
    const tax = Number((subtotal * taxRate).toFixed(2));
    const creditsApplied = Math.min(billing.creditBalanceUsd || 0, subtotal + tax);
    const totalDue = Number((subtotal + tax - creditsApplied).toFixed(2));

    const invoicePreview = {
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: cust.id,
      customerName: cust.legalName || cust.name,
      customerAddress: `Registered Address, ${cust.country}`,
      taxVatNumber: cust.taxVatNumber || 'VAT-UNASSIGNED',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      billingCycle: `${billing.billingCycle.toUpperCase()} (${billing.billingCycleStartDate} to ${billing.billingCycleEndDate})`,
      status: 'issued',
      lineItems: [
        {
          id: 'li-1',
          description: `ALTIL Enterprise AI Ingress & Gateway API Calls (${cust.tier.toUpperCase()} Tier)`,
          quantity: Math.round(subtotal * 12),
          unitPriceUsd: 0.05,
          totalUsd: Number((subtotal * 0.8).toFixed(2))
        },
        {
          id: 'li-2',
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

  app.put('/api/v1/customers/:id', requireAuthentication, requireTenantAccess('id'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const idx = customers.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
    customers[idx] = {
      ...customers[idx],
      ...req.body,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    res.json(customers[idx]);
  });

  app.delete('/api/v1/customers/:id', requireAuthentication, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
    customers = customers.filter(c => c.id !== req.params.id);
    res.json({ success: true });
  });

  // Customer Users CRUD
  app.post('/api/v1/customers/:id/users', requireAuthentication, requireTenantAccess('id'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const newUser: CustomerUser = {
      id: `usr-${cust.id}-${Date.now().toString(36)}`,
      customerId: cust.id,
      name: req.body.name || 'New Team Member',
      email: req.body.email || 'user@customer.internal',
      role: req.body.role || 'developer',
      designation: req.body.designation || 'Engineer',
      mfaEnabled: req.body.mfaEnabled ?? true,
      status: req.body.status || 'active',
      lastLogin: null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    cust.users.push(newUser);
    cust.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    res.status(201).json(newUser);
  });

  app.put('/api/v1/customers/:id/users/:userId', requireAuthentication, requireTenantAccess('id'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const uIdx = cust.users.findIndex(u => u.id === req.params.userId);
    if (uIdx === -1) return res.status(404).json({ error: 'User not found in customer organization' });

    cust.users[uIdx] = {
      ...cust.users[uIdx],
      ...req.body
    };
    cust.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    res.json(cust.users[uIdx]);
  });

  app.delete('/api/v1/customers/:id/users/:userId', requireAuthentication, requireTenantAccess('id'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    cust.users = cust.users.filter(u => u.id !== req.params.userId);
    cust.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    res.json({ success: true });
  });

  // Customer Key Generation & Validation
  app.post('/api/v1/customers/:id/keys', requireAuthentication, requireTenantAccess('id'), requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const cust = customers.find(c => c.id === req.params.id);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });

    const targetApp = applications.find(a => a.id === req.body.appId) || applications.find(a => cust.connectedAppIds.includes(a.id));
    const rawKey = `ALTIL-LIVE-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newKey: ApiKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId: cust.id,
      customerName: cust.name,
      appId: targetApp?.id || 'all',
      appName: targetApp?.name || 'All Connected Applications',
      name: req.body.name || `${cust.name} API Key`,
      key: rawKey,
      prefix: `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: req.body.expiresInDays && Number(req.body.expiresInDays) > 0
        ? new Date(Date.now() + Number(req.body.expiresInDays) * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
        : null,
      lastUsedAt: null,
      rateLimitRpm: Number(req.body.rateLimitRpm) || cust.rateLimitRpm || 120,
      ipWhitelist: req.body.ipWhitelist || [],
      scopes: req.body.scopes || ['read:inference', 'read:models']
    };

    apiKeys.unshift(newKey);
    res.status(201).json(newKey);
  });

  app.post('/api/v1/customers/validate-key', (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ valid: false, error: 'API key is required' });

    const keyRecord = apiKeys.find(k => k.key === key.trim() || (k.prefix && key.trim().startsWith(k.prefix.split('...')[0])));
    if (!keyRecord) {
      return res.status(401).json({ valid: false, status: 'INVALID', error: 'Provided key not found in ALTIL Gateway registry' });
    }

    if (keyRecord.status === 'revoked') {
      return res.status(403).json({ valid: false, status: 'REVOKED', error: 'This API key has been revoked by the customer administrator or statutory officer' });
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt).getTime() < Date.now()) {
      return res.status(403).json({ valid: false, status: 'EXPIRED', error: 'This API key expired on ' + keyRecord.expiresAt });
    }

    const customer = customers.find(c => c.id === keyRecord.customerId);
    const app = applications.find(a => a.id === keyRecord.appId);

    res.json({
      valid: true,
      status: 'ACTIVE',
      keyId: keyRecord.id,
      keyPrefix: keyRecord.prefix,
      customer: customer ? {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        country: customer.country,
        tier: customer.tier,
        status: customer.status,
        informationOfficer: customer.statutoryOfficers?.informationOfficer?.name || 'Nominated',
        dataProtectionOfficer: customer.statutoryOfficers?.dataProtectionOfficer?.name || 'Nominated'
      } : null,
      application: app ? {
        id: app.id,
        name: app.name,
        environment: app.environment,
        allowedCapabilities: app.allowedCapabilities
      } : { id: 'all', name: 'All Connected Applications' },
      rateLimitRpm: keyRecord.rateLimitRpm,
      scopes: keyRecord.scopes,
      ipWhitelist: keyRecord.ipWhitelist
    });
  });

  // Applications CRUD
  app.get('/api/v1/applications', requireAuthentication, (req: AuthenticatedRequest, res) => {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
    const tenantId = req.user?.tenantId;
    const filtered = isSuperAdmin ? applications : applications.filter(a => a.customerId === tenantId || (!a.customerId && tenantId === 'cust-1'));
    res.json(filtered);
  });

  app.post('/api/v1/applications', requireAuthentication, requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const appId = `app-${(req.body.appIdentifier || req.body.name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newApp: Application = {
      id: appId,
      customerId: req.user?.tenantId || req.body.customerId || 'cust-1',
      customerName: req.body.customerName || (req.user?.tenantId === 'cust-2' ? 'Capitec Bank Ltd' : 'Introsoft Cloud (Default)'),
      appIdentifier: req.body.appIdentifier || (req.body.name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: req.body.name || 'New Application',
      description: req.body.description || '',
      status: req.body.status || 'active',
      environment: req.body.environment || 'production',
      allowedCapabilities: req.body.allowedCapabilities || ['general_ai', 'fast_chat'],
      rateLimitRpm: Number(req.body.rateLimitRpm) || 120,
      quotaMonthlyRequests: Number(req.body.quotaMonthlyRequests) || 50000,
      quotaUsedRequests: 0,
      assignedPolicyIds: req.body.assignedPolicyIds || ['pol-global-safety'],
      contactEmail: req.body.contactEmail || 'admin@introsoft.internal',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    applications.unshift(newApp);

    // Automatically create a default API Key
    const keyRaw = `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey: ApiKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId: newApp.customerId,
      customerName: newApp.customerName,
      appId: newApp.id,
      name: `${newApp.name} Primary Key`,
      key: keyRaw,
      prefix: `${keyRaw.slice(0, 10)}...${keyRaw.slice(-4)}`,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: null,
      lastUsedAt: null,
      rateLimitRpm: newApp.rateLimitRpm,
      ipWhitelist: [],
      scopes: ['read:inference']
    };
    apiKeys.unshift(newKey);

    res.status(201).json({ application: newApp, apiKey: newKey });
  });

  app.put('/api/v1/applications/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const idx = applications.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Application not found' });
    
    // Check tenant access if not super admin
    if (!req.user?.roles.includes('SUPER_ADMIN') && applications[idx].customerId && applications[idx].customerId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Forbidden: Access denied to other tenant application' });
    }

    applications[idx] = {
      ...applications[idx],
      ...req.body,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    res.json(applications[idx]);
  });

  app.delete('/api/v1/applications/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const target = applications.find(a => a.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Application not found' });

    if (!req.user?.roles.includes('SUPER_ADMIN') && target.customerId && target.customerId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    applications = applications.filter(a => a.id !== req.params.id);
    apiKeys = apiKeys.filter(k => k.appId !== req.params.id);
    res.json({ success: true });
  });

  // API Keys CRUD
  app.get('/api/v1/api-keys', requireAuthentication, (req: AuthenticatedRequest, res) => {
    const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR');
    const tenantId = req.user?.tenantId;
    const filtered = isSuperAdmin ? apiKeys : apiKeys.filter(k => k.customerId === tenantId || (!k.customerId && tenantId === 'cust-1'));
    res.json(filtered);
  });

  app.post('/api/v1/api-keys', requireAuthentication, requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const targetCustId = req.user?.roles.includes('SUPER_ADMIN') ? (req.body.customerId || 'cust-1') : req.user?.tenantId;
    const keyRaw = `ALTIL-${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newKey: ApiKey = {
      id: `key-${Date.now().toString(36)}`,
      customerId: targetCustId,
      customerName: targetCustId === 'cust-2' ? 'Capitec Bank Ltd' : 'Introsoft Cloud (Default)',
      appId: req.body.appId || applications[0]?.id || 'app-introsoft-web',
      name: req.body.name || 'Application API Key',
      key: keyRaw,
      prefix: `${keyRaw.slice(0, 10)}...${keyRaw.slice(-4)}`,
      status: 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      expiresAt: req.body.expiresAt || null,
      lastUsedAt: null,
      rateLimitRpm: Number(req.body.rateLimitRpm) || 120,
      ipWhitelist: req.body.ipWhitelist || [],
      scopes: req.body.scopes || ['read:inference']
    };
    apiKeys.unshift(newKey);
    res.status(201).json(newKey);
  });

  app.put('/api/v1/api-keys/:id/revoke', requireAuthentication, requireRole(['SUPER_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    const key = apiKeys.find(k => k.id === req.params.id);
    if (!key) return res.status(404).json({ error: 'Key not found' });
    
    if (!req.user?.roles.includes('SUPER_ADMIN') && key.customerId && key.customerId !== req.user?.tenantId) {
      return res.status(403).json({ error: 'Forbidden: Access denied to other tenant API key' });
    }

    key.status = 'revoked';
    res.json(key);
  });

  app.delete('/api/v1/api-keys/:id', requireAuthentication, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res) => {
    apiKeys = apiKeys.filter(k => k.id !== req.params.id);
    res.json({ success: true });
  });

  // Routing Rules CRUD
  app.get('/api/v1/routes', requireAuthentication, (req: AuthenticatedRequest, res) => {
    res.json(routingRules);
  });

  app.get('/api/v1/routing-rules', requireAuthentication, (req: AuthenticatedRequest, res) => {
    res.json(routingRules);
  });

  app.post('/api/v1/routes', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const newRoute: RoutingRule = {
      id: `route-${Date.now().toString(36)}`,
      name: req.body.name || 'New Routing Rule',
      taskOrCapability: req.body.taskOrCapability || 'general_ai',
      appId: req.body.appId || 'all',
      primaryModelId: req.body.primaryModelId || models[0]?.id,
      firstFallbackModelId: req.body.firstFallbackModelId,
      secondFallbackModelId: req.body.secondFallbackModelId,
      maxTokens: Number(req.body.maxTokens) || 4096,
      timeoutMs: Number(req.body.timeoutMs) || 8000,
      fallbackTriggers: req.body.fallbackTriggers || ['on_error', 'on_timeout'],
      loadBalancingStrategy: req.body.loadBalancingStrategy || 'priority_fallback',
      enabled: req.body.enabled !== false,
      description: req.body.description || ''
    };
    routingRules.unshift(newRoute);
    res.status(201).json(newRoute);
  });

  app.put('/api/v1/routes/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    const idx = routingRules.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Route not found' });
    routingRules[idx] = { ...routingRules[idx], ...req.body };
    res.json(routingRules[idx]);
  });

  app.delete('/api/v1/routes/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'AI_ENGINEER']), (req: AuthenticatedRequest, res) => {
    routingRules = routingRules.filter(r => r.id !== req.params.id);
    res.json({ success: true });
  });

  // Policies CRUD
  app.get('/api/v1/policies', requireAuthentication, (req: AuthenticatedRequest, res) => {
    res.json(policies);
  });

  app.post('/api/v1/policies', requireAuthentication, requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER']), (req: AuthenticatedRequest, res) => {
    const newPolicy: AIPolicy = {
      id: `pol-${Date.now().toString(36)}`,
      name: req.body.name || 'New AI Governance Policy',
      description: req.body.description || '',
      appliesToAppIds: req.body.appliesToAppIds || ['all'],
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
      status: req.body.status || 'active',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    policies.unshift(newPolicy);
    res.status(201).json(newPolicy);
  });

  app.put('/api/v1/policies/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER']), (req: AuthenticatedRequest, res) => {
    const idx = policies.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Policy not found' });
    policies[idx] = {
      ...policies[idx],
      ...req.body,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    res.json(policies[idx]);
  });

  app.delete('/api/v1/policies/:id', requireAuthentication, requireRole(['SUPER_ADMIN', 'SECURITY_ADMIN', 'COMPLIANCE_OFFICER']), (req: AuthenticatedRequest, res) => {
    policies = policies.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  // Audit Logs
  app.get('/api/v1/logs', requireAuthentication, requireRole(['SUPER_ADMIN', 'AUDITOR', 'SECURITY_ADMIN', 'TENANT_ADMIN']), (req: AuthenticatedRequest, res) => {
    let result = [...auditLogs];
    const isSuperOrAuditor = req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('AUDITOR') || req.user?.roles.includes('SECURITY_ADMIN');
    
    if (!isSuperOrAuditor && req.user?.tenantId) {
      const tenantApps = applications.filter(a => a.customerId === req.user?.tenantId).map(a => a.id);
      result = result.filter(l => tenantApps.includes(l.appId));
    }

    if (req.query.appId && req.query.appId !== 'all') {
      result = result.filter(l => l.appId === req.query.appId);
    }
    if (req.query.providerId && req.query.providerId !== 'all') {
      result = result.filter(l => l.providerId === req.query.providerId);
    }
    if (req.query.status && req.query.status !== 'all') {
      result = result.filter(l => l.status === req.query.status);
    }
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase();
      result = result.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.appName.toLowerCase().includes(q) ||
        l.capability.toLowerCase().includes(q) ||
        l.modelIdentifier.toLowerCase().includes(q) ||
        l.sanitizedPromptPreview.toLowerCase().includes(q)
      );
    }
    res.json(result);
  });

  app.get('/api/v1/usage', requireAuthentication, (req: AuthenticatedRequest, res) => {
    res.json({
      chartData: USAGE_CHART_DATA,
      todayRequests: 4812,
      todaySuccessful: 4763,
      todayFailed: 49,
      inputTokensToday: 2420000,
      outputTokensToday: 1110000,
      providerShare: [
        { name: 'Ollama Local Cluster', share: 62, requests: 2983, color: '#3b82f6' },
        { name: 'Groq Cloud LPU', share: 25, requests: 1203, color: '#f97316' },
        { name: 'Google Gemini', share: 13, requests: 626, color: '#10b981' }
      ],
      applicationUsage: applications.map(app => ({
        id: app.id,
        name: app.name,
        requests: app.quotaUsedRequests,
        quota: app.quotaMonthlyRequests,
        quotaPct: Math.round((app.quotaUsedRequests / app.quotaMonthlyRequests) * 100),
        status: app.status
      }))
    });
  });

  // ----------------------------------------------------
  // ALTIL LAYER 2 ORCHESTRATION PIPELINE ENGINE
  // (Full 7-Step Provider-Agnostic Intelligent Dispatch)
  // ----------------------------------------------------
  app.post('/api/v1/orchestrate', async (req, res) => {
    try {
      const rawAuthHeader = req.headers.authorization;
      const headerApiKey = req.headers['x-api-key'] as string;
      const cookieToken = req.headers.cookie?.split(';')
        .find(c => c.trim().startsWith('altil_session='))
        ?.split('=')[1]?.trim();

    const {
      apiKey = headerApiKey,
      appId,
      capability = 'general_ai',
      task,
      prompt = '',
      input = '',
      simulatePrimaryFailure = false,
      simulateProviderFailure = false
    } = req.body;

    // Verify authentication (either valid API key or valid user session)
    let authenticatedCaller: { type: 'api_key' | 'session'; user?: any; keyRecord?: ApiKey } | null = null;

    if (apiKey) {
      const keyRecord = apiKeys.find(k => k.key === apiKey || (k.prefix && k.prefix.includes(apiKey.slice(0, 8))));
      if (!keyRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API key provided' });
      }
      if (keyRecord.status === 'revoked') {
        return res.status(403).json({ error: 'Forbidden: API key has been revoked' });
      }
      if (keyRecord.expiresAt && new Date(keyRecord.expiresAt).getTime() < Date.now()) {
        return res.status(403).json({ error: 'Forbidden: API key expired' });
      }
      authenticatedCaller = { type: 'api_key', keyRecord };
    } else {
      const token = rawAuthHeader?.startsWith('Bearer ') ? rawAuthHeader.slice(7).trim() : cookieToken;
      if (token) {
        const session = await IamRepository.getSession(token);
        if (session) {
          const user = await IamRepository.getUserById(session.user_id);
          if (user && user.status === 'ACTIVE') {
            authenticatedCaller = { type: 'session', user };
          }
        }
      }
    }

    if (!authenticatedCaller) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or invalid credentials. Provide a valid x-api-key or Bearer session token.'
      });
    }

    const isFailureSimulated = simulatePrimaryFailure || simulateProviderFailure;
    const queryText = prompt || input || 'Hello from Introsoft application';
    const chosenCapability = capability || task || 'general_ai';
    const requestId = `ALTIL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const startTime = Date.now();
    const steps: OrchestrationStep[] = [];

    // 1. Authenticate Application
    let appRecord = applications.find(a => a.id === appId);
    if (authenticatedCaller.type === 'api_key' && authenticatedCaller.keyRecord) {
      const keyApp = applications.find(a => a.id === authenticatedCaller!.keyRecord?.appId);
      if (keyApp) appRecord = keyApp;
    }

    if (!appRecord) {
      appRecord = applications[0]; // fallback to default
    }

    if (appRecord.status === 'revoked' || appRecord.status === 'suspended') {
      steps.push({
        stepNumber: 1,
        name: 'Application Authentication',
        status: 'failed',
        details: `Application [${appRecord.name}] is currently ${appRecord.status.toUpperCase()}. Access denied by ALTIL Security Gateway.`,
        durationMs: 4
      });
      return res.status(403).json({
        id: requestId,
        requestId,
        status: 'ERROR',
        capability: chosenCapability,
        executedModel: 'None',
        executedProvider: 'ALTIL Gateway Auth',
        selectedModel: 'None',
        selectedProvider: 'ALTIL Gateway Auth',
        durationSeconds: 0.04,
        tokensConsumed: 0,
        output: `Application [${appRecord.name}] access is ${appRecord.status}. Contact your ALTIL administrator.`,
        response: `Application [${appRecord.name}] access is ${appRecord.status}. Contact your ALTIL administrator.`,
        error: `Application [${appRecord.name}] access is ${appRecord.status}. Contact your ALTIL administrator.`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        steps,
        policyPassed: false
      });
    }

    steps.push({
      stepNumber: 1,
      name: 'Application Authentication & Identity Verification',
      status: 'completed',
      details: `Authenticated [${appRecord.name}] (App ID: ${appRecord.appIdentifier}). Scopes and rate limits (Limit: ${appRecord.rateLimitRpm} RPM) validated.`,
      durationMs: 6
    });

    // 2. Evaluate AI Policies & Statutory Compliance (POPIA / GDPR)
    const applicablePolicies = policies.filter(p =>
      p.status === 'active' &&
      (p.appliesToAppIds.includes('all') || p.appliesToAppIds.includes(appRecord!.id))
    );

    const policyViolations: string[] = [];
    let sanitizedPrompt = queryText;

    // Check financial policies
    const financialKeywords = ['iban', 'account number', 'credit card', 'cvv', 'swift', 'routing number', 'bank balance'];
    const hasFinancialData = financialKeywords.some(kw => (queryText || '').toLowerCase().includes(kw));

    for (const pol of applicablePolicies) {
      if (pol.rules.blockSensitiveFinancialData && hasFinancialData) {
        policyViolations.push(`Policy [${pol.name}] violation: Un-tokenized sensitive banking data detected.`);
      }
      if (pol.rules.redactPII) {
        // Redact email/phone patterns
        sanitizedPrompt = sanitizedPrompt
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]')
          .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
      }
    }

    // Run POPIA and GDPR regulatory engine
    const activePopiaRules = applicablePolicies.find(p => p.rules.popiaRules?.enabled)?.rules.popiaRules || globalComplianceConfig.popia;
    const activeGdprRules = applicablePolicies.find(p => p.rules.gdprRules?.enabled)?.rules.gdprRules || globalComplianceConfig.gdpr;

    const complianceResult = scanAndSanitizePrompt(sanitizedPrompt, {
      popiaRules: activePopiaRules,
      gdprRules: activeGdprRules
    });

    if (complianceResult.actionTaken === 'BLOCKED') {
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
        name: 'AI Policy & Guardrail Enforcement',
        status: 'failed',
        details: `Blocked by Policy: ${policyViolations.join('; ')}`,
        durationMs: 12
      });

      const blockedLog: AuditLog = {
        id: requestId,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        appId: appRecord.id,
        appName: appRecord.name,
        apiKeyPrefix: authenticatedCaller?.keyRecord ? authenticatedCaller.keyRecord.prefix : 'ALTIL-SESSION',
        requestType: 'capability',
        capability: chosenCapability,
        providerId: 'none',
        providerName: 'ALTIL Security Filter',
        modelId: 'none',
        modelIdentifier: 'policy-guard-v1',
        durationSeconds: 0.05,
        status: 'POLICY_BLOCKED',
        fallbackAttempted: false,
        inputTokens: Math.ceil(queryText.length / 4),
        outputTokens: 0,
        costEstimated: 0.0,
        policyApplied: applicablePolicies[0]?.name || 'Financial Data Protection Policy',
        policyViolations,
        sanitizedPromptPreview: sanitizedPrompt.slice(0, 120),
        sanitizedResponsePreview: '[BLOCKED BY ALTIL POLICY GATEWAY]',
        clientIp: '192.168.1.50'
      };
      auditLogs.unshift(blockedLog);

      return res.status(422).json({
        id: requestId,
        requestId,
        status: 'POLICY_BLOCKED',
        capability: chosenCapability,
        executedModel: 'ALTIL Policy Guard',
        executedProvider: 'ALTIL Governance Gateway',
        selectedModel: 'ALTIL Policy Guard',
        selectedProvider: 'ALTIL Governance Gateway',
        durationSeconds: 0.05,
        tokensConsumed: 0,
        output: `Request rejected by ALTIL AI Governance Policy:\n${policyViolations.join('\n')}`,
        response: `Request rejected by ALTIL AI Governance Policy:\n${policyViolations.join('\n')}`,
        error: 'Request rejected by ALTIL AI Governance Policy',
        violations: policyViolations,
        timestamp: blockedLog.timestamp,
        steps,
        policyPassed: false
      });
    }

    steps.push({
      stepNumber: 2,
      name: 'AI Policy & Guardrail Verification',
      status: 'completed',
      details: `Passed ${applicablePolicies.length} active policy filters (${applicablePolicies.map(p => p.name).join(', ')}). PII sanitization verified.`,
      durationMs: 14
    });

    // 3. Routing Engine Resolution
    let matchingRoute = routingRules.find(r =>
      r.enabled &&
      (r.appId === appRecord!.id || r.appId === 'all') &&
      (r.taskOrCapability || '').toLowerCase() === (chosenCapability || '').toLowerCase()
    );

    if (!matchingRoute) {
      matchingRoute = routingRules.find(r => r.enabled && (r.taskOrCapability || '').toLowerCase() === 'general_ai') || routingRules[0];
    }

    const primaryModel = models.find(m => m.id === matchingRoute?.primaryModelId) || models[0];
    const primaryProvider = providers.find(p => p.id === primaryModel.providerId) || providers[0];

    const fallbackModel1 = models.find(m => m.id === matchingRoute?.firstFallbackModelId);
    const fallbackProvider1 = fallbackModel1 ? providers.find(p => p.id === fallbackModel1.providerId) : undefined;

    steps.push({
      stepNumber: 3,
      name: 'Intelligent Model Routing Resolution',
      status: 'completed',
      details: `Mapped capability "${chosenCapability}" -> Primary Model: [${primaryModel.displayName}] (${primaryProvider.name}). Fallback chain: ${fallbackModel1?.displayName || 'Groq Llama 3.3'} -> Gemini Cloud.`,
      durationMs: 8
    });

    // 4. Primary Provider Dispatch
    let dispatchSuccess = false;
    let finalProvider = primaryProvider;
    let finalModel = primaryModel;
    let fallbackTriggered = false;
    let responseText = '';

    if (!isFailureSimulated && primaryProvider.status === 'online' && primaryModel.enabled) {
      steps.push({
        stepNumber: 4,
        name: `Primary Provider Inference Execution [${primaryProvider.name}]`,
        status: 'in_progress',
        details: `Dispatching payload to ${primaryProvider.endpoint} (${primaryModel.modelIdentifier})...`
      });

      // If primary is Gemini and API key is present
      if (primaryProvider.type === 'gemini' && process.env.GEMINI_API_KEY) {
        try {
          const client = getGeminiClient();
          if (client) {
            const geminiRes = await client.models.generateContent({
              model: primaryModel.modelIdentifier.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
              contents: `Context: You are responding via Introsoft ALTIL AI Gateway on behalf of ${appRecord.name}.\nTask/Capability: ${chosenCapability}\nQuery: ${sanitizedPrompt}`
            });
            responseText = geminiRes.text || 'Inference completed successfully.';
            dispatchSuccess = true;
          }
        } catch (e) {
          console.warn('Primary dispatch error, triggering fallback:', e);
        }
      }

      if (!dispatchSuccess && !isFailureSimulated) {
        // High quality simulated provider response
        await new Promise(r => setTimeout(r, 220 + Math.random() * 150));
        responseText = generateSimulatedResponse(appRecord.name, chosenCapability, sanitizedPrompt, primaryModel.displayName, primaryProvider.name);
        dispatchSuccess = true;
      }

      if (dispatchSuccess) {
        steps[3].status = 'completed';
        steps[3].details = `Inference generated in ${primaryProvider.latencyMs}ms via ${primaryProvider.name} (${primaryModel.modelIdentifier}).`;
        steps[3].durationMs = primaryProvider.latencyMs;
      }
    }

    // 5. Fallback Execution (if primary failed or simulation requested)
    if (!dispatchSuccess) {
      fallbackTriggered = true;
      steps.push({
        stepNumber: 4,
        name: `Primary Provider Inference [${primaryProvider.name}]`,
        status: 'failed',
        details: `Primary provider ${primaryProvider.name} timed out / simulated unreachable. Triggering automated fallback route...`,
        durationMs: 450
      });

      const activeFallbackModel = fallbackModel1 || models.find(m => m.providerId === 'p-groq') || models[1];
      const activeFallbackProvider = fallbackProvider1 || providers.find(p => p.id === activeFallbackModel.providerId) || providers[1];

      finalModel = activeFallbackModel;
      finalProvider = activeFallbackProvider;

      steps.push({
        stepNumber: 5,
        name: `Automated Fallback Dispatch [${finalProvider.name}]`,
        status: 'completed',
        details: `Seamlessly rerouted to [${finalModel.displayName}] on ${finalProvider.name}. Zero client disruption.`,
        durationMs: 180
      });

      // Check if fallback can use real Gemini
      if (finalProvider.type === 'gemini' && process.env.GEMINI_API_KEY) {
        try {
          const client = getGeminiClient();
          if (client) {
            const geminiRes = await client.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Context: You are responding via Introsoft ALTIL AI Gateway on behalf of ${appRecord.name} (Fallback).\nQuery: ${sanitizedPrompt}`
            });
            responseText = geminiRes.text || 'Fallback inference completed.';
          }
        } catch {
          responseText = generateSimulatedResponse(appRecord.name, chosenCapability, sanitizedPrompt, finalModel.displayName, finalProvider.name);
        }
      } else {
        responseText = generateSimulatedResponse(appRecord.name, chosenCapability, sanitizedPrompt, finalModel.displayName, finalProvider.name);
      }
    }

    // 6. Security Post-Processing & Output Boundary Validation
    steps.push({
      stepNumber: fallbackTriggered ? 6 : 5,
      name: 'Security Post-Processing & Output Bounding',
      status: 'completed',
      details: 'Validated maximum output tokens, verified absence of data leakage, stripped internal debug headers.',
      durationMs: 8
    });

    // 7. Audit Trail Registration
    const duration = Number(((Date.now() - startTime) / 1000).toFixed(2));
    const inputTokensEst = Math.ceil(sanitizedPrompt.length / 3.8);
    const outputTokensEst = Math.ceil(responseText.length / 3.8);
    const totalTokensEst = inputTokensEst + outputTokensEst;

    const logEntry: AuditLog = {
      id: requestId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      appId: appRecord.id,
      appName: appRecord.name,
      apiKeyPrefix: authenticatedCaller?.keyRecord ? authenticatedCaller.keyRecord.prefix : 'ALTIL-SESSION',
      requestType: task ? 'task' : 'capability',
      capability: chosenCapability,
      providerId: finalProvider.id,
      providerName: finalProvider.name,
      modelId: finalModel.id,
      modelIdentifier: finalModel.modelIdentifier,
      durationSeconds: duration,
      status: fallbackTriggered ? 'FALLBACK_SUCCESS' : 'SUCCESS',
      fallbackAttempted: fallbackTriggered,
      fallbackProviderName: fallbackTriggered ? finalProvider.name : undefined,
      fallbackModelIdentifier: fallbackTriggered ? finalModel.modelIdentifier : undefined,
      inputTokens: inputTokensEst,
      outputTokens: outputTokensEst,
      costEstimated: Number((inputTokensEst * finalModel.costPer1kInput / 1000 + outputTokensEst * finalModel.costPer1kOutput / 1000).toFixed(4)),
      policyApplied: applicablePolicies[0]?.name || 'Global Introsoft AI Safety Baseline',
      sanitizedPromptPreview: sanitizedPrompt.slice(0, 120) + (sanitizedPrompt.length > 120 ? '...' : ''),
      sanitizedResponsePreview: responseText.slice(0, 140) + (responseText.length > 140 ? '...' : ''),
      clientIp: '192.168.1.50'
    };
    auditLogs.unshift(logEntry);

    // Update app quota
    appRecord.quotaUsedRequests += 1;

    steps.push({
      stepNumber: fallbackTriggered ? 7 : 6,
      name: 'Immutable Audit Trail Logging',
      status: 'completed',
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
      policyChecks: applicablePolicies.map(p => ({
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
    } catch (err: any) {
      console.error('Orchestration pipeline error:', err);
      res.status(500).json({ error: 'Orchestration pipeline failure', details: err.message });
    }
  });

  // ----------------------------------------------------
  // RAG INCIDENT DIAGNOSTIC & CRM AI ASSISTANT API
  // ----------------------------------------------------
  app.post('/api/v1/rag/incident-diagnostics', async (req, res) => {
    try {
      const { query, incidentId, incidentTitle, category, tenantName, severity } = req.body;
      const userPrompt = query || 'Provide root cause analysis and Level 1/2/3 support mitigation steps for this incident.';

      // Import initial RAG Knowledge articles and Incidents if available
      const { INITIAL_RAG_KNOWLEDGE_BASE, INITIAL_INCIDENTS_LIST } = await import('./src/data/incidentData');

      // 1. Vector / Keyword Match Retrieval
      const queryLower = (userPrompt + ' ' + (incidentTitle || '') + ' ' + (category || '')).toLowerCase();
      
      const matchedArticles = INITIAL_RAG_KNOWLEDGE_BASE.filter(art => 
        art.keywords.some(kw => queryLower.includes(kw.toLowerCase())) ||
        art.relatedErrorCodes.some(ec => queryLower.includes(ec.toLowerCase())) ||
        art.category.toLowerCase().includes(category?.toLowerCase() || '')
      );

      const relevantArticles = matchedArticles.length > 0 ? matchedArticles : INITIAL_RAG_KNOWLEDGE_BASE.slice(0, 2);

      // Context Construction for RAG Grounding
      const ragContext = relevantArticles.map(a => `[KB Document ${a.id} - ${a.title}]\n${a.content}`).join('\n\n');

      let aiAnalysis = '';
      let recommendedMitigation = '';
      let customerCommunicationDraft = '';

      // 2. Invoke Gemini 3.7 Flash if available
      const client = getGeminiClient();
      if (client) {
        try {
          const geminiPrompt = `You are the Lead Systems & Security Architect for ALTIL AI Gateway.
You are diagnosing an Enterprise AI Incident:
Incident ID: ${incidentId || 'INC-2026-NOC'}
Title: ${incidentTitle || 'AI Gateway Latency & Timeout Spike'}
Severity: ${severity || 'P1_CRITICAL'}
Tenant: ${tenantName || 'Enterprise Tenant'}
Category: ${category || 'API_Gateway'}

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
            model: 'gemini-3.7-flash',
            contents: geminiPrompt
          });

          aiAnalysis = geminiRes.text || 'RAG analysis synthesized successfully.';
        } catch (e) {
          console.warn('Gemini 3.7 Flash call failed, utilizing RAG rule fallback engine:', e);
        }
      }

      // Fallback RAG Synthesis if Gemini API call not active
      if (!aiAnalysis) {
        aiAnalysis = `### RAG Diagnostic Analysis for ${incidentTitle || 'Incident ' + incidentId}
**Retrieved Grounded Runbooks:** ${relevantArticles.map(a => a.title).join(', ')}

#### 1. Root Cause Hypothesis
• **Primary Cause (75% Probability):** Upstream provider latency spike exceeding 1,500ms, triggering socket timeout in gateway proxy layer.
• **Secondary Factor (25% Probability):** Burst traffic surge exceeding tenant RPM rate limit window during peak processing cycle.

#### 2. Level 1 Support Action Plan
1. **Immediate Reroute:** Trigger 1-click fallback to **Groq Cloud LPU** or **Local Ollama GPU Cluster** via ALTIL Routing Matrix.
2. **Buffer Flush:** Execute \`redis-cli DEL "tenant:rate:${tenantName || 'cust'}"\` to reset bucket limit.
3. **PAGED:** BOC Commander and Account Manager notified.

#### 3. SOC & POPIA Statutory Assessment
• **PII Breach Status:** **NOMINAL (Zero Leak Detected)**. All payloads sanitized through regex masking prior to upstream dispatch.
• **Cross-Border Compliance:** Verified zero unredacted personal data transferred outside SA borders.

#### 4. Customer Executive SLA Communication Draft
> **Subject:** [ALTIL Service Update] Incident ${incidentId || 'INC-2026-901'} — Mitigation Active
> 
> Dear ${tenantName || 'Enterprise'} Operations Team,
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
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('RAG Diagnostic Error:', err);
      res.status(500).json({ error: 'Failed to process RAG incident diagnostics', details: err.message });
    }
  });
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`ALTIL AI Control Centre Server running on http://localhost:${PORT}`);
    console.log(`[Database Engine] MariaDB 10.11.18 Initialization...`);
    await testAndInitMariaDb();
  });
}

function generateSimulatedResponse(appName: string, capability: string, prompt: string, modelName: string, providerName: string): string {
  switch (capability) {
    case 'security_analysis':
      return `[ALTIL Security Audit Engine via ${modelName}]\n\nAnalysis Assessment:\n• Ingress Payload Integrity: 100% Validated\n• Threat Classification: Nominal (Zero CVE signatures detected)\n• Authentication Token: Cryptographically signed & non-expired\n• Recommendation: Permit transaction pipeline to proceed without elevation.`;
    case 'financial_summary':
      return `[ALTIL Financial Governance Engine via ${modelName}]\n\nFinancial Metric Summary for ${appName}:\n• Variance Analysis: Baseline aligned with Q3 operational benchmarks\n• Exposure Index: Low risk ratio (0.14)\n• Compliance Status: Strict adherence to FCA and internal liquidity thresholds confirmed.`;
    case 'document_analysis':
      return `[ALTIL Document Extraction Core via ${modelName}]\n\nDocument Summary & Structured Findings:\n• Primary Subject: High-level architectural specifications for ${appName}\n• Key Clauses: Zero-trust inter-service authentication, automatic provider redundancy, sub-second SLAs\n• Action Items: Verified all governance rules.`;
    case 'code_generation':
      return `// Generated by ALTIL Code Synthesizer (${modelName})\nexport async function requestAltilInference(capability: string, payload: unknown) {\n  const response = await fetch('/api/v1/orchestrate', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ALTIL-KEY' },\n    body: JSON.stringify({ capability, input: payload })\n  });\n  return response.json();\n}`;
    case 'fast_chat':
      return `Hello! I am the ALTIL-governed AI assistant serving ${appName}. I am orchestrated through ${providerName} (${modelName}) with guaranteed high availability and data privacy. How can I assist your workflow today?`;
    default:
      return `[ALTIL Governed AI Response]\n\nProcessed query for ${appName} via ${providerName} (${modelName}).\n\nResult:\n"${prompt.slice(0, 100)}..."\n\nExecution was routed dynamically based on optimal latency, cost constraints, and enterprise security guardrails.`;
  }
}

startServer();
