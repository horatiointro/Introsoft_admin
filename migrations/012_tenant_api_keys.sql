-- The migration runner checks information_schema before applying additive columns.
ALTER TABLE tenant_applications ADD COLUMN metadata_json JSON NULL;

CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  application_id VARCHAR(64) NOT NULL,
  key_hash CHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(40) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  metadata_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_api_key_tenant (tenant_id, status),
  INDEX idx_tenant_api_key_application (application_id, status)
);
