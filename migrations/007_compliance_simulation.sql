-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 007: Live Compliance & Law-Breaker Simulation Engine
-- ==============================================================================

-- 1. Simulated Traffic & Law-Breaker Interception Log
CREATE TABLE IF NOT EXISTS compliance_traffic_simulations (
  id VARCHAR(64) PRIMARY KEY,
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
  INDEX idx_sim_tenant (tenant_id),
  INDEX idx_sim_created (created_at),
  INDEX idx_sim_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Cryptographic Tokenization Vault
CREATE TABLE IF NOT EXISTS compliance_token_vault (
  id VARCHAR(64) PRIMARY KEY,
  token_id VARCHAR(64) NOT NULL UNIQUE,
  tenant_id VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  masked_display VARCHAR(128) NOT NULL,
  encrypted_value TEXT NOT NULL,
  reversible BOOLEAN NOT NULL DEFAULT TRUE,
  jurisdiction VARCHAR(32) NOT NULL DEFAULT 'POPIA',
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vault_token (token_id),
  INDEX idx_vault_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
