CREATE TABLE IF NOT EXISTS tenant_registrations (
  id VARCHAR(80) PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  created_at DATETIME(3) NOT NULL,
  payload_json JSON NOT NULL,
  INDEX idx_registration_email (email),
  INDEX idx_registration_status (status, created_at)
);
