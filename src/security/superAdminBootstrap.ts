import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';

export const PLATFORM_SUPER_ADMIN_EMAIL = 'horatio@introsoft.co.za';
export const REQUIRED_AUTHORIZATION_MIGRATION = '024';

export interface BootstrapConnection {
  beginTransaction(): Promise<void>;
  execute(sql: string, params?: unknown[]): Promise<unknown>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

type BootstrapRow = Record<string, unknown>;

async function rows<T extends BootstrapRow>(connection: BootstrapConnection, sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await connection.execute(sql, params);
  if (!Array.isArray(result) || !Array.isArray(result[0])) return [];
  return result[0] as T[];
}

/**
 * Creates or reconciles the platform Super Admin through the existing IAM tables.
 * The password is accepted only at runtime, bcrypt-hashed before persistence, and
 * is never included in an audit record or return value.
 */
export async function bootstrapPlatformSuperAdmin(
  connection: BootstrapConnection,
  bootstrapPassword: string,
  now = new Date(),
): Promise<{ userId: string; created: boolean; role: 'SUPER_ADMIN'; scope: 'GLOBAL' }> {
  if (typeof bootstrapPassword !== 'string' || bootstrapPassword.length === 0) {
    throw new Error('A bootstrap password must be supplied through the protected runtime environment.');
  }

  await connection.beginTransaction();
  try {
    const migrations = await rows<BootstrapRow>(connection,
      'SELECT version, name FROM schema_migrations WHERE version = ? FOR UPDATE',
      [REQUIRED_AUTHORIZATION_MIGRATION]);
    if (!migrations.some(row => row.name === '024_iam_authorization_scopes.sql')) {
      throw new Error('Required IAM authorization-scope migration 024 is not recorded as applied. No bootstrap changes were committed.');
    }

    const roleRows = await rows<BootstrapRow>(connection,
      "SELECT id, tenant_id FROM iam_roles WHERE role_code = 'SUPER_ADMIN' FOR UPDATE");
    const role = roleRows[0];
    if (!role || role.tenant_id !== null) {
      throw new Error('The existing global SUPER_ADMIN system role is unavailable. No bootstrap changes were committed.');
    }

    const existingUsers = await rows<BootstrapRow>(connection,
      'SELECT id, status FROM iam_users WHERE LOWER(email) = ? FOR UPDATE',
      [PLATFORM_SUPER_ADMIN_EMAIL]);
    if (existingUsers.length > 1) {
      throw new Error('Duplicate IAM identities match the designated platform administrator. Resolve them before bootstrap.');
    }

    const existing = existingUsers[0];
    if (existing && existing.status !== 'ACTIVE') {
      throw new Error('The designated IAM identity is not active. Bootstrap will not reactivate or otherwise change its account status.');
    }

    const userId = existing ? String(existing.id) : `user_${randomUUID()}`;
    const passwordHash = existing ? null : await bcrypt.hash(bootstrapPassword, 12);
    if (!existing) {
      await connection.execute(
        `INSERT INTO iam_users (
          id, tenant_id, email, password_hash, first_name, last_name, department, status,
          failed_login_attempts, mfa_enabled, mfa_enforced, password_changed_at,
          force_password_change, created_by, created_at, updated_at
        ) VALUES (?, NULL, ?, ?, 'Platform', 'Administrator', 'Platform Administration', 'ACTIVE', 0, 0, 0, ?, 1, 'SYSTEM_BOOTSTRAP', ?, ?)`,
        [userId, PLATFORM_SUPER_ADMIN_EMAIL, passwordHash, now, now, now],
      );
    }

    // MariaDB unique indexes permit more than one NULL tenant key. The identity
    // row lock serializes this bootstrap for the designated user; detect existing
    // duplicates explicitly instead of relying on NULL uniqueness behavior.
    const globalAssignments = await rows<BootstrapRow>(connection,
      'SELECT id FROM iam_user_roles WHERE user_id = ? AND role_id = ? AND tenant_id IS NULL FOR UPDATE',
      [userId, String(role.id)]);
    if (globalAssignments.length > 1) {
      throw new Error('Duplicate platform Super Admin role assignments exist. Resolve them before bootstrap.');
    }
    if (globalAssignments.length === 1) {
      await connection.execute(
        "UPDATE iam_user_roles SET access_scope = 'GLOBAL' WHERE id = ?",
        [String(globalAssignments[0].id)],
      );
    } else {
      await connection.execute(
        `INSERT INTO iam_user_roles (id, user_id, role_id, tenant_id, assigned_by, access_scope)
         VALUES (?, ?, ?, NULL, 'SYSTEM_BOOTSTRAP', 'GLOBAL')`,
        [`ur_global_${userId}`.slice(0, 64), userId, String(role.id)],
      );
    }

    const permissions = await rows<BootstrapRow>(connection,
      'SELECT id FROM iam_permissions ORDER BY id FOR UPDATE');
    for (const permission of permissions) {
      const permissionId = String(permission.id);
      const linkId = `rp_${createHash('sha256').update(`${role.id}:${permissionId}`).digest('hex').slice(0, 56)}`;
      await connection.execute(
        'INSERT IGNORE INTO iam_role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)',
        [linkId, String(role.id), permissionId],
      );
    }

    const requestId = `bootstrap-${randomUUID()}`;
    const event = {
      actor: 'SYSTEM_BOOTSTRAP',
      actorIdentity: 'SYSTEM_BOOTSTRAP',
      actorRole: 'SYSTEM_BOOTSTRAP',
      targetIdentity: PLATFORM_SUPER_ADMIN_EMAIL,
      targetRole: 'SUPER_ADMIN',
      scope: 'GLOBAL',
      operation: existing ? 'RECONCILE' : 'CREATE',
      resourceType: 'IAM_IDENTITY',
      resourceId: userId,
      requestId,
      outcome: 'SUCCESS',
      timestamp: now.toISOString(),
    };
    await connection.execute(
      `INSERT INTO audit_logs (
        id, timestamp, tenant_id, user_email, action_type, category, severity,
        ip_address, request_payload, raw_response_payload, created_at
      ) VALUES (?, ?, NULL, ?, 'SUPER_ADMIN_BOOTSTRAP', 'IAM', 'INFO', NULL, ?, ?, ?)`,
      [`audit_${randomUUID()}`, now, PLATFORM_SUPER_ADMIN_EMAIL, JSON.stringify(event), JSON.stringify({ outcome: 'SUCCESS', requestId }), now],
    );

    await connection.commit();
    return { userId, created: !existing, role: 'SUPER_ADMIN', scope: 'GLOBAL' };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
