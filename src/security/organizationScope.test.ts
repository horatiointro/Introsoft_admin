import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeOrganizationAccess, legacyAccessScope, resolveVisibleOrganizationIds, type OrganizationNode, type OrganizationRelationship } from './organizationScope.ts';

const nodes: OrganizationNode[] = [
  { id: 'introsoft', parentId: null }, { id: 'partner-a', parentId: 'introsoft' },
  { id: 'sub-a1', parentId: 'partner-a' }, { id: 'client-a1', parentId: 'sub-a1' }, { id: 'client-a2', parentId: 'sub-a1' },
  { id: 'partner-a2', parentId: 'partner-a' }, { id: 'client-a2-1', parentId: 'partner-a2' }, { id: 'individual-a-001', parentId: 'partner-a' },
  { id: 'partner-b', parentId: 'introsoft' }, { id: 'client-b1', parentId: 'partner-b' },
  { id: 'direct-c', parentId: 'introsoft' },
];
const relationshipTypes: Record<string, OrganizationRelationship['relationshipType']> = {
  'partner-a': 'PARTNER', 'sub-a1': 'SUBSIDIARY', 'client-a1': 'CLIENT', 'client-a2': 'CLIENT',
  'partner-a2': 'PARTNER', 'client-a2-1': 'CLIENT', 'individual-a-001': 'CLIENT',
  'partner-b': 'PARTNER', 'client-b1': 'CLIENT', 'direct-c': 'DIRECT_CLIENT',
};
const relationships: OrganizationRelationship[] = nodes.flatMap(node => node.parentId ? [{
  parentOrganizationId: node.parentId, childOrganizationId: node.id, relationshipType: relationshipTypes[node.id],
  status: 'ACTIVE' as const, effectiveFrom: '2026-01-01T00:00:00.000Z', effectiveTo: null,
}] : []);
const grant = (organizationId: string, visibility: 'SELF' | 'DESCENDANTS' | 'TREE' | 'GLOBAL', permissions = ['user.read']) => ({ rootOrganizationId: organizationId, organizationId, visibility, permissions });
const syntheticUsers = nodes.flatMap(node => [
  { id: `${node.id}-admin`, organizationId: node.id, role: node.id === 'introsoft' ? 'SUPER_ADMIN' : 'TENANT_ADMIN' },
  { id: `${node.id}-member`, organizationId: node.id, role: 'MEMBER' },
]);

describe('organization scope resolution', () => {
  it('limits SELF to the assigned organization', () => {
    assert.deepEqual([...resolveVisibleOrganizationIds({ scope: grant('client-a1', 'SELF'), nodes, relationships, asOf: '2026-09-01T00:00:00.000Z' })], ['client-a1']);
  });
  it('supports arbitrary-depth partner descendant scope without sibling or parent access', () => {
    const visible = resolveVisibleOrganizationIds({ scope: grant('partner-a', 'DESCENDANTS'), nodes, relationships, asOf: '2026-09-01T00:00:00.000Z' });
    assert.deepEqual([...visible].sort(), ['client-a1', 'client-a2', 'individual-a-001', 'partner-a', 'partner-a2', 'client-a2-1', 'sub-a1'].sort());
    assert.equal(visible.has('introsoft'), false);
    assert.equal(visible.has('partner-b'), false);
    assert.equal(visible.has('direct-c'), false);
  });
  it('TREE includes ancestors and descendants but not siblings', () => {
    const visible = resolveVisibleOrganizationIds({ scope: grant('sub-a1', 'TREE'), nodes, relationships, asOf: '2026-09-01T00:00:00.000Z' });
    assert.deepEqual([...visible].sort(), ['client-a1', 'client-a2', 'introsoft', 'partner-a', 'sub-a1'].sort());
    assert.equal(visible.has('client-b1'), false);
    assert.equal(visible.has('partner-a2'), false);
  });
  it('honors relationship effective dates and ended edges', () => {
    const ended = relationships.map(edge => edge.childOrganizationId === 'client-a1' ? { ...edge, status: 'ENDED' as const } : edge);
    const visible = resolveVisibleOrganizationIds({ scope: grant('partner-a', 'DESCENDANTS'), nodes, relationships: ended, asOf: '2026-09-01T00:00:00.000Z' });
    assert.equal(visible.has('client-a1'), false);
  });
  it('treats an active edge without an effective-from date as current and an explicit empty graph as no relationships', () => {
    const missingStart = relationships.map(edge => ({ ...edge, effectiveFrom: undefined }));
    const withMissingStart = resolveVisibleOrganizationIds({ scope: grant('partner-a', 'DESCENDANTS'), nodes, relationships: missingStart, asOf: '2026-09-01T00:00:00.000Z' });
    assert.equal(withMissingStart.has('client-a1'), true);
    const emptyGraph = resolveVisibleOrganizationIds({ scope: grant('partner-a', 'DESCENDANTS'), nodes, relationships: [], asOf: '2026-09-01T00:00:00.000Z' });
    assert.deepEqual([...emptyGraph], ['partner-a']);
  });
  it('checks permission and scope independently', () => {
    assert.equal(authorizeOrganizationAccess({ scope: grant('client-a1', 'SELF'), targetOrganizationId: 'client-a1', requiredPermission: 'user.read', nodes }), true);
    assert.equal(authorizeOrganizationAccess({ scope: grant('client-a1', 'SELF'), targetOrganizationId: 'client-b1', requiredPermission: 'user.read', nodes }), false);
    assert.equal(authorizeOrganizationAccess({ scope: grant('client-a1', 'SELF', []), targetOrganizationId: 'client-a1', requiredPermission: 'user.read', nodes }), false);
  });
  it('only grants GLOBAL to an explicitly global Super Admin assignment', () => {
    assert.equal(legacyAccessScope({ roles: ['SUPER_ADMIN'], permissions: ['user.read'], tenantId: null, globalSuperAdminAssigned: true })?.visibility, 'GLOBAL');
    assert.equal(legacyAccessScope({ roles: ['SUPER_ADMIN'], permissions: ['user.read'], tenantId: null, globalSuperAdminAssigned: false }), null);
    assert.equal(legacyAccessScope({ roles: ['TENANT_ADMIN'], permissions: ['user.read'], tenantId: 'client-a1', globalSuperAdminAssigned: false })?.visibility, 'ORGANISATION');
  });
  it('includes deterministic synthetic administrator and ordinary-user fixtures for each organization', () => {
    assert.equal(syntheticUsers.length, nodes.length * 2);
    assert.equal(syntheticUsers.filter(user => user.role === 'SUPER_ADMIN').length, 1);
    for (const node of nodes) {
      assert.ok(syntheticUsers.some(user => user.organizationId === node.id && ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role)));
      assert.ok(syntheticUsers.some(user => user.organizationId === node.id && user.role === 'MEMBER'));
    }
  });
  it('does not allow an organization-scoped user to use hierarchy IDs to gain parent or sibling scope', () => {
    const clientScope = grant('client-a1', 'SELF', ['user.read', 'user.create', 'user.update', 'user.disable']);
    for (const permission of ['user.read', 'user.create', 'user.update', 'user.disable']) {
      assert.equal(authorizeOrganizationAccess({ scope: clientScope, targetOrganizationId: 'client-a1', requiredPermission: permission, nodes, relationships }), true);
      assert.equal(authorizeOrganizationAccess({ scope: clientScope, targetOrganizationId: 'partner-a', requiredPermission: permission, nodes, relationships }), false);
      assert.equal(authorizeOrganizationAccess({ scope: clientScope, targetOrganizationId: 'client-a2', requiredPermission: permission, nodes, relationships }), false);
      assert.equal(authorizeOrganizationAccess({ scope: clientScope, targetOrganizationId: 'client-b1', requiredPermission: permission, nodes, relationships }), false);
    }
  });
});
