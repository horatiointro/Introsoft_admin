import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeAllInContext, authorizeInContext, buildAuthorizationContext, organizationsAuthorizedFor, type AuthorizationAssignment } from './authorizationContext.ts';
import type { OrganizationNode, OrganizationRelationship } from './organizationScope.ts';

const organizations: OrganizationNode[] = [
  { id: 'introsoft', parentId: null }, { id: 'partner-a', parentId: 'introsoft' },
  { id: 'client-a', parentId: 'partner-a' }, { id: 'partner-b', parentId: 'introsoft' },
  { id: 'client-b', parentId: 'partner-b' }, { id: 'direct-c', parentId: 'introsoft' },
];
const relationships: OrganizationRelationship[] = organizations.flatMap(org => org.parentId ? [{
  parentOrganizationId: org.parentId,
  childOrganizationId: org.id,
  relationshipType: org.id.startsWith('partner') ? 'PARTNER' as const : org.id === 'direct-c' ? 'DIRECT_CLIENT' as const : 'CLIENT' as const,
  status: 'ACTIVE' as const,
  effectiveFrom: '2026-01-01T00:00:00Z',
  effectiveTo: null,
}] : []);

const assignment = (overrides: Partial<AuthorizationAssignment> = {}): AuthorizationAssignment => ({
  assignmentId: 'assignment-1', role: 'TENANT_ADMIN', organizationId: 'partner-a', visibility: 'ORGANISATION', permissions: ['customer.read'], ...overrides,
});

describe('authorization context from trusted role assignments', () => {
  it('grants only the assigned organization by default', () => {
    const context = buildAuthorizationContext({ userId: 'user-a', assignments: [assignment()], organizations, relationships, asOf: '2026-09-01T00:00:00Z' });
    assert.equal(authorizeInContext(context, 'partner-a', 'customer.read'), true);
    assert.equal(authorizeInContext(context, 'client-a', 'customer.read'), false);
    assert.equal(authorizeInContext(context, 'partner-b', 'customer.read'), false);
  });

  it('grants descendants only when the persisted role assignment explicitly says DESCENDANTS', () => {
    const context = buildAuthorizationContext({ userId: 'user-a', assignments: [assignment({ visibility: 'DESCENDANTS' })], organizations, relationships, asOf: '2026-09-01T00:00:00Z' });
    assert.equal(authorizeInContext(context, 'partner-a', 'customer.read'), true);
    assert.equal(authorizeInContext(context, 'client-a', 'customer.read'), true);
    assert.equal(authorizeInContext(context, 'partner-b', 'customer.read'), false);
    assert.equal(authorizeInContext(context, 'introsoft', 'customer.read'), false);
  });

  it('does not infer GLOBAL from the Super Admin role name without a NULL-scope GLOBAL assignment', () => {
    const scopedRole = buildAuthorizationContext({ userId: 'user-a', assignments: [assignment({ role: 'SUPER_ADMIN' })], organizations, relationships });
    assert.equal(authorizeInContext(scopedRole, 'partner-b', 'customer.read'), false);
    const global = buildAuthorizationContext({ userId: 'root', assignments: [assignment({ role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL' })], organizations, relationships });
    assert.equal(authorizeInContext(global, 'client-b', 'customer.read'), true);
  });

  it('denies permission and ID substitution outside the caller’s scope', () => {
    const context = buildAuthorizationContext({ userId: 'user-a', assignments: [assignment({ visibility: 'DESCENDANTS', permissions: ['user.read'] })], organizations, relationships });
    assert.equal(authorizeInContext(context, 'client-a', 'user.read'), true);
    assert.equal(authorizeInContext(context, 'client-b', 'user.read'), false);
    assert.equal(authorizeInContext(context, 'client-a', 'user.disable'), false);
    assert.equal(authorizeInContext(context, '', 'user.read'), false);
  });

  it('ignores a GLOBAL grant attached to a tenant or a non-platform role', () => {
    const wrongTenant = buildAuthorizationContext({ userId: 'user-a', assignments: [assignment({ role: 'SUPER_ADMIN', visibility: 'GLOBAL' })], organizations, relationships });
    const wrongRole = buildAuthorizationContext({ userId: 'user-a', assignments: [assignment({ role: 'TENANT_ADMIN', organizationId: null, visibility: 'GLOBAL' })], organizations, relationships });
    assert.equal(wrongTenant.visibleOrganizationIds.has('partner-b'), false);
    assert.equal(wrongRole.visibleOrganizationIds.has('partner-b'), false);
  });

  it('returns only organizations visible through grants that carry the requested permission', () => {
    const context = buildAuthorizationContext({ userId: 'user-a', assignments: [
      assignment({ assignmentId: 'read-a', organizationId: 'partner-a', visibility: 'DESCENDANTS', permissions: ['tenant.read'] }),
      assignment({ assignmentId: 'update-b', organizationId: 'partner-b', visibility: 'DESCENDANTS', permissions: ['tenant.update'] }),
    ], organizations, relationships, asOf: '2026-09-01T00:00:00Z' });
    assert.deepEqual(organizationsAuthorizedFor(context, 'tenant.read').sort(), ['client-a', 'partner-a']);
    assert.deepEqual(organizationsAuthorizedFor(context, 'tenant.update').sort(), ['client-b', 'partner-b']);
    assert.deepEqual(organizationsAuthorizedFor(context, 'tenant.delete'), []);
  });

  it('does not combine capabilities from separate grants for one operation', () => {
    const context = buildAuthorizationContext({ userId: 'user-a', assignments: [
      assignment({ assignmentId: 'update', organizationId: 'partner-a', visibility: 'SELF', permissions: ['tenant.update'] }),
      assignment({ assignmentId: 'revoke', organizationId: 'partner-a', visibility: 'SELF', permissions: ['apikeys.revoke'] }),
    ], organizations, relationships });
    assert.equal(authorizeAllInContext(context, 'partner-a', ['tenant.update', 'apikeys.revoke']), false);
    assert.equal(authorizeAllInContext(context, 'partner-a', ['tenant.update']), true);
  });

  it('does not turn a commercial parent-child relationship into an IAM authorization grant', () => {
    const commercialRelationship = relationships.find(edge => edge.parentOrganizationId === 'partner-a' && edge.childOrganizationId === 'client-a');
    assert.ok(commercialRelationship, 'fixture documents the independent commercial relationship');
    const context = buildAuthorizationContext({
      userId: 'partner-admin',
      assignments: [assignment({ organizationId: 'partner-a', visibility: 'ORGANISATION', permissions: ['customer.read', 'customer.write'] })],
      organizations,
      relationships: [],
      asOf: '2026-09-01T00:00:00Z',
    });
    assert.equal(authorizeInContext(context, 'partner-a', 'customer.read'), true);
    assert.equal(authorizeInContext(context, 'client-a', 'customer.read'), false);
    assert.equal(authorizeInContext(context, 'client-a', 'customer.write'), false);
    assert.equal(authorizeInContext(context, 'partner-b', 'customer.read'), false);
    assert.equal(authorizeInContext(context, 'client-b', 'customer.read'), false);
  });
});
