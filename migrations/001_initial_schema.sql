-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 001: Initial Core Schema (12 Tables)
-- ==============================================================================

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  tenant_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(64) NOT NULL DEFAULT 'Enterprise',
  region VARCHAR(64) NOT NULL DEFAULT 'South Africa (af-south-1)',
  popia_compliant BOOLEAN NOT NULL DEFAULT TRUE,
  max_rpm INT NOT NULL DEFAULT 5000,
  max_tpm INT NOT NULL DEFAULT 1000000,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_status (status),
  INDEX idx_tenant_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tenant Applications Table
CREATE TABLE IF NOT EXISTS tenant_applications (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  app_code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  capability_type VARCHAR(64) NOT NULL DEFAULT 'General_AI',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_app_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_app_tenant (tenant_id),
  INDEX idx_app_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Licensing Plans Table
CREATE TABLE IF NOT EXISTS licensing_plans (
  id VARCHAR(64) PRIMARY KEY,
  plan_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pricing_model VARCHAR(64) NOT NULL DEFAULT 'per_transaction',
  base_price DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  billing_cycle VARCHAR(32) NOT NULL DEFAULT 'monthly',
  included_transactions_quota INT NOT NULL DEFAULT 100000,
  overage_rate_per_1k DECIMAL(10, 4) NOT NULL DEFAULT 0.0500,
  grace_period_days INT NOT NULL DEFAULT 14,
  max_rpm_limit INT NOT NULL DEFAULT 5000,
  sla_guarantee_percent DECIMAL(5, 2) NOT NULL DEFAULT 99.95,
  enforcement_rule VARCHAR(64) NOT NULL DEFAULT 'hard_block_402',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tenant Subscriptions / Licenses Table
CREATE TABLE IF NOT EXISTS tenant_licenses (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  tenant_name VARCHAR(255) NOT NULL,
  application_id VARCHAR(64) NOT NULL,
  application_name VARCHAR(255) NOT NULL,
  plan_id VARCHAR(64) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  license_key VARCHAR(128) NOT NULL,
  license_status VARCHAR(32) NOT NULL DEFAULT 'active',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'current',
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  active_enforcement VARCHAR(64) NOT NULL DEFAULT 'none',
  current_accrued_bill_usd DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  grace_period_days_remaining INT NOT NULL DEFAULT 0,
  last_payment_date DATE,
  last_payment_amount DECIMAL(12, 4) DEFAULT 0.0000,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_license_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_license_plan FOREIGN KEY (plan_id) REFERENCES licensing_plans(id),
  INDEX idx_license_tenant (tenant_id),
  INDEX idx_license_plan (plan_id),
  INDEX idx_license_status (license_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AI Providers Table
CREATE TABLE IF NOT EXISTS ai_providers (
  id VARCHAR(64) PRIMARY KEY,
  provider_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  vendor VARCHAR(64) NOT NULL,
  endpoint_type VARCHAR(64) NOT NULL DEFAULT 'REST',
  routing_weight INT NOT NULL DEFAULT 50,
  health_status VARCHAR(32) NOT NULL DEFAULT 'Healthy',
  average_latency_ms INT NOT NULL DEFAULT 120,
  total_calls BIGINT NOT NULL DEFAULT 0,
  error_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AI Foundation Models Table
CREATE TABLE IF NOT EXISTS ai_models (
  id VARCHAR(64) PRIMARY KEY,
  provider_id VARCHAR(64) NOT NULL,
  model_code VARCHAR(128) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  cost_per_1k_tokens_input_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.000150,
  cost_per_1k_tokens_output_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.000600,
  context_window_tokens INT NOT NULL DEFAULT 128000,
  capability_tags VARCHAR(255) NOT NULL DEFAULT 'chat,reasoning,vision',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_model_provider FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
  INDEX idx_model_provider (provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Capability Routing Table
CREATE TABLE IF NOT EXISTS ai_capability_routing (
  id VARCHAR(64) PRIMARY KEY,
  capability_code VARCHAR(64) NOT NULL UNIQUE,
  function_name VARCHAR(255) NOT NULL,
  assigned_model_code VARCHAR(128) NOT NULL,
  fallback_model_code VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  active_tenants_count INT NOT NULL DEFAULT 0,
  total_requests BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SLA Targets & Telemetry Table
CREATE TABLE IF NOT EXISTS service_sla_targets (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  target_uptime_percent DECIMAL(5, 2) NOT NULL DEFAULT 99.95,
  target_latency_p95_ms INT NOT NULL DEFAULT 200,
  max_error_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.05,
  current_uptime_percent DECIMAL(5, 2) NOT NULL DEFAULT 99.98,
  current_latency_p95_ms INT NOT NULL DEFAULT 145,
  current_error_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.01,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sla_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_sla_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Security Guardrails Table
CREATE TABLE IF NOT EXISTS security_guardrails (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64),
  rule_code VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT,
  popia_section VARCHAR(64),
  enforcement_mode VARCHAR(32) NOT NULL DEFAULT 'Redact_Anonymize',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  total_interceptions BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_guardrail_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audit Ledger Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tenant_id VARCHAR(64),
  user_email VARCHAR(255),
  action_type VARCHAR(64) NOT NULL,
  category VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
  ip_address VARCHAR(45),
  request_payload JSON,
  raw_response_payload JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_tenant (tenant_id),
  INDEX idx_audit_severity (severity),
  INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Payment Webhook Logs Table
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tenant_id VARCHAR(64) NOT NULL,
  tenant_name VARCHAR(255) NOT NULL,
  application_id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  amount DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  gateway_provider VARCHAR(64) NOT NULL DEFAULT 'Stripe',
  enforcement_triggered VARCHAR(64) NOT NULL DEFAULT 'none',
  status VARCHAR(32) NOT NULL DEFAULT 'processed',
  raw_payload_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_webhook_tenant (tenant_id),
  INDEX idx_webhook_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Financial Monthly Snapshots Table
CREATE TABLE IF NOT EXISTS financial_monthly_snapshots (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  year_month VARCHAR(7) NOT NULL,
  spend_usd DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  tokens_consumed_millions DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  active_users_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_snap_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uk_tenant_month (tenant_id, year_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
