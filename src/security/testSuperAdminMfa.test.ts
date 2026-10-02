import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isTestSuperAdminMfaConfigured, TEST_SUPER_ADMIN_IDENTITIES, verifyTestSuperAdminMfa } from './testSuperAdminMfa.mjs';

const enabled = { NODE_ENV: 'development', ALTIL_ENVIRONMENT: 'development-test', ALTIL_ENABLE_TEST_SUPER_ADMINS: 'true', ALTIL_TEST_MFA_CODE: '000000' };

describe('test Super Admin MFA fixture', () => {
  it('accepts the configured code only for either provisioned test Super Admin identity', () => {
    for (const identity of TEST_SUPER_ADMIN_IDENTITIES) assert.equal(verifyTestSuperAdminMfa(identity.id, '000000', enabled), true);
  });

  it('rejects other identities and incorrect codes', () => {
    assert.equal(verifyTestSuperAdminMfa('another-admin', '000000', enabled), false);
    assert.equal(verifyTestSuperAdminMfa(TEST_SUPER_ADMIN_IDENTITIES[0].id, '000001', enabled), false);
  });

  it('is unavailable in production or without both explicit test settings', () => {
    assert.equal(verifyTestSuperAdminMfa(TEST_SUPER_ADMIN_IDENTITIES[0].id, '000000', { ...enabled, NODE_ENV: 'production' }), false);
    assert.equal(verifyTestSuperAdminMfa(TEST_SUPER_ADMIN_IDENTITIES[0].id, '000000', { ...enabled, ALTIL_ENVIRONMENT: 'production' }), false);
    assert.equal(verifyTestSuperAdminMfa(TEST_SUPER_ADMIN_IDENTITIES[0].id, '000000', { ...enabled, ALTIL_ENABLE_TEST_SUPER_ADMINS: 'false' }), false);
    assert.equal(isTestSuperAdminMfaConfigured(enabled), true);
    assert.equal(isTestSuperAdminMfaConfigured({ ...enabled, ALTIL_TEST_MFA_CODE: 'not-a-code' }), false);
    assert.equal(isTestSuperAdminMfaConfigured({ ...enabled, NODE_ENV: 'production' }), false);
  });
});
