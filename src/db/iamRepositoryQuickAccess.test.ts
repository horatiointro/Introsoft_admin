import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { IamRepository, type IamUserRecord } from './iamRepository.ts';

const account = (status: IamUserRecord['status']): IamUserRecord => ({
  id: 'quick-access-test-user',
  tenant_id: null,
  email: 'active-super-admin@example.invalid',
  password_hash: 'not-used-by-this-test',
  first_name: 'Test',
  last_name: 'Administrator',
  department: null,
  status,
  failed_login_attempts: 0,
  lockout_until: null,
  mfa_enabled: true,
  mfa_enforced: true,
  last_login_at: null,
  last_login_ip: null,
  password_changed_at: new Date(0),
  created_by: 'SYNTHETIC_TEST',
  created_at: new Date(0),
  updated_at: new Date(0),
});

describe('Super Admin quick-access account validation', () => {
  it('accepts only an ACTIVE account with the SUPER_ADMIN role', async t => {
    const activeAccount = account('ACTIVE');
    t.mock.method(IamRepository, 'getUserByEmail', async () => activeAccount);
    t.mock.method(IamRepository, 'getUserRolesAndPermissions', async () => ({ roles: ['SUPER_ADMIN'], permissions: [], tenantId: null }));

    assert.equal(await IamRepository.prepareSuperAdminQuickAccess(activeAccount.email), activeAccount);
  });

  it('does not unlock or accept a non-ACTIVE Super Admin account', async t => {
    t.mock.method(IamRepository, 'getUserByEmail', async () => account('LOCKED'));
    t.mock.method(IamRepository, 'getUserRolesAndPermissions', async () => ({ roles: ['SUPER_ADMIN'], permissions: [], tenantId: null }));

    assert.equal(await IamRepository.prepareSuperAdminQuickAccess('active-super-admin@example.invalid'), null);
  });

  it('rejects an ACTIVE account that does not have the SUPER_ADMIN role', async t => {
    t.mock.method(IamRepository, 'getUserByEmail', async () => account('ACTIVE'));
    t.mock.method(IamRepository, 'getUserRolesAndPermissions', async () => ({ roles: ['TENANT_ADMIN'], permissions: [], tenantId: null }));

    assert.equal(await IamRepository.prepareSuperAdminQuickAccess('active-super-admin@example.invalid'), null);
  });
});
