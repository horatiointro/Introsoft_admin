import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizationContext } from './authorizationContext.ts';
import { resolveAuthorizedTenantTarget } from './tenantTarget.ts';

const orgs = [{ id: 'tenant-a', parentId: null }, { id: 'tenant-b', parentId: null }];
const scoped = buildAuthorizationContext({ userId: 'user-a', organizations: orgs, assignments: [
  { assignmentId: 'a1', role: 'TENANT_ADMIN', organizationId: 'tenant-a', visibility: 'ORGANISATION', permissions: [] },
] });
const global = buildAuthorizationContext({ userId: 'root', organizations: orgs, assignments: [
  { assignmentId: 'g1', role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL', permissions: [] },
] });
const hierarchy = buildAuthorizationContext({ userId: 'parent', organizations: [
  { id: 'org-parent', parentId: null }, { id: 'org-child', parentId: 'org-parent' }, { id: 'org-sibling', parentId: 'org-parent' },
], relationships: [
  { parentOrganizationId: 'org-parent', childOrganizationId: 'org-child', relationshipType: 'SUBSIDIARY', status: 'ACTIVE', effectiveTo: null },
  { parentOrganizationId: 'org-parent', childOrganizationId: 'org-sibling', relationshipType: 'SUBSIDIARY', status: 'ACTIVE', effectiveTo: null },
], assignments: [
  { assignmentId: 'parent-descendants', role: 'TENANT_ADMIN', organizationId: 'org-parent', visibility: 'DESCENDANTS', permissions: ['tenant.read', 'tenant.update'] },
] });

describe('authorized tenant target resolution', () => {
  it('keeps scoped callers on their own tenant and rejects a caller-selected other tenant', () => {
    assert.equal(resolveAuthorizedTenantTarget({ context: scoped, actorTenantId: 'tenant-a' }), 'tenant-a');
    assert.equal(resolveAuthorizedTenantTarget({ context: scoped, actorTenantId: 'tenant-a', requestedTenantId: 'tenant-b' }), null);
  });
  it('never infers global access from a missing tenant or role name', () => {
    assert.equal(resolveAuthorizedTenantTarget({ actorTenantId: null, requestedTenantId: null, allowGlobalList: true }), null);
    const roleOnly = buildAuthorizationContext({ userId: 'role-only', organizations: orgs, assignments: [
      { assignmentId: 'r1', role: 'SUPER_ADMIN', organizationId: 'tenant-a', visibility: 'ORGANISATION', permissions: [] },
    ] });
    assert.equal(resolveAuthorizedTenantTarget({ context: roleOnly, actorTenantId: 'tenant-a', requestedTenantId: 'tenant-b' }), null);
  });
  it('allows cross-tenant selection and all-tenant reads only with explicit global Super Admin scope', () => {
    assert.equal(resolveAuthorizedTenantTarget({ context: global, actorTenantId: null, requestedTenantId: 'tenant-b' }), 'tenant-b');
    assert.equal(resolveAuthorizedTenantTarget({ context: global, actorTenantId: null, allowGlobalList: true }), 'all');
    assert.equal(resolveAuthorizedTenantTarget({ context: global, actorTenantId: null }), null);
  });
  it('allows hierarchy selection only when a single descendant grant carries the requested permission', () => {
    assert.equal(resolveAuthorizedTenantTarget({ context: hierarchy, actorTenantId: 'org-parent', requestedTenantId: 'org-child', requiredPermission: 'tenant.read' }), 'org-child');
    assert.equal(resolveAuthorizedTenantTarget({ context: hierarchy, actorTenantId: 'org-parent', requestedTenantId: 'org-child', requiredPermission: 'tenant.update' }), 'org-child');
    assert.equal(resolveAuthorizedTenantTarget({ context: hierarchy, actorTenantId: 'org-parent', requestedTenantId: 'org-sibling', requiredPermission: 'tenant.read' }), 'org-sibling');
    assert.equal(resolveAuthorizedTenantTarget({ context: hierarchy, actorTenantId: 'org-parent', requestedTenantId: 'tenant-outside', requiredPermission: 'tenant.read' }), null);
    assert.equal(resolveAuthorizedTenantTarget({ context: hierarchy, actorTenantId: 'org-parent', requestedTenantId: 'org-child' }), null);
  });
});
