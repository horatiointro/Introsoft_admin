import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { afterEach, describe, it, type TestContext } from 'node:test';
import { IamRepository, type IamSessionRecord, type IamUserRecord } from './iamRepository.ts';
import { configureMfaCodeVerifier } from '../security/mfaVerification.ts';

const syntheticPassword = 'Synthetic-only-password-42';
const syntheticCode = '123456';

function syntheticAdmin(): IamUserRecord {
  const now = new Date();
  return {
    id: 'synthetic-auth-user',
    tenant_id: null,
    email: 'synthetic-admin@example.invalid',
    password_hash: bcrypt.hashSync(syntheticPassword, 4),
    first_name: 'Synthetic',
    last_name: 'Admin',
    department: null,
    status: 'ACTIVE',
    failed_login_attempts: 0,
    lockout_until: null,
    mfa_enabled: true,
    mfa_enforced: true,
    last_login_at: null,
    last_login_ip: null,
    password_changed_at: now,
    force_password_change: false,
    created_by: 'SYNTHETIC_TEST',
    created_at: now,
    updated_at: now,
  };
}

function installAuthenticationStubs(t: TestContext, user: IamUserRecord, roles = ['SUPER_ADMIN']): void {
  t.mock.method(IamRepository, 'getUserByEmail', async () => user);
  t.mock.method(IamRepository, 'getUserRolesAndPermissions', async () => ({ roles, permissions: [], tenantId: user.tenant_id }));
  t.mock.method(IamRepository, 'recordSuccessfulLogin', async () => undefined);
  t.mock.method(IamRepository, 'logLoginEvent', async () => undefined);
  t.mock.method(IamRepository, 'createSession', async (_userId: string, token: string, ip: string, ua: string, expiresAt: Date): Promise<IamSessionRecord> => ({
    id: 'synthetic-session',
    user_id: user.id,
    session_token: token,
    ip_address: ip,
    user_agent: ua,
    is_active: true,
    expires_at: expiresAt,
    last_activity_at: new Date(),
    created_at: new Date(),
  }));
}

async function withMfaDisabled<T>(operation: () => Promise<T>): Promise<T> {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalMfaSetting = process.env.ALTIL_MFA_ENABLED;
  process.env.NODE_ENV = 'test';
  process.env.ALTIL_MFA_ENABLED = 'false';
  configureMfaCodeVerifier(undefined);
  try {
    return await operation();
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalMfaSetting === undefined) delete process.env.ALTIL_MFA_ENABLED;
    else process.env.ALTIL_MFA_ENABLED = originalMfaSetting;
  }
}

afterEach(() => configureMfaCodeVerifier(undefined));

describe('IAM login MFA enforcement', () => {
  it('rejects an MFA-enabled account when the code is absent', async t => {
    const user = syntheticAdmin();
    installAuthenticationStubs(t, user);
    configureMfaCodeVerifier(async () => true);

    const result = await IamRepository.authenticate(user.email, syntheticPassword);
    assert.equal(result.success, false);
    assert.equal(result.error, 'MFA_REQUIRED_OR_INVALID');
  });

  it('rejects an invalid MFA code', async t => {
    const user = syntheticAdmin();
    installAuthenticationStubs(t, user);
    configureMfaCodeVerifier(async (_userId, code) => code === syntheticCode);

    const result = await IamRepository.authenticate(user.email, syntheticPassword, { mfaCode: '654321' });
    assert.equal(result.success, false);
    assert.equal(result.error, 'MFA_REQUIRED_OR_INVALID');
  });

  it('accepts valid MFA only when the configured verifier confirms it', async t => {
    const user = syntheticAdmin();
    installAuthenticationStubs(t, user);
    configureMfaCodeVerifier(async (userId, code) => userId === user.id && code === syntheticCode);

    const result = await IamRepository.authenticate(user.email, syntheticPassword, { mfaCode: syntheticCode });
    assert.equal(result.success, true);
    assert.equal(result.session?.user_id, user.id);
  });

  it('requires MFA for SUPER_ADMIN even if the account flags are disabled', async t => {
    const user = syntheticAdmin();
    user.mfa_enabled = false;
    user.mfa_enforced = false;
    installAuthenticationStubs(t, user);

    const result = await IamRepository.authenticate(user.email, syntheticPassword);
    assert.equal(result.success, false);
    assert.equal(result.error, 'MFA_REQUIRED_OR_INVALID');
  });

  it('fails closed when no authorization role can be loaded', async t => {
    const user = syntheticAdmin();
    installAuthenticationStubs(t, user, []);
    configureMfaCodeVerifier(async () => true);

    const result = await IamRepository.authenticate(user.email, syntheticPassword, { mfaCode: syntheticCode });
    assert.equal(result.success, false);
    assert.equal(result.error, 'AUTHORIZATION_PROFILE_UNAVAILABLE');
  });

  it('allows a normal MFA-enabled user to authenticate without invoking a verifier when test MFA is disabled', async t => {
    const user = syntheticAdmin();
    installAuthenticationStubs(t, user, ['TENANT_ADMIN']);
    let verifierCalls = 0;
    configureMfaCodeVerifier(async () => { verifierCalls += 1; return true; });

    const result = await withMfaDisabled(() => IamRepository.authenticate(user.email, syntheticPassword));
    assert.equal(result.success, true);
    assert.equal(verifierCalls, 0);
  });

  it('allows SUPER_ADMIN to authenticate without MFA only when test MFA is explicitly disabled', async t => {
    const user = syntheticAdmin();
    installAuthenticationStubs(t, user, ['SUPER_ADMIN']);
    let verifierCalls = 0;
    configureMfaCodeVerifier(async () => { verifierCalls += 1; return true; });

    const result = await withMfaDisabled(() => IamRepository.authenticate(user.email, syntheticPassword));
    assert.equal(result.success, true);
    assert.equal(verifierCalls, 0);
  });
});
