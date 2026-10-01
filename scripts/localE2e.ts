import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

const DATABASE = 'altil_e2e_test';
const RESET_FLAG = '--reset-database';
const projectRoot = process.cwd();
const parsedEnv = dotenv.parse(await readFile(path.join(projectRoot, '.env')).catch(() => Buffer.from('')));
const host = (parsedEnv.MARIADB_HOST || '').trim().toLowerCase();
const port = Number(parsedEnv.MARIADB_PORT || '3306');
const user = parsedEnv.MARIADB_USER || '';
const password = parsedEnv.MARIADB_PASSWORD || '';
const requestedPort = Number(process.env.ALTIL_LOCAL_E2E_PORT || '3105');
const requestedReset = process.argv.includes(RESET_FLAG);
const resetConfirmation = process.argv[process.argv.indexOf(RESET_FLAG) + 1];

if (host !== '127.0.0.1' || !user || !Number.isInteger(port) || port < 1 || port > 65535 || ![3105, 3106, 3107, 3108].includes(requestedPort)) {
  throw new Error('LOCAL E2E refused: .env must identify a loopback database endpoint and user. No database was contacted.');
}
if (parsedEnv.DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim()) {
  throw new Error('LOCAL E2E refused: remove DATABASE_URL from the local process environment and configure discrete loopback settings.');
}
if (requestedReset && resetConfirmation !== DATABASE) {
  throw new Error(`Database reset requires: ${RESET_FLAG} ${DATABASE}`);
}

const testRunId = `local-e2e-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${randomBytes(4).toString('hex')}`;
const dataDirectory = path.join(projectRoot, '.altil-data');
const logDirectory = path.join(dataDirectory, 'logs');
const emptyDotenv = path.join(dataDirectory, 'e2e-empty.env');
await mkdir(logDirectory, { recursive: true });
await writeFile(emptyDotenv, '', { encoding: 'utf8', flag: 'a' });

const safeEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  SystemRoot: process.env.SystemRoot,
  WINDIR: process.env.WINDIR,
  TEMP: process.env.TEMP,
  TMP: process.env.TMP,
  USERPROFILE: process.env.USERPROFILE,
  DOTENV_CONFIG_PATH: emptyDotenv,
  NODE_ENV: 'development',
  ALTIL_ENVIRONMENT: 'local-test',
  ALTIL_LOCAL_E2E: 'true',
  ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'true',
  ALTIL_ENABLE_BACKGROUND_JOBS: 'false',
  ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS: 'false',
  ALTIL_LOCAL_E2E_DATABASE: DATABASE,
  ALTIL_EVENT_ENVIRONMENT: 'local-test',
  ALTIL_TEST_RUN_ID: testRunId,
  ALTIL_TEST_MFA_CODE: '000000',
  ALTIL_LOCAL_LOG_FILE: path.join(logDirectory, `events-${testRunId}.ndjson`),
  MARIADB_HOST: host,
  MARIADB_PORT: String(port),
  MARIADB_USER: user,
  MARIADB_PASSWORD: password,
  MARIADB_DATABASE: DATABASE,
  MARIADB_SSL: 'false',
  HOST: '127.0.0.1',
  PORT: String(requestedPort),
};

const node = process.execPath;
const tsxCli = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const migrationCli = path.join(projectRoot, 'scripts', 'migrate.js');
const serverEntry = path.join(projectRoot, 'server.ts');

async function withDatabase<T>(operation: (connection: mysql.Connection) => Promise<T>): Promise<T> {
  const connection = await mysql.createConnection({ host, port, user, password, connectTimeout: 4000, multipleStatements: false });
  try { return await operation(connection); } finally { await connection.end(); }
}

if (requestedReset) {
  await withDatabase(async connection => {
    const [rows] = await connection.query<(RowDataPacket & { selected_database: string | null })[]>('SELECT DATABASE() AS selected_database');
    if (rows[0]?.selected_database) throw new Error('LOCAL E2E reset requires a server-level connection without a selected database.');
    await connection.query(`DROP DATABASE IF EXISTS \`${DATABASE}\``);
    await connection.query(`CREATE DATABASE \`${DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  });
  await runChild(node, ['--import', 'tsx', migrationCli], safeEnv, 'Database migrations');
}

await withDatabase(async connection => {
  await connection.query(`USE \`${DATABASE}\``);
  const [versionRows] = await connection.query<(RowDataPacket & { version: string })[]>('SELECT version FROM schema_migrations');
  const migrationFiles = (await readdir(path.join(projectRoot, 'migrations'))).filter(file => /^\d+.*\.sql$/.test(file));
  const expected = migrationFiles.map(file => file.match(/^(\d+)/)?.[1]).filter((version): version is string => Boolean(version));
  const applied = new Set(versionRows.map(row => String(row.version).padStart(3, '0')));
  const missing = expected.filter(version => !applied.has(version.padStart(3, '0')));
  if (missing.length) throw new Error(`LOCAL E2E database is not ready; unapplied migration versions: ${missing.join(', ')}. Reset only the allowlisted test database explicitly.`);
});

const bcryptModule = await import('bcryptjs');
const passwordHash = await bcryptModule.default.hash('supertest', 10);
await withDatabase(async connection => {
  await connection.query(`USE \`${DATABASE}\``);
  await connection.execute(
    `INSERT INTO iam_users (id, tenant_id, email, password_hash, first_name, last_name, department, status, mfa_enabled, mfa_enforced, force_password_change, password_changed_at, created_by)
     VALUES (?, NULL, ?, ?, 'LOCAL TEST', 'SUPERTEST', 'LOCAL E2E', 'ACTIVE', 1, 1, 0, NOW(), 'LOCAL_E2E_FIXTURE')
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), status='ACTIVE', mfa_enabled=1, mfa_enforced=1, force_password_change=0, password_changed_at=NOW()`,
    ['local-e2e-super-admin', 'supertest@introsoft.co.za', passwordHash],
  );
  await connection.execute(
    `INSERT IGNORE INTO iam_user_roles (id, user_id, role_id, tenant_id, assigned_by, access_scope)
     VALUES ('local-e2e-super-admin-global', 'local-e2e-super-admin', 'role_super_admin', NULL, 'LOCAL_E2E_FIXTURE', 'GLOBAL')`,
  );
});

console.log(`Starting ALTIL real server in isolated LOCAL E2E mode on loopback port ${requestedPort}. testRunId=${testRunId}`);
console.log(`Local event file: ${path.relative(projectRoot, safeEnv.ALTIL_LOCAL_LOG_FILE!)}`);
console.log('The disposable database is allowlisted as altil_e2e_test; no provider credentials are passed to the server.');
await runChild(node, ['--import', 'tsx', serverEntry], safeEnv, 'ALTIL LOCAL E2E server');

function runChild(executable: string, args: string[], env: NodeJS.ProcessEnv, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: projectRoot, env, stdio: 'inherit' });
    const forward = (signal: NodeJS.Signals) => child.kill(signal);
    process.on('SIGINT', forward);
    process.on('SIGTERM', forward);
    child.once('error', error => { process.off('SIGINT', forward); process.off('SIGTERM', forward); reject(error); });
    child.once('exit', (code, signal) => {
      process.off('SIGINT', forward);
      process.off('SIGTERM', forward);
      if (code === 0 || signal) resolve();
      else reject(new Error(`${label} exited with status ${code}.`));
    });
  });
}
