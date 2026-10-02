import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { TEST_SUPER_ADMIN_IDENTITIES } from '../src/security/testSuperAdminMfa.mjs';

function refuse(message) {
  console.error(`Test Super Admin provisioning refused: ${message}`);
  process.exit(2);
}

const targetDatabase = String(process.env.MARIADB_DATABASE || '').trim();
const targetHost = String(process.env.MARIADB_HOST || '').trim();
if (process.env.NODE_ENV === 'production' || process.env.ALTIL_ENVIRONMENT !== 'development-test') {
  refuse('only the explicit development-test profile is permitted.');
}
if (process.env.ALTIL_TEST_ADMIN_PROVISIONING !== 'true' || process.env.ALTIL_ENABLE_TEST_SUPER_ADMINS !== 'true') {
  refuse('explicit test-account provisioning flags are required.');
}
if (!targetDatabase || process.env.ALTIL_TEST_ADMIN_CONFIRM_DATABASE !== targetDatabase) {
  refuse('the target database does not match the explicit database confirmation.');
}
if (!targetHost || process.env.ALTIL_TEST_ADMIN_CONFIRM_HOST !== targetHost) {
  refuse('the target database host does not match the explicit host confirmation.');
}
if (!process.env.MARIADB_USER || !process.env.MARIADB_PASSWORD || !process.env.MARIADB_SSL) {
  refuse('complete explicit MariaDB settings are required.');
}
const passwords = [process.env.ALTIL_TEST_SUPER_ADMIN_001_PASSWORD, process.env.ALTIL_TEST_SUPER_ADMIN_002_PASSWORD];
if (passwords.some(password => typeof password !== 'string' || password.length === 0)) {
  refuse('both test-account passwords must be supplied through the protected runtime environment.');
}
if (passwords.some(password => /^replace_with_/i.test(password.trim()))) {
  refuse('replace the example password placeholders before provisioning.');
}
if (passwords[0] === passwords[1]) refuse('each test Super Admin must have a distinct password.');

const connection = await mysql.createConnection({
  host: targetHost,
  port: Number(process.env.MARIADB_PORT || 3306),
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: targetDatabase,
  ssl: String(process.env.MARIADB_SSL).toLowerCase() === 'true' ? {} : undefined,
  connectTimeout: 5000,
  multipleStatements: false,
});

let stage = 'verify target';
try {
  stage = 'verify selected database';
  const [databaseRows] = await connection.query('SELECT DATABASE() AS selected_database');
  if (databaseRows[0]?.selected_database !== targetDatabase) refuse('connected database does not match the confirmed target.');
  stage = 'verify required migration';
  const [migrationRows] = await connection.execute('SELECT version, name FROM schema_migrations WHERE version = ?', ['024']);
  if (!migrationRows.some(row => row.name === '024_iam_authorization_scopes.sql')) {
    refuse('IAM authorization-scope migration 024 is not applied.');
  }
  stage = 'verify global role';
  const [roleRows] = await connection.execute("SELECT id, tenant_id FROM iam_roles WHERE role_code = 'SUPER_ADMIN'");
  const role = roleRows[0];
  if (!role || role.tenant_id !== null) refuse('the existing global SUPER_ADMIN system role is unavailable.');

  stage = 'check identity collisions';
  const [existingRows] = await connection.execute(
    'SELECT id, email FROM iam_users WHERE LOWER(email) IN (?, ?) FOR UPDATE',
    TEST_SUPER_ADMIN_IDENTITIES.map(identity => identity.email),
  );
  if (existingRows.length) refuse('one or both target identities already exist; refusing to alter existing accounts.');

  stage = 'verify role permissions';
  const [permissionRows] = await connection.execute(
    'SELECT COUNT(*) AS total FROM iam_permissions p JOIN iam_role_permissions rp ON rp.permission_id=p.id WHERE rp.role_id=?',
    [role.id],
  );
  if (!Number(permissionRows[0]?.total)) refuse('the global SUPER_ADMIN role has no persisted permission grants.');

  stage = 'hash test passwords';
  const hashes = await Promise.all(passwords.map(password => bcrypt.hash(password, 12)));
  await connection.beginTransaction();
  const now = new Date();
  const requestId = `test-super-admin-provision-${randomUUID()}`;
  try {
    for (let index = 0; index < TEST_SUPER_ADMIN_IDENTITIES.length; index += 1) {
      const identity = TEST_SUPER_ADMIN_IDENTITIES[index];
      stage = `insert test identity ${index + 1}`;
      await connection.execute(
        `INSERT INTO iam_users (
          id, tenant_id, email, password_hash, first_name, last_name, department, status,
          failed_login_attempts, mfa_enabled, mfa_enforced, force_password_change,
          password_changed_at, created_by, created_at, updated_at
        ) VALUES (?, NULL, ?, ?, ?, ?, 'TEST PLATFORM ACCESS', 'ACTIVE', 0, 1, 1, 0, ?, 'TEST_ACCOUNT_PROVISIONER', ?, ?)`,
        [identity.id, identity.email, hashes[index], 'Test Super Admin', String(index + 1).padStart(3, '0'), now, now, now],
      );
      stage = `assign global role ${index + 1}`;
      await connection.execute(
        `INSERT INTO iam_user_roles (id, user_id, role_id, tenant_id, assigned_by, access_scope)
         VALUES (?, ?, ?, NULL, 'TEST_ACCOUNT_PROVISIONER', 'GLOBAL')`,
        [`ur-${identity.id}`, identity.id, role.id],
      );
      const event = {
        actor: 'TEST_ACCOUNT_PROVISIONER', actorRole: 'SYSTEM_BOOTSTRAP',
        targetIdentity: identity.email, targetRole: 'SUPER_ADMIN', scope: 'GLOBAL',
        operation: 'CREATE', resourceType: 'IAM_IDENTITY', resourceId: identity.id,
        requestId, outcome: 'SUCCESS', environment: 'development-test', timestamp: now.toISOString(),
      };
      stage = `audit test identity ${index + 1}`;
      await connection.execute(
        `INSERT INTO audit_logs (id, timestamp, tenant_id, user_email, action_type, category, severity, request_payload, raw_response_payload, created_at)
         VALUES (?, ?, NULL, 'TEST_ACCOUNT_PROVISIONER', 'TEST_SUPER_ADMIN_PROVISION', 'IAM', 'INFO', ?, ?, ?)`,
        [`audit-${randomUUID()}`, now, JSON.stringify(event), JSON.stringify({ outcome: 'SUCCESS', requestId }), now],
      );
    }
    await connection.commit();
    stage = 'complete';
  } catch (error) {
    await connection.rollback();
    throw error;
  }
  console.log(`Created ${TEST_SUPER_ADMIN_IDENTITIES.length} test Super Admin identities in confirmed database ${targetDatabase}; passwords and hashes were not logged.`);
  for (const identity of TEST_SUPER_ADMIN_IDENTITIES) console.log(`ACTIVE GLOBAL SUPER_ADMIN: ${identity.email} (${identity.id})`);
} catch (error) {
  if (error?.code === 'ER_DUP_ENTRY') {
    console.error('Test Super Admin provisioning refused: an identity or role assignment conflicts with existing data. No password or hash was logged.');
    process.exitCode = 2;
  } else if (process.exitCode !== 2) {
    console.error(`Test Super Admin provisioning failed during ${stage} (${error?.code || 'database or schema error'}: ${String(error?.sqlMessage || error?.message || 'no database detail').replace(/[\r\n]+/g, ' ').slice(0, 220)}); no password or hash was logged.`);
    process.exitCode = 1;
  }
} finally {
  await connection.end();
}
