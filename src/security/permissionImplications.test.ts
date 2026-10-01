import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expandLegacyPermissionCodes } from './permissionImplications.ts';

describe('legacy permission vocabulary compatibility', () => {
  it('maps persisted administrator codes to current read and equivalent operation codes', () => {
    const result = expandLegacyPermissionCodes(['routing.edit', 'models.configure', 'providers.write', 'policies.write', 'audit.export']);
    for (const permission of ['routing.read', 'routing.modify', 'model.read', 'model.configure', 'provider.read', 'provider.configure', 'policy.read', 'policy.create', 'policy.modify', 'policy.disable', 'audit.read', 'audit.export']) {
      assert.ok(result.includes(permission), `expected ${permission} to be represented`);
    }
  });

  it('never infers a write permission from a read permission', () => {
    const result = expandLegacyPermissionCodes(['provider.read', 'model.read', 'tenant.read']);
    assert.deepEqual(result, ['provider.read', 'model.read', 'tenant.read']);
  });

  it('preserves canonical permission codes and removes duplicates', () => {
    assert.deepEqual(expandLegacyPermissionCodes(['audit.export', 'audit.read']), ['audit.export', 'audit.read']);
  });
});
