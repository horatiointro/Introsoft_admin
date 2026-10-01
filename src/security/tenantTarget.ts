import { authorizeInContext, type AuthorizationContext } from './authorizationContext';

/** Resolve a caller-selected tenant without treating a missing tenant as global. */
export function resolveAuthorizedTenantTarget(input: {
  readonly context?: AuthorizationContext;
  readonly actorTenantId?: string | null;
  readonly requestedTenantId?: string | null;
  readonly allowGlobalList?: boolean;
  /** Cross-organization selection is allowed only when a single grant carries this permission. */
  readonly requiredPermission?: string;
}): string | null {
  const requested = String(input.requestedTenantId || '').trim();
  const actorTenant = String(input.actorTenantId || '').trim();
  const explicitGlobalSuperAdmin = input.context?.grants.some(grant =>
    grant.role === 'SUPER_ADMIN' && grant.visibility === 'GLOBAL'
  ) === true;

  if (explicitGlobalSuperAdmin) {
    if (requested) return requested;
    if (input.allowGlobalList) return 'all';
    return actorTenant || null;
  }

  if (requested && requested !== actorTenant) {
    return input.requiredPermission && authorizeInContext(input.context, requested, input.requiredPermission) ? requested : null;
  }
  if (!actorTenant) return null;
  return actorTenant;
}
