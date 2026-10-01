import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getMfaConfigurationStatus, isMfaRequired, verifyMfaCode, verifyMfaRequirement, type MfaCodeVerifier } from './mfaVerification.ts';

describe('MFA authentication requirement', () => {
  const user = { userId: 'synthetic-user', mfaEnabled: true, mfaEnforced: true };
  const acceptsSyntheticCode: MfaCodeVerifier = async (_userId, code) => code === '123456';
  const enabledTestEnv = { NODE_ENV: 'test', ALTIL_MFA_ENABLED: 'true' };

  it('rejects absent MFA codes for MFA-enabled accounts', async () => {
    assert.equal(await verifyMfaRequirement(user, undefined, acceptsSyntheticCode, enabledTestEnv), false);
  });

  it('rejects invalid MFA codes', async () => {
    assert.equal(await verifyMfaRequirement(user, '654321', acceptsSyntheticCode, enabledTestEnv), false);
  });

  it('accepts a code only when the configured verifier confirms it', async () => {
    assert.equal(await verifyMfaRequirement(user, '123456', acceptsSyntheticCode, enabledTestEnv), true);
    assert.equal(await verifyMfaRequirement(user, '123456', undefined, enabledTestEnv), false);
  });

  it('requires MFA for SUPER_ADMIN even when account flags are false', async () => {
    const superAdmin = { userId: 'synthetic-admin', roles: ['SUPER_ADMIN'] };
    assert.equal(isMfaRequired(superAdmin), true);
    assert.equal(await verifyMfaRequirement(superAdmin, undefined, acceptsSyntheticCode, enabledTestEnv), false);
    assert.equal(await verifyMfaRequirement(superAdmin, '123456', acceptsSyntheticCode, enabledTestEnv), true);
  });

  it('does not add an MFA requirement for accounts that have no policy or role', async () => {
    assert.equal(await verifyMfaRequirement({ userId: 'synthetic-user' }, undefined), true);
  });

  it('fails closed when step-up verification has no configured verifier', async () => {
    assert.equal(await verifyMfaCode('synthetic-user', '123456', undefined, enabledTestEnv), 'UNAVAILABLE');
  });

  it('validates step-up codes through the same configured verifier', async () => {
    assert.equal(await verifyMfaCode('synthetic-user', undefined, acceptsSyntheticCode, enabledTestEnv), 'INVALID');
    assert.equal(await verifyMfaCode('synthetic-user', '654321', acceptsSyntheticCode, enabledTestEnv), 'INVALID');
    assert.equal(await verifyMfaCode('synthetic-user', '123456', acceptsSyntheticCode, enabledTestEnv), 'VERIFIED');
  });

  it('disables MFA explicitly in the test environment without invoking a verifier', async () => {
    let verifierCalls = 0;
    const verifier: MfaCodeVerifier = async () => { verifierCalls += 1; return true; };
    const disabledEnv = { NODE_ENV: 'test', ALTIL_MFA_ENABLED: 'false' };

    assert.deepEqual(getMfaConfigurationStatus(disabledEnv), { enabled: false, source: 'EXPLICIT' });
    assert.equal(await verifyMfaRequirement(user, undefined, verifier, disabledEnv), true);
    assert.equal(await verifyMfaRequirement({ userId: 'synthetic-admin', roles: ['SUPER_ADMIN'] }, undefined, verifier, disabledEnv), true);
    assert.equal(await verifyMfaCode('synthetic-admin', undefined, verifier, disabledEnv), 'DISABLED');
    assert.equal(verifierCalls, 0);
  });

  it('keeps MFA enabled when explicitly true', () => {
    assert.deepEqual(getMfaConfigurationStatus({ NODE_ENV: 'test', ALTIL_MFA_ENABLED: 'true' }), { enabled: true, source: 'EXPLICIT' });
  });

  it('defaults missing or invalid configuration to enabled', () => {
    assert.deepEqual(getMfaConfigurationStatus({ NODE_ENV: 'development' }), { enabled: true, source: 'SECURE_DEFAULT' });
    assert.deepEqual(getMfaConfigurationStatus({ NODE_ENV: 'test', ALTIL_MFA_ENABLED: 'sometimes' }), { enabled: true, source: 'INVALID_SECURE_DEFAULT' });
  });

  it('uses explicit MFA configuration rather than inferring posture from NODE_ENV', () => {
    assert.deepEqual(getMfaConfigurationStatus({ NODE_ENV: 'production', ALTIL_MFA_ENABLED: 'true' }), { enabled: true, source: 'EXPLICIT' });
    assert.deepEqual(getMfaConfigurationStatus({ NODE_ENV: 'production', ALTIL_MFA_ENABLED: 'false' }), { enabled: false, source: 'EXPLICIT' });
  });
});
