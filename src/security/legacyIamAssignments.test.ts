import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMissingAuthorizationScopeColumn, normalizeLegacyIamAssignments } from './legacyIamAssignments.ts';

describe('legacy IAM assignment compatibility', () => {
  it('preserves tenant-bound role permissions as organization-only grants', () => {
    const result = normalizeLegacyIamAssignments([
      { assignment_id: 'a1', role_code: 'TENANT_ADMIN', tenant_id: 'tenant-a', permission_code: 'tenant.read' },
      { assignment_id: 'a1', role_code: 'TENANT_ADMIN', tenant_id: 'tenant-a', permission_code: 'apikeys.create' },
      { assignment_id: 'a1', role_code: 'TENANT_ADMIN', tenant_id: 'tenant-a', permission_code: 'tenant.read' },
    ]);

    assert.deepEqual(result, [{
      assignmentId: 'a1', role: 'TENANT_ADMIN', organizationId: 'tenant-a',
      visibility: 'ORGANISATION', permissions: ['tenant.read', 'apikeys.create'],
    }]);
  });

  it('does not infer a GLOBAL grant from a null-tenant Super Admin row', () => {
    const result = normalizeLegacyIamAssignments([
      { assignment_id: 'root-role', role_code: 'SUPER_ADMIN', tenant_id: null, permission_code: 'tenant.read' },
    ]);
    assert.deepEqual(result, []);
  });

  it('keeps assignments separate when a user has roles in different organizations', () => {
    const result = normalizeLegacyIamAssignments([
      { assignment_id: 'a1', role_code: 'TENANT_ADMIN', tenant_id: 'tenant-a', permission_code: 'tenant.read' },
      { assignment_id: 'a2', role_code: 'AUDITOR', tenant_id: 'tenant-b', permission_code: 'audit.read' },
    ]);
    assert.equal(result.length, 2);
    assert.equal(result[0].organizationId, 'tenant-a');
    assert.equal(result[1].organizationId, 'tenant-b');
  });

  it('ignores rows without a concrete tenant assignment', () => {
    const result = normalizeLegacyIamAssignments([
      { assignment_id: 'a1', role_code: 'TENANT_ADMIN', tenant_id: null, permission_code: 'tenant.read' },
      { assignment_id: '', role_code: 'TENANT_ADMIN', tenant_id: 'tenant-a', permission_code: 'tenant.read' },
    ]);
    assert.deepEqual(result, []);
  });

  it('recognizes only a missing access_scope column as a legacy schema signal', () => {
    assert.equal(isMissingAuthorizationScopeColumn({ code: 'ER_BAD_FIELD_ERROR', message: "Unknown column 'ur.access_scope' in 'field list'" }), true);
    assert.equal(isMissingAuthorizationScopeColumn({ code: 'ER_BAD_FIELD_ERROR', message: "Unknown column 'ur.other_column' in 'field list'" }), false);
    assert.equal(isMissingAuthorizationScopeColumn({ code: 'ECONNREFUSED', message: 'access_scope unavailable' }), false);
  });
});
