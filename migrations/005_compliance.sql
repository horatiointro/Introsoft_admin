-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 005: Statutory POPIA / GDPR Compliance & DSAR
-- ==============================================================================

-- 1. Compliance DSAR Requests Table
CREATE TABLE IF NOT EXISTS compliance_dsar_requests (
  id VARCHAR(64) PRIMARY KEY,
  request_number VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'DSR-2026-089'
  tenant_id VARCHAR(64) NOT NULL,
  data_subject_ref VARCHAR(128) NOT NULL, -- Pseudonymized reference e.g. 'SUBJ-HASH-883A'
  request_type VARCHAR(64) NOT NULL, -- ACCESS, RECTIFICATION, ERASURE, OBJECTION
  status VARCHAR(32) NOT NULL DEFAULT 'NEW', -- NEW, IDENTITY_VERIFIED, PROCESSING, FULFILLED, REJECTED
  statutory_basis VARCHAR(64) NOT NULL DEFAULT 'POPIA_SECTION_23', -- POPIA_SECTION_23, POPIA_SECTION_24, GDPR_ARTICLE_15, GDPR_ARTICLE_17
  received_date DATE NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE NULL,
  assigned_officer_email VARCHAR(255) NOT NULL,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method VARCHAR(64) NOT NULL DEFAULT 'NATIONAL_ID_OTP',
  redacted_summary TEXT NOT NULL,
  audit_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dsar_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_dsar_tenant (tenant_id),
  INDEX idx_dsar_status (status),
  INDEX idx_dsar_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Compliance Security & Breach Events Table (POPIA Section 22 Mandatory Reporting)
CREATE TABLE IF NOT EXISTS compliance_breach_events (
  id VARCHAR(64) PRIMARY KEY,
  incident_number VARCHAR(32) NOT NULL UNIQUE,
  tenant_id VARCHAR(64) NOT NULL,
  detection_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  regulator_notified BOOLEAN NOT NULL DEFAULT FALSE,
  regulator_notification_date TIMESTAMP NULL,
  data_subjects_notified BOOLEAN NOT NULL DEFAULT FALSE,
  affected_records_count INT NOT NULL DEFAULT 0,
  data_categories_involved JSON NOT NULL, -- ['SA_ID', 'FINANCIAL_ACCOUNT', 'HEALTH_RECORDS']
  remediation_status VARCHAR(32) NOT NULL DEFAULT 'CONTAINED',
  information_officer_signoff VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_br_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_br_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
