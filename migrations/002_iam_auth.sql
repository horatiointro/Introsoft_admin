-- ==============================================================================
-- ALTIL SECURE AI MIGRATION 002: Identity & Access Management (IAM) and Authentication
-- ==============================================================================

-- 1. IAM Users Table
CREATE TABLE IF NOT EXISTS iam_users (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NULL, -- NULL indicates global/platform user
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(128) NOT NULL,
  last_name VARCHAR(128) NOT NULL,
  department VARCHAR(128) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, LOCKED, SUSPENDED, OFFBOARDED
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lockout_until TIMESTAMP NULL,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enforced BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMP NULL,
  last_login_ip VARCHAR(45) NULL,
  password_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_iam_user_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL,
  INDEX idx_iam_user_email (email),
  INDEX idx_iam_user_tenant (tenant_id),
  INDEX idx_iam_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. IAM Roles Table
CREATE TABLE IF NOT EXISTS iam_roles (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NULL, -- NULL indicates global system role
  role_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_iam_role_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_iam_role_code (role_code),
  INDEX idx_iam_role_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. IAM Permissions Table
CREATE TABLE IF NOT EXISTS iam_permissions (
  id VARCHAR(64) PRIMARY KEY,
  permission_code VARCHAR(128) NOT NULL UNIQUE, -- e.g. 'tenant.write', 'routing.edit'
  category VARCHAR(64) NOT NULL, -- e.g. 'TENANT', 'GATEWAY', 'COMPLIANCE', 'FINOPS', 'IAM'
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_iam_perm_code (permission_code),
  INDEX idx_iam_perm_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. IAM User Roles (Many-to-Many Assignment)
CREATE TABLE IF NOT EXISTS iam_user_roles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  role_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NULL, -- Scope of the role assignment
  assigned_by VARCHAR(64) NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES iam_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES iam_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_role_scope (user_id, role_id, tenant_id),
  INDEX idx_ur_user (user_id),
  INDEX idx_ur_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. IAM Role Permissions (Many-to-Many Grant)
CREATE TABLE IF NOT EXISTS iam_role_permissions (
  id VARCHAR(64) PRIMARY KEY,
  role_id VARCHAR(64) NOT NULL,
  permission_id VARCHAR(64) NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES iam_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES iam_permissions(id) ON DELETE CASCADE,
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  INDEX idx_rp_role (role_id),
  INDEX idx_rp_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. IAM User Sessions Table (Stateful, Revocable Tokens)
CREATE TABLE IF NOT EXISTS iam_user_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  revoked_reason VARCHAR(128) NULL,
  CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES iam_users(id) ON DELETE CASCADE,
  INDEX idx_sess_token (session_token),
  INDEX idx_sess_user (user_id),
  INDEX idx_sess_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. IAM MFA Credentials Table
CREATE TABLE IF NOT EXISTS iam_mfa_credentials (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  mfa_type VARCHAR(32) NOT NULL DEFAULT 'TOTP', -- TOTP, FIPS_HSM, FIDO2
  secret_key_encrypted TEXT NOT NULL,
  backup_codes_hash JSON NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES iam_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. IAM Login Events Table (Security Audit)
CREATE TABLE IF NOT EXISTS iam_login_events (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  email_attempted VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  outcome VARCHAR(32) NOT NULL, -- SUCCESS, INVALID_PASSWORD, LOCKED, MFA_FAILED, SUSPENDED
  failure_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_email (email_attempted),
  INDEX idx_login_outcome (outcome),
  INDEX idx_login_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. IAM Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS iam_password_reset_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES iam_users(id) ON DELETE CASCADE,
  INDEX idx_prt_token (token_hash),
  INDEX idx_prt_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- BASELINE SEED DATA: Roles & Permissions
-- ==============================================================================

-- Insert Standard Enterprise Roles
INSERT INTO iam_roles (id, role_code, name, description, is_system_role, is_immutable) VALUES
('role_super_admin', 'SUPER_ADMIN', 'Global Super Admin', 'Full unrestricted enterprise-wide administrative control across all tenants and infrastructure.', TRUE, TRUE),
('role_platform_admin', 'PLATFORM_ADMIN', 'Platform Administrator', 'Technical control over AI routing, providers, and cluster infrastructure.', TRUE, TRUE),
('role_tenant_admin', 'TENANT_ADMIN', 'Tenant Administrator', 'Administrative control bounded strictly to assigned tenant micro-services and users.', TRUE, TRUE),
('role_security_officer', 'SECURITY_OFFICER', 'Security Officer (SOC)', 'Control over statutory POPIA/GDPR guardrails, threat containment, and security audit ledger.', TRUE, TRUE),
('role_compliance_officer', 'COMPLIANCE_OFFICER', 'Statutory Compliance Officer', 'Management of statutory POPIA/GDPR DSRs, data subject records, and audit verifications.', TRUE, TRUE),
('role_finops_manager', 'FINOPS_MANAGER', 'FinOps Manager', 'Commercial monetization, licensing plans, quota controls, and service credit reconciliation.', TRUE, TRUE),
('role_service_manager', 'SERVICE_MANAGER', 'Service Operations Manager', 'ITIL service catalogue, SLA threshold enforcement, and incident lifecycle management.', TRUE, TRUE),
('role_developer', 'DEVELOPER', 'Application Developer', 'Access to API playground, application API key generation, and telemetry diagnostics.', TRUE, TRUE),
('role_auditor', 'AUDITOR', 'Statutory Governance Auditor', 'Read-only access across all compliance ledgers, SLA records, and execution logs.', TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Granular Permission Definitions
INSERT INTO iam_permissions (id, permission_code, category, name, description) VALUES
('p_tenant_read', 'tenant.read', 'TENANT', 'View Tenant Profiles', 'Permission to view tenant directory and configuration.'),
('p_tenant_write', 'tenant.write', 'TENANT', 'Create/Edit Tenants', 'Permission to onboard and modify tenant settings.'),
('p_tenant_delete', 'tenant.delete', 'TENANT', 'Delete/Offboard Tenants', 'Permission to decommission or delete enterprise tenants.'),
('p_routing_edit', 'routing.edit', 'GATEWAY', 'Manage AI Routing', 'Permission to modify model routing matrix and fallback chains.'),
('p_models_config', 'models.configure', 'GATEWAY', 'Configure AI Models', 'Permission to enable or disable provider models.'),
('p_providers_write', 'providers.write', 'GATEWAY', 'Manage AI Providers', 'Permission to modify endpoint settings and routing weights.'),
('p_apikeys_create', 'apikeys.create', 'GATEWAY', 'Issue API Keys', 'Permission to generate cryptographic client tokens.'),
('p_apikeys_revoke', 'apikeys.revoke', 'GATEWAY', 'Revoke API Keys', 'Permission to immediately invalidate client tokens.'),
('p_policies_write', 'policies.write', 'SECURITY', 'Edit Guardrails', 'Permission to modify POPIA/GDPR sanitization policies.'),
('p_security_write', 'security.write', 'SECURITY', 'Security Operations', 'Permission to trigger threat containment playbooks.'),
('p_compliance_dsr', 'compliance.dsr', 'COMPLIANCE', 'Process DSRs', 'Permission to fulfill statutory data subject access requests.'),
('p_audit_export', 'audit.export', 'COMPLIANCE', 'Export Audit Ledger', 'Permission to download cryptographic audit logs.'),
('p_billing_write', 'billing.write', 'FINOPS', 'Manage Licensing Plans', 'Permission to create commercial tiers and issue credit rebates.'),
('p_incidents_write', 'incidents.write', 'OPERATIONS', 'Manage Incidents', 'Permission to update incident state, root causes, and PIRs.'),
('p_cmdb_write', 'cmdb.write', 'OPERATIONS', 'Modify CMDB', 'Permission to register CI nodes and dependency edges.'),
('p_sla_write', 'sla.write', 'OPERATIONS', 'Configure SLA Profiles', 'Permission to set uptime targets and latency thresholds.'),
('p_iam_users_write', 'iam.users.write', 'IAM', 'Manage Users', 'Permission to invite, edit, or offboard users.'),
('p_iam_roles_write', 'iam.roles.write', 'IAM', 'Manage Roles', 'Permission to modify role permissions and assignments.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Grant All Permissions to SUPER_ADMIN Role
INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_super_', p.id), 'role_super_admin', p.id FROM iam_permissions p;

-- Grant Tenant Admin Permissions
INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_tenant_', p.id), 'role_tenant_admin', p.id FROM iam_permissions p
WHERE p.permission_code IN ('tenant.read', 'apikeys.create', 'apikeys.revoke', 'incidents.write', 'iam.users.write');

-- Grant Compliance Officer Permissions
INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_comp_', p.id), 'role_compliance_officer', p.id FROM iam_permissions p
WHERE p.permission_code IN ('tenant.read', 'policies.write', 'compliance.dsr', 'audit.export');

-- Grant FinOps Manager Permissions
INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_fin_', p.id), 'role_finops_manager', p.id FROM iam_permissions p
WHERE p.permission_code IN ('tenant.read', 'billing.write', 'audit.export');

-- Grant Auditor (Read Only) Permissions
INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_audit_', p.id), 'role_auditor', p.id FROM iam_permissions p
WHERE p.permission_code IN ('tenant.read', 'audit.export');

-- Insert Initial Seed Super Admin User (Password: "Admin@Altil2026!", hashed via bcryptjs)
-- Hash below corresponds to: "Admin@Altil2026!"
INSERT INTO iam_users (
  id, tenant_id, email, password_hash, first_name, last_name, department, status, mfa_enabled, mfa_enforced
) VALUES (
  'user_super_admin_001',
  NULL,
  'horatio.huxham@gmail.com',
  '$2a$10$7R0wUf8K0s14vXfP.h2e0u45K1n7YtE79h6OQ8UoJ0B78f5VvF1W2', -- standard bcrypt hash for Admin@Altil2026!
  'Horatio',
  'Huxham',
  'Executive AI Governance & Architecture',
  'ACTIVE',
  TRUE,
  TRUE
) ON DUPLICATE KEY UPDATE first_name=VALUES(first_name);

-- Assign SUPER_ADMIN role to Seed User
INSERT IGNORE INTO iam_user_roles (id, user_id, role_id, tenant_id, assigned_by)
VALUES ('ur_seed_001', 'user_super_admin_001', 'role_super_admin', NULL, 'SYSTEM_INIT');
