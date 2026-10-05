import { resolveVisibleOrganizationIds, type AccessScope, type OrganizationNode, type OrganizationRelationship, type OrganizationRelationshipType, type OrganizationVisibility } from './organizationScope';
import { expandLegacyPermissionCodes } from './permissionImplications';

export interface AuthorizationAssignment {
  readonly assignmentId: string;
  readonly role: string;
  readonly organizationId: string | null;
  readonly visibility: OrganizationVisibility;
  readonly permissions: readonly string[];
  /** Optional relationship-type boundary; absent means all explicit types. */
  readonly relationshipTypes?: readonly OrganizationRelationshipType[];
}

export interface AuthorizationGrant extends AccessScope {
  readonly role: string;
  readonly assignmentId: string;
  readonly visibleOrganizationIds: ReadonlySet<string>;
}

export interface AuthorizationContext {
  readonly userId: string;
  readonly organizationId: string | null;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly grants: readonly AuthorizationGrant[];
  readonly visibleOrganizationIds: ReadonlySet<string>;
}

const VALID_VISIBILITIES = new Set<OrganizationVisibility>(['GLOBAL', 'ORGANISATION', 'DESCENDANTS', 'SELF', 'TREE']);

/** Build scope only from persisted/session-resolved assignments and the trusted organization graph. */
export function buildAuthorizationContext(input: {
  readonly userId: string;
  readonly assignments: readonly AuthorizationAssignment[];
  readonly organizations: readonly OrganizationNode[];
  readonly relationships?: readonly OrganizationRelationship[];
  readonly asOf?: string;
}): AuthorizationContext {
    const organizationIds = new Set(input.organizations.map(node => node.id));
    const grants: AuthorizationGrant[] = [];
    // Expand legacy operation names once at the authorization boundary so every
    // consumer (Sidebar, route gates, capability inventory) sees the implied
    // read codes without re-implying them per surface.
    const expand = (codes: readonly string[]): string[] => [...new Set(expandLegacyPermissionCodes(codes))];

    for (const assignment of input.assignments) {
    if (!VALID_VISIBILITIES.has(assignment.visibility)) continue;
    const isGlobal = assignment.visibility === 'GLOBAL';
    // Global reach is an explicit Super Admin assignment with a NULL organization scope.
    if (isGlobal) {
      if (assignment.role !== 'SUPER_ADMIN' || assignment.organizationId !== null) continue;
      const scope: AccessScope = {
        rootOrganizationId: 'platform:introsoft',
        organizationId: 'platform:introsoft',
        visibility: 'GLOBAL',
        permissions: Object.freeze(expand(assignment.permissions)),
        relationshipTypes: assignment.relationshipTypes ? Object.freeze([...assignment.relationshipTypes]) : undefined,
      };
      grants.push(Object.freeze({ ...scope, role: assignment.role, assignmentId: assignment.assignmentId, visibleOrganizationIds: new Set(organizationIds) }));
      continue;
    }

    if (!assignment.organizationId || !organizationIds.has(assignment.organizationId)) continue;
    const scope: AccessScope = {
      rootOrganizationId: assignment.organizationId,
      organizationId: assignment.organizationId,
      visibility: assignment.visibility,
      permissions: Object.freeze(expand(assignment.permissions)),
      relationshipTypes: assignment.relationshipTypes ? Object.freeze([...assignment.relationshipTypes]) : undefined,
    };
    const visibleOrganizationIds = resolveVisibleOrganizationIds({
      scope,
      nodes: input.organizations,
      relationships: input.relationships,
      asOf: input.asOf,
    });
    grants.push(Object.freeze({ ...scope, role: assignment.role, assignmentId: assignment.assignmentId, visibleOrganizationIds }));
  }

  const visible = new Set<string>();
  grants.forEach(grant => grant.visibleOrganizationIds.forEach(id => visible.add(id)));
  const roles = [...new Set(input.assignments.map(assignment => assignment.role))];
  const permissions = [...new Set(grants.flatMap(grant => grant.permissions))];
  const organizationId = grants.find(grant => grant.visibility !== 'GLOBAL')?.organizationId ?? null;

  return Object.freeze({
    userId: input.userId,
    organizationId,
    roles: Object.freeze(roles),
    permissions: Object.freeze(permissions),
    grants: Object.freeze(grants),
    visibleOrganizationIds: visible,
  });
}

/** Authorize one operation against one target organization; browser IDs never expand grants. */
export function authorizeInContext(context: AuthorizationContext | undefined, targetOrganizationId: string, permission: string): boolean {
  if (!context || !targetOrganizationId || !permission) return false;
  return context.grants.some(grant => grant.permissions.includes(permission) && grant.visibleOrganizationIds.has(targetOrganizationId));
}

/** Require every capability and organization visibility on one grant; multiple grants cannot be combined. */
export function authorizeAllInContext(context: AuthorizationContext | undefined, targetOrganizationId: string, permissions: readonly string[]): boolean {
  if (!context || !targetOrganizationId || !permissions.length) return false;
  return context.grants.some(grant => grant.visibleOrganizationIds.has(targetOrganizationId) && permissions.every(permission => grant.permissions.includes(permission)));
}

/** Return only organizations visible through grants that carry this permission. */
export function organizationsAuthorizedFor(context: AuthorizationContext | undefined, permission: string): string[] {
  if (!context || !permission) return [];
  const authorized = new Set<string>();
  for (const grant of context.grants) {
    if (!grant.permissions.includes(permission)) continue;
    for (const organizationId of grant.visibleOrganizationIds) authorized.add(organizationId);
  }
  return [...authorized];
}
