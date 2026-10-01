import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { compareMigrationVersions, configurationStatuses, resolveDatabaseConfig, validateRuntimeEnvironment } from '../src/config/environmentContract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const outputJson = process.argv.includes('--json');
const config = validateRuntimeEnvironment(process.env);
const databaseSettings = (() => { try { return resolveDatabaseConfig(process.env); } catch { return null; } })();

function git(command) {
  try { return execFileSync('git', command, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

function hashFile(file) {
  try { return createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'); }
  catch { return null; }
}

function secretFingerprint(name, key) {
  const value = process.env[name];
  if (!value || !key) return null;
  return createHmac('sha256', key).update(`ALTIL_PARITY_V1:${name}:`).update(value).digest('hex');
}

function installedVersions() {
  return Object.fromEntries(['mysql2', 'express', 'vite', 'typescript', 'tsx', 'bcryptjs'].map(name => {
    try { return [name, JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version]; }
    catch { return [name, 'NOT INSTALLED']; }
  }));
}

async function databaseReport() {
  if (!databaseSettings) return { status: 'INVALID_CONFIGURATION' };
  let connection;
  try {
    const ssl = databaseSettings.ssl
      ? { rejectUnauthorized: true, ...(databaseSettings.sslCaPath ? { ca: fs.readFileSync(databaseSettings.sslCaPath, 'utf8') } : {}) }
      : undefined;
    const { sslCaPath: _sslCaPath, ...connectionSettings } = databaseSettings;
    connection = await mysql.createConnection({ ...connectionSettings, ssl, connectTimeout: 4000, multipleStatements: false });
    const [[identity]] = await connection.query('SELECT VERSION() AS serverVersion, DATABASE() AS databaseName');
    const [tableRows] = await connection.query(
      'SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_COLLATION FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY TABLE_NAME',
    );
    const [columnRows] = await connection.query(
      "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, IF(COLUMN_DEFAULT IS NULL, 'NULL', 'SET') AS DEFAULT_STATE, EXTRA, COLLATION_NAME, ORDINAL_POSITION FROM information_schema.columns WHERE table_schema = DATABASE() ORDER BY TABLE_NAME, ORDINAL_POSITION",
    );
    const [indexRows] = await connection.query(
      'SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, COLLATION, SUB_PART, INDEX_TYPE FROM information_schema.statistics WHERE table_schema = DATABASE() ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX',
    );
    const [constraintRows] = await connection.query(
      "SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME, kcu.ORDINAL_POSITION, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME FROM information_schema.table_constraints tc LEFT JOIN information_schema.key_column_usage kcu ON kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND kcu.TABLE_NAME = tc.TABLE_NAME AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY') ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME, kcu.ORDINAL_POSITION",
    );
    const schemaFingerprint = createHash('sha256').update(JSON.stringify({ tableRows, columnRows, indexRows, constraintRows })).digest('hex');
    const [[historyTable]] = await connection.execute(
      'SELECT COUNT(*) AS found FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      ['schema_migrations'],
    );
    const migrationFiles = fs.readdirSync(path.join(root, 'migrations')).filter(name => /^\d+.*\.sql$/i.test(name));
    const expected = migrationFiles.map(name => name.match(/^(\d+)/)?.[1]?.padStart(3, '0')).filter(Boolean).sort();
    if (Number(historyTable?.found || 0) === 0) {
      return { status: 'CONNECTED', databaseName: identity.databaseName, serverVersion: identity.serverVersion, tableCount: tableRows.length, schemaFingerprint, migrationStatus: 'MISSING_HISTORY_TABLE', expectedCount: expected.length, applied: [], pending: expected };
    }
    const [rows] = await connection.query('SELECT version FROM schema_migrations ORDER BY version');
    const applied = [...new Set(rows.map(row => String(row.version).padStart(3, '0')))].sort();
    const migrationComparison = compareMigrationVersions(expected, applied);
    const { missing: pending, unexpected: unknownApplied } = migrationComparison;
    return {
      status: 'CONNECTED', databaseName: identity.databaseName, serverVersion: identity.serverVersion,
      tableCount: tableRows.length, schemaFingerprint,
      migrationStatus: migrationComparison.current ? 'CURRENT' : 'DRIFT',
      expectedCount: expected.length, applied, pending, unknownApplied,
    };
  } catch (error) {
    return { status: 'UNAVAILABLE', reason: error?.code || error?.name || 'DatabaseError' };
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}

const statuses = configurationStatuses(process.env);
const parityKey = process.env.ALTIL_PARITY_FINGERPRINT_KEY;
const parityKeyCheck = parityKey ? createHmac('sha256', parityKey).update('ALTIL_PARITY_FINGERPRINT_KEY_CHECK_V1').digest('hex') : null;
const secretNames = [
  'ALTIL_KNOWLEDGE_ENCRYPTION_KEY', 'ALTIL_PROVIDER_VAULT_KEY', 'ALTIL_PAYMENT_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY',
  'PAYFAST_PASSPHRASE', 'IKHOKHA_APP_ID', 'IKHOKHA_APP_SECRET', 'GEMINI_API_KEY',
  'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'GROQ_API_KEY', 'DEEPSEEK_API_KEY', 'MISTRAL_API_KEY', 'TOGETHER_API_KEY',
];
const report = {
  reportVersion: 1,
  generatedAt: new Date().toISOString(),
  environment: process.env.ALTIL_ENVIRONMENT || 'MISSING',
  nodeEnvironment: process.env.NODE_ENV || 'UNSET (Node default: development)',
  application: { product: 'ALTIL', packageName: pkg.name, packageVersion: pkg.version, gitCommit: git(['rev-parse', 'HEAD']), workingTree: git(['status', '--porcelain']) === '' ? 'CLEAN' : 'DIRTY' },
  runtime: {
    node: process.version, platform: process.platform, architecture: process.arch,
    packageManager: (process.env.npm_config_user_agent || '').match(/npm\/([^\s]+)/)?.[0] || 'npm UNKNOWN (run via npm to report version)',
  },
  dependencies: {
    canonicalLockfile: 'package-lock.json', packageLockSha256: hashFile('package-lock.json'),
    packageLockPresent: fs.existsSync(path.join(root, 'package-lock.json')),
    secondaryLockfiles: ['bun.lock'].filter(name => fs.existsSync(path.join(root, name))),
    installedTopLevel: installedVersions(),
  },
  database: await databaseReport(),
  configuration: {
    valid: config.valid, validationErrors: config.errors,
    environmentVariables: statuses,
    providerReachability: 'NOT CHECKED (no external provider calls are made by this report)',
    smtp: 'DATABASE-BACKED / NOT CHECKED',
    cors: 'No environment variable found; server emits Access-Control-Allow-Origin: * for gateway routes.',
    proxy: 'X-Forwarded-For is read directly by several server/auth paths; trusted-proxy configuration is not centralized.',
  },
  sharedSecretFingerprints: {
    mechanism: 'HMAC-SHA256; fingerprints are comparable only when parityKeyCheck matches.',
    parityKeyCheck,
    fingerprints: {
      ...Object.fromEntries(secretNames.map(name => [name, secretFingerprint(name, parityKey)])),
      databaseTarget: databaseSettings && parityKey ? createHmac('sha256', parityKey).update(`ALTIL_PARITY_V1:databaseTarget:${databaseSettings.host}:${databaseSettings.port}:${databaseSettings.database}`).digest('hex') : null,
      databaseCredential: databaseSettings && parityKey ? createHmac('sha256', parityKey).update(`ALTIL_PARITY_V1:databaseCredential:${databaseSettings.user}\0${databaseSettings.password}`).digest('hex') : null,
    },
  },
  safety: { secretValuesIncluded: false, migrationsRun: false, providerCallsMade: false, databaseQueries: 'SELECT and information_schema only' },
};

if (outputJson) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
else {
  console.log('ALTIL ENVIRONMENT REPORT');
  console.log('========================');
  console.log(`Environment: ${report.environment}`);
  console.log(`Application: ${report.application.product} (package ${report.application.packageName} ${report.application.packageVersion})`);
  console.log(`Configuration contract: ${config.valid ? 'VALID' : 'INVALID'}`);
  console.log(`Git commit: ${report.application.gitCommit || 'UNAVAILABLE'}`);
  console.log(`Working tree: ${report.application.workingTree}`);
  console.log(`Node / npm: ${report.runtime.node} / ${report.runtime.packageManager}`);
  console.log(`Canonical lockfile: package-lock.json ${report.dependencies.packageLockSha256 || 'MISSING'}`);
  if (report.dependencies.secondaryLockfiles.length) console.log(`Secondary lockfiles: ${report.dependencies.secondaryLockfiles.join(', ')} (not used by npm ci)`);
  console.log(`Database: ${report.database.status}${report.database.databaseName ? ` (${report.database.databaseName})` : ''}`);
  console.log(`Database server: ${report.database.serverVersion || 'UNKNOWN'}; tables: ${report.database.tableCount ?? 'UNKNOWN'}; schema fingerprint: ${report.database.schemaFingerprint?.slice(0, 16) || 'UNKNOWN'}`);
  console.log(`Database schema: ${report.database.migrationStatus || 'UNKNOWN'}; applied ${report.database.applied?.length ?? 0}/${report.database.expectedCount ?? 0}; pending ${report.database.pending?.join(', ') || 'none/unknown'}`);
  console.log(`Provider connectivity: ${report.configuration.providerReachability}`);
  console.log(`Secret values included: NO; parity fingerprints: ${parityKey ? 'available' : 'not configured'}`);
  if (!config.valid) for (const error of config.errors) console.error(`CONFIG ERROR: ${error}`);
}

if (!config.valid || report.database.status !== 'CONNECTED' || report.database.migrationStatus !== 'CURRENT') process.exitCode = 1;
