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

export type HealthStatus = 'online' | 'degraded' | 'offline' | 'checking';

export interface AIProvider {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  apiKey?: string;
  keyPrefix?: string;
  organizationId?: string;
  customHeaders?: Record<string, string>;
  enabled: boolean;
  status: HealthStatus;
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
export type CustomerStatus = 'active' | 'pending_kyc' | 'trial' | 'restricted' | 'suspended' | 'archived';
export type CustomerTier = 'enterprise' | 'growth' | 'startup' | 'pay_as_you_go';
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
  currency: 'USD' | 'ZAR' | 'EUR' | 'GBP';
  creditBalanceUsd: number;
  creditLimitUsd: number;
  prepaidCredits: boolean;
  taxIdNumber?: string;
  billingEmail?: string;
  overageAllowed: boolean;
  overageAlertThresholdPercent: number; // e.g. 80%
  lastInvoiceAmount?: number;
  nextBillingDate?: string;
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
  appIdentifier: string;
  name: string;
  description: string;
  status: ApplicationStatus;
  environment: 'production' | 'staging' | 'development';
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
  apiKey: string;
  capability: string;
  prompt: string;
  simulateProviderFailure?: boolean;
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
// INCIDENT & PROBLEM MANAGEMENT
// ==========================================

export type IncidentSeverity = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  commander: string;
  affectedTenantIds: string[];
  affectedServiceIds: string[];
  startTime: string;
  estimatedResolutionTime?: string;
  resolvedTime?: string;
  slaImpacted: boolean;
  slaBreachMinutes?: number;
  summary: string;
  timeline: {
    timestamp: string;
    author: string;
    note: string;
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
  roleId: string;
  roleName: string;
  tenantId?: string;
  tenantName?: string;
  status: 'active' | 'inactive' | 'locked';
  mfaEnabled: boolean;
  authMethod: 'sso_saml' | 'oauth_google' | 'mfa_password';
  lastLogin: string;
}

export interface IamRole {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
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


