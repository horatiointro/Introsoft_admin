-- ============================================================================
-- Enterprise Multi-Tenant AI Governance Platform
-- MariaDB 10.11.18 Production Schema & Comprehensive Seed Script
-- Architecture Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `ai_governance_platform`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `ai_governance_platform`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Table: tenants
-- Primary multi-tenant registry with POPIA/GDPR isolation flags
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `tenants`;
CREATE TABLE `tenants` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `tier` ENUM('Starter', 'Professional', 'Enterprise', 'Strategic_Gov') NOT NULL DEFAULT 'Enterprise',
  `region` VARCHAR(32) NOT NULL DEFAULT 'af-south-1',
  `popia_compliant` TINYINT(1) NOT NULL DEFAULT 1,
  `max_rpm` INT UNSIGNED NOT NULL DEFAULT 5000,
  `max_tpm` INT UNSIGNED NOT NULL DEFAULT 2000000,
  `status` ENUM('active', 'grace_period', 'auto_suspended', 'decommissioned') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_code` (`tenant_code`),
  KEY `idx_tenant_status` (`status`),
  KEY `idx_tenant_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Table: tenant_applications
-- Micro-applications deployed per tenant
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `tenant_applications`;
CREATE TABLE `tenant_applications` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `app_code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `capability_type` VARCHAR(64) NOT NULL,
  `status` ENUM('active', 'maintenance', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_app_tenant` (`tenant_id`),
  KEY `idx_app_status` (`status`),
  CONSTRAINT `fk_app_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Table: licensing_plans
-- Commercial Plan Blueprint Templates
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `licensing_plans`;
CREATE TABLE `licensing_plans` (
  `id` VARCHAR(64) NOT NULL,
  `plan_code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `pricing_model` ENUM('per_transaction', 'per_day', 'per_month', 'per_year', 'tiered_volume', 'hybrid_base_metered', 'bespoke_sla') NOT NULL,
  `base_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'USD',
  `billing_cycle` ENUM('Daily', 'Monthly', 'Annual', 'Metered') NOT NULL DEFAULT 'Monthly',
  `included_transactions_quota` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `overage_rate_per_1k` DECIMAL(10,4) NOT NULL DEFAULT 0.0000,
  `grace_period_days` INT UNSIGNED NOT NULL DEFAULT 14,
  `max_rpm_limit` INT UNSIGNED NOT NULL DEFAULT 1000,
  `sla_guarantee_percent` DECIMAL(5,2) NOT NULL DEFAULT 99.90,
  `enforcement_rule` ENUM('hard_block_402', 'soft_warning', 'rate_limit_throttle', 'read_only') NOT NULL DEFAULT 'hard_block_402',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plan_code` (`plan_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Table: tenant_licenses
-- Active Subscriptions mapping Tenant + App + Plan
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `tenant_licenses`;
CREATE TABLE `tenant_licenses` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `tenant_name` VARCHAR(128) NOT NULL,
  `application_id` VARCHAR(64) NOT NULL,
  `application_name` VARCHAR(128) NOT NULL,
  `plan_id` VARCHAR(64) NOT NULL,
  `plan_name` VARCHAR(128) NOT NULL,
  `license_key` VARCHAR(128) NOT NULL,
  `license_status` ENUM('active', 'grace_period', 'auto_suspended', 'expired') NOT NULL DEFAULT 'active',
  `payment_status` ENUM('paid', 'overdue', 'failed', 'pending_reconciliation') NOT NULL DEFAULT 'paid',
  `start_date` DATE NOT NULL,
  `renewal_date` DATE NOT NULL,
  `active_enforcement` ENUM('hard_block_402', 'soft_warning', 'rate_limit_throttle', 'read_only', 'none') NULL,
  `current_accrued_bill_usd` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `grace_period_days_remaining` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_payment_date` DATE NULL,
  `last_payment_amount` DECIMAL(12,2) NULL,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'USD',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_license_tenant` (`tenant_id`),
  KEY `idx_license_plan` (`plan_id`),
  KEY `idx_license_status` (`license_status`),
  CONSTRAINT `fk_license_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_license_plan` FOREIGN KEY (`plan_id`) REFERENCES `licensing_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Table: ai_providers
-- Managed AI Gateway Providers
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_providers`;
CREATE TABLE `ai_providers` (
  `id` VARCHAR(64) NOT NULL,
  `provider_code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `vendor` VARCHAR(64) NOT NULL,
  `endpoint_type` VARCHAR(64) NOT NULL DEFAULT 'REST_gRPC',
  `routing_weight` INT UNSIGNED NOT NULL DEFAULT 50,
  `health_status` ENUM('Healthy', 'Degraded', 'Offline') NOT NULL DEFAULT 'Healthy',
  `average_latency_ms` INT UNSIGNED NOT NULL DEFAULT 120,
  `total_calls` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `error_rate_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.02,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_code` (`provider_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Table: ai_models
-- Managed Models per Provider
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_models`;
CREATE TABLE `ai_models` (
  `id` VARCHAR(64) NOT NULL,
  `provider_id` VARCHAR(64) NOT NULL,
  `model_code` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(128) NOT NULL,
  `cost_per_1k_tokens_input_usd` DECIMAL(10,6) NOT NULL DEFAULT 0.000150,
  `cost_per_1k_tokens_output_usd` DECIMAL(10,6) NOT NULL DEFAULT 0.000600,
  `context_window_tokens` INT UNSIGNED NOT NULL DEFAULT 1000000,
  `capability_tags` TEXT NULL,
  `status` ENUM('Active', 'Deprecated', 'Beta') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model_code` (`model_code`),
  KEY `idx_model_provider` (`provider_id`),
  CONSTRAINT `fk_model_provider` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Table: ai_capability_routing
-- Functional AI Capability Routing Matrix
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_capability_routing`;
CREATE TABLE `ai_capability_routing` (
  `id` VARCHAR(64) NOT NULL,
  `capability_code` VARCHAR(64) NOT NULL,
  `function_name` VARCHAR(128) NOT NULL,
  `assigned_model_code` VARCHAR(64) NOT NULL,
  `fallback_model_code` VARCHAR(64) NOT NULL,
  `status` ENUM('Optimal', 'Degraded', 'Fallback_Active') NOT NULL DEFAULT 'Optimal',
  `active_tenants_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_requests` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_capability_code` (`capability_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. Table: service_sla_targets
-- Service SLA & Health KPI Benchmarks
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `service_sla_targets`;
CREATE TABLE `service_sla_targets` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(128) NOT NULL,
  `target_uptime_percent` DECIMAL(5,2) NOT NULL DEFAULT 99.95,
  `target_latency_p95_ms` INT UNSIGNED NOT NULL DEFAULT 250,
  `max_error_rate_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.10,
  `current_uptime_percent` DECIMAL(5,2) NOT NULL DEFAULT 99.99,
  `current_latency_p95_ms` INT UNSIGNED NOT NULL DEFAULT 142,
  `current_error_rate_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.02,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sla_tenant` (`tenant_id`),
  CONSTRAINT `fk_sla_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. Table: security_guardrails
-- Statutory POPIA & AI Risk Mitigation Rules
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `security_guardrails`;
CREATE TABLE `security_guardrails` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NULL,
  `rule_code` VARCHAR(32) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `description` TEXT NOT NULL,
  `popia_section` VARCHAR(64) NULL,
  `enforcement_mode` ENUM('Redact_Mask', 'Hard_Block_403', 'Sanitize_Pass', 'Audit_Flag') NOT NULL DEFAULT 'Redact_Mask',
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `total_interceptions` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_guardrail_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. Table: audit_logs
-- Comprehensive Operational and Security Audit Logs
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_email` VARCHAR(128) NOT NULL,
  `action_type` VARCHAR(64) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `severity` ENUM('INFO', 'WARNING', 'CRITICAL', 'ALERT') NOT NULL DEFAULT 'INFO',
  `ip_address` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  `request_payload` TEXT NULL,
  `raw_response_payload` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_tenant` (`tenant_id`),
  KEY `idx_audit_severity` (`severity`),
  KEY `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. Table: payment_webhook_logs
-- Commercial Payment Webhook & Gateway Reconciliation Log
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payment_webhook_logs`;
CREATE TABLE `payment_webhook_logs` (
  `id` VARCHAR(64) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tenant_id` VARCHAR(64) NOT NULL,
  `tenant_name` VARCHAR(128) NOT NULL,
  `application_id` VARCHAR(64) NOT NULL,
  `invoice_id` VARCHAR(64) NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'USD',
  `gateway_provider` VARCHAR(64) NOT NULL DEFAULT 'Stripe',
  `enforcement_triggered` VARCHAR(64) NOT NULL DEFAULT 'none',
  `status` ENUM('processed', 'failed', 'pending') NOT NULL DEFAULT 'processed',
  `raw_payload_summary` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_webhook_tenant` (`tenant_id`),
  KEY `idx_webhook_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. Table: financial_monthly_snapshots
-- Monthly FinOps Spend and Token Consumption History
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `financial_monthly_snapshots`;
CREATE TABLE `financial_monthly_snapshots` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `snapshot_month` VARCHAR(7) NOT NULL, -- e.g. '2026-08'
  `spend_usd` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tokens_consumed_millions` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `active_users_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_month` (`tenant_id`, `snapshot_month`),
  CONSTRAINT `fk_snap_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- SEED DATA INGESTION
-- ============================================================================

-- Seed 1: Tenants
INSERT INTO `tenants` (`id`, `tenant_code`, `name`, `tier`, `region`, `popia_compliant`, `max_rpm`, `max_tpm`, `status`) VALUES
('tenant-med', 'MED-CLINIC', 'MediClinic AI Health Group', 'Enterprise', 'af-south-1', 1, 10000, 5000000, 'active'),
('tenant-fin', 'FIN-BANK', 'Investec Private Banking', 'Strategic_Gov', 'af-south-1', 1, 25000, 10000000, 'active'),
('tenant-retail', 'SHOP-MALL', 'Shoprite Checkers Digital', 'Enterprise', 'af-south-1', 1, 12000, 4000000, 'grace_period'),
('tenant-gov', 'GOV-DEPT', 'Department of Home Affairs', 'Strategic_Gov', 'af-south-1', 1, 50000, 20000000, 'auto_suspended'),
('tenant-ed', 'UNI-TECH', 'Wits University Research Lab', 'Starter', 'af-south-1', 1, 2000, 500000, 'active');

-- Seed 2: Tenant Applications
INSERT INTO `tenant_applications` (`id`, `tenant_id`, `app_code`, `name`, `description`, `capability_type`, `status`) VALUES
('app-med-diag', 'tenant-med', 'MED-DIAG', 'MediClinic Clinical Copilot', 'AI Diagnostic Assistant for Radiology and Patient Triage', 'Clinical & Medical AI', 'active'),
('app-fin-fraud', 'tenant-fin', 'FIN-FRAUD', 'Investec Fraud Shield', 'Real-time Transaction Fraud & AML Anomaly Detection Engine', 'Fraud & Risk Analytics', 'active'),
('app-retail-chat', 'tenant-retail', 'RETAIL-CHAT', 'Shoprite Support Bot', 'Automated Customer Self-Service and Order Inquiry Assistant', 'Customer Self-Service Chat', 'active'),
('app-gov-doc', 'tenant-gov', 'GOV-DOC', 'HomeAffairs ID OCR', 'High-throughput Identity Document & Visa Processing System', 'Document OCR & Extraction', 'suspended'),
('app-ed-stem', 'tenant-ed', 'ED-STEM', 'Wits Research Solver', 'High-complexity STEM Reasoning & Mathematics Engine', 'Code & STEM Reasoner', 'active');

-- Seed 3: Commercial Licensing Plans
INSERT INTO `licensing_plans` (`id`, `plan_code`, `name`, `description`, `pricing_model`, `base_price`, `currency`, `billing_cycle`, `included_transactions_quota`, `overage_rate_per_1k`, `grace_period_days`, `max_rpm_limit`, `sla_guarantee_percent`, `enforcement_rule`) VALUES
('plan-tx-base', 'PLAN-TX-100K', 'Per-Transaction Metered Standard', 'Pay per request with included 100,000 requests quota monthly', 'per_transaction', 499.00, 'USD', 'Monthly', 100000, 0.0050, 14, 2500, 99.90, 'hard_block_402'),
('plan-day-pass', 'PLAN-DAY-PASS', 'Commercial Daily License Pass', 'Fixed daily license fee for seasonal compute workloads', 'per_day', 150.00, 'USD', 'Daily', 50000, 0.0020, 3, 5000, 99.95, 'rate_limit_throttle'),
('plan-month-ent', 'PLAN-MONTH-ENT', 'Enterprise Monthly Platform SLA', 'Comprehensive enterprise tier with SLA availability guarantee', 'per_month', 4500.00, 'USD', 'Monthly', 1000000, 0.0015, 14, 15000, 99.95, 'hard_block_402'),
('plan-year-gov', 'PLAN-YEAR-GOV', 'Strategic Government Annual Pass', 'Dedicated annual SLA contract with customized POPIA compliance', 'per_year', 48000.00, 'USD', 'Annual', 15000000, 0.0010, 30, 50000, 99.99, 'soft_warning'),
('plan-bespoke', 'PLAN-BESPOKE', 'Bespoke Negotiated SLA & Token Volume', 'Fully custom commercial agreement with tailored SLA and rate limits', 'bespoke_sla', 12500.00, 'USD', 'Monthly', 5000000, 0.0008, 21, 30000, 99.99, 'hard_block_402');

-- Seed 4: Tenant Licenses
INSERT INTO `tenant_licenses` (`id`, `tenant_id`, `tenant_name`, `application_id`, `application_name`, `plan_id`, `plan_name`, `license_key`, `license_status`, `payment_status`, `start_date`, `renewal_date`, `active_enforcement`, `current_accrued_bill_usd`, `grace_period_days_remaining`, `last_payment_date`, `last_payment_amount`, `currency`) VALUES
('lic-med-01', 'tenant-med', 'MediClinic AI Health Group', 'app-med-diag', 'MediClinic Clinical Copilot', 'plan-month-ent', 'Enterprise Monthly Platform SLA', 'LIC-MED-CLINIC-2026-X992', 'active', 'paid', '2026-01-01', '2026-09-01', NULL, 4500.00, 14, '2026-08-01', 4500.00, 'USD'),
('lic-fin-01', 'tenant-fin', 'Investec Private Banking', 'app-fin-fraud', 'Investec Fraud Shield', 'plan-year-gov', 'Strategic Government Annual Pass', 'LIC-INVESTEC-BANK-2026-A104', 'active', 'paid', '2026-01-01', '2027-01-01', NULL, 4000.00, 30, '2026-01-01', 48000.00, 'USD'),
('lic-retail-01', 'tenant-retail', 'Shoprite Checkers Digital', 'app-retail-chat', 'Shoprite Support Bot', 'plan-tx-base', 'Per-Transaction Metered Standard', 'LIC-SHOPRITE-MALL-2026-B882', 'grace_period', 'failed', '2026-02-15', '2026-08-15', 'soft_warning', 890.50, 4, '2026-07-15', 750.00, 'USD'),
('lic-gov-01', 'tenant-gov', 'Department of Home Affairs', 'app-gov-doc', 'HomeAffairs ID OCR', 'plan-bespoke', 'Bespoke Negotiated SLA & Token Volume', 'LIC-DEPT-GOV-2026-C301', 'auto_suspended', 'overdue', '2026-03-01', '2026-08-01', 'hard_block_402', 12500.00, 0, '2026-06-01', 12500.00, 'USD'),
('lic-ed-01', 'tenant-ed', 'Wits University Research Lab', 'app-ed-stem', 'Wits Research Solver', 'plan-day-pass', 'Commercial Daily License Pass', 'LIC-WITS-UNI-2026-D412', 'active', 'paid', '2026-08-01', '2026-09-01', NULL, 150.00, 3, '2026-08-28', 150.00, 'USD');

-- Seed 5: Managed AI Providers
INSERT INTO `ai_providers` (`id`, `provider_code`, `name`, `vendor`, `endpoint_type`, `routing_weight`, `health_status`, `average_latency_ms`, `total_calls`, `error_rate_percent`) VALUES
('prov-gemini', 'PROV-GEMINI', 'Google Gemini 2.5 Flash / Pro', 'Google Cloud AI', 'gRPC / REST', 45, 'Healthy', 95, 4820000, 0.01),
('prov-openai', 'PROV-OPENAI', 'OpenAI Enterprise GPT-4o', 'OpenAI', 'REST API', 25, 'Healthy', 185, 2900000, 0.03),
('prov-anthropic', 'PROV-CLAUDE', 'Anthropic Claude 3.5 Sonnet', 'Anthropic', 'REST API', 20, 'Healthy', 160, 1850000, 0.02),
('prov-azure', 'PROV-AZURE', 'Azure OpenAI Private Gateway', 'Microsoft Azure', 'Private Endpoint', 10, 'Degraded', 240, 920000, 0.12);

-- Seed 6: Managed AI Models
INSERT INTO `ai_models` (`id`, `provider_id`, `model_code`, `display_name`, `cost_per_1k_tokens_input_usd`, `cost_per_1k_tokens_output_usd`, `context_window_tokens`, `capability_tags`) VALUES
('mod-gemini-flash', 'prov-gemini', 'gemini-2.5-flash', 'Gemini 2.5 Flash Ultra-Fast', 0.000075, 0.000300, 1000000, 'Multimodal, Low Latency, OCR, Code'),
('mod-gemini-pro', 'prov-gemini', 'gemini-2.5-pro', 'Gemini 2.5 Pro Deep Reasoner', 0.001250, 0.005000, 2000000, 'Deep Reasoning, Complex Analysis, Medical'),
('mod-gpt4o', 'prov-openai', 'gpt-4o', 'GPT-4o Omni Model', 0.002500, 0.010000, 128000, 'General Intelligence, Multimodal'),
('mod-claude-sonnet', 'prov-anthropic', 'claude-3-5-sonnet', 'Claude 3.5 Sonnet Engine', 0.003000, 0.015000, 200000, 'Code, Creative Writing, Document Analysis');

-- Seed 7: AI Capability Routing
INSERT INTO `ai_capability_routing` (`id`, `capability_code`, `function_name`, `assigned_model_code`, `fallback_model_code`, `status`, `active_tenants_count`, `total_requests`) VALUES
('cap-clin', 'CAP-CLINICAL', 'Clinical & Medical AI', 'gemini-2.5-pro', 'claude-3-5-sonnet', 'Optimal', 4, 1840000),
('cap-fraud', 'CAP-FRAUD', 'Fraud & Risk Analytics', 'gemini-2.5-flash', 'gpt-4o', 'Optimal', 5, 4200000),
('cap-chat', 'CAP-CHAT', 'Customer Self-Service Chat', 'gemini-2.5-flash', 'gemini-2.5-pro', 'Optimal', 8, 3100000),
('cap-ocr', 'CAP-OCR', 'Document OCR & Extraction', 'gemini-2.5-flash', 'gpt-4o', 'Optimal', 3, 980000),
('cap-stem', 'CAP-STEM', 'Code & STEM Reasoner', 'gemini-2.5-pro', 'claude-3-5-sonnet', 'Optimal', 2, 450000);

-- Seed 8: Service SLA Targets
INSERT INTO `service_sla_targets` (`id`, `tenant_id`, `service_name`, `target_uptime_percent`, `target_latency_p95_ms`, `max_error_rate_percent`, `current_uptime_percent`, `current_latency_p95_ms`, `current_error_rate_percent`) VALUES
('sla-med-01', 'tenant-med', 'Clinical Triage Ingress API', 99.95, 200, 0.05, 99.99, 110, 0.01),
('sla-fin-01', 'tenant-fin', 'Realtime Fraud Shield Service', 99.99, 100, 0.01, 100.00, 48, 0.00),
('sla-retail-01', 'tenant-retail', 'Customer Support Assistant Gateway', 99.90, 300, 0.10, 99.92, 180, 0.04),
('sla-gov-01', 'tenant-gov', 'Identity Document OCR Engine', 99.99, 250, 0.02, 98.40, 650, 1.80),
('sla-ed-01', 'tenant-ed', 'Wits Math Research Cluster', 99.50, 500, 0.50, 99.85, 310, 0.12);

-- Seed 9: Statutory Security Guardrails (POPIA / GDPR)
INSERT INTO `security_guardrails` (`id`, `tenant_id`, `rule_code`, `category`, `description`, `popia_section`, `enforcement_mode`, `is_enabled`, `total_interceptions`) VALUES
('sg-popia-01', NULL, 'POPIA-SECT-14', 'PII Protection', 'Automatic redaction and masking of South African ID Numbers and Passport details', 'Section 14 (Data Minimisation)', 'Redact_Mask', 1, 1420),
('sg-popia-02', NULL, 'POPIA-SECT-19', 'Security Safeguards', 'Hard block requests attempting prompt injection or model weights extraction', 'Section 19 (Security Measures)', 'Hard_Block_403', 1, 88),
('sg-med-01', 'tenant-med', 'MED-HEALTH-RECORD', 'Medical Privacy', 'Sanitize protected health information (PHI) before routing to public foundation models', 'Section 13 (Purpose Specification)', 'Redact_Mask', 1, 312),
('sg-fin-01', 'tenant-fin', 'FIN-CARD-MASK', 'Financial Privacy', 'Mask PCI-DSS payment credit card numbers and bank account credentials', 'Section 14 (Data Minimisation)', 'Redact_Mask', 1, 890);

-- Seed 10: Audit Logs
INSERT INTO `audit_logs` (`id`, `timestamp`, `tenant_id`, `user_email`, `action_type`, `category`, `severity`, `ip_address`, `request_payload`, `raw_response_payload`) VALUES
('log-101', '2026-08-30 03:45:12', 'tenant-med', 'dr.smith@mediclinic.co.za', 'AI_DIAGNOSTIC_QUERY', 'Clinical AI', 'INFO', '102.165.42.12', '{"patient_id":"ANON-9912","query":"Analyze chest x-ray findings"}', '{"status":"success","confidence":0.98,"latency_ms":112}'),
('log-102', '2026-08-30 03:48:50', 'tenant-fin', 'risk.officer@investec.co.za', 'FRAUD_RULE_EVALUATION', 'Fraud Risk', 'INFO', '196.25.255.1', '{"tx_id":"TX-88219","amount_zar":450000}', '{"fraud_score":0.02,"action":"APPROVE"}'),
('log-103', '2026-08-30 03:52:01', 'tenant-gov', 'sysadmin@dha.gov.za', 'LICENSE_HARD_BLOCK_TRIGGERED', 'Licensing Enforcement', 'ALERT', '164.151.12.9', '{"tenant_id":"tenant-gov","reason":"Account payment overdue"}', '{"error_code":402,"message":"Payment Required. Traffic hard blocked."}'),
('log-104', '2026-08-30 03:59:30', 'tenant-retail', 'billing@shoprite.co.za', 'PAYMENT_WEBHOOK_RECEIVED', 'Commercial Billing', 'WARNING', '54.210.12.8', '{"event":"invoice.payment_failed","tenant_id":"tenant-retail"}', '{"status":"grace_period","grace_days_remaining":4}');

-- Seed 11: Payment Webhook Logs
INSERT INTO `payment_webhook_logs` (`id`, `timestamp`, `tenant_id`, `tenant_name`, `application_id`, `invoice_id`, `event_type`, `amount`, `currency`, `gateway_provider`, `enforcement_triggered`, `status`, `raw_payload_summary`) VALUES
('paylog-201', '2026-08-01 08:00:00', 'tenant-med', 'MediClinic AI Health Group', 'app-med-diag', 'INV-2026-0801', 'invoice.paid', 4500.00, 'USD', 'Stripe', 'none', 'processed', 'Monthly subscription payment successfully reconciled via Stripe.'),
('paylog-202', '2026-08-15 14:22:10', 'tenant-retail', 'Shoprite Checkers Digital', 'app-retail-chat', 'INV-2026-0815', 'invoice.payment_failed', 890.50, 'USD', 'PayFast', 'soft_warning', 'Payment charge failed. Auto grace period initialized for 14 days.'),
('paylog-203', '2026-08-01 00:00:01', 'tenant-gov', 'Department of Home Affairs', 'app-gov-doc', 'INV-2026-0601', 'license.auto_suspended', 12500.00, 'USD', 'SAP_S4HANA_Billing', 'hard_block_402', 'processed', 'Grace period expired without payment receipt. Tenant gateway hard blocked.');

-- Seed 12: Monthly Financial Snapshots
INSERT INTO `financial_monthly_snapshots` (`id`, `tenant_id`, `snapshot_month`, `spend_usd`, `tokens_consumed_millions`, `active_users_count`) VALUES
('snap-med-08', 'tenant-med', '2026-08', 4850.00, 18.50, 420),
('snap-fin-08', 'tenant-fin', '2026-08', 12400.00, 42.00, 1150),
('snap-retail-08', 'tenant-retail', '2026-08', 2150.00, 9.80, 890),
('snap-gov-08', 'tenant-gov', '2026-08', 12500.00, 0.50, 12),
('snap-ed-08', 'tenant-ed', '2026-08', 150.00, 1.20, 85);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- END OF MARIADB 10.11.18 INITIALIZATION SCRIPT
-- ============================================================================
