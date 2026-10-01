-- Explicit commercial-account representation of an existing IAM identity.
-- This does not grant technical tenant, application, or credential access.
CREATE TABLE IF NOT EXISTS commercial_account_iam_relationships (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  effective_from DATETIME(3) NOT NULL,
  effective_to DATETIME(3) NULL,
  audit_reference VARCHAR(180) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_commercial_account_iam_account FOREIGN KEY (account_id) REFERENCES commercial_accounts(id),
  CONSTRAINT fk_commercial_account_iam_user FOREIGN KEY (user_id) REFERENCES iam_users(id),
  CONSTRAINT fk_commercial_account_iam_actor FOREIGN KEY (created_by) REFERENCES iam_users(id),
  UNIQUE KEY uk_commercial_account_iam_user_start (user_id, effective_from),
  INDEX idx_commercial_account_iam_active (user_id, status, effective_from, effective_to),
  INDEX idx_commercial_account_iam_account (account_id, status, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO iam_roles
  (id, tenant_id, role_code, name, description, is_system_role, is_immutable)
VALUES
  ('role_customer_account_user', NULL, 'CUSTOMER_ACCOUNT_USER', 'Commercial Account User',
   'A sign-in identity whose commercial access is limited to its explicit effective account relationship.', 1, 1);
