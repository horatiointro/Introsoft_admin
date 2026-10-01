import type { AuthorizationContext } from './authorizationContext';
import { resolveAuthorizedTenantTarget } from './tenantTarget';

/** Incident reads/writes require an explicit tenant grant; platform roles alone do not widen scope. */
export function canAccessIncidentTenant(context: AuthorizationContext | undefined, tenantId: string, permission: 'tenant.read' | 'tenant.update'): boolean {
  return Boolean(context && tenantId && context.grants.some(grant => grant.permissions.includes(permission) && grant.visibleOrganizationIds.has(tenantId)));
}

export function resolveIncidentReadScope(input: { context?: AuthorizationContext; actorTenantId?: string | null; requestedTenantId?: string | null }): string | null {
  const target = resolveAuthorizedTenantTarget({ ...input, allowGlobalList: true, requiredPermission: 'tenant.read' });
  if (!target) return null;
  if (target === 'all') return input.context?.grants.some(grant => grant.role === 'SUPER_ADMIN' && grant.visibility === 'GLOBAL' && grant.permissions.includes('tenant.read')) ? 'all' : null;
  return canAccessIncidentTenant(input.context, target, 'tenant.read') ? target : null;
}
