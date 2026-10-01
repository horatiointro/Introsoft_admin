import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const migrationsDir = join(process.cwd(), 'migrations');
const migrationPath = join(migrationsDir, '035_compliance_dcr_schema_repair.sql');
const migration = readFileSync(migrationPath, 'utf8');

const requiredColumns: Record<string, string[]> = {
  compliance_traffic_simulations: ['id', 'transaction_id', 'tenant_id', 'company_name', 'source_app_id', 'target_model', 'target_provider', 'outbound_raw', 'outbound_sanitized', 'inbound_raw', 'inbound_sanitized', 'violations_json', 'tokenized_entities_json', 'action_taken', 'status', 'tokens_consumed', 'duration_ms', 'fines_prevented_zar', 'fines_prevented_eur', 'created_at'],
  compliance_token_vault: ['id', 'token_id', 'tenant_id', 'entity_type', 'masked_display', 'encrypted_value', 'reversible', 'jurisdiction', 'expires_at', 'created_at'],
  dcr_transformation_records: ['id', 'request_id', 'tenant_id', 'principal_id', 'identity_id', 'application_id', 'classification', 'data_type', 'original_value_ciphertext', 'original_value_hash', 'original_masked_preview', 'surrogate_value', 'transformation_strategy', 'scope', 'key_reference', 'semantic_constraints_json', 'status', 'reconstruction_count', 'created_at', 'expires_at', 'last_reconstructed_at'],
  dcr_policy_rules: ['id', 'tenant_id', 'classification', 'entity_type', 'strategy', 'scope', 'provider_restrictions_json', 'permitted_providers_json', 'semantic_config_json', 'priority', 'status', 'updated_at'],
  dcr_provenance_ledger: ['event_id', 'event_type', 'request_id', 'tenant_id', 'identity_id', 'classification', 'source_hash', 'surrogate_hash', 'transformation_strategy', 'provenance_category', 'policy_version', 'description', 'previous_event_hash', 'event_hash', 'details_json', 'created_at'],
  dcr_vault_keys: ['key_id', 'tenant_id', 'algorithm', 'version', 'status', 'created_at', 'expires_at'],
  compliance_framework_configs: ['scope_type', 'scope_id', 'popia_rules_json', 'gdpr_rules_json', 'information_officer_name', 'information_officer_email', 'eu_data_protection_officer_email', 'compliance_officer_registration_number', 'default_data_retention_days', 'last_updated', 'created_at', 'updated_at'],
};

const verificationAliases: Record<string, string> = {
  compliance_traffic_simulations: 'sim',
  compliance_token_vault: 'vault',
  dcr_transformation_records: 'transform',
  dcr_policy_rules: 'policy',
  dcr_provenance_ledger: 'provenance',
  dcr_vault_keys: 'vault_key',
  compliance_framework_configs: 'config',
};

function splitLikeMigrationRunners(sql: string): string[] {
  return sql.split(/;\s*$/m).map(statement => statement.trim())
    .filter(statement => statement.length > 0 && !statement.startsWith('--'));
}

function canonicalTableDefinition(sql: string, table: string): string[] {
  const body = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(([\\s\\S]*?)\\n\\) ENGINE=InnoDB`, 'i').exec(sql)?.[1];
  assert.ok(body, `${table} definition must exist`);
  const clauses = body.split(/,\s*\r?\n/).map(clause => clause.trim().replace(/,$/, '').replace(/\s+/g, ' '));
  const primaryKey = clauses.find(clause => /^\w+\s+[^,]+\s+PRIMARY KEY$/i.test(clause));
  if (primaryKey) {
    const column = primaryKey.match(/^(\w+)/)?.[1];
    assert.ok(column);
    const index = clauses.indexOf(primaryKey);
    clauses[index] = primaryKey.replace(/\s+PRIMARY KEY$/i, ' NOT NULL');
    clauses.push(`PRIMARY KEY (${column})`);
  }
  const uniqueColumn = clauses.find(clause => /\bUNIQUE$/i.test(clause));
  if (uniqueColumn) {
    const column = uniqueColumn.match(/^(\w+)/)?.[1];
    assert.ok(column);
    const index = clauses.indexOf(uniqueColumn);
    clauses[index] = uniqueColumn.replace(/\s+UNIQUE$/i, '');
    clauses.push(`UNIQUE KEY ${column} (${column})`);
  }
  const options = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\([\\s\\S]*?\\n\\)\\s*(ENGINE=[^;]+);`, 'i').exec(sql)?.[1];
  assert.ok(options, `${table} engine and charset options must exist`);
  return [...clauses.map(clause => clause.toLowerCase()).sort(), options.toLowerCase().replace(/\s+/g, ' ')];
}

test('migration 035 is a forward-only repair migration and defines all seven repair tables', () => {
  assert.match(migrationPath, /035_compliance_dcr_schema_repair\.sql$/);
  assert.equal(Object.values(requiredColumns).reduce((sum, columns) => sum + columns.length, 0), 98);
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const create = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(([\\s\\S]*?)\\n\\) ENGINE=InnoDB`, 'i').exec(migration);
    assert.ok(create, `${table} must be created idempotently`);
    for (const column of columns) assert.match(create[1], new RegExp(`\\b${column}\\b`, 'i'), `${table}.${column} must exist`);
  }
});

test('migration 035 reproduces historical 007 and 008 table definitions', () => {
  const migration007 = readFileSync(join(migrationsDir, '007_compliance_simulation.sql'), 'utf8');
  const migration008 = readFileSync(join(migrationsDir, '008_dcr_transformation_vault.sql'), 'utf8');
  for (const table of ['compliance_traffic_simulations', 'compliance_token_vault']) {
    assert.deepEqual(canonicalTableDefinition(migration, table), canonicalTableDefinition(migration007, table), `${table} must match migration 007`);
  }
  for (const table of ['dcr_transformation_records', 'dcr_policy_rules', 'dcr_provenance_ledger', 'dcr_vault_keys']) {
    assert.deepEqual(canonicalTableDefinition(migration, table), canonicalTableDefinition(migration008, table), `${table} must match migration 008`);
  }
});

test('migration 035 preserves global DCR policy semantics without a tenants foreign key', () => {
  const policy = /CREATE TABLE IF NOT EXISTS dcr_policy_rules\s*\(([\s\S]*?)\n\) ENGINE=InnoDB/i.exec(migration)?.[1];
  assert.ok(policy);
  assert.match(policy, /tenant_id VARCHAR\(64\) NOT NULL/i);
  assert.doesNotMatch(policy, /FOREIGN KEY|REFERENCES\s+tenants/i);
});

test('migration 035 uses one standalone SELECT that fails on any missing required table or column', () => {
  const statements = splitLikeMigrationRunners(migration);
  const verification = statements.find(statement => /^SELECT\b/i.test(statement)) || '';
  assert.match(verification, /^SELECT\b/i);
  assert.match(verification, /\bLIMIT\s+0\s*$/i);
  assert.doesNotMatch(verification, /\b(?:IF|SIGNAL|PROCEDURE|TRIGGER)\b/i);

  const projections = verification.slice(verification.indexOf('\n') + 1, verification.toUpperCase().indexOf('\nFROM '))
    .split(',').map(item => item.trim()).filter(Boolean);
  const actual = new Map<string, string[]>();
  for (const projection of projections) {
    const match = projection.match(/^(\w+)\.(\w+)$/);
    assert.ok(match, `Expected qualified column projection, got ${projection}`);
    const [alias, column] = [match[1], match[2]];
    const table = Object.entries(verificationAliases).find(([, expectedAlias]) => expectedAlias === alias)?.[0];
    assert.ok(table, `Unexpected verification alias ${alias}`);
    actual.set(table, [...(actual.get(table) || []), column]);
  }
  assert.equal(projections.length, 98);
  for (const [table, columns] of Object.entries(requiredColumns)) {
    assert.deepEqual(actual.get(table), columns, `${table} verification must reference every required repository column exactly once`);
    assert.match(verification, new RegExp(`\\b${table}\\s+AS\\s+${verificationAliases[table]}\\b`, 'i'));
  }
});

test('the standalone verification remains one statement under both migration runner splitters', () => {
  const cliStatements = migration
    .replace(/^[ \t]*--.*(?:\r?\n|$)/gm, '')
    .split(/;\s*$/m)
    .map(statement => statement.trim())
    .filter(Boolean);
  const appStatements = splitLikeMigrationRunners(migration);
  assert.equal(cliStatements.length, 8);
  assert.equal(appStatements.length, 8);
  assert.match(cliStatements.at(-1) || '', /^SELECT\b[\s\S]*\bLIMIT\s+0$/i);
  assert.match(appStatements.at(-1) || '', /^SELECT\b[\s\S]*\bLIMIT\s+0$/i);
});

test('migration 035 contains no data seeding or historical/DSAR migration-record edits', () => {
  assert.doesNotMatch(migration, /\bINSERT\s+INTO\b/i);
  assert.doesNotMatch(migration, /\bUPDATE\s+schema_migrations\b|\bDELETE\s+FROM\s+schema_migrations\b|\bDROP\s+TABLE\s+schema_migrations\b/i);
  assert.doesNotMatch(migration, /\bcompliance_dsar_requests\b/i);
});
