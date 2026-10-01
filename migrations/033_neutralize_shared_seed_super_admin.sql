-- Disable the shared administrator identity inserted by migration 002 only
-- after a different active, globally assigned SUPER_ADMIN already exists.
-- This preserves an administrator recovery path and leaves test bootstrap
-- fixtures untouched when they do not provision an alternate persistent admin.

UPDATE iam_users AS seeded
JOIN (
  SELECT eligible.candidate_id
  FROM (
    SELECT DISTINCT replacement.id AS candidate_id
    FROM iam_users AS replacement
    JOIN iam_user_roles AS assignment ON assignment.user_id = replacement.id
    JOIN iam_roles AS role ON role.id = assignment.role_id
    WHERE replacement.status = 'ACTIVE'
      AND assignment.tenant_id IS NULL
      AND assignment.access_scope = 'GLOBAL'
      AND role.role_code = 'SUPER_ADMIN'
  ) AS eligible
) AS active_global_admin ON active_global_admin.candidate_id <> seeded.id
SET seeded.status = 'SUSPENDED',
    seeded.force_password_change = 1,
    seeded.failed_login_attempts = 0,
    seeded.lockout_until = NULL,
    seeded.updated_at = CURRENT_TIMESTAMP
WHERE seeded.id = 'user_super_admin_001'
  AND LOWER(seeded.email) = 'horatio.huxham@gmail.com'
  AND LOWER(COALESCE(DATABASE(), '')) NOT REGEXP '(^|[_-])test([_-]|$)'
  AND seeded.status = 'ACTIVE';

UPDATE iam_user_sessions AS session
JOIN iam_users AS seeded ON seeded.id = session.user_id
JOIN (
  SELECT eligible.candidate_id
  FROM (
    SELECT DISTINCT replacement.id AS candidate_id
    FROM iam_users AS replacement
    JOIN iam_user_roles AS assignment ON assignment.user_id = replacement.id
    JOIN iam_roles AS role ON role.id = assignment.role_id
    WHERE replacement.status = 'ACTIVE'
      AND assignment.tenant_id IS NULL
      AND assignment.access_scope = 'GLOBAL'
      AND role.role_code = 'SUPER_ADMIN'
  ) AS eligible
) AS active_global_admin ON active_global_admin.candidate_id <> seeded.id
SET session.is_active = 0,
    session.revoked_at = CURRENT_TIMESTAMP,
    session.revoked_reason = 'SEEDED_ADMIN_NEUTRALIZED'
WHERE seeded.id = 'user_super_admin_001'
  AND LOWER(seeded.email) = 'horatio.huxham@gmail.com'
  AND LOWER(COALESCE(DATABASE(), '')) NOT REGEXP '(^|[_-])test([_-]|$)'
  AND session.is_active = 1;
