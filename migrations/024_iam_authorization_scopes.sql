-- Add explicit visibility to an existing user/role/tenant assignment.
-- Existing tenant assignments remain organisation-scoped by default; a NULL tenant is
-- not automatically global. Only the existing platform Super Admin assignment is
-- explicitly marked GLOBAL.
ALTER TABLE iam_user_roles
  ADD COLUMN access_scope VARCHAR(24) NOT NULL DEFAULT 'ORGANISATION';

UPDATE iam_user_roles ur
JOIN iam_roles r ON r.id = ur.role_id
SET ur.access_scope = 'GLOBAL'
WHERE ur.tenant_id IS NULL
  AND r.role_code = 'SUPER_ADMIN';

CREATE INDEX idx_iam_user_roles_scope
  ON iam_user_roles (user_id, tenant_id, access_scope);

INSERT IGNORE INTO iam_permissions (id, permission_code, category, name, description) VALUES
  ('p_user_read', 'user.read', 'IAM', 'View Organization Users', 'Read users within the assigned organization scope.'),
  ('p_user_create', 'user.create', 'IAM', 'Create Organization Users', 'Create users within the assigned organization scope.'),
  ('p_user_update', 'user.update', 'IAM', 'Update Organization Users', 'Update users within the assigned organization scope.'),
  ('p_user_disable', 'user.disable', 'IAM', 'Disable Organization Users', 'Disable users within the assigned organization scope.'),
  ('p_tenant_update', 'tenant.update', 'TENANT', 'Update Organization', 'Update the assigned organization profile.');

INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_super_', p.id), 'role_super_admin', p.id
FROM iam_permissions p
WHERE p.permission_code IN ('user.read', 'user.create', 'user.update', 'user.disable', 'tenant.update');

INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_tenant_', p.id), 'role_tenant_admin', p.id
FROM iam_permissions p
WHERE p.permission_code IN ('user.read', 'user.create', 'user.update', 'user.disable', 'tenant.update');
