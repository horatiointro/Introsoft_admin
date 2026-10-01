import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSuperAdminQuickAccessEnabled } from './superAdminQuickAccess.ts';

describe('Super Admin quick access deployment gate', () => {
  it('is disabled unless the explicit deployment flag is exactly true', () => {
    assert.equal(isSuperAdminQuickAccessEnabled({}), false);
    assert.equal(isSuperAdminQuickAccessEnabled({ ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'false' }), false);
    assert.equal(isSuperAdminQuickAccessEnabled({ ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'TRUE' }), false);
    assert.equal(isSuperAdminQuickAccessEnabled({ ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'true' }), true);
  });

  it('is unavailable in production even if the feature flag is accidentally enabled', () => {
    assert.equal(isSuperAdminQuickAccessEnabled({ NODE_ENV: 'production', ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'true' }), false);
  });

  it('remains available in explicitly enabled non-production environments', () => {
    assert.equal(isSuperAdminQuickAccessEnabled({ NODE_ENV: 'test', ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'true' }), true);
  });
});
