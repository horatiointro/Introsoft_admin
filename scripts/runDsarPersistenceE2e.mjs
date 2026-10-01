import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const root = process.cwd();
const parsed = dotenv.parse(fs.readFileSync(path.join(root, '.env')));
const host = process.env.MARIADB_HOST || parsed.MARIADB_HOST;
const port = Number(process.env.MARIADB_PORT || parsed.MARIADB_PORT || '3306');
const user = process.env.MARIADB_USER || parsed.MARIADB_USER;
const password = process.env.MARIADB_PASSWORD || parsed.MARIADB_PASSWORD;
const database = 'altil_e2e_test';

if (process.env.DATABASE_URL?.trim() || parsed.DATABASE_URL?.trim() || host !== '127.0.0.1' || !user || !password || !Number.isInteger(port)) {
  throw new Error('DSAR E2E refused: it requires discrete credentials for loopback altil_e2e_test.');
}

const connection = await mysql.createConnection({ host, port, user, password, database, connectTimeout: 4000, multipleStatements: false });
try {
  const [[identity]] = await connection.query('SELECT DATABASE() AS databaseName');
  if (identity.databaseName !== database) throw new Error('DSAR E2E refused: selected database differs from the exact allowlist.');
  const [migrationRows] = await connection.query('SELECT version FROM schema_migrations ORDER BY version');
  const applied = new Set(migrationRows.map(row => String(row.version).padStart(3, '0')));
  if (!applied.has('036') || applied.size !== 36) throw new Error('DSAR E2E requires exactly migrations 001–036 applied to altil_e2e_test.');
  console.log('DSAR and billing database-backed tests target: 127.0.0.1 loopback / altil_e2e_test; migrations 001–036 verified.');
} finally {
  await connection.end();
}

const childEnv = {
  PATH: process.env.PATH,
  SystemRoot: process.env.SystemRoot,
  WINDIR: process.env.WINDIR,
  TEMP: process.env.TEMP,
  TMP: process.env.TMP,
  USERPROFILE: process.env.USERPROFILE,
  NODE_ENV: 'development',
  ALTIL_ENVIRONMENT: 'local-test',
  ALTIL_LOCAL_E2E: 'true',
  ALTIL_LOCAL_E2E_DATABASE: database,
  MARIADB_HOST: host,
  MARIADB_PORT: String(port),
  MARIADB_USER: user,
  MARIADB_PASSWORD: password,
  MARIADB_DATABASE: database,
  MARIADB_SSL: 'false',
};
const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', 'src/db/complianceRepository.e2e.test.ts', 'src/db/manualInvoicePayment.e2e.test.ts'], {
  cwd: root, env: childEnv, stdio: 'inherit', windowsHide: true,
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
