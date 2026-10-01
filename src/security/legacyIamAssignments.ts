import type { AuthorizationAssignment } from './authorizationContext';

export interface LegacyIamAssignmentRow {
  readonly assignment_id: string;
  readonly role_code: string;
  readonly tenant_id: string | null;
  readonly permission_code: string | null;
}

type MutableAuthorizationAssignment = Omit<AuthorizationAssignment, 'permissions'> & { permissions: string[] };

/**
 * Adapt the pre-access_scope IAM schema without widening authority. Tenant-bound role
 * assignments retain their organization scope; NULL-scoped assignments are intentionally
 * omitted because the legacy schema cannot prove an explicit GLOBAL grant.
 */
export function normalizeLegacyIamAssignments(rows: readonly LegacyIamAssignmentRow[]): AuthorizationAssignment[] {
  const assignments = new Map<string, MutableAuthorizationAssignment>();

  for (const row of rows) {
    if (!row.assignment_id || !row.role_code || !row.tenant_id) continue;
    let assignment = assignments.get(row.assignment_id);
    if (!assignment) {
      assignment = {
        assignmentId: row.assignment_id,
        role: row.role_code,
        organizationId: row.tenant_id,
        visibility: 'ORGANISATION',
        permissions: [],
      };
      assignments.set(row.assignment_id, assignment);
    }
    if (row.permission_code && !assignment.permissions.includes(row.permission_code)) {
      assignment.permissions.push(row.permission_code);
    }
  }

  return [...assignments.values()].map(assignment => Object.freeze({
    ...assignment,
    permissions: Object.freeze([...assignment.permissions]),
  }));
}

export function isMissingAuthorizationScopeColumn(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const dbError = error as { code?: unknown; errno?: unknown; sqlMessage?: unknown; message?: unknown };
  const codeMatches = dbError.code === 'ER_BAD_FIELD_ERROR' || dbError.errno === 1054;
  const message = typeof dbError.sqlMessage === 'string'
    ? dbError.sqlMessage
    : typeof dbError.message === 'string' ? dbError.message : '';
  return codeMatches && /(?:unknown column|column .* does not exist).*access_scope/i.test(message);
}
