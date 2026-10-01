CREATE TABLE IF NOT EXISTS compliance_traffic_simulations (
  id VARCHAR(64) NOT NULL,
  transaction_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  company_name VARCHAR(128) NOT NULL,
  source_app_id VARCHAR(64) NOT NULL,
  target_model VARCHAR(64) NOT NULL,
  target_provider VARCHAR(64) NOT NULL,
  outbound_raw MEDIUMTEXT NOT NULL,
  outbound_sanitized MEDIUMTEXT NOT NULL,
  inbound_raw MEDIUMTEXT NOT NULL,
  inbound_sanitized MEDIUMTEXT NOT NULL,
  violations_json JSON NOT NULL,
  tokenized_entities_json JSON NOT NULL,
  action_taken VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'INTERCEPTED_AND_SANITIZED',
  tokens_consumed INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  fines_prevented_zar DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  fines_prevented_eur DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sim_tenant (tenant_id),
  INDEX idx_sim_created (created_at),
  INDEX idx_sim_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compliance_token_vault (
  id VARCHAR(64) NOT NULL,
  token_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  masked_display VARCHAR(128) NOT NULL,
  encrypted_value TEXT NOT NULL,
  reversible BOOLEAN NOT NULL DEFAULT TRUE,
  jurisdiction VARCHAR(32) NOT NULL DEFAULT 'POPIA',
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY token_id (token_id),
  INDEX idx_vault_token (token_id),
  INDEX idx_vault_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dcr_transformation_records (
  id VARCHAR(64) NOT NULL,
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
  PRIMARY KEY (id),
  INDEX idx_dcr_tenant (tenant_id),
  INDEX idx_dcr_req (request_id),
  INDEX idx_dcr_orig_hash (original_value_hash),
  INDEX idx_dcr_status (status),
  INDEX idx_dcr_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dcr_policy_rules (
  id VARCHAR(64) NOT NULL,
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
  PRIMARY KEY (id),
  INDEX idx_dcr_pol_tenant (tenant_id),
  INDEX idx_dcr_pol_class (classification)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dcr_provenance_ledger (
  event_id VARCHAR(64) NOT NULL,
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
  PRIMARY KEY (event_id),
  INDEX idx_dcr_prov_req (request_id),
  INDEX idx_dcr_prov_tenant (tenant_id),
  INDEX idx_dcr_prov_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dcr_vault_keys (
  key_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  algorithm VARCHAR(32) NOT NULL DEFAULT 'AES-256-GCM',
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  PRIMARY KEY (key_id),
  INDEX idx_dcr_keys_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compliance_framework_configs (
  scope_type VARCHAR(16) NOT NULL DEFAULT 'GLOBAL',
  scope_id VARCHAR(64) NOT NULL DEFAULT 'GLOBAL',
  popia_rules_json JSON NOT NULL,
  gdpr_rules_json JSON NOT NULL,
  information_officer_name VARCHAR(255) NOT NULL,
  information_officer_email VARCHAR(320) NOT NULL,
  eu_data_protection_officer_email VARCHAR(320) NOT NULL,
  compliance_officer_registration_number VARCHAR(128) NOT NULL,
  default_data_retention_days INT UNSIGNED NOT NULL,
  last_updated DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (scope_type, scope_id),
  CONSTRAINT chk_compliance_framework_config_scope CHECK (
    (scope_type = 'GLOBAL' AND scope_id = 'GLOBAL') OR
    (scope_type = 'APPLICATION' AND scope_id <> '')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT
  sim.id, sim.transaction_id, sim.tenant_id, sim.company_name, sim.source_app_id,
  sim.target_model, sim.target_provider, sim.outbound_raw, sim.outbound_sanitized,
  sim.inbound_raw, sim.inbound_sanitized, sim.violations_json,
  sim.tokenized_entities_json, sim.action_taken, sim.status, sim.tokens_consumed,
  sim.duration_ms, sim.fines_prevented_zar, sim.fines_prevented_eur, sim.created_at,
  vault.id, vault.token_id, vault.tenant_id, vault.entity_type, vault.masked_display,
  vault.encrypted_value, vault.reversible, vault.jurisdiction, vault.expires_at,
  vault.created_at,
  transform.id, transform.request_id, transform.tenant_id, transform.principal_id,
  transform.identity_id, transform.application_id, transform.classification,
  transform.data_type, transform.original_value_ciphertext,
  transform.original_value_hash, transform.original_masked_preview,
  transform.surrogate_value, transform.transformation_strategy, transform.scope,
  transform.key_reference, transform.semantic_constraints_json, transform.status,
  transform.reconstruction_count, transform.created_at, transform.expires_at,
  transform.last_reconstructed_at,
  policy.id, policy.tenant_id, policy.classification, policy.entity_type,
  policy.strategy, policy.scope, policy.provider_restrictions_json,
  policy.permitted_providers_json, policy.semantic_config_json, policy.priority,
  policy.status, policy.updated_at,
  provenance.event_id, provenance.event_type, provenance.request_id,
  provenance.tenant_id, provenance.identity_id, provenance.classification,
  provenance.source_hash, provenance.surrogate_hash,
  provenance.transformation_strategy, provenance.provenance_category,
  provenance.policy_version, provenance.description, provenance.previous_event_hash,
  provenance.event_hash, provenance.details_json, provenance.created_at,
  vault_key.key_id, vault_key.tenant_id, vault_key.algorithm, vault_key.version,
  vault_key.status, vault_key.created_at, vault_key.expires_at,
  config.scope_type, config.scope_id, config.popia_rules_json, config.gdpr_rules_json,
  config.information_officer_name, config.information_officer_email,
  config.eu_data_protection_officer_email,
  config.compliance_officer_registration_number,
  config.default_data_retention_days, config.last_updated, config.created_at,
  config.updated_at
FROM compliance_traffic_simulations AS sim
CROSS JOIN compliance_token_vault AS vault
CROSS JOIN dcr_transformation_records AS transform
CROSS JOIN dcr_policy_rules AS policy
CROSS JOIN dcr_provenance_ledger AS provenance
CROSS JOIN dcr_vault_keys AS vault_key
CROSS JOIN compliance_framework_configs AS config
LIMIT 0;
