CREATE TABLE IF NOT EXISTS tenant_key_usage (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  application_id VARCHAR(64) NOT NULL,
  api_key_id VARCHAR(64) NOT NULL,
  api_key_prefix VARCHAR(40) NOT NULL,
  model_id VARCHAR(120) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  occurred_at DATETIME NOT NULL,
  input_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
  amount_usd DECIMAL(18, 8) NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'success',
  INDEX idx_key_usage_tenant_time (tenant_id, occurred_at),
  INDEX idx_key_usage_key_time (api_key_id, occurred_at),
  INDEX idx_key_usage_app_time (application_id, occurred_at),
  CONSTRAINT fk_key_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
