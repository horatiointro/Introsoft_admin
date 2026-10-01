import { authorizeInContext, type AuthorizationContext } from './authorizationContext.ts';
import type { Application } from '../types.ts';

export type CredentialScopeStatus = 'RUNTIME_ENFORCED' | 'PERSISTED_NON_FUNCTIONAL' | 'REJECTED_UNSUPPORTED';

export interface CredentialScopeDefinition {
  readonly scope: string;
  readonly status: CredentialScopeStatus;
  readonly managementPermission?: string;
  readonly applicationRequirement?: 'ACTIVE_WITH_CAPABILITIES';
}

/** Registry separates historical scope data from scopes that can safely be granted and enforced now. */
export const CREDENTIAL_SCOPE_REGISTRY: Readonly<Record<string, CredentialScopeDefinition>> = Object.freeze({
  'read:inference': Object.freeze({
    scope: 'read:inference',
    status: 'RUNTIME_ENFORCED',
    managementPermission: 'apikeys.create',
    applicationRequirement: 'ACTIVE_WITH_CAPABILITIES',
  }),
  'write:inference': Object.freeze({ scope: 'write:inference', status: 'PERSISTED_NON_FUNCTIONAL' }),
  'read:models': Object.freeze({ scope: 'read:models', status: 'PERSISTED_NON_FUNCTIONAL' }),
  'read:capabilities': Object.freeze({ scope: 'read:capabilities', status: 'PERSISTED_NON_FUNCTIONAL' }),
  'write:telemetry': Object.freeze({ scope: 'write:telemetry', status: 'PERSISTED_NON_FUNCTIONAL' }),
});

export function credentialScopeStatus(scope: string): CredentialScopeStatus {
  return CREDENTIAL_SCOPE_REGISTRY[scope]?.status ?? 'REJECTED_UNSUPPORTED';
}

export type CredentialScopeGrantDecision =
  | { readonly allowed: true; readonly maximumScopes: readonly string[]; readonly grantedScopes: readonly string[] }
  | { readonly allowed: false; readonly code: 'NO_MANAGEMENT_AUTHORITY' | 'APPLICATION_SCOPE_MISMATCH' | 'APPLICATION_NOT_GRANTABLE' | 'UNSUPPORTED_SCOPE' | 'SCOPE_NOT_WITHIN_CEILING'; readonly maximumScopes: readonly string[]; readonly deniedScopes: readonly string[] };

/**
 * Computes a caller's scope ceiling from its target-scoped credential-management grant
 * and the selected application's current identity/capability boundary.
 */
export function evaluateCredentialScopeGrant(input: {
  readonly authorization?: AuthorizationContext;
  readonly targetOrganizationId: string;
  readonly application: Application;
  readonly requestedScopes: unknown;
}): CredentialScopeGrantDecision {
  const requested = Array.isArray(input.requestedScopes) && input.requestedScopes.every(scope => typeof scope === 'string')
    ? [...new Set(input.requestedScopes as string[])]
    : [];
  if (!input.targetOrganizationId || input.application.customerId !== input.targetOrganizationId) {
    return { allowed: false, code: 'APPLICATION_SCOPE_MISMATCH', maximumScopes: [], deniedScopes: requested };
  }
  if (input.application.status !== 'active') {
    return { allowed: false, code: 'APPLICATION_NOT_GRANTABLE', maximumScopes: [], deniedScopes: requested };
  }

  const definitions = Object.values(CREDENTIAL_SCOPE_REGISTRY);
  const maximumScopes = definitions
    .filter(definition => definition.status === 'RUNTIME_ENFORCED')
    .filter(definition => !definition.managementPermission || authorizeInContext(input.authorization, input.targetOrganizationId, definition.managementPermission))
    .filter(definition => definition.applicationRequirement !== 'ACTIVE_WITH_CAPABILITIES' || input.application.allowedCapabilities.length > 0)
    .map(definition => definition.scope);

  if (!input.authorization || !authorizeInContext(input.authorization, input.targetOrganizationId, 'apikeys.create')) {
    return { allowed: false, code: 'NO_MANAGEMENT_AUTHORITY', maximumScopes, deniedScopes: requested };
  }
  if (!Array.isArray(input.requestedScopes) || requested.length === 0) {
    return { allowed: false, code: 'UNSUPPORTED_SCOPE', maximumScopes, deniedScopes: requested };
  }
  const unsupported = requested.filter(scope => credentialScopeStatus(scope) !== 'RUNTIME_ENFORCED');
  if (unsupported.length) {
    return { allowed: false, code: 'UNSUPPORTED_SCOPE', maximumScopes, deniedScopes: unsupported };
  }
  const deniedScopes = requested.filter(scope => !maximumScopes.includes(scope));
  if (deniedScopes.length) {
    const code = input.application.allowedCapabilities.length === 0 ? 'APPLICATION_NOT_GRANTABLE' : 'SCOPE_NOT_WITHIN_CEILING';
    return { allowed: false, code, maximumScopes, deniedScopes };
  }
  return { allowed: true, maximumScopes, grantedScopes: requested };
}

export function auditRequestedScopes(value: unknown): string[] {
  if (value === undefined) return ['read:inference'];
  if (!Array.isArray(value)) return [];
  return value.slice(0, 10).flatMap(scope => typeof scope === 'string' ? [scope.slice(0, 80)] : []);
}
