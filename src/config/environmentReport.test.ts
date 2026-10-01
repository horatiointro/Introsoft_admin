import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const compareScript = path.resolve('scripts/compareEnvironmentReports.mjs');

function report(overrides: Record<string, unknown> = {}) {
  return {
    reportVersion: 1,
    environment: 'development-test',
    application: { gitCommit: 'same-commit', packageVersion: '0.0.0', workingTree: 'CLEAN' },
    runtime: { node: 'v24.16.0', packageManager: 'npm/11.13.0', platform: 'win32', architecture: 'x64' },
    dependencies: { packageLockSha256: 'same-lock', installedTopLevel: { mysql2: '3.24.2', express: '4.21.2' } },
    database: { status: 'CONNECTED', serverVersion: 'MariaDB 9.5.0', schemaFingerprint: 'same-schema', migrationStatus: 'CURRENT', applied: ['001'], pending: [] },
    configuration: { valid: true },
    sharedSecretFingerprints: { parityKeyCheck: 'same-key-check', fingerprints: {
      ALTIL_KNOWLEDGE_ENCRYPTION_KEY: 'same-hmac', databaseTarget: 'same-target', databaseCredential: 'same-db-credential',
    } },
    ...overrides,
  };
}

function compare(left: unknown, right: unknown) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'altil-parity-test-'));
  const leftFile = path.join(directory, 'pc.json');
  const rightFile = path.join(directory, 'server.json');
  fs.writeFileSync(leftFile, JSON.stringify(left));
  fs.writeFileSync(rightFile, JSON.stringify(right));
  try { return spawnSync(process.execPath, [compareScript, leftFile, rightFile], { encoding: 'utf8', windowsHide: true }); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

test('parity report comparison passes only when commit, lock, runtime, migrations, and keyed config match', () => {
  const result = compare(report(), report());
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Deployment parity: PASS/);
});

test('parity report comparison flags database migration and shared-secret mismatches without showing values', () => {
  const result = compare(report(), report({
    database: { status: 'CONNECTED', serverVersion: 'MariaDB 9.5.0', schemaFingerprint: 'different-schema', migrationStatus: 'DRIFT', applied: ['001', '002'], pending: ['003'] },
    sharedSecretFingerprints: { parityKeyCheck: 'same-key-check', fingerprints: {
      ALTIL_KNOWLEDGE_ENCRYPTION_KEY: 'synthetic-hmac-different', databaseTarget: 'same-target', databaseCredential: 'same-db-credential',
    } },
  }));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /MISMATCH Applied migration versions/);
  assert.match(result.stdout, /MISMATCH Pending migration versions/);
  assert.match(result.stdout, /MISMATCH Database schema fingerprint/);
  assert.match(result.stdout, /ALTIL_KNOWLEDGE_ENCRYPTION_KEY/);
  assert.doesNotMatch(result.stdout, /synthetic-hmac-different/);
});

test('parity report does not claim secret equality when the fingerprint key differs', () => {
  const result = compare(report(), report({
    sharedSecretFingerprints: { parityKeyCheck: 'different-key-check', fingerprints: { ALTIL_KNOWLEDGE_ENCRYPTION_KEY: 'same-hmac' } },
  }));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Selected shared-secret fingerprints: UNVERIFIED/);
  assert.match(result.stdout, /Deployment parity: NOT DEMONSTRATED/);
});

test('parity report flags operating-system and installed dependency drift', () => {
  const result = compare(report(), report({
    runtime: { node: 'v24.16.0', packageManager: 'npm/11.13.0', platform: 'linux', architecture: 'x64' },
    dependencies: { packageLockSha256: 'same-lock', installedTopLevel: { mysql2: '3.24.2', express: '4.22.0' } },
  }));
  assert.equal(result.status, 1);
  assert.match(result.stdout, /MISMATCH Operating system \/ architecture/);
  assert.match(result.stdout, /MISMATCH Selected installed dependency versions/);
});

test('separate database targets permit distinct database-bound encryption keys when the fingerprint key matches', () => {
  const result = compare(report(), report({
    sharedSecretFingerprints: { parityKeyCheck: 'same-key-check', fingerprints: {
      ALTIL_KNOWLEDGE_ENCRYPTION_KEY: 'different-encryption-key', databaseTarget: 'different-target', databaseCredential: 'different-db-credential',
    } },
  }));
  assert.equal(result.status, 0);
  assert.match(result.stdout, /NO SHARED SECRETS CONFIGURED \(database endpoint differs or cannot be compared\)/);
  assert.match(result.stdout, /Deployment parity: PASS/);
});
