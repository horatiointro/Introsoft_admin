-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 006: SLA Profiles, Measurements & KPI Telemetry
-- ==============================================================================

-- 1. SLA Profiles Table
CREATE TABLE IF NOT EXISTS sla_profiles (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL UNIQUE,
  profile_name VARCHAR(128) NOT NULL,
  uptime_target_percent DECIMAL(5, 2) NOT NULL DEFAULT 99.95,
  p50_latency_target_ms INT NOT NULL DEFAULT 80,
  p95_latency_target_ms INT NOT NULL DEFAULT 200,
  p99_latency_target_ms INT NOT NULL DEFAULT 500,
  max_error_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.05,
  p1_response_sla_minutes INT NOT NULL DEFAULT 15,
  p2_response_sla_minutes INT NOT NULL DEFAULT 60,
  mtta_target_minutes INT NOT NULL DEFAULT 10,
  mttr_target_minutes INT NOT NULL DEFAULT 120,
  rto_target_minutes INT NOT NULL DEFAULT 60,
  rpo_target_minutes INT NOT NULL DEFAULT 15,
  credit_rebate_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 2.00,
  support_hours VARCHAR(64) NOT NULL DEFAULT '24x7x365_MISSION_CRITICAL',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_slaprof_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. SLA Measurements Table (Persisted Operational Telemetry)
CREATE TABLE IF NOT EXISTS sla_measurements (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  measurement_date DATE NOT NULL,
  uptime_measured_percent DECIMAL(5, 2) NOT NULL,
  p50_latency_measured_ms INT NOT NULL,
  p95_latency_measured_ms INT NOT NULL,
  p99_latency_measured_ms INT NOT NULL,
  total_requests BIGINT NOT NULL DEFAULT 0,
  failed_requests BIGINT NOT NULL DEFAULT 0,
  error_rate_measured_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  provenance VARCHAR(32) NOT NULL DEFAULT 'LIVE', -- LIVE, CALCULATED, DERIVED, DEMO
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_slameas_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uk_tenant_day (tenant_id, measurement_date),
  INDEX idx_slameas_tenant (tenant_id),
  INDEX idx_slameas_date (measurement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SLA Breaches & Service Credits Table
CREATE TABLE IF NOT EXISTS sla_breaches (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  incident_id VARCHAR(64) NULL,
  breach_date DATE NOT NULL,
  metric_name VARCHAR(64) NOT NULL, -- UPTIME, P95_LATENCY, P1_RESPONSE_TIME
  target_value DECIMAL(10, 2) NOT NULL,
  actual_value DECIMAL(10, 2) NOT NULL,
  service_credit_amount_usd DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  credit_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- PENDING, APPROVED, APPLIED
  reconciliation_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_breach_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_breach_tenant (tenant_id),
  INDEX idx_breach_date (breach_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. KPI Telemetry Measurements Table
CREATE TABLE IF NOT EXISTS kpi_measurements (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NULL,
  kpi_code VARCHAR(64) NOT NULL, -- AI_CACHE_HIT_RATE, GUARDRAIL_PASS_RATE, COST_PER_TOKEN_EFFICIENCY
  metric_value DECIMAL(12, 4) NOT NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'PERCENT',
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  provenance VARCHAR(32) NOT NULL DEFAULT 'LIVE',
  INDEX idx_kpi_code (kpi_code),
  INDEX idx_kpi_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
