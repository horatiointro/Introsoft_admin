-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 008: Data Cloaking, Tokenisation & Reconstruction (DCR)
-- ==============================================================================

-- 1. Transformation Vault Records (Encrypted original values, surrogates, scope, and TTL)
CREATE TABLE IF NOT EXISTS dcr_transformation_records (
  id VARCHAR(64) PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  principal_id VARCHAR(64) NULL,
  identity_id VARCHAR(64) NULL,
  application_id VARCHAR(64) NULL,
  classification VARCHAR(64) NOT NULL,
  data_type VARCHAR(64) NOT NULL,
  original_value_ciphertext MEDIUMTEXT NOT NULL,
  original_value_hash VARCHAR(64) NOT NULL,
  original_masked_preview VARCHAR(128) NOT NULL,
  surrogate_value TEXT NOT NULL,
  transformation_strategy VARCHAR(64) NOT NULL,
  scope VARCHAR(32) NOT NULL DEFAULT 'REQUEST',
  key_reference VARCHAR(64) NOT NULL,
  semantic_constraints_json JSON NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  reconstruction_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_reconstructed_at TIMESTAMP NULL,
  INDEX idx_dcr_tenant (tenant_id),
  INDEX idx_dcr_req (request_id),
  INDEX idx_dcr_orig_hash (original_value_hash),
  INDEX idx_dcr_status (status),
  INDEX idx_dcr_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. DCR Policy & Strategy Rules per Tenant / Data Classification
CREATE TABLE IF NOT EXISTS dcr_policy_rules (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  classification VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NULL,
  strategy VARCHAR(64) NOT NULL,
  scope VARCHAR(32) NOT NULL DEFAULT 'REQUEST',
  provider_restrictions_json JSON NOT NULL,
  permitted_providers_json JSON NOT NULL,
  semantic_config_json JSON NULL,
  priority INT NOT NULL DEFAULT 100,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dcr_pol_tenant (tenant_id),
  INDEX idx_dcr_pol_class (classification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Immutable DCR Provenance & Reconstruction Ledger (Append-Only)
CREATE TABLE IF NOT EXISTS dcr_provenance_ledger (
  event_id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  request_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  identity_id VARCHAR(64) NULL,
  classification VARCHAR(64) NOT NULL,
  source_hash VARCHAR(64) NOT NULL,
  surrogate_hash VARCHAR(64) NOT NULL,
  transformation_strategy VARCHAR(64) NOT NULL,
  provenance_category VARCHAR(64) NOT NULL,
  policy_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  description TEXT NOT NULL,
  previous_event_hash VARCHAR(64) NOT NULL,
  event_hash VARCHAR(64) NOT NULL,
  details_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dcr_prov_req (request_id),
  INDEX idx_dcr_prov_tenant (tenant_id),
  INDEX idx_dcr_prov_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Cryptographic Vault Keystore Metadata (Tenant Key Hierarchy)
CREATE TABLE IF NOT EXISTS dcr_vault_keys (
  key_id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  algorithm VARCHAR(32) NOT NULL DEFAULT 'AES-256-GCM',
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  INDEX idx_dcr_keys_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
