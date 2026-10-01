export type CommercialOrganizationType = 'INTROSOFT' | 'SUBSIDIARY' | 'PARTNER' | 'RESELLER';
export type CommercialCustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface CommercialCustomerInput {
  customerType: CommercialCustomerType;
  displayName: string;
  companyName?: string | null;
  individualGivenName?: string | null;
  individualFamilyName?: string | null;
}

export interface CommercialScopeGrant {
  role: string;
  visibility: string;
  permissions: readonly string[];
  visibleOrganizationIds: ReadonlySet<string>;
}

export interface CommercialOrganizationTenantScope {
  organizationId: string;
  tenantId: string;
  effectiveFrom: string | Date;
  effectiveTo: string | Date | null;
}

export const COMMERCIAL_SCOPE_LINK_TYPES = Object.freeze(['PRIMARY', 'PRODUCTION', 'SANDBOX', 'DEVELOPMENT'] as const);

/** Effective intervals are half-open; touching endpoints are valid, intersections are not. */
export function hasOverlappingTenantScope(input: {
  tenantId: string;
  effectiveFrom: string | Date;
  effectiveTo: string | Date | null;
  existing: readonly CommercialOrganizationTenantScope[];
}): boolean {
  const timestamp = (value: string | Date) => value instanceof Date ? value.getTime() : Date.parse(value);
  const start = timestamp(input.effectiveFrom);
  const end = input.effectiveTo === null ? Number.POSITIVE_INFINITY : timestamp(input.effectiveTo);
  if (!Number.isFinite(start) || (input.effectiveTo !== null && (!Number.isFinite(end) || end <= start))) return true;
  return input.existing.some(scope => {
    if (scope.tenantId !== input.tenantId) return false;
    const otherStart = timestamp(scope.effectiveFrom);
    const otherEnd = scope.effectiveTo === null ? Number.POSITIVE_INFINITY : timestamp(scope.effectiveTo);
    return Number.isFinite(otherStart) && otherEnd > start && end > otherStart;
  });
}

/** Resolves commercial visibility only through existing IAM grants plus explicit tenant-scope links. */
export function resolveCommercialOrganizationScope(input: {
  grants: readonly CommercialScopeGrant[];
  permission: string;
  organizationIds: readonly string[];
  tenantScopes: readonly CommercialOrganizationTenantScope[];
  asOf: Date;
}): ReadonlySet<string> {
  const global = input.grants.some(grant => grant.role === 'SUPER_ADMIN' && grant.visibility === 'GLOBAL' && grant.permissions.includes(input.permission));
  if (global) return new Set(input.organizationIds);
  const authorizedOrganizations = new Set<string>();
  for (const scope of input.tenantScopes) {
    const from = new Date(scope.effectiveFrom).getTime();
    const to = scope.effectiveTo === null ? Number.POSITIVE_INFINITY : new Date(scope.effectiveTo).getTime();
    if (!Number.isFinite(from) || from > input.asOf.getTime() || to <= input.asOf.getTime()) continue;
    if (input.grants.some(grant => grant.permissions.includes(input.permission) && grant.visibleOrganizationIds.has(scope.tenantId))) authorizedOrganizations.add(scope.organizationId);
  }
  return authorizedOrganizations;
}

export function normalizeCommercialContact(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Contact details must be an object.');
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const field of ['email', 'phone', 'billingEmail'] as const) {
    const item = source[field];
    if (item !== undefined) {
      if (typeof item !== 'string' || item.length > 254) throw new Error(`Invalid ${field}.`);
      result[field] = item.trim();
    }
  }
  if (source.address !== undefined) {
    if (!source.address || typeof source.address !== 'object' || Array.isArray(source.address)) throw new Error('Invalid address.');
    const address: Record<string, string> = {};
    for (const field of ['line1', 'line2', 'city', 'region', 'postalCode', 'country'] as const) {
      const item = (source.address as Record<string, unknown>)[field];
      if (item !== undefined) {
        if (typeof item !== 'string' || item.length > 160) throw new Error(`Invalid address ${field}.`);
        address[field] = item.trim();
      }
    }
    result.address = address;
  }
  for (const field of ['billingAddress', 'registeredAddress'] as const) {
    if (source[field] !== undefined) {
      if (!source[field] || typeof source[field] !== 'object' || Array.isArray(source[field])) throw new Error(`Invalid ${field}.`);
      const address: Record<string, string> = {};
      for (const part of ['line1', 'line2', 'city', 'region', 'postalCode', 'country'] as const) {
        const item = (source[field] as Record<string, unknown>)[part];
        if (item !== undefined) {
          if (typeof item !== 'string' || item.length > 160) throw new Error(`Invalid ${field} ${part}.`);
          address[part] = item.trim();
        }
      }
      result[field] = address;
    }
  }
  if (source.notificationPreferences !== undefined) {
    if (!source.notificationPreferences || typeof source.notificationPreferences !== 'object' || Array.isArray(source.notificationPreferences)) throw new Error('Invalid notification preferences.');
    const allowedPreferences = ['invoiceEmails', 'paymentReminders', 'productUpdates'] as const;
    const preferences = source.notificationPreferences as Record<string, unknown>;
    if (Object.keys(preferences).some(key => !allowedPreferences.includes(key as typeof allowedPreferences[number])) || allowedPreferences.some(key => preferences[key] !== undefined && typeof preferences[key] !== 'boolean')) throw new Error('Notification preferences must use the supported boolean options.');
    result.notificationPreferences = Object.fromEntries(allowedPreferences.filter(key => preferences[key] !== undefined).map(key => [key, preferences[key]]));
  }
  if (source.authorizedContact !== undefined) {
    if (!source.authorizedContact || typeof source.authorizedContact !== 'object' || Array.isArray(source.authorizedContact)) throw new Error('Invalid authorized contact.');
    const contact = source.authorizedContact as Record<string, unknown>;
    if (Object.keys(contact).some(key => !['name', 'email', 'phone', 'role'].includes(key))) throw new Error('Authorized contact contains unsupported fields.');
    const normalized: Record<string, string> = {};
    for (const key of ['name', 'email', 'phone', 'role'] as const) {
      if (contact[key] !== undefined) {
        if (typeof contact[key] !== 'string' || contact[key].length > (key === 'email' ? 254 : 180)) throw new Error(`Invalid authorized contact ${key}.`);
        normalized[key] = (contact[key] as string).trim();
      }
    }
    result.authorizedContact = normalized;
  }
  return JSON.stringify(result);
}

/** Strict allowlist for profile mutations; creation retains its historical sanitizing behavior. */
export function validateCommercialContactInput(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Contact details must be an object.';
  const source = value as Record<string, unknown>;
  const allowed = new Set(['email', 'phone', 'billingEmail', 'address', 'billingAddress', 'registeredAddress', 'notificationPreferences', 'authorizedContact']);
  if (Object.keys(source).some(key => !allowed.has(key))) return 'Contact details contain unsupported fields.';
  for (const field of ['address', 'billingAddress', 'registeredAddress'] as const) {
    const address = source[field];
    if (address && typeof address === 'object' && !Array.isArray(address) && Object.keys(address as object).some(key => !['line1', 'line2', 'city', 'region', 'postalCode', 'country'].includes(key))) return `${field} contains unsupported fields.`;
  }
  const preferences = source.notificationPreferences;
  if (preferences && typeof preferences === 'object' && !Array.isArray(preferences) && Object.keys(preferences as object).some(key => !['invoiceEmails', 'paymentReminders', 'productUpdates'].includes(key))) return 'Notification preferences contain unsupported fields.';
  const authorizedContact = source.authorizedContact;
  if (authorizedContact && typeof authorizedContact === 'object' && !Array.isArray(authorizedContact) && Object.keys(authorizedContact as object).some(key => !['name', 'email', 'phone', 'role'].includes(key))) return 'Authorized contact contains unsupported fields.';
  return null;
}

export function validateCommercialOrganizationType(value: unknown): value is Exclude<CommercialOrganizationType, 'INTROSOFT'> {
  return value === 'SUBSIDIARY' || value === 'PARTNER' || value === 'RESELLER';
}

export function validateCommercialCustomer(input: CommercialCustomerInput): string[] {
  const errors: string[] = [];
  if (!['INDIVIDUAL', 'COMPANY'].includes(input.customerType)) errors.push('Customer type must be INDIVIDUAL or COMPANY.');
  if (!input.displayName?.trim()) errors.push('Display name is required.');
  if (input.customerType === 'COMPANY' && !input.companyName?.trim()) errors.push('Company name is required for a company customer.');
  if (input.customerType === 'INDIVIDUAL' && (!input.individualGivenName?.trim() || !input.individualFamilyName?.trim())) {
    errors.push('Given and family names are required for an individual customer.');
  }
  if (input.customerType === 'INDIVIDUAL' && input.companyName?.trim()) errors.push('Company fields are not accepted for an individual customer.');
  return errors;
}

export function isEffectiveAt(from: string | Date, to: string | Date | null, at: Date): boolean {
  const start = new Date(from).getTime();
  const end = to === null ? Number.POSITIVE_INFINITY : new Date(to).getTime();
  return Number.isFinite(start) && start <= at.getTime() && end > at.getTime();
}

/** True only for an explicitly stored edge; no tenant metadata or name matching is consulted. */
export function hasExplicitOrganizationEdge(edges: readonly { parentId: string; childId: string }[], parentId: string, childId: string): boolean {
  return edges.some(edge => edge.parentId === parentId && edge.childId === childId);
}
