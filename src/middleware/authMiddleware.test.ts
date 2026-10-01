import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireOrganizationPermission, requirePermission, requireRole, requireTenantAccess, type AuthenticatedRequest } from './authMiddleware.ts';
import { buildAuthorizationContext, type AuthorizationAssignment } from '../security/authorizationContext.ts';

const organizations = [
  { id: 'platform', parentId: null },
  { id: 'partner-a', parentId: 'platform' },
  { id: 'client-a', parentId: 'partner-a' },
  { id: 'partner-b', parentId: 'platform' },
  { id: 'client-b', parentId: 'partner-b' },
];
const relationships = organizations.flatMap(node => node.parentId ? [{
  parentOrganizationId: node.parentId,
  childOrganizationId: node.id,
  relationshipType: 'CLIENT' as const,
  status: 'ACTIVE' as const,
  effectiveTo: null,
}] : []);
const assignments = (overrides: Partial<AuthorizationAssignment> = {}): AuthorizationAssignment[] => [{
  assignmentId: 'grant-1', role: 'TENANT_ADMIN', organizationId: 'partner-a', visibility: 'DESCENDANTS', permissions: ['tenant.read'], ...overrides,
}];
const context = (grants = assignments()) => buildAuthorizationContext({ userId: 'tenant-admin', assignments: grants, organizations, relationships });

function invoke(middleware: Function, reqValues: Record<string, unknown>) {
  const result = { statusCode: 200, body: undefined as unknown, nextCalled: false };
  const req = { method: 'GET', baseUrl: '/api/v1/customers', path: '/client-a', params: {}, query: {}, body: {}, ...reqValues } as unknown as AuthenticatedRequest;
  const res = {
    status(code: number) { result.statusCode = code; return this; },
    json(body: unknown) { result.body = body; return this; },
  };
  middleware(req, res, () => { result.nextCalled = true; });
  return result;
}

describe('organization authorization middleware', () => {
  it('allows a descendant only when explicit descendant scope contains the target', () => {
    const result = invoke(requireTenantAccess('id'), { params: { id: 'client-a' }, user: { id: 'tenant-admin', roles: ['TENANT_ADMIN'], permissions: [], tenantId: 'partner-a', sessionId: 's1', authorization: context() } });
    assert.equal(result.nextCalled, true);
  });

  it('denies sibling ID substitution and hides whether an out-of-scope organization exists', () => {
    const result = invoke(requireTenantAccess('id'), { params: { id: 'client-b' }, user: { id: 'tenant-admin', roles: ['TENANT_ADMIN'], permissions: [], tenantId: 'partner-a', sessionId: 's1', authorization: context() } });
    assert.equal(result.statusCode, 403);
    assert.equal(result.nextCalled, false);
  });

  it('denies a missing target instead of treating it as an unscoped allow', () => {
    const result = invoke(requireTenantAccess('id'), { user: { id: 'tenant-admin', roles: ['TENANT_ADMIN'], permissions: [], tenantId: 'partner-a', sessionId: 's1', authorization: context() } });
    assert.equal(result.statusCode, 403);
    assert.equal(result.nextCalled, false);
  });

  it('checks permission against the resolved assignment grants', () => {
    const allowed = invoke(requirePermission('tenant.read'), { user: { id: 'tenant-admin', roles: ['TENANT_ADMIN'], permissions: [], tenantId: 'partner-a', sessionId: 's1', authorization: context() } });
    const denied = invoke(requirePermission('tenant.delete'), { user: { id: 'tenant-admin', roles: ['TENANT_ADMIN'], permissions: [], tenantId: 'partner-a', sessionId: 's1', authorization: context() } });
    assert.equal(allowed.nextCalled, true);
    assert.equal(denied.statusCode, 403);
  });

  it('does not combine a permission from one organization with visibility from another assignment', () => {
    const splitContext = context([
      { assignmentId: 'read-a', role: 'AUDITOR', organizationId: 'partner-a', visibility: 'ORGANISATION', permissions: ['tenant.read'] },
      { assignmentId: 'write-b', role: 'TENANT_ADMIN', organizationId: 'partner-b', visibility: 'ORGANISATION', permissions: ['tenant.update'] },
    ]);
    const result = invoke(requireOrganizationPermission('tenant.read', 'id'), {
      params: { id: 'partner-b' },
      user: { id: 'tenant-admin', roles: ['AUDITOR', 'TENANT_ADMIN'], permissions: ['tenant.read', 'tenant.update'], tenantId: 'partner-a', sessionId: 's1', authorization: splitContext },
    });
    assert.equal(result.statusCode, 403);
    assert.equal(result.nextCalled, false);
  });

  it('allows a target only when the same role assignment grants its permission and scope', () => {
    const result = invoke(requireOrganizationPermission('tenant.read', 'id'), {
      params: { id: 'client-a' },
      user: { id: 'tenant-admin', roles: ['TENANT_ADMIN'], permissions: ['tenant.read'], tenantId: 'partner-a', sessionId: 's1', authorization: context() },
    });
    assert.equal(result.nextCalled, true);
  });

  it('does not grant global Super Admin role access without an explicit GLOBAL assignment', () => {
    const result = invoke(requireRole(['SUPER_ADMIN']), { user: { id: 'tenant-admin', roles: ['SUPER_ADMIN'], permissions: [], tenantId: 'partner-a', sessionId: 's1', authorization: context(assignments({ role: 'SUPER_ADMIN' })) } });
    assert.equal(result.statusCode, 403);
    assert.equal(result.nextCalled, false);
  });

  it('grants global Super Admin only from an explicit NULL-organization GLOBAL assignment', () => {
    const globalContext = context(assignments({ role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL' }));
    const result = invoke(requireRole(['SUPER_ADMIN']), { user: { id: 'root', roles: ['SUPER_ADMIN'], permissions: [], tenantId: null, sessionId: 's1', authorization: globalContext } });
    assert.equal(result.nextCalled, true);
  });
});
