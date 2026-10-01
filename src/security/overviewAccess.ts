import { organizationsAuthorizedFor, type AuthorizationContext } from './authorizationContext';

export interface OverviewAccess {
  readonly organizationIds: readonly string[];
  readonly canReadPlatformProviders: boolean;
  readonly canReadPlatformModels: boolean;
}

/** Build dashboard visibility only from persisted authorization grants. */
export function overviewAccess(context: AuthorizationContext | undefined): OverviewAccess {
  const globalSuperAdmin = context?.grants.find(grant => grant.role === 'SUPER_ADMIN' && grant.visibility === 'GLOBAL');
  return Object.freeze({
    organizationIds: Object.freeze(organizationsAuthorizedFor(context, 'tenant.read')),
    canReadPlatformProviders: Boolean(globalSuperAdmin?.permissions.includes('provider.read')),
    canReadPlatformModels: Boolean(globalSuperAdmin?.permissions.includes('model.read')),
  });
}
