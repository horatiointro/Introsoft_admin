-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 003: ITIL Operations (Incidents, Problems, Changes, PIRs)
-- ==============================================================================

-- 1. Operations Incidents Table
CREATE TABLE IF NOT EXISTS operations_incidents (
  id VARCHAR(64) PRIMARY KEY,
  incident_number VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'INC-8092'
  tenant_id VARCHAR(64) NULL,
  tenant_name VARCHAR(255) NULL,
  application_id VARCHAR(64) NULL,
  application_name VARCHAR(255) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(8) NOT NULL DEFAULT 'P2', -- P1, P2, P3, P4
  status VARCHAR(32) NOT NULL DEFAULT 'NEW', -- NEW, ACKNOWLEDGED, INVESTIGATING, MITIGATING, RESOLVED, CLOSED
  affected_service VARCHAR(128) NOT NULL DEFAULT 'AI Orchestration Gateway',
  affected_provider VARCHAR(64) NULL,
  affected_model VARCHAR(128) NULL,
  owner_email VARCHAR(255) NULL,
  assignee_email VARCHAR(255) NULL,
  root_cause TEXT NULL,
  containment_action TEXT NULL,
  resolution_summary TEXT NULL,
  sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
  mtta_minutes INT NULL,
  mttr_minutes INT NULL,
  is_major_incident BOOLEAN NOT NULL DEFAULT FALSE,
  pir_required BOOLEAN NOT NULL DEFAULT FALSE,
  pir_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  CONSTRAINT fk_inc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  INDEX idx_inc_tenant (tenant_id),
  INDEX idx_inc_severity (severity),
  INDEX idx_inc_status (status),
  INDEX idx_inc_service (affected_service)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Incident Timeline Events Table
CREATE TABLE IF NOT EXISTS incident_events (
  id VARCHAR(64) PRIMARY KEY,
  incident_id VARCHAR(64) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  event_type VARCHAR(64) NOT NULL, -- STATUS_CHANGE, DIAGNOSTIC_RUN, RAG_ANALYSIS, COMMENT, ESCALATION
  description TEXT NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ievt_incident FOREIGN KEY (incident_id) REFERENCES operations_incidents(id) ON DELETE CASCADE,
  INDEX idx_ievt_incident (incident_id),
  INDEX idx_ievt_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Operations Problems Table
CREATE TABLE IF NOT EXISTS operations_problems (
  id VARCHAR(64) PRIMARY KEY,
  problem_number VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'PRB-104'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  root_cause_category VARCHAR(64) NOT NULL, -- UPSTREAM_PROVIDER, RATE_LIMIT, NETWORK_TIMEOUT, CODE_DEFECT
  workaround TEXT NULL,
  permanent_fix TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- OPEN, UNDER_ANALYSIS, FIX_IDENTIFIED, CLOSED
  known_error BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Change Requests Table (CAB / Emergency Changes)
CREATE TABLE IF NOT EXISTS change_requests (
  id VARCHAR(64) PRIMARY KEY,
  change_number VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'CHG-409'
  title VARCHAR(255) NOT NULL,
  change_type VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- STANDARD, NORMAL, EMERGENCY
  risk_level VARCHAR(16) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
  impact_scope VARCHAR(128) NOT NULL,
  backout_plan TEXT NOT NULL,
  approval_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, IMPLEMENTED
  approved_by VARCHAR(255) NULL,
  scheduled_start TIMESTAMP NULL,
  scheduled_end TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Post Incident Reviews Table (PIR)
CREATE TABLE IF NOT EXISTS post_incident_reviews (
  id VARCHAR(64) PRIMARY KEY,
  incident_id VARCHAR(64) NOT NULL UNIQUE,
  facilitator_email VARCHAR(255) NOT NULL,
  executive_summary TEXT NOT NULL,
  timeline_summary JSON NOT NULL,
  five_whys JSON NOT NULL,
  action_items JSON NOT NULL,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pir_incident FOREIGN KEY (incident_id) REFERENCES operations_incidents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
