export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'ollama'
  | 'openrouter'
  | 'deepseek'
  | 'mistral'
  | 'together'
  | 'openai_compatible'
  | 'custom';

import type { ProviderLocalityFacts } from './security/providerLocality';

export type DataProvenanceType = 'LIVE' | 'CALCULATED' | 'DERIVED' | 'DEMO' | 'FALLBACK';

export interface ProvenanceMetadata {
  provenance: DataProvenanceType;
  source: string;
  calculatedAt?: string;
  verified?: boolean;
  notes?: string;
}

export interface ProvenanceValue<T = any> {
  value: T;
  provenance: DataProvenanceType;
  source: string;
  calculatedAt?: string;
}

export type HealthStatus = 'online' | 'degraded' | 'offline' | 'checking';

export interface AIProvider {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  apiKey?: string;
  keyPrefix?: string;
  credentialsConfigured?: boolean;
  lastConnectionTest?: { success: boolean; timestamp: string; latencyMs?: number; errorMessage?: string };
  organizationId?: string;
  customHeaders?: Record<string, string>;
  enabled: boolean;
  status: HealthStatus;
  executionState?: 'LIVE' | 'CONFIGURED-BUT-VERIFIED' | 'CONFIGURED-BUT-NOT-VERIFIED' | 'FALLBACK' | 'UNAVAILABLE';
  provenance?: DataProvenanceType;
  /** Operator attestation that this endpoint runs on-premises or otherwise inside an ALTIL-controlled boundary. */
  onPremAttested?: boolean;
  /** Jurisdictions this deployment actually processes in. Locality enforcement fails closed when absent. */
  processingJurisdictions?: string[];
  latencyMs: number;
  p95LatencyMs?: number;
  uptimePercent?: number;
  errorRate: number;
  priority: number;
  timeoutMs: number;
  rateLimitRpm?: number;
  rateLimitTpm?: number;
  hasFreeTier?: boolean;
  freeModelsCount?: number;
  modelsCount: number;
  totalRequests: number;
  tokensTotal?: number;
  costTotal?: number;
  lastTested: string;
  notes?: string;
}

export interface AIModel {
  id: string;
  modelIdentifier: string;
  providerId: string;
  providerName?: string;
  displayName: string;
  status: HealthStatus;
  contextWindow: number;
  maxOutputTokens: number;
  enabled: boolean;
  isFree?: boolean;
  capabilities: string[];
  costPer1kInput: number;
  costPer1kOutput: number;
  averageLatencyMs: number;
  tokensPerSecond?: number;
  description: string;
  catalogSource?: string;
  lastVerifiedAt?: string;
  lastCatalogUpdateAt?: string;
  freeQuotaState?: 'available' | 'exhausted' | 'unknown';
  verificationStatus?: 'verified' | 'failed' | 'pending';
  usageCount?: number;
  tokensUsed?: number;
  lastUsedAt?: string;
}

export interface ProviderTelemetryData {
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  uptimePercent: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackCount: number;
  tokensTotal: number;
  inputTokens: number;
  outputTokens: number;
  avgTokensPerSec: number;
  estimatedCostTotal: number;
  freeTierSavings: number;
  hourlyMetrics: {
    time: string;
    requests: number;
    latency: number;
    tokens: number;
    errors: number;
    cost: number;
  }[];
  modelMetrics: {
    modelId: string;
    modelName: string;
    requests: number;
    avgLatencyMs: number;
    tokensConsumed: number;
    isFree: boolean;
    cost: number;
  }[];
  recentEvents: {
    id: string;
    timestamp: string;
    type: 'success' | 'fallback' | 'error' | 'health_check';
    model: string;
    latencyMs: number;
    tokens: number;
    message: string;
  }[];
}

export type ApplicationStatus = 'active' | 'suspended' | 'revoked';

export type CustomerType = 'company' | 'individual';
export type CustomerStatus = 'active' | 'pending_kyc' | 'trial' | 'restricted' | 'suspended' | 'archived' | 'terminated';
export type CustomerTier = 'enterprise' | 'scale' | 'growth' | 'starter' | 'startup' | 'pay_as_you_go';
export type UserRole = 'owner' | 'admin' | 'developer' | 'compliance_officer' | 'billing' | 'viewer';
export type OrgRole = 'parent_owner' | 'subsidiary' | 'partner_reseller' | 'direct_client';

export interface CustomerLifecycleEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  previousStatus?: CustomerStatus;
  newStatus?: CustomerStatus;
}

export interface ComplianceDossier {
  kycVerified: boolean;
  kycVerifiedDate?: string;
  popiaSigned: boolean;
  gdprDpaSigned: boolean;
  lastAuditedDate?: string;
  riskRating: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface CustomerBillingConfig {
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  billingCycleStartDate: string;
  billingCycleEndDate: string;
  autoRenew: boolean;
  paymentMethod: 'invoice' | 'credit_card' | 'wire_eft' | 'prepaid';
  /** Contract/invoice currency. USD is ALTIL's accounting base for new billing. */
  currency: 'USD' | 'ZAR' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'NZD' | 'JPY' | 'CNY' | 'INR' | 'SGD' | 'CHF' | 'AED' | 'BRL' | 'MXN' | 'NGN' | 'KES' | 'GHS' | 'HKD' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'KRW' | 'THB' | 'TRY' | 'ILS' | 'SAR' | 'PHP' | 'IDR';
  /** Tenant-selected display currency; does not change the USD ledger or invoice amount. */
  displayCurrency?: string;
  displayLocale?: string;
  creditBalanceUsd: number;
  creditLimitUsd: number;
  prepaidCredits: boolean;
  taxIdNumber?: string;
  billingEmail?: string;
  overageAllowed: boolean;
  overageAlertThresholdPercent: number; // e.g. 80%
  lastInvoiceAmount?: number;
  nextBillingDate?: string;
  /** Day of month invoices are prepared and delivered. Defaults to the 24th; 1–31 are valid. */
  invoiceDay?: number;
  automaticInvoicing?: boolean;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalUsd: number;
}

export interface InvoicePreview {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  taxVatNumber?: string;
  issueDate: string;
  dueDate: string;
  billingCycle: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue';
  lineItems: InvoiceLineItem[];
  subtotalUsd: number;
  taxUsd: number;
  creditsAppliedUsd: number;
  totalDueUsd: number;
}

export interface CustomerUser {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  mfaEnabled: boolean;
  status: 'active' | 'invited' | 'suspended';
  lastLogin?: string | null;
  createdAt: string;
}

export interface StatutoryOfficers {
  informationOfficer?: {
    name: string;
    email: string;
    phone: string;
    designation: string;
    registrationNumber: string; // Official Information Regulator Registration Number (e.g. ZA-IR-IO-2023-XXXX)
    registeredDate?: string;
    deputyOfficerName?: string;
    deputyOfficerEmail?: string;
  };
  dataProtectionOfficer?: {
    name: string;
    email: string;
    phone: string;
    dpoType: 'internal' | 'external_counsel';
    leadSupervisoryAuthority: string; // e.g. CNIL, BfDI, ICO, DPC
    registrationNumber: string; // Official DPO Certificate/Registration ID
    registeredDate?: string;
  };
}

export interface Customer {
  id: string;
  type: CustomerType;
  orgRole?: OrgRole;
  parentId?: string | null; // e.g. parent company or subsidiary ID
  revenueSharePercent?: number; // e.g. 15% reseller rev share
  name: string;
  legalName?: string;
  registrationNumber?: string; // Company Registration Number (CIPC SA, EU Commercial Register, etc.)
  taxVatNumber?: string;
  industry: string;
  country: string; // Country / Jurisdiction
  status: CustomerStatus;
  tier: CustomerTier;
  serviceTier?: ServiceTier;
  businessCriticality?: BusinessCriticality;
  slaProfile?: TenantSlaProfile;
  kpiProfile?: TenantKpiProfile;
  contractTerms?: TenantContractTerms;
  securityProfile?: TenantSecurityProfile;
  healthScore?: number; // 0 - 100 composite score
  code?: string;
  monthlySpendUsd?: number;
  monthlyTokenUsage?: number;
  monthlyBudgetUsd: number;
  currentSpendUsd: number;
  rateLimitRpm: number;
  rateLimitTpm?: number;
  trialEndsAt?: string | null;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  archivedAt?: string | null;
  archivedReason?: string | null;
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  billingConfig?: CustomerBillingConfig;
  complianceDossier?: ComplianceDossier;
  lifecycleEvents?: CustomerLifecycleEvent[];
  statutoryOfficers: StatutoryOfficers;
  users: CustomerUser[];
  connectedAppIds: string[];
  assignedPolicyIds: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Application {
  id: string;
  customerId?: string;
  customerName?: string;
  parentApplicationId?: string | null;
  applicationType?: 'application' | 'sub_application' | 'function';
  functionIdentifier?: string;
  appIdentifier: string;
  name: string;
  description: string;
  status: ApplicationStatus;
  environment: 'production' | 'staging' | 'development';
  /** Optional persistent environment binding; legacy records continue to use environment. */
  environmentId?: string;
  allowedCapabilities: string[];
  rateLimitRpm: number;
  quotaMonthlyRequests: number;
  quotaUsedRequests: number;
  assignedPolicyIds: string[];
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export type KeyStatus = 'active' | 'revoked' | 'expired';

export interface ApiKey {
  id: string;
  customerId?: string;
  customerName?: string;
  appId: string;
  appName?: string;
  subApplicationId?: string;
  functionIdentifier?: string;
  name: string;
  key: string;
  prefix: string;
  status: KeyStatus;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt?: string | null;
  rateLimitRpm: number;
  ipWhitelist?: string[];
  scopes: string[];
  /** Per-key commercial controls; usage is attributed to this key even when the app has multiple keys. */
  billingMode?: 'included' | 'metered' | 'prepaid';
  monthlyRequestLimit?: number | null;
  monthlySpendLimitUsd?: number | null;
  /** Optional immutable scope bindings populated by a persistence adapter when available. */
  organizationId?: string;
  environmentId?: string;
  productId?: string;
  licenseId?: string;
  policyId?: string;
  providerRestrictions?: string[];
  modelRestrictions?: string[];
  classificationRestrictions?: string[];
  validFrom?: string | null;
  replacementOf?: string | null;
  compromisedAt?: string | null;
  archivedAt?: string | null;
}

export type EnvironmentStatus = 'active' | 'suspended' | 'retired';

export interface Environment {
  id: string;
  customerId: string;
  applicationId?: string | null;
  code: string;
  name: string;
  status: EnvironmentStatus;
  createdAt: string;
  updatedAt: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export type FallbackTrigger = 'on_error' | 'on_timeout' | 'on_rate_limit';
export type LoadBalancingStrategy = 'priority_fallback' | 'round_robin' | 'lowest_latency' | 'cost_optimized';

export interface RoutingRule {
  id: string;
  name: string;
  taskOrCapability: string;
  appId: string; // 'all' or specific appId
  primaryModelId: string;
  firstFallbackModelId?: string;
  secondFallbackModelId?: string;
  maxTokens: number;
  timeoutMs: number;
  fallbackTriggers: FallbackTrigger[];
  loadBalancingStrategy: LoadBalancingStrategy;
  enabled: boolean;
  description?: string;
}

export interface PopiaComplianceRules {
  enabled: boolean;
  enforcementMode: 'strict_block' | 'redact_mask' | 'quarantine_audit' | 'warn_only';
  maskSaIdNumbers: boolean; // 13-digit South African ID (Luhn checked)
  maskSaTaxNumbers: boolean; // 10-digit SARS Tax Reference Numbers
  maskSaPhoneNumbers: boolean; // +27, 082, 071, 083, 084...
  maskSaBankingDetails: boolean; // Capitec, Standard Bank, FNB, ABSA, Nedbank formats
  blockSpecialPersonalInfo: boolean; // POPIA Part B: Race, health, biometric, criminal behavior, union membership
  enforceSection72CrossBorder: boolean; // Trans-border data transfer restrictions to non-adequate jurisdictions
  logInformationOfficerAudit: boolean; // Information Officer accountability logging
  requireConsentProofHeader: boolean;
}

export interface GdprComplianceRules {
  enabled: boolean;
  enforcementMode: 'strict_block' | 'redact_mask' | 'quarantine_audit' | 'warn_only';
  enforceArticle9SpecialCategories: boolean; // Racial/ethnic origin, political, religious, health, biometric, sexual orientation
  enforceEuSovereignResidencyOnly: boolean; // Chapter V / Schrems II - Restrict to EU-resident nodes/providers
  enforceArticle17ZeroRetention: boolean; // Zero data retention / No model training persistence
  enforceArticle22AutomatedDecisionFlag: boolean; // Automated decision-making & profiling human-in-the-loop flag
  maskEuropeanIbans: boolean; // European IBANs & BIC/SWIFT
  maskEuPassportsAndNationalIds: boolean; // EU passports, National Insurance, Fiscal codes
  maskEmailsAndIps: boolean; // Standard PII masking
  dataRetentionTtlDays: number; // Log retention policy (e.g. 30/90 days)
}

export interface AIPolicyRules {
  blockSensitiveFinancialData: boolean;
  redactPII: boolean;
  logRequestMetadata: boolean;
  anonymizePromptsInAudit: boolean;
  requireApprovedProvider: boolean;
  maxContextTokens: number;
  maxResponseTokens: number;
  enableAuditTrail: boolean;
  blockPromptInjections: boolean;
  allowedProviderIds?: string[];
  popiaRules?: PopiaComplianceRules;
  gdprRules?: GdprComplianceRules;
}

export interface AIPolicy {
  id: string;
  name: string;
  description: string;
  appliesToAppIds: string[]; // 'all' or list of appIds
  tenantId?: string;         // tenant isolation binding
  rules: AIPolicyRules;
  status: 'active' | 'draft' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export interface RegulatoryViolation {
  framework: 'POPIA' | 'GDPR';
  rule: string;
  clause: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedValueMasked: string;
  description: string;
}

export interface ComplianceScanResult {
  /** Deployment locality that was actually evaluated for this scan. */
  providerLocality?: ProviderLocalityFacts;
  passed: boolean;
  riskScore: number; // 0 to 100
  actionTaken: 'PASSED' | 'REDACTED_FORWARDED' | 'BLOCKED' | 'FLAGGED_FOR_REVIEW';
  popiaViolations: RegulatoryViolation[];
  gdprViolations: RegulatoryViolation[];
  originalPromptSnippet: string;
  sanitizedPrompt: string;
  redactedTokensCount: number;
  detectedCategories: string[];
  crossBorderTransferFlag?: {
    sourceJurisdiction: string;
    destinationProvider: string;
    destinationJurisdiction: string;
    isAdequate: boolean;
    warning?: string;
  };
  timestamp: string;
}

export interface DataSubjectRequest {
  id: string;
  /** Technical tenant scope when supplied by a persisted or explicitly scoped request. */
  tenantId?: string;
  framework: 'POPIA' | 'GDPR';
  requestType: 'access' | 'erasure' | 'rectification' | 'objection' | 'portability';
  subjectIdentifier: string;
  requestorName: string;
  appId?: string;
  status: 'pending' | 'in_progress' | 'fulfilled' | 'rejected';
  createdAt: string;
  dueAt: string;
  notes?: string;
}

export interface GlobalComplianceConfig {
  popia: PopiaComplianceRules;
  gdpr: GdprComplianceRules;
  informationOfficerName: string;
  informationOfficerEmail: string;
  euDataProtectionOfficerEmail: string;
  complianceOfficerRegistrationNumber: string;
  defaultDataRetentionDays: number;
  lastUpdated: string;
}

export type AuditLogStatus = 'SUCCESS' | 'FALLBACK_SUCCESS' | 'POLICY_BLOCKED' | 'ERROR' | 'RATE_LIMITED';

export interface AuditLog {
  id: string;
  timestamp: string;
  appId: string;
  appName: string;
  apiKeyPrefix?: string;
  requestType?: string;
  capability: string;
  providerId?: string;
  providerName: string;
  modelId?: string;
  modelIdentifier: string;
  durationSeconds: number;
  status: AuditLogStatus;
  fallbackAttempted?: boolean;
  fallbackProviderName?: string;
  fallbackModelIdentifier?: string;
  inputTokens?: number;
  outputTokens?: number;
  tokensConsumed?: number;
  costEstimated?: number;
  policyApplied?: string;
  policyChecksPassed?: boolean;
  policyViolations?: string[];
  piiScrubbed?: boolean;
  sanitizedPromptPreview?: string;
  sanitizedResponsePreview?: string;
  promptPreview?: string;
  responsePreview?: string;
  clientIp?: string;
  localEvent?: {
    source: 'LOCAL_TEST';
    actor: string;
    tenantId: string;
    requestId: string;
    method: string;
    route: string;
    statusCode: number;
    outcome: 'SUCCESS' | 'DENIED' | 'FAILURE';
    detail: string;
  };
  environment?: 'production' | 'development' | 'local-test';
  testRunId?: string;
  actorId?: string;
  actorEmail?: string;
  eventCategory?: 'APPLICATION_LOG' | 'API_REQUEST' | 'AUTHORIZATION' | 'AUDIT' | 'SECURITY_EVENT' | 'ERROR';
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: 'SUCCESS' | 'DENIED' | 'FAILURE' | 'INFO';
  organizationId?: string;
  tenantId?: string;
  requestId?: string;
  statusCode?: number;
  requiredPermission?: string;
  grantedPermissions?: string[];
  actualScope?: string;
  denialReason?: string;
}

export interface UsageMetric {
  time: string;
  ollama: number;
  groq: number;
  gemini: number;
  total: number;
}

export interface SystemHealthItem {
  id: string;
  name: string;
  category: 'core' | 'database' | 'cache' | 'provider';
  status: HealthStatus;
  details: string;
  latencyMs?: number;
  uptime: string;
}

export interface ProviderTestResult {
  providerId: string;
  providerName: string;
  timestamp: string;
  success: boolean;
  latencyMs: number;
  authValid: boolean;
  reachable: boolean;
  modelsDiscoveredCount: number;
  discoveredModels: string[];
  sampleGenerationSuccess: boolean;
  sampleOutput?: string;
  errorMessage?: string;
}

export interface OrchestrationStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  details: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationRequest {
  appId: string;
  capability: string;
  prompt: string;
}

export interface OrchestrationResponse {
  id: string;
  status: AuditLogStatus;
  capability: string;
  executedModel: string;
  executedProvider: string;
  durationSeconds: number;
  tokensConsumed: number;
  output: string;
  timestamp: string;
  fallbackTriggered?: boolean;
  policyPassed?: boolean;
  piiScrubbed?: boolean;
  metricsAvailable?: boolean;
}

export interface OrchestrationExecutionResult {
  requestId: string;
  timestamp: string;
  application: {
    id: string;
    name: string;
  };
  capability: string;
  selectedProvider: string;
  selectedModel: string;
  fallbackTriggered: boolean;
  durationSeconds: number;
  totalTokens: {
    input: number;
    output: number;
  };
  policyChecks: {
    policyName: string;
    passed: boolean;
    violations: string[];
  }[];
  steps: OrchestrationStep[];
  response: string;
  status: AuditLogStatus;
}

// ==========================================
// ENTERPRISE TENANT SERVICE MANAGEMENT & GOVERNANCE
// ==========================================

export type ServiceTier = 'standard' | 'professional' | 'enterprise' | 'custom';
export type BusinessCriticality = 'tier_0_mission_critical' | 'tier_1_business_critical' | 'tier_2_important' | 'tier_3_non_critical';

export interface TenantSlaProfile {
  id: string;
  name: string; // e.g. "Enterprise Platinum SLA"
  availabilityTargetPercent: number; // e.g. 99.95
  apiResponseTimeTargetMs: number; // e.g. 500
  maxLatencyMs: number; // e.g. 1500
  p95LatencyMsTarget: number; // e.g. 800
  p99LatencyMsTarget: number; // e.g. 2000
  errorRateTargetPercent: number; // e.g. 0.10
  p1ResponseMinutes: number; // e.g. 15
  p2ResponseMinutes: number; // e.g. 30
  p3ResponseHours: number; // e.g. 4
  p4ResponseHours: number; // e.g. 12
  rtoHours: number; // Recovery Time Objective e.g. 1
  rpoMinutes: number; // Recovery Point Objective e.g. 15
  supportHours: '24/7/365' | '24/5' | 'business_hours_8x5';
  escalationTimes: string;
  penaltyCreditRatePercent: number; // e.g. 10% credit for breach
}

export interface TenantKpiProfile {
  requestsMonthlyTarget: number;
  tokensMonthlyTarget: number;
  costMonthlyTargetUsd: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  fallbackRatePercent: number;
  availabilityPercent: number;
  piiDetectionRatePercent: number;
  policyViolationRatePercent: number;
  serviceCreditsAccruedUsd: number;
}

export interface TenantContractTerms {
  contractStartDate: string;
  contractEndDate: string;
  renewalDate: string;
  billingTerms: 'net_30' | 'net_60' | 'prepaid' | 'annual_upfront';
  currency: 'USD' | 'ZAR' | 'EUR' | 'GBP';
  monthlyMinimumUsd: number;
  spendCeilingUsd: number;
  includedTokensMonthly: number;
  overageRatePer1kTokensUsd: number;
  budgetActionOn100Percent: 'block' | 'switch_cheaper_model' | 'require_approval' | 'notify_only';
}

export interface TenantSecurityProfile {
  approvedProviderIds: string[];
  approvedModelIds: string[];
  dataResidencyRestrictions: string[]; // e.g. ["South Africa Only", "EU Sovereign Nodes"]
  allowedCapabilities: string[];
  retentionPolicyDays: number;
  businessCriticality: BusinessCriticality;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' | 'special_personal_information';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SlaProfileDefinition extends TenantSlaProfile {
  description: string;
  isDefault?: boolean;
}

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  targetValue: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  measurementPeriod: 'rolling_15m' | 'hourly' | 'daily' | 'monthly';
  scope: 'global' | 'tenant' | 'application' | 'provider' | 'model';
  scopeEntityId?: string;
  currentValue: number;
  status: 'within_target' | 'warning' | 'breach';
  notificationThreshold: string;
}

// ==========================================
// SCOPE FILTERING (COMPANY vs TENANT vs APP)
// ==========================================

export interface CompanyScopeFilter {
  tenantId: string; // 'all' or specific customer ID e.g. 'cust-fnb'
  appId: string;    // 'all' or specific application ID e.g. 'app-fnb-support'
  scopeName?: string;
}

// ==========================================
// INCIDENT & PROBLEM MANAGEMENT & CRM
// ==========================================

export type IncidentSeverity = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
export type IncidentStatus = 'reported' | 'investigating' | 'assigned' | 'mitigated' | 'resolved' | 'closed';

export interface BocDiagnosticInfo {
  revenueAtRiskUsdPerHour: number;
  slaCreditPenaltyPercent: number;
  breachCountdownMinutes: number;
  affectedTenantTier: string;
  contractImpactSummary: string;
  customerExecutiveNotified: boolean;
  accountManagerName: string;
}

export interface SocDiagnosticInfo {
  threatClassification: string; // e.g. 'POPIA Part B Violation', 'Prompt Injection', 'Unauthorized API Token'
  popiaSectionClause?: string; // e.g. 'POPIA Section 72'
  threatVector: string;
  auditHash: string;
  sourceIp: string;
  informationOfficerPaged: boolean;
  complianceRiskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface NocDiagnosticInfo {
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  httpStatusCodeDistribution: Record<string, number>; // e.g. { '504': 142, '429': 18, '200': 1200 }
  upstreamProviderHealth: { name: string; status: 'online' | 'degraded' | 'offline'; latencyMs: number }[];
  activeCircuitBreaker: boolean;
  gatewayNodeCpuRam: string;
}

export interface Level1PlaybookInfo {
  triageChecklist: { step: string; done: boolean }[];
  recommendedActions: string[];
  suggestedFallbackModel: string;
  oneClickMitigationAvailable: boolean;
}

export interface Level2DiagnosticInfo {
  rootCauseHypotheses: { hypothesis: string; probabilityPercent: number }[];
  stackTraceSnippet: string;
  recentDeploymentsCorrelated: string[];
  payloadHeaderDiff: string;
}

export interface Level3EngineeringInfo {
  rawRequestPayloadJson: string;
  rawResponsePayloadJson: string;
  databaseLockStatus: string;
  jiraTicketUrl?: string;
  gitHubIssueUrl?: string;
  suggestedCodePatch?: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  commander: string;
  assignedTeam: 'BOC' | 'SOC' | 'NOC' | 'Level_1' | 'Level_2' | 'Level_3';
  assignedEngineer?: string;
  affectedTenantIds: string[];
  affectedTenantNames?: string[];
  affectedAppIds: string[];
  affectedAppNames?: string[];
  affectedServiceIds: string[];
  startTime: string;
  estimatedResolutionTime?: string;
  resolvedTime?: string;
  slaImpacted: boolean;
  slaBreachMinutes?: number;
  summary: string;
  category: 'API_Gateway' | 'Security_POPIA' | 'Provider_Outage' | 'Latency_Spike' | 'Billing_Webhook' | 'Model_Drift';
  
  // Multi-channel alerting state
  alertChannels: ('sms' | 'email' | 'in_app')[];
  smsAlertSent: boolean;
  emailAlertSent: boolean;
  inAppAlertSent: boolean;

  // Operational 360 Diagnostics
  bocDetails?: BocDiagnosticInfo;
  socDetails?: SocDiagnosticInfo;
  nocDetails?: NocDiagnosticInfo;
  level1Details?: Level1PlaybookInfo;
  level2Details?: Level2DiagnosticInfo;
  level3Details?: Level3EngineeringInfo;

  timeline: {
    timestamp: string;
    author: string;
    note: string;
    channelTriggered?: string;
  }[];
  
  postIncidentReview?: {
    rootCause: string;
    customerImpact: string;
    detectionMethod: string;
    correctiveActions: string[];
    preventiveActions: string[];
    owner: string;
    dueDate: string;
    status: 'open' | 'in_progress' | 'completed';
  };
}

export interface MultiChannelAlert {
  id: string;
  incidentId: string;
  incidentTitle: string;
  severity: IncidentSeverity;
  timestamp: string;
  tenantName?: string;
  appName?: string;
  message: string;
  channels: ('sms' | 'email' | 'in_app')[];
  recipientPhone?: string;
  recipientEmail?: string;
  smsStatus: 'sent' | 'queued' | 'failed';
  emailStatus: 'sent' | 'queued' | 'failed';
  inAppStatus: 'delivered' | 'read';
  isRead: boolean;
}

export interface RagKnowledgeArticle {
  id: string;
  title: string;
  category: 'runbook' | 'post_mortem' | 'compliance' | 'sla_policy';
  content: string;
  keywords: string[];
  relatedErrorCodes: string[];
  updatedAt: string;
}

export interface ProblemRecord {
  id: string;
  title: string;
  rootCause: string;
  affectedServices: string[];
  relatedIncidentIds: string[];
  correctiveAction: string;
  preventiveAction: string;
  knownError: boolean;
  status: 'open' | 'under_review' | 'resolved';
  createdAt: string;
}

// ==========================================
// AUTOMATION & WORKFLOW ENGINE
// ==========================================

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: 'budget_exceeded' | 'sla_breach' | 'pii_detected' | 'provider_error_rate_high' | 'prompt_injection';
  condition: string;
  action: 'notify_admin' | 'trigger_p2_incident' | 'switch_secondary_provider' | 'block_request' | 'revoke_key';
  targetChannel: 'email' | 'slack' | 'teams' | 'pagerduty' | 'webhook';
  enabled: boolean;
  lastTriggered?: string;
}

// ==========================================
// IAM & ACCESS CONTROL
// ==========================================

export interface IamUser {
  id: string;
  name: string;
  email: string;
  department: string;
  designation?: string;
  phone?: string;
  roleId: string;
  roleName: string;
  tenantId?: string;
  tenantName?: string;
  status: 'active' | 'inactive' | 'locked' | 'suspended' | 'offboarded';
  mfaEnabled: boolean;
  authMethod: 'sso_saml' | 'oauth_google' | 'mfa_password' | 'fido2_webauthn';
  lastLogin: string;
  createdAt?: string;
  ipWhitelist?: string[];
  sessionTokenRevokedAt?: string | null;
  offboardedAt?: string | null;
  offboardedReason?: string | null;
  forcePasswordChange?: boolean;
  passwordHistory?: string[];
}

export interface IamRole {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
  tenantId?: string;
  userCount?: number;
  createdAt?: string;
}

// ==========================================
// COMPLIANCE & EVIDENCE
// ==========================================

export interface ComplianceControl {
  id: string;
  framework: 'POPIA' | 'GDPR' | 'ISO_27001' | 'SOC_2' | 'NIST_AI_RMF' | 'OWASP_AI';
  code: string; // e.g. "POPIA-SEC-72"
  title: string;
  requirement: string;
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'under_audit';
  owner: string;
  evidenceIds: string[];
  lastReviewDate: string;
  auditorNotes?: string;
}

export interface EvidenceItem {
  id: string;
  controlId: string;
  fileName: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSizeMb: number;
}

// ==========================================
// EXECUTIVE REPORTING
// ==========================================

export interface ExecutiveReport {
  id: string;
  title: string;
  type: 'monthly_sla' | 'tenant_usage' | 'ai_cost_finops' | 'security_soc' | 'popia_gdpr_compliance' | 'executive_board';
  generatedAt: string;
  period: string;
  summaryMetrics: Record<string, string | number>;
  downloadUrl?: string;
}

// ==========================================
// ENTITLEMENTS & TENANT 360 SCORECARDS
// ==========================================

export interface EntitlementQuota {
  feature: string;
  contracted: string | number;
  entitled: string | number;
  consumed: string | number;
  remaining: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'exceeded';
}

export interface TenantHealthDomainScore {
  domain: 'Availability' | 'Performance' | 'Security' | 'Compliance' | 'FinOps' | 'Support' | 'AI Quality';
  score: number; // 0 - 100
  weightPercent: number; // e.g., 20%
  status: 'optimal' | 'good' | 'at_risk' | 'critical';
  details: string;
}

export interface TenantHealthScorecard {
  overallScore: number; // 0 - 100
  rating: 'EXCELLENT' | 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
  domainScores: TenantHealthDomainScore[];
}

// ==========================================
// SERVICE CATALOGUE
// ==========================================

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: 'AI Gateway' | 'Private AI' | 'Dedicated AI' | 'AI Governance' | 'AI Security' | 'AI FinOps' | 'Professional Services';
  description: string;
  serviceOwner: string;
  technicalOwner: string;
  slaTier: string;
  pricingModel: string;
  dependencies: string[];
  supportModel: string;
  criticality: BusinessCriticality;
  riskClassification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'active' | 'beta' | 'deprecated';
}

// ==========================================
// CMDB & SERVICE DEPENDENCY MAP
// ==========================================

export interface CmdbNode {
  id: string;
  name: string;
  type: 'tenant' | 'application' | 'gateway' | 'orchestration' | 'policy' | 'router' | 'provider' | 'model' | 'infrastructure';
  status: 'operational' | 'degraded' | 'outage';
  latencyMs?: number;
  details?: string;
}

export interface CmdbDependency {
  fromId: string;
  toId: string;
  relation: 'uses' | 'routes_to' | 'enforces' | 'depends_on';
}

// ==========================================
// ENTERPRISE RISK MANAGEMENT & HEATMAP
// ==========================================

export type RiskCategory = 'Cybersecurity' | 'Privacy' | 'Regulatory' | 'Operational' | 'AI/model' | 'Vendor' | 'Financial' | 'Availability' | 'Data' | 'Concentration risk';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface EnterpriseRiskItem {
  id: string;
  tenantId?: string;
  tenantName?: string;
  category: RiskCategory;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5; // 1=Rare, 5=Almost Certain
  impact: 1 | 2 | 3 | 4 | 5;      // 1=Negligible, 5=Catastrophic
  inherentRiskScore: number;       // prob * impact (1-25)
  inherentRiskLevel: RiskLevel;
  controls: string[];
  residualRiskScore: number;
  residualRiskLevel: RiskLevel;
  riskOwner: string;
  treatment: 'mitigate' | 'transfer' | 'accept' | 'avoid';
  dueDate: string;
  status: 'open' | 'in_mitigation' | 'accepted' | 'closed';
  evidenceIds: string[];
}

// ==========================================
// AI MODEL GOVERNANCE & EVALUATION LAB
// ==========================================

export type ModelLifecycleState = 'DISCOVERED' | 'ASSESSED' | 'SECURITY_TESTED' | 'APPROVED' | 'PRODUCTION' | 'MONITORED' | 'REVIEW' | 'RETIRED';

export interface AiModelGovernanceRecord {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  version: string;
  contextWindow: string;
  costPer1kInputUsd: number;
  costPer1kOutputUsd: number;
  accuracyBenchmark: number; // 0-100
  securityBenchmark: number; // 0-100
  hallucinationRatePercent: number;
  piiHandlingRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'UNSATISFACTORY';
  dataResidency: string;
  approvedUseCases: string[];
  prohibitedUseCases: string[];
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lifecycleState: ModelLifecycleState;
  modelOwner: string;
  reviewDate: string;
  retirementDate?: string;
}

export interface ModelEvalBenchmark {
  modelName: string;
  provider: string;
  latencyMs: number;
  costPer1kTokens: number;
  accuracyScore: number;
  reasoningScore: number;
  codingScore: number;
  securityScore: number;
  piiMaskingScore: number;
  promptInjectionDefenseScore: number;
  hallucinationRate: number;
  recommendationWeightScore: number; // Calculated overall score
}

// ==========================================
// VENDOR 360 & RESILIENCE
// ==========================================

export interface Vendor360Record {
  id: string;
  vendorName: string;
  status: 'active' | 'under_review' | 'degraded' | 'suspended';
  modelsCount: number;
  pricingTier: string;
  slaTargetPercent: number;
  actualAvailabilityPercent: number;
  dpaSigned: boolean;
  securityCertifications: string[];
  dataResidency: string;
  concentrationRiskExposurePercent: number; // e.g. 45% of traffic
  monthlySpendUsd: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  drFailoverReadiness: 'READY' | 'TESTING' | 'NOT_CONFIGURED';
}

// ==========================================
// BCDR & DISASTER RECOVERY
// ==========================================

export interface BcdrStatus {
  rtoTargetHours: number;
  rpoTargetMinutes: number;
  backupStatus: 'HEALTHY' | 'SYNCING' | 'ATTENTION';
  replicationStatus: 'ACTIVE_ACTIVE' | 'ACTIVE_PASSIVE';
  drRegion: string;
  failoverReadiness: '100% READY' | 'DEGRADED';
  lastDrTestDate: string;
  lastDrTestResult: 'PASSED' | 'FAILED' | 'PARTIAL';
  recoverySuccessPercent: number;
  outstandingDrIssuesCount: number;
  exerciseInProgress: boolean;
}

// ==========================================
// ITIL CHANGE MANAGEMENT
// ==========================================

export type ChangeType = 'Standard' | 'Normal' | 'Emergency';

export interface ChangeRequestRecord {
  id: string;
  title: string;
  requestor: string;
  tenantId?: string;
  service: string;
  type: ChangeType;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactDescription: string;
  plannedStart: string;
  plannedCompletion: string;
  backoutPlan: string;
  testPlan: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'implemented';
  implementationNotes?: string;
  relatedIncidentId?: string;
}

// ==========================================
// SERVICE REQUEST DESK & WORKFLOWS
// ==========================================

export interface ServiceDeskTicket {
  id: string;
  requestType: 'Create Tenant' | 'Create API Key' | 'Quota Limit Increase' | 'Change SLA' | 'Enable Model' | 'Data Export' | 'DSAR Request' | 'IP Whitelist' | 'Security Review';
  requestorName: string;
  tenantName: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  approvalStage: 'Tenant Admin' | 'Service Owner' | 'Commercial Approval' | 'Security Review' | 'Completed';
  status: 'open' | 'in_approval' | 'approved' | 'fulfilled' | 'rejected';
  createdAt: string;
}

// ==========================================
// SECURITY POSTURE DASHBOARD
// ==========================================

export interface SecurityPostureScorecard {
  overallScore: number; // 0 - 100
  domainScores: {
    identityScore: number;
    apiSecurityScore: number;
    aiSecurityScore: number;
    dataSecurityScore: number;
    infrastructureScore: number;
    vulnerabilityScore: number;
    complianceScore: number;
  };
  topRisks: {
    id: string;
    risk: string;
    owner: string;
    dueDate: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  }[];
}

// ==========================================
// GLOBAL SEARCH & UNIVERSAL EVENT STREAM
// ==========================================

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: 'Tenant' | 'User' | 'Application' | 'API Key' | 'Incident' | 'Problem' | 'Change' | 'Model' | 'Provider' | 'Policy' | 'Risk' | 'Contract' | 'Report';
  subtitle: string;
  targetTab: string;
}

export interface ActivityFeedEvent {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  details: string;
}

// ==========================================
// ENTERPRISE LICENSING & MONETIZATION
// ==========================================

export type PricingModelType =
  | 'per_transaction'      // $ per API call / per 1k tokens
  | 'per_day'              // Daily recurring license
  | 'per_month'            // Monthly recurring subscription
  | 'per_year'             // Annual enterprise contract
  | 'tiered_volume'        // Step-down pricing per volume bracket
  | 'hybrid_base_metered'  // Fixed base fee + metered transaction overage
  | 'custom_contract';     // Custom enterprise SLA agreement

export type EnforcementAction =
  | 'soft_warning'         // Header warning & UI notification banner
  | 'rate_limit_throttle'  // Strict request throttling (e.g. 5 RPM)
  | 'read_only'            // Block POST/PUT mutations, allow read queries
  | 'hard_block_402';      // HTTP 402 Payment Required - Gateway traffic blocked

export type LicenseStatus =
  | 'active'
  | 'grace_period'
  | 'past_due_restricted'
  | 'auto_suspended'
  | 'cancelled';

export interface LicensingPlanTemplate {
  id: string;
  name: string;
  applicationId: string; // bound application id or 'all'
  applicationName: string;
  pricingType: PricingModelType;
  currency: 'USD' | 'ZAR' | 'EUR';
  basePrice: number;
  billingCycle: 'per_transaction' | 'daily' | 'monthly' | 'annual' | 'custom';
  includedTransactions: number;
  overagePricePerTransaction: number;
  gracePeriodDays: number;
  autoEnforcementAction: EnforcementAction;
  autoEnforceOnUnpaid: boolean;
  features: string[];
  maxUsersAllowed?: number;
  slaUptimeGuarantee?: number;
  isPublished: boolean;
  createdDate: string;
  /** Optional, explicit request bands enable transparent volume pricing. Null upper bound means unlimited. */
  volumeTiers?: { upToRequests: number | null; pricePerRequest: number; label: string }[];
  groupDiscountPercent?: number;
  licenseScope?: 'application' | 'tenant_group';
}

export interface TenantAppLicense {
  id: string;
  tenantId: string;
  tenantName: string;
  applicationId: string;
  applicationName: string;
  planId: string;
  planName: string;
  pricingType: PricingModelType;
  currency: 'USD' | 'ZAR' | 'EUR';
  basePrice: number;
  contractStartDate: string;
  contractEndDate: string;
  nextBillingDate: string;
  lastPaymentDate: string;
  lastPaymentAmount?: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'overdue';
  licenseStatus: LicenseStatus;
  currentTransactionCount: number;
  maxTransactionQuota: number;
  overageTransactionsCount: number;
  currentAccruedBillUsd: number;
  autoEnforceOnUnpaid: boolean;
  graceDaysRemaining: number;
  activeEnforcement: EnforcementAction | null;
  billingContactEmail: string;
  customContractNotes?: string;
  discountPercent?: number;
  groupSize?: number;
  assignedKeyIds?: string[];
}

export interface PaymentWebhookLog {
  id: string;
  tenantId: string;
  tenantName: string;
  applicationId?: string;
  invoiceId?: string;
  gateway?: 'stripe' | 'paypal' | 'payfast' | 'eft_manual' | string;
  gatewayProvider?: string;
  eventType: string;
  amountUsd?: number;
  amount?: number;
  currency?: string;
  status: 'success' | 'failed' | 'pending' | 'processed' | string;
  timestamp?: string;
  receivedAt?: string;
  payloadSummary?: string;
  rawPayloadSummary?: string;
  enforcementTriggered?: boolean | string;
}

export interface DeviceTrustRecord {
  id: string;
  modelId: string;
  modelName: string;
  immutableDeviceId: string;
  phoneNumber: string;
  trustLevel: 'ultra_secure' | 'secure' | 'not_trusted';
  secureEnclave: string;
  consentHash: string;
  lastHandshake: string;
  fingerprintHash: string;
  sharedSecretToken: string;
  registeredAt: string;
  description: string;
}

export interface ComplianceSegment {
  text: string;
  compliant: boolean;
  reason: string;
}

export interface AIMessageLog {
  id: string;
  deviceId: string;
  phoneNumber: string;
  modelId: string;
  modelName: string;
  timestamp: string;
  promptText: string;
  responseText: string;
  trustLevel: 'ultra_secure' | 'secure' | 'not_trusted';
  popiaSegments: ComplianceSegment[];
  gdprSegments: ComplianceSegment[];
  latencyMs: number;
  tokenCount: number;
}

export type PrincipalType = 'PERSON' | 'ORGANISATION' | 'APPLICATION' | 'SERVICE' | 'AI_AGENT';

export type CredentialType = 'APPLICATION_API_KEY' | 'USER_CREDENTIAL' | 'DEVICE_CREDENTIAL' | 'SERVICE_CREDENTIAL' | 'AI_AGENT_CREDENTIAL';

export type DataClassificationType =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'PERSONAL'
  | 'SPECIAL_PERSONAL'
  | 'FINANCIAL'
  | 'HEALTH'
  | 'LOCATION'
  | 'COMMERCIAL';

export type AIDecisionType = 'ALLOW' | 'BLOCK' | 'REDACT' | 'TRANSFORM' | 'REQUIRE_APPROVAL';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  planId?: string;
  createdAt: string;
}

export interface Principal {
  id: string;
  tenantId: string;
  principalType: PrincipalType;
  displayName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface Identity {
  id: string;
  principalId: string;
  altilId: string; // e.g. ALTIL-USR-xxxxxxxx
  createdAt: string;
}

export interface Device {
  id: string;
  identityId: string;
  deviceFingerprintHash: string;
  secureEnclaveStatus: string;
  trustLevel: 'ultra_secure' | 'secure' | 'not_trusted';
  revokedAt?: string | null;
  registeredAt: string;
}

export interface Credential {
  id: string;
  tenantId: string;
  principalId: string;
  applicationId?: string;
  credentialType: CredentialType;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
}

export interface Contract {
  id: string;
  tenantId: string;
  contractType: string;
  version: string;
  effectiveDate: string;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  termsReference: string;
  acceptanceTimestamp: string;
  acceptingIdentityId: string;
  evidenceReference: string;
}

export interface Consent {
  id: string;
  principalId: string;
  tenantId: string;
  purpose: string;
  scope: string[];
  policyVersionId: string;
  granted: boolean;
  timestamp: string;
  evidenceReference: string;
}

export interface TrustRelationship {
  relationshipId: string;
  sourceIdentityId: string;
  targetIdentityId: string;
  relationshipType: string;
  status: 'ACTIVE' | 'REVOKED' | 'SUSPENDED';
  scope: string[];
  createdAt: string;
  effectiveAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  contractId?: string;
  policyId?: string;
  consentId?: string;
  evidenceId?: string;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  rulesSummary: string;
  effectiveAt: string;
  author: string;
  description: string;
}

export interface AIDecision {
  decision: AIDecisionType;
  tenantId: string;
  principalId: string;
  applicationId: string;
  credentialId: string;
  policyVersion: string;
  dataClassification: DataClassificationType;
  provider: string;
  model: string;
  transformations: string[];
  timestamp: string;
}

export interface EvidenceEvent {
  eventId: string;
  eventType: string;
  tenantId: string;
  principalId: string;
  identityId: string;
  applicationId: string;
  credentialId: string;
  timestamp: string;
  actor: string;
  action: string;
  policyVersion: string;
  previousEventHash: string;
  eventHash: string;
  metadata?: Record<string, any>;
}

// =========================================================================
// ALTIL DATA CLOAKING, TOKENISATION & RECONSTRUCTION (DCR) TYPES
// =========================================================================

export type DcrTransformationStrategy =
  | 'EXACT_TOKEN'           // Deterministic tokenisation (e.g. John Smith -> ALTIL_PERSON_7F82A1)
  | 'PSEUDONYM'             // Semantic synthetic cloaking (e.g. John Smith -> David Miller)
  | 'SYNTHETIC_VALUE'       // Synthetic entity generation (e.g. 12 Main St -> 84 Oak Avenue)
  | 'RANGE_PRESERVE'        // Semantic magnitude preserving (e.g. age 47 -> 46, salary R48,732 -> R49,105)
  | 'RELATIONSHIP_PRESERVE' // Structural entity mapping across relationships
  | 'FORMAT_PRESERVE'       // Preserves syntax shape (e.g. +27 82 123 4567 -> +27 82 894 1029)
  | 'SEMANTIC_GENERALISE'   // Categorical generalisation (e.g. Lung Cancer -> Thoracic Oncology Class B)
  | 'STATISTICAL_PRESERVE'  // Retains statistical distribution characteristics
  | 'HASH'                  // One-way cryptographic hash
  | 'ENCRYPT'               // Reversible AES-256 encrypted payload
  | 'REDACT'                // Mask with [REDACTED_ENTITY]
  | 'REMOVE'                // Strip entity entirely from payload
  | 'LEAVE_UNCHANGED';      // Permitted cleartext passthrough

export type DcrTransformationScope =
  | 'REQUEST'       // Auto-expires immediately upon response delivery
  | 'SESSION'       // Persists for the active user/agent session
  | 'CONVERSATION'  // Persists across multi-turn thread
  | 'APPLICATION'   // Consistent surrogate across application lifetime
  | 'TENANT'        // Enterprise-wide consistent surrogate
  | 'LONG_TERM';    // Retained for statutory audit window

export type DcrProvenanceCategory =
  | 'ORIGINAL'          // Source enterprise ground truth (ALTIL transformed)
  | 'ALTIL_SURROGATE'   // ALTIL-generated token/synthetic surrogate
  | 'AI_GENERATED'      // Newly invented content produced by AI model
  | 'AI_DERIVED'        // AI output calculated from surrogate context
  | 'SYSTEM_GENERATED'  // Orchestration metadata injected by platform
  | 'UNKNOWN';          // Unverified provenance (strictly blocked from reconstruction)

export interface DcrClassificationResult {
  id: string;
  originalText: string;
  startIndex: number;
  endIndex: number;
  classification: DataClassificationType;
  entityType: string; // e.g. PERSON_NAME, ID_NUMBER, SALARY_AMOUNT, ADDRESS, PHONE_NUMBER, MEDICAL_DIAGNOSIS, COMPANY_NAME
  confidence: number; // 0.0 - 1.0
  suggestedStrategy: DcrTransformationStrategy;
  jurisdiction: 'POPIA' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'GLOBAL';
  statutoryReference?: string; // e.g. "POPIA Section 1 / GDPR Article 4(1)"
  metadata?: Record<string, any>;
}

export interface DcrTransformationRecord {
  id: string;
  requestId: string;
  tenantId: string;
  principalId?: string;
  identityId?: string;
  applicationId?: string;
  classification: DataClassificationType;
  dataType: string;
  originalValueCiphertext: string;
  originalValueHash: string; // SHA-256 for O(1) matching without decrypting
  originalMaskedPreview: string; // e.g. "J*** S***"
  surrogateValue: string; // e.g. "David Miller" or "ALTIL_PERSON_7F82A1"
  transformationStrategy: DcrTransformationStrategy;
  scope: DcrTransformationScope;
  keyReference: string; // e.g. "KEY-TENANT-T1-V2"
  semanticConstraints?: {
    rangeDelta?: number;
    currency?: string;
    preserveCase?: boolean;
    relationshipFamilyId?: string;
    originalMagnitude?: number;
  };
  status: 'ACTIVE' | 'RECONSTRUCTED' | 'EXPIRED' | 'REVOKED';
  reconstructionCount: number;
  createdAt: string;
  expiresAt: string;
  lastReconstructedAt?: string;
  pemEntityId?: string;
  pemPseudonymId?: string;
  transactionId?: string;
  conversationId?: string;
  mappingSetId?: string;
  organizationId?: string;
  environmentId?: string;
  policyVersion?: string;
  providerRestrictions?: string[];
  reconstructionPolicy?: Record<string, unknown>;
}

export interface DcrPolicyRule {
  id: string;
  tenantId: string;
  tenantName?: string;
  classification: DataClassificationType;
  entityType?: string;
  strategy: DcrTransformationStrategy;
  scope: DcrTransformationScope;
  providerRestrictions: string[]; // Providers forbidden from raw data (e.g. ['openai', 'anthropic'])
  permittedProviders: string[];    // Providers allowed raw data (e.g. ['ollama_sovereign_local'])
  semanticConfig?: {
    rangeVariancePercent?: number;
    preserveCurrency?: boolean;
    maskFormat?: string;
    generalisationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    preserveCase?: boolean;
  };
  status: 'ACTIVE' | 'DISABLED';
  priority: number;
  updatedAt: string;
}

export type DcrEventType =
  | 'DATA_DETECTED'
  | 'DATA_CLASSIFIED'
  | 'TRANSFORMATION_SELECTED'
  | 'VALUE_TRANSFORMED'
  | 'PROTECTED_REQUEST_CREATED'
  | 'AI_REQUEST_SENT'
  | 'AI_RESPONSE_RECEIVED'
  | 'SURROGATE_DETECTED'
  | 'PROVENANCE_VERIFIED'
  | 'VALUE_RECONSTRUCTED'
  | 'RECONSTRUCTION_BLOCKED'
  | 'TRANSFORMATION_EXPIRED'
  | 'RECONSTRUCTION'
  | 'VAULT_READ'
  | 'VAULT_REVEAL'
  | 'KEY_CREATED'
  | 'KEY_ROTATED'
  | 'KEY_REVOKED'
  | 'BREAK_GLASS_REIDENTIFICATION'
  | 'PEM_ENTITY_CREATED'
  | 'PEM_ENTITY_MATCHED'
  | 'PEM_PSEUDONYM_COMPROMISED'
  | 'PEM_PSEUDONYM_ROTATED'
  | 'PEM_REIDENTIFICATION_ATTEMPT';

export interface DcrProvenanceEvent {
  eventId: string;
  eventType: DcrEventType;
  requestId: string;
  tenantId: string;
  identityId?: string;
  classification: DataClassificationType;
  sourceHash: string;
  surrogateHash: string;
  transformationStrategy: DcrTransformationStrategy;
  provenanceCategory: DcrProvenanceCategory;
  policyVersion: string;
  timestamp: string;
  previousEventHash: string;
  eventHash: string;
  description: string;
  details?: Record<string, any>;
}

export interface DcrVaultKeyMetadata {
  keyId: string;
  tenantId: string;
  organizationId?: string;
  applicationId?: string;
  environmentId?: string;
  purpose?: string;
  algorithm: 'AES-256-GCM' | 'CHACHA20-POLY1305';
  version: number;
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED' | 'RETIRED';
  createdAt: string;
  expiresAt?: string;
  predecessorKeyId?: string;
  activeTransformationsCount?: number;
}

export interface DcrPipelineResult {
  requestId: string;
  tenantId: string;
  timestamp: string;
  originalPayload: string;
  cloakedPayload: string;
  rawAiResponse?: string;
  reconstructedResponse?: string;
  transformationsApplied: {
    originalMasked: string;
    surrogate: string;
    dataType: string;
    classification: DataClassificationType;
    strategy: DcrTransformationStrategy;
    scope: DcrTransformationScope;
    provenance: DcrProvenanceCategory;
  }[];
  reconstructedItems: {
    surrogate: string;
    restoredMasked: string;
    dataType: string;
    provenance: DcrProvenanceCategory;
    reconstructed: boolean;
    reason?: string;
  }[];
  unreconstructedItems: {
    value: string;
    reason: string;
    provenance: DcrProvenanceCategory;
  }[];
  stats: {
    detectedEntitiesCount: number;
    transformedEntitiesCount: number;
    reconstructedEntitiesCount: number;
    blockedReconstructionsCount: number;
    finesPreventedZar: number;
    finesPreventedEur: number;
    durationMs: number;
  };
  policyPassed: boolean;
  ledgerEventsCount: number;
}
