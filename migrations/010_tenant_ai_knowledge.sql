CREATE TABLE IF NOT EXISTS tenant_ai_knowledge (
  id VARCHAR(80) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  app_id VARCHAR(64) NULL,
  title VARCHAR(200) NOT NULL,
  content_ciphertext LONGTEXT NOT NULL,
  tags_json LONGTEXT NOT NULL,
  source VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL,
  expires_at DATETIME NULL,
  INDEX idx_tenant_knowledge_scope (tenant_id, app_id),
  INDEX idx_tenant_knowledge_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_ai_profiles (
  tenant_id VARCHAR(64) PRIMARY KEY,
  profile_json LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
