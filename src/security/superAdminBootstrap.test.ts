import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import {
  bootstrapPlatformSuperAdmin,
  PLATFORM_SUPER_ADMIN_EMAIL,
  type BootstrapConnection,
} from './superAdminBootstrap';

class MemoryBootstrapConnection implements BootstrapConnection {
  users: Array<{ id: string; email: string; status: string; hash: string }> = [];
  assignments = new Map<string, string>();
  permissionLinks = new Set<string>();
  audits: string[] = [];
  appliedScopeMigration = true;
  userInsertCount = 0;
  commits = 0;
  rollbacks = 0;

  async beginTransaction(): Promise<void> {}
  async commit(): Promise<void> { this.commits += 1; }
  async rollback(): Promise<void> { this.rollbacks += 1; }

  async execute(sql: string, params: unknown[] = []): Promise<unknown> {
    if (sql.includes('FROM schema_migrations')) {
      return [[...(this.appliedScopeMigration ? [{ version: '024', name: '024_iam_authorization_scopes.sql' }] : [])], []];
    }
    if (sql.includes('FROM iam_roles')) return [[{ id: 'role_super_admin', tenant_id: null }], []];
    if (sql.includes('FROM iam_users')) {
      return [[...this.users.filter(user => user.email === params[0])], []];
    }
    if (sql.includes('FROM iam_user_roles')) return [[], []];
    if (sql.includes('FROM iam_permissions')) return [[{ id: 'p_tenant_read' }, { id: 'p_audit_read' }], []];
    if (sql.startsWith('INSERT INTO iam_users')) {
      this.userInsertCount += 1;
      this.users.push({ id: String(params[0]), email: String(params[1]), hash: String(params[2]), status: 'ACTIVE' });
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('INSERT INTO iam_user_roles')) {
      this.assignments.set(`${String(params[1])}:${String(params[2])}`, 'GLOBAL');
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('INSERT IGNORE INTO iam_role_permissions')) {
      this.permissionLinks.add(`${String(params[1])}:${String(params[2])}`);
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('INSERT INTO audit_logs')) {
      this.audits.push(String(params[3]));
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unexpected bootstrap query: ${sql}`);
  }
}

test('platform Super Admin bootstrap is persisted through IAM with an explicit global grant and is idempotent', async () => {
  const temporarySecret = randomBytes(32).toString('base64url');
  const connection = new MemoryBootstrapConnection();
  const first = await bootstrapPlatformSuperAdmin(connection, temporarySecret, new Date('2026-09-29T00:00:00.000Z'));
  const second = await bootstrapPlatformSuperAdmin(connection, temporarySecret, new Date('2026-09-29T00:01:00.000Z'));

  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(first.userId, second.userId);
  assert.equal(connection.userInsertCount, 1);
  assert.equal(connection.users[0]?.email, PLATFORM_SUPER_ADMIN_EMAIL);
  assert.notEqual(connection.users[0]?.hash, temporarySecret);
  assert.equal(await bcrypt.compare(temporarySecret, connection.users[0]!.hash), true);
  assert.equal(connection.assignments.get(`${first.userId}:role_super_admin`), 'GLOBAL');
  assert.equal(connection.permissionLinks.size, 2);
  assert.equal(connection.audits.length, 2);
  assert.equal(connection.audits.some(payload => payload.includes(temporarySecret)), false);
  assert.equal(connection.commits, 2);
  assert.equal(connection.rollbacks, 0);
});

test('platform Super Admin bootstrap refuses to write if explicit GLOBAL scope migration is not applied', async () => {
  const connection = new MemoryBootstrapConnection();
  connection.appliedScopeMigration = false;
  const temporarySecret = randomBytes(32).toString('base64url');

  await assert.rejects(
    bootstrapPlatformSuperAdmin(connection, temporarySecret),
    /migration 024 is not recorded as applied/,
  );
  assert.equal(connection.userInsertCount, 0);
  assert.equal(connection.users.length, 0);
  assert.equal(connection.commits, 0);
  assert.equal(connection.rollbacks, 1);
});

test('platform Super Admin bootstrap preserves existing profile and password and refuses inactive identity', async () => {
  const connection = new MemoryBootstrapConnection();
  connection.users.push({ id: 'existing_platform_admin', email: PLATFORM_SUPER_ADMIN_EMAIL, status: 'SUSPENDED', hash: 'existing-hash' });
  const temporarySecret = randomBytes(32).toString('base64url');

  await assert.rejects(bootstrapPlatformSuperAdmin(connection, temporarySecret), /will not reactivate/);
  assert.equal(connection.userInsertCount, 0);
  assert.equal(connection.users[0]?.hash, 'existing-hash');
  assert.equal(connection.commits, 0);
  assert.equal(connection.rollbacks, 1);
});
