import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizationContext } from './authorizationContext.ts';
import { canAccessIncidentTenant, resolveIncidentReadScope } from './incidentAuthorization.ts';

const context = buildAuthorizationContext({ userId: 'operator', organizations: [{ id: 'org-a', parentId: null }, { id: 'org-b', parentId: null }], assignments: [
  { assignmentId: 'read-a', role: 'TENANT_ADMIN', organizationId: 'org-a', visibility: 'SELF', permissions: ['tenant.read'] },
  { assignmentId: 'write-b', role: 'SRE_ENGINEER', organizationId: 'org-b', visibility: 'SELF', permissions: ['tenant.update'] },
] });

test('incident access requires matching permission and target organization on one grant', () => {
  assert.equal(canAccessIncidentTenant(context, 'org-a', 'tenant.read'), true);
  assert.equal(canAccessIncidentTenant(context, 'org-a', 'tenant.update'), false);
  assert.equal(canAccessIncidentTenant(context, 'org-b', 'tenant.update'), true);
  assert.equal(canAccessIncidentTenant(context, 'org-a', 'tenant.update'), false);
  assert.equal(canAccessIncidentTenant(undefined, 'org-a', 'tenant.read'), false);
});

test('global incident listing requires tenant.read on the explicit GLOBAL Super Admin grant', () => {
  const split = buildAuthorizationContext({ userId: 'split', organizations: [{ id: 'org-a', parentId: null }], assignments: [
    { assignmentId: 'global-role', role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL', permissions: [] },
    { assignmentId: 'scoped-read', role: 'TENANT_ADMIN', organizationId: 'org-a', visibility: 'SELF', permissions: ['tenant.read'] },
  ] });
  assert.equal(resolveIncidentReadScope({ context: split, actorTenantId: 'org-a' }), null);
  const platform = buildAuthorizationContext({ userId: 'platform', organizations: [{ id: 'org-a', parentId: null }], assignments: [
    { assignmentId: 'global-read', role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL', permissions: ['tenant.read'] },
  ] });
  assert.equal(resolveIncidentReadScope({ context: platform, actorTenantId: 'org-a' }), 'all');
});
