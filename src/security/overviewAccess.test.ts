import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizationContext } from './authorizationContext.ts';
import { overviewAccess } from './overviewAccess.ts';

const orgs = [{ id: 'parent', parentId: null }, { id: 'child', parentId: 'parent' }, { id: 'other', parentId: null }];

test('overview exposes only organizations from tenant.read grants', () => {
  const context = buildAuthorizationContext({ userId: 'tenant-user', assignments: [
    { assignmentId: 'a', role: 'TENANT_ADMIN', organizationId: 'parent', visibility: 'DESCENDANTS', permissions: ['tenant.read'] },
    { assignmentId: 'b', role: 'TENANT_ADMIN', organizationId: 'other', visibility: 'SELF', permissions: ['billing.read'] },
  ], organizations: orgs });
  assert.deepEqual([...overviewAccess(context).organizationIds].sort(), ['child', 'parent']);
  assert.equal(overviewAccess(context).canReadPlatformProviders, false);
  assert.equal(overviewAccess(context).canReadPlatformModels, false);
});

test('a Super Admin role without explicit global scope has no platform overview access', () => {
  const context = buildAuthorizationContext({ userId: 'scoped-admin', assignments: [
    { assignmentId: 'a', role: 'SUPER_ADMIN', organizationId: 'parent', visibility: 'ORGANISATION', permissions: ['tenant.read', 'provider.read', 'model.read'] },
  ], organizations: orgs });
  const access = overviewAccess(context);
  assert.deepEqual([...access.organizationIds], ['parent']);
  assert.equal(access.canReadPlatformProviders, false);
  assert.equal(access.canReadPlatformModels, false);
});

test('platform metrics require explicit global Super Admin plus their specific read permission', () => {
  const context = buildAuthorizationContext({ userId: 'platform-admin', assignments: [
    { assignmentId: 'a', role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL', permissions: ['tenant.read', 'provider.read'] },
  ], organizations: orgs });
  const access = overviewAccess(context);
  assert.deepEqual([...access.organizationIds].sort(), ['child', 'other', 'parent']);
  assert.equal(access.canReadPlatformProviders, true);
  assert.equal(access.canReadPlatformModels, false);
});
