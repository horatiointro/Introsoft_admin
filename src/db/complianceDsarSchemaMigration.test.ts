import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('migrations/036_dsar_repository_contract.sql', 'utf8');

test('migration 036 adds only forward-compatible DSAR repository fields', () => {
  assert.match(migration, /ADD COLUMN framework VARCHAR\(16\) NOT NULL DEFAULT 'POPIA'/i);
  assert.match(migration, /ADD COLUMN requestor_name VARCHAR\(255\) NULL/i);
  assert.match(migration, /ADD COLUMN app_id VARCHAR\(64\) NULL/i);
  assert.match(migration, /ADD COLUMN notes TEXT NULL/i);
  assert.match(migration, /MODIFY COLUMN assigned_officer_email VARCHAR\(255\) NULL/i);
  assert.doesNotMatch(migration, /\b(?:DROP|DELETE|TRUNCATE)\b/i);
  assert.doesNotMatch(migration, /UPDATE\s+compliance_dsar_requests/i);
});

test('migration 036 uses separate additive statements supported by the idempotent migration runner', () => {
  const statements = migration.replace(/^[ \t]*--.*(?:\r?\n|$)/gm, '').split(/;\s*$/m).map(statement => statement.trim()).filter(Boolean);
  assert.equal(statements.length, 5);
  for (const statement of statements.slice(0, 4)) assert.match(statement, /^ALTER TABLE compliance_dsar_requests\s+ADD COLUMN/i);
  assert.match(statements[4], /^ALTER TABLE compliance_dsar_requests\s+MODIFY COLUMN assigned_officer_email/i);
});
