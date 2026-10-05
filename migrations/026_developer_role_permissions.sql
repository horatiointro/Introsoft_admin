-- Add the permissions implied by the DEVELOPER role description.
-- The role existed with no iam_role_permissions rows, so every route gated on
-- apikeys.create/model.read/provider.read/audit.read was unreachable for developers.
-- INSERT IGNORE keeps this idempotent against the baseline seed.

INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id)
SELECT CONCAT('rp_dev_', p.id), 'role_developer', p.id
FROM iam_permissions p
WHERE p.permission_code IN (
  'apikeys.create',
  'apikeys.revoke',
  'model.read',
  'provider.read',
  'audit.read',
  'tenant.read'
);