import test from 'node:test';
import assert from 'node:assert/strict';
import { expandLegacyPermissionCodes } from './permissionImplications.ts';

test('plural operation grants imply the singular read codes the routes check', () => {
  const result = expandLegacyPermissionCodes(['incidents.write']);
  assert.ok(result.includes('incident.read'));
  assert.ok(result.includes('incident.create'));
  assert.ok(result.includes('incident.update'));
});

test('compliance.dsr implies dsar.read and its write variants', () => {
  const result = expandLegacyPermissionCodes(['compliance.dsr']);
  assert.ok(result.includes('dsar.read'));
  assert.ok(result.includes('dsar.create'));
  assert.ok(result.includes('dsar.update'));
});

test('system.migrate implies system.configure so admin views stay reachable', () => {
  const result = expandLegacyPermissionCodes(['system.migrate']);
  assert.ok(result.includes('system.configure'));
});

test('expansion is idempotent and never promotes a read to a write', () => {
  const once = expandLegacyPermissionCodes(['incidents.write']);
  const twice = expandLegacyPermissionCodes(once);
  assert.deepEqual(once, twice);
  // A singular read code must never imply the plural write operation.
  assert.deepEqual(expandLegacyPermissionCodes(['incident.read']), ['incident.read']);
  // system.configure must never imply the migration code.
  assert.deepEqual(expandLegacyPermissionCodes(['system.configure']), ['system.configure']);
});