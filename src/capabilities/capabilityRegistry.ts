import type { AuthorizationContext } from '../security/authorizationContext';

export type CapabilityStatus = 'IMPLEMENTED' | 'PARTIALLY_IMPLEMENTED' | 'CONFIGURED' | 'PLANNED' | 'UNAVAILABLE' | 'REQUIRES_AUTHORIZATION' | 'NOT_ASSESSED';
export type CapabilityAuthentication = 'PUBLIC' | 'ALTIL_SESSION' | 'TENANT_API_KEY';
export type CapabilityScope = 'PUBLIC' | 'PLATFORM' | 'ORGANISATION' | 'TENANT';

export interface CapabilityDefinition {
  readonly id: string;
  readonly domain: string;
  readonly name: string;
  readonly description: string;
  readonly method: string;
  readonly route: string;
  readonly authentication: CapabilityAuthentication;
  readonly requiredRoles: readonly string[];
  readonly requiredPermissions: readonly string[];
  readonly scope: CapabilityScope;
  readonly status: CapabilityStatus;
  readonly ui: readonly string[];
  readonly source: string;
  readonly limitations?: readonly string[];
}

/**
 * Source-backed initial capability map. This is deliberately an incomplete inventory:
 * only entries reviewed against a handler are listed; omission is not proof of absence.
 */
export const capabilityRegistry: readonly CapabilityDefinition[] = Object.freeze([
  {
    id: 'capabilities.read', domain: 'Platform', name: 'Read capability inventory',
    description: 'Returns a partial source-reviewed route inventory with status and authentication metadata.', method: 'GET', route: '/api/v1/capabilities',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: [], scope: 'PLATFORM', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['API documentation', 'Ask ALTIL'], source: 'server.ts · GET /api/v1/capabilities',
    limitations: ['The inventory is intentionally partial and does not prove production deployment.'],
  },
  {
    id: 'public.plans.read', domain: 'Commercial', name: 'Read published plans',
    description: 'Lists published customer plans.', method: 'GET', route: '/api/v1/public/plans',
    authentication: 'PUBLIC', requiredRoles: [], requiredPermissions: [], scope: 'PUBLIC', status: 'IMPLEMENTED',
    ui: ['Self registration'], source: 'server.ts · GET /api/v1/public/plans',
  },
  {
    id: 'auth.login', domain: 'Identity', name: 'Sign in',
    description: 'Authenticates an ALTIL user and issues a session through the configured authentication flow.', method: 'POST', route: '/api/v1/auth/login',
    authentication: 'PUBLIC', requiredRoles: [], requiredPermissions: [], scope: 'PUBLIC', status: 'IMPLEMENTED',
    ui: ['Login screen'], source: 'src/routes/authRoutes.ts · POST /login',
  },
  {
    id: 'customers.list', domain: 'Customers', name: 'List organizations in scope',
    description: 'Lists customer/tenant records inside the authenticated authorization context.', method: 'GET', route: '/api/v1/customers',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Manage customers'], source: 'server.ts · GET /api/v1/customers',
    limitations: ['Customer/tenant records do not establish commercial Customer identity.'],
  },
  {
    id: 'commercial.organizations.read', domain: 'Commercial', name: 'Read commercial organizations',
    description: 'Reads explicitly linked organizations, commercial relationships, visible customers, and linked technical scopes through independently authorized IAM scope.', method: 'GET', route: '/api/v1/commercial/organizations',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Organization structure'], source: 'src/routes/commercialFoundationRoutes.ts · GET /organizations',
    limitations: ['Commercial relationships do not grant IAM access; technical scope links must be explicit.'],
  },
  {
    id: 'commercial.account-portal.read', domain: 'Commercial', name: 'Read commercial account portal',
    description: 'Reads one authorized commercial organization or customer, its explicit effective relationships, and existing financial aggregates only when a persisted technical link and billing.read grant both exist.', method: 'GET', route: '/api/v1/commercial/account-portal',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Commercial account portal'], source: 'src/routes/commercialFoundationRoutes.ts · GET /account-portal',
    limitations: ['Financial details additionally require billing.read and explicit commercial-to-technical links.', 'Profile editing and bank-cash evidence are not implemented by this read-only portal foundation.'],
  },
  {
    id: 'commercial.evidence-approvals.create', domain: 'Commercial', name: 'Approve commercial evidence',
    description: 'Records a one-use evidence approval from a globally scoped Super Admin for a commercial foundation write; supports exact tenant, purpose, and effective-period approval for scope links. Requires Idempotency-Key and atomic audit.', method: 'POST', route: '/api/v1/commercial/evidence-approvals',
    authentication: 'ALTIL_SESSION', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: ['tenant.write'], scope: 'PLATFORM', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · POST /evidence-approvals',
    limitations: ['This approval operation is intentionally restricted to an explicit GLOBAL Super Admin grant.'],
  },
  {
    id: 'commercial.organizations.create', domain: 'Commercial', name: 'Create commercial organization',
    description: 'Creates an organization and its explicit parent relationship from a single-use owner approval. Requires Idempotency-Key; mutation, approval use, audit and replay result are atomic.', method: 'POST', route: '/api/v1/commercial/organizations',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.write'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · POST /organizations',
    limitations: ['Introsoft root is migration-seeded; hierarchy changes are append-only and effective-dated.'],
  },
  {
    id: 'commercial.customers.read', domain: 'Commercial', name: 'Read commercial customers',
    description: 'Lists commercial customers linked explicitly to authorized commercial organizations.', method: 'GET', route: '/api/v1/commercial/customers',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Organization structure'], source: 'src/routes/commercialFoundationRoutes.ts · GET /customers',
    limitations: ['This is separate from technical tenant/customer compatibility APIs.'],
  },
  {
    id: 'commercial.customers.create', domain: 'Commercial', name: 'Create commercial customer',
    description: 'Creates an INDIVIDUAL or COMPANY buyer and an explicit organization relationship without creating a tenant, application, or credential. Requires Idempotency-Key; mutation, approval use, audit and replay result are atomic.', method: 'POST', route: '/api/v1/commercial/customers',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.write'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · POST /customers',
  },
  {
    id: 'commercial.accounts.create', domain: 'Commercial', name: 'Create commercial account',
    description: 'Creates a separate commercial account for an authorized commercial customer. Requires Idempotency-Key; mutation, approval use, audit and replay result are atomic.', method: 'POST', route: '/api/v1/commercial/accounts',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.write'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · POST /accounts',
  },
  {
    id: 'commercial.legal-entities.read', domain: 'Commercial', name: 'Read customer legal entities',
    description: 'Reads legal entities explicitly recorded for a customer in authorized commercial scope.', method: 'GET', route: '/api/v1/commercial/customers/:customerId/legal-entities',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · GET /customers/:customerId/legal-entities',
  },
  {
    id: 'commercial.legal-entities.create', domain: 'Commercial', name: 'Create customer legal entity',
    description: 'Creates a customer-owned legal entity from a single-use owner approval. Requires Idempotency-Key; mutation, approval use, audit and replay result are atomic.', method: 'POST', route: '/api/v1/commercial/legal-entities',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.write'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · POST /legal-entities',
    limitations: ['Registration references are not returned by the read endpoint.'],
  },
  {
    id: 'commercial.organization-tenant-scopes.read', domain: 'Commercial', name: 'Read organization technical scopes',
    description: 'Reads only explicit technical tenant scope links attached to an independently authorized commercial organization.', method: 'GET', route: '/api/v1/commercial/organizations/:organizationId/technical-scopes',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Organization structure'], source: 'src/routes/commercialFoundationRoutes.ts · GET /organizations/:organizationId/technical-scopes',
  },
  {
    id: 'commercial.organization-tenant-scopes.create', domain: 'Commercial', name: 'Link a technical tenant to a commercial organization',
    description: 'Creates one explicit effective-dated tenant owner link with GLOBAL Super Admin approval, serialized cardinality checks, Idempotency-Key, and atomic audit.', method: 'POST', route: '/api/v1/commercial/organization-tenant-scopes',
    authentication: 'ALTIL_SESSION', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: ['tenant.write'], scope: 'PLATFORM', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialFoundationRoutes.ts · POST /organization-tenant-scopes',
    limitations: ['The scope relationship does not grant technical IAM permissions; an existing IAM grant remains required.'],
  },
  {
    id: 'applications.list', domain: 'Developers', name: 'List applications in scope',
    description: 'Lists applications visible to the authenticated organization scope.', method: 'GET', route: '/api/v1/applications',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Applications & API keys'], source: 'server.ts · GET /api/v1/applications',
  },
  {
    id: 'applications.create', domain: 'Developers', name: 'Create an application',
    description: 'Creates an application and its supported initial credential through the existing management handler.', method: 'POST', route: '/api/v1/applications',
    authentication: 'ALTIL_SESSION', requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'], requiredPermissions: ['tenant.update', 'apikeys.create'], scope: 'ORGANISATION', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['Applications'], source: 'server.ts · POST /api/v1/applications',
    limitations: ['Application creation remains coupled to API-key creation; project/environment resources are not first-class.'],
  },
  {
    id: 'api-keys.list', domain: 'Credentials', name: 'List API keys in scope',
    description: 'Lists API key metadata visible to the authenticated organization scope.', method: 'GET', route: '/api/v1/api-keys',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: ['Applications & API keys'], source: 'server.ts · GET /api/v1/api-keys',
  },
  {
    id: 'api-keys.create', domain: 'Credentials', name: 'Create a runtime API key',
    description: 'Issues a tenant/application-bound runtime key through the existing management route.', method: 'POST', route: '/api/v1/api-keys',
    authentication: 'ALTIL_SESSION', requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'], requiredPermissions: ['apikeys.create'], scope: 'ORGANISATION', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['Applications & API keys'], source: 'server.ts · POST /api/v1/api-keys',
    limitations: ['Separate management credentials and the complete rotation/expiry lifecycle are not established by this route.'],
  },
  {
    id: 'providers.list', domain: 'AI platform', name: 'List provider configuration',
    description: 'Lists the configured provider catalogue for an authenticated ALTIL session.', method: 'GET', route: '/api/v1/providers',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: [], scope: 'PLATFORM', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['Providers & models'], source: 'server.ts · GET /api/v1/providers',
    limitations: ['Provider secrets are not part of this list response; provider health and account capability still depend on configuration.'],
  },
  {
    id: 'models.list', domain: 'AI platform', name: 'List model catalogue',
    description: 'Lists model metadata available in the configured ALTIL catalogue.', method: 'GET', route: '/api/v1/models',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: [], scope: 'PLATFORM', status: 'IMPLEMENTED',
    ui: ['Providers & models'], source: 'server.ts · GET /api/v1/models',
  },
  {
    id: 'policies.list', domain: 'Governance', name: 'List policies',
    description: 'Lists policies visible through the caller’s explicit permission and organization scope.', method: 'GET', route: '/api/v1/policies',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['policy.read'], scope: 'ORGANISATION', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['AI guardrails & policies'], source: 'server.ts · GET /api/v1/policies',
    limitations: ['Policy persistence and evaluation are not yet unified with the capability inventory or every AI request path.'],
  },
  {
    id: 'audit.logs.read', domain: 'Security', name: 'Read audit logs in scope',
    description: 'Lists audit events for applications belonging to organizations where the caller has audit-read authority.', method: 'GET', route: '/api/v1/logs',
    authentication: 'ALTIL_SESSION', requiredRoles: ['SUPER_ADMIN', 'AUDITOR', 'SECURITY_ADMIN', 'TENANT_ADMIN'], requiredPermissions: ['audit.read'], scope: 'ORGANISATION', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['Audit trail'], source: 'server.ts · GET /api/v1/logs',
    limitations: ['Logs without a known application-to-organization relationship are omitted for scoped readers.'],
  },
  {
    id: 'usage.read', domain: 'FinOps', name: 'Read scoped usage',
    description: 'Returns stored aggregate usage counters and application quota metadata for visible organizations.', method: 'GET', route: '/api/v1/usage',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.read'], scope: 'ORGANISATION', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['AI cost & usage'], source: 'server.ts · GET /api/v1/usage',
    limitations: ['Daily time series and provider-share data are not recorded by this handler and are returned as unavailable.'],
  },
  {
    id: 'gateway.models', domain: 'AI gateway', name: 'List gateway models',
    description: 'Lists active gateway model identifiers for a tenant API-key caller.', method: 'GET', route: '/v1/models',
    authentication: 'TENANT_API_KEY', requiredRoles: [], requiredPermissions: [], scope: 'TENANT', status: 'IMPLEMENTED',
    ui: ['API documentation', 'API playground'], source: 'server.ts · GET /v1/models',
  },
  {
    id: 'gateway.chat-completions', domain: 'AI gateway', name: 'Create a governed chat completion',
    description: 'Processes a chat-completion request through tenant, application, quota, policy and provider-routing checks.', method: 'POST', route: '/v1/chat/completions',
    authentication: 'TENANT_API_KEY', requiredRoles: [], requiredPermissions: [], scope: 'TENANT', status: 'PARTIALLY_IMPLEMENTED',
    ui: ['API documentation', 'API playground'], source: 'server.ts · POST /v1/chat/completions',
    limitations: ['A successful upstream response requires an enabled compatible provider, credentials and an available model.'],
  },
  {
    id: 'commercial.catalogue.read', domain: 'Commercial', name: 'Read catalogue and product relationships',
    description: 'Reads the existing billing product catalogue with effective-dated relationships and a separate per-organization resale authorization indicator.', method: 'GET', route: '/api/v1/commercial/catalogue',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['billing.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialCatalogueRoutes.ts · GET /catalogue',
    limitations: ['Catalogue visibility does not authorize resale; each product requires a separately persisted active authorization.'],
  },
  {
    id: 'commercial.catalogue.relationships.create', domain: 'Commercial', name: 'Create a product relationship or bundle membership',
    description: 'Creates an approved effective-dated relationship between existing billing products; bundle membership expands from the existing bundle product without creating an alternate order system.', method: 'POST', route: '/api/v1/commercial/catalogue/relationships',
    authentication: 'ALTIL_SESSION', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: ['tenant.write'], scope: 'PLATFORM', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialCatalogueRoutes.ts · POST /catalogue/relationships',
    limitations: ['Catalogue-wide write requires a GLOBAL Super Admin grant, exact one-use owner approval, Idempotency-Key and atomic audit.'],
  },
  {
    id: 'commercial.reseller-authorizations.read', domain: 'Commercial', name: 'Read explicit reseller product authorizations',
    description: 'Reads product resale grants involving an organization visible in the caller’s billing scope.', method: 'GET', route: '/api/v1/commercial/reseller-authorizations',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['billing.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialCatalogueRoutes.ts · GET /reseller-authorizations',
  },
  {
    id: 'commercial.reseller-authorizations.create', domain: 'Commercial', name: 'Authorize reseller product sales',
    description: 'Grants a directly related reseller authority to sell one product for an explicit effective period.', method: 'POST', route: '/api/v1/commercial/reseller-authorizations',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.write'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialCatalogueRoutes.ts · POST /reseller-authorizations',
    limitations: ['The owner must be within the explicit Introsoft organization tree; the reseller must be an explicit related child; an exact one-use owner approval and Idempotency-Key are required.'],
  },
  {
    id: 'commercial.reseller-pricing.read', domain: 'Commercial', name: 'Read effective reseller prices',
    description: 'Returns reseller cost, minimum price, and recommended customer price only for active product resale authorizations in the caller’s visible scope.', method: 'GET', route: '/api/v1/commercial/reseller-pricing',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['billing.read'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialCatalogueRoutes.ts · GET /reseller-pricing',
  },
  {
    id: 'commercial.reseller-pricing.create', domain: 'Commercial', name: 'Create an effective reseller price version',
    description: 'Creates a currency-matched reseller cost, minimum customer price, and recommended markup version covered by an active resale authorization.', method: 'POST', route: '/api/v1/commercial/reseller-pricing',
    authentication: 'ALTIL_SESSION', requiredRoles: [], requiredPermissions: ['tenant.write'], scope: 'ORGANISATION', status: 'IMPLEMENTED',
    ui: [], source: 'src/routes/commercialCatalogueRoutes.ts · POST /reseller-pricing',
    limitations: ['Price versions are owner-approved, effective-dated and audited; FX is not inferred and no order is created in B1.'],
  },
]);

export interface CapabilityActor {
  readonly roles: readonly string[];
  readonly authorization?: AuthorizationContext;
}

function actorCanInvoke(capability: CapabilityDefinition, actor: CapabilityActor): boolean {
  if (capability.authentication === 'PUBLIC') return true;
  if (capability.authentication === 'TENANT_API_KEY') return false;

  const context = actor.authorization;
  if (capability.scope === 'ORGANISATION' && !context?.visibleOrganizationIds.size) return false;
  return context?.grants.some(grant => {
    if (!capability.requiredPermissions.every(permission => grant.permissions.includes(permission))) return false;
    if (capability.scope === 'ORGANISATION' && grant.visibleOrganizationIds.size === 0) return false;
    if (!capability.requiredRoles.length) return true;
    return capability.requiredRoles.some(role => actor.roles.includes(role)
      && grant.role === role
      && (role !== 'SUPER_ADMIN' || grant.visibility === 'GLOBAL'));
  }) === true;
}

export function capabilitiesForActor(actor: CapabilityActor): Array<CapabilityDefinition & { availableToCurrentIdentity: boolean | null }> {
  return capabilityRegistry.map(capability => ({
    ...capability,
    availableToCurrentIdentity: capability.authentication === 'TENANT_API_KEY'
      ? null
      : actorCanInvoke(capability, actor),
  }));
}
