export type OrganizationVisibility = 'GLOBAL' | 'ORGANISATION' | 'DESCENDANTS' | 'SELF' | 'TREE';

export type OrganizationRelationshipType =
  | 'SUBSIDIARY'
  | 'PARTNER'
  | 'RESELLER'
  | 'CLIENT'
  | 'DIRECT_CLIENT'
  | 'OTHER';

export interface OrganizationNode {
  readonly id: string;
  readonly parentId: string | null;
}

/** A relationship is separate from the organization node so its type and dates can evolve. */
export interface OrganizationRelationship {
  readonly parentOrganizationId: string;
  readonly childOrganizationId: string;
  readonly relationshipType: OrganizationRelationshipType;
  readonly status: 'ACTIVE' | 'ENDED';
  readonly effectiveFrom?: string;
  readonly effectiveTo: string | null;
}

/** Server-resolved scope. Never construct this from browser-supplied IDs or claims. */
export interface AccessScope {
  readonly rootOrganizationId: string;
  readonly organizationId: string;
  readonly visibility: OrganizationVisibility;
  readonly permissions: readonly string[];
}

export interface OrganizationAccessRequest {
  readonly scope: AccessScope | null;
  readonly targetOrganizationId: string;
  readonly requiredPermission: string;
  readonly asOf?: string;
}

function isEffective(relationship: OrganizationRelationship, asOf: number): boolean {
  const from = relationship.effectiveFrom ? Date.parse(relationship.effectiveFrom) : null;
  const to = relationship.effectiveTo ? Date.parse(relationship.effectiveTo) : null;
  return relationship.status === 'ACTIVE'
    && (from === null || (Number.isFinite(from) && from <= asOf))
    && (to === null || (Number.isFinite(to) && asOf < to));
}

/**
 * Resolve scope over arbitrary-depth relationship graphs. A visited set prevents cycles
 * from causing an unbounded traversal; invalid graph structure never broadens visibility.
 */
export function resolveVisibleOrganizationIds(input: {
  readonly scope: AccessScope;
  readonly nodes: readonly OrganizationNode[];
  readonly relationships?: readonly OrganizationRelationship[];
  readonly asOf?: string;
}): ReadonlySet<string> {
  const { scope, nodes } = input;
  const nodeIds = new Set(nodes.map(node => node.id));
  if (scope.visibility === 'GLOBAL') return nodeIds;
  if (!nodeIds.has(scope.organizationId)) return new Set();
  if (scope.visibility === 'SELF' || scope.visibility === 'ORGANISATION') return new Set([scope.organizationId]);

  const now = Date.parse(input.asOf ?? new Date().toISOString());
  const childByParent = new Map<string, Set<string>>();
  const parentByChild = new Map<string, Set<string>>();
  const edges = input.relationships !== undefined
    ? input.relationships.filter(edge => isEffective(edge, now))
    : nodes.flatMap(node => node.parentId ? [{ parentOrganizationId: node.parentId, childOrganizationId: node.id, relationshipType: 'OTHER' as const, status: 'ACTIVE' as const, effectiveTo: null }] : []);

  for (const edge of edges) {
    if (!nodeIds.has(edge.parentOrganizationId) || !nodeIds.has(edge.childOrganizationId) || edge.parentOrganizationId === edge.childOrganizationId) continue;
    const children = childByParent.get(edge.parentOrganizationId) ?? new Set<string>();
    children.add(edge.childOrganizationId);
    childByParent.set(edge.parentOrganizationId, children);
    const parents = parentByChild.get(edge.childOrganizationId) ?? new Set<string>();
    parents.add(edge.parentOrganizationId);
    parentByChild.set(edge.childOrganizationId, parents);
  }

  const visible = new Set<string>([scope.organizationId]);
  const walk = (start: string, adjacency: Map<string, Set<string>>) => {
    const queue = [start];
    while (queue.length) {
      const current = queue.shift()!;
      for (const next of adjacency.get(current) ?? []) {
        if (visible.has(next)) continue;
        visible.add(next);
        queue.push(next);
      }
    }
  };
  walk(scope.organizationId, childByParent);
  if (scope.visibility === 'TREE') walk(scope.organizationId, parentByChild);
  return visible;
}

export function authorizeOrganizationAccess(input: OrganizationAccessRequest & {
  readonly nodes?: readonly OrganizationNode[];
  readonly relationships?: readonly OrganizationRelationship[];
}): boolean {
  const { scope, targetOrganizationId, requiredPermission } = input;
  if (!scope || !requiredPermission || !scope.permissions.includes(requiredPermission)) return false;
    if (scope.visibility === 'GLOBAL') return true;
  const visible = resolveVisibleOrganizationIds({
    scope,
    nodes: input.nodes ?? [{ id: scope.organizationId, parentId: null }, { id: targetOrganizationId, parentId: null }],
    relationships: input.relationships,
    asOf: input.asOf,
  });
  return visible.has(targetOrganizationId);
}

/** Legacy IAM role assignment → safe scope. Descendants require a future explicit persisted grant. */
export function legacyAccessScope(input: {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly tenantId: string | null;
  readonly globalSuperAdminAssigned: boolean;
}): AccessScope | null {
  if (input.roles.includes('SUPER_ADMIN') && input.globalSuperAdminAssigned && input.tenantId === null) {
    return Object.freeze({ rootOrganizationId: 'platform:introsoft', organizationId: 'platform:introsoft', visibility: 'GLOBAL', permissions: Object.freeze([...input.permissions]) });
  }
  if (!input.tenantId) return null;
  return Object.freeze({ rootOrganizationId: input.tenantId, organizationId: input.tenantId, visibility: 'ORGANISATION', permissions: Object.freeze([...input.permissions]) });
}
