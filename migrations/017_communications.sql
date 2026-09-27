CREATE TABLE IF NOT EXISTS communication_channels (
  id VARCHAR(80) PRIMARY KEY,
  channel_type VARCHAR(32) NOT NULL,
  name VARCHAR(160) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  secret_blob LONGTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  INDEX idx_communication_channel_type (channel_type, enabled)
);

CREATE TABLE IF NOT EXISTS communication_messages (
  id VARCHAR(80) PRIMARY KEY,
  tenant_id VARCHAR(80) NULL,
  direction VARCHAR(16) NOT NULL,
  channel_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  payload_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_communication_message_tenant (tenant_id, created_at),
  INDEX idx_communication_message_status (status, created_at)
);

CREATE TABLE IF NOT EXISTS mobile_devices (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  push_token_ciphertext LONGTEXT NOT NULL,
  device_secret_hash CHAR(64) NOT NULL,
  metadata_json JSON NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,
  INDEX idx_mobile_device_tenant (tenant_id, status)
);
