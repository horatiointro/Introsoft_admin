import { CREDENTIAL_SCOPE_REGISTRY } from './credentialScopeAuthority.ts';

const KEY_SCOPES = new Set(Object.values(CREDENTIAL_SCOPE_REGISTRY).filter(definition => definition.status === 'RUNTIME_ENFORCED').map(definition => definition.scope));
const APPLICATION_STATUSES = new Set(['active', 'suspended', 'revoked']);
const APPLICATION_ENVIRONMENTS = new Set(['production', 'staging', 'development']);

export function validateApplicationProfileUpdate(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  if ('id' in body || 'customerId' in body || 'tenantId' in body || 'parentApplicationId' in body || 'applicationType' in body || 'functionIdentifier' in body) return null;
  const allowed = new Set(['name', 'appIdentifier', 'description', 'status', 'environment', 'allowedCapabilities', 'rateLimitRpm', 'quotaMonthlyRequests', 'assignedPolicyIds', 'contactEmail']);
  if (Object.keys(body).some(key => !allowed.has(key))) return null;
  const result: Record<string, unknown> = {};
  if ('name' in body) { if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) return null; result.name = body.name.trim(); }
  if ('appIdentifier' in body) { if (typeof body.appIdentifier !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(body.appIdentifier)) return null; result.appIdentifier = body.appIdentifier; }
  if ('description' in body) { if (typeof body.description !== 'string' || body.description.length > 2000) return null; result.description = body.description; }
  if ('status' in body) { if (typeof body.status !== 'string' || !APPLICATION_STATUSES.has(body.status)) return null; result.status = body.status; }
  if ('environment' in body) { if (typeof body.environment !== 'string' || !APPLICATION_ENVIRONMENTS.has(body.environment)) return null; result.environment = body.environment; }
  if ('allowedCapabilities' in body) { if (!stringList(body.allowedCapabilities, 50, 100)) return null; result.allowedCapabilities = [...new Set(body.allowedCapabilities as string[])]; }
  if ('assignedPolicyIds' in body) { if (!stringList(body.assignedPolicyIds, 50, 128)) return null; result.assignedPolicyIds = [...new Set(body.assignedPolicyIds as string[])]; }
  if ('rateLimitRpm' in body) { if (!positiveInteger(body.rateLimitRpm, 1_000_000)) return null; result.rateLimitRpm = body.rateLimitRpm; }
  if ('quotaMonthlyRequests' in body) { if (!positiveInteger(body.quotaMonthlyRequests, 1_000_000_000)) return null; result.quotaMonthlyRequests = body.quotaMonthlyRequests; }
  if ('contactEmail' in body) { if (typeof body.contactEmail !== 'string' || body.contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail)) return null; result.contactEmail = body.contactEmail; }
  return result;
}

export function validateApiKeyRestrictions(input: { scopes?: unknown; ipWhitelist?: unknown; expiresAt?: unknown; rateLimitRpm?: unknown }): { scopes: string[]; ipWhitelist: string[]; expiresAt: string | null; rateLimitRpm: number } | null {
  const scopes = input.scopes === undefined ? ['read:inference'] : input.scopes;
  const ipWhitelist = input.ipWhitelist === undefined ? [] : input.ipWhitelist;
  if (!Array.isArray(scopes) || scopes.length < 1 || scopes.length > KEY_SCOPES.size || scopes.some(scope => typeof scope !== 'string' || !KEY_SCOPES.has(scope))) return null;
  if (!Array.isArray(ipWhitelist) || ipWhitelist.length > 100 || ipWhitelist.some(ip => typeof ip !== 'string' || ip.length > 64 || !/^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/.test(ip))) return null;
  const rateLimitRpm = input.rateLimitRpm === undefined ? 120 : input.rateLimitRpm;
  if (!positiveInteger(rateLimitRpm, 1_000_000)) return null;
  let expiresAt: string | null = null;
  if (input.expiresAt !== undefined && input.expiresAt !== null && input.expiresAt !== '') {
    if (typeof input.expiresAt !== 'string' || !Number.isFinite(Date.parse(input.expiresAt)) || Date.parse(input.expiresAt) <= Date.now()) return null;
    expiresAt = new Date(input.expiresAt).toISOString();
  }
  return { scopes: [...new Set(scopes as string[])], ipWhitelist: [...new Set(ipWhitelist as string[])], expiresAt, rateLimitRpm };
}

export function apiKeyHasScope(scopes: readonly string[] | undefined, requiredScope: string): boolean {
  return Array.isArray(scopes) && scopes.includes(requiredScope);
}

function stringList(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every(item => typeof item === 'string' && item.trim().length > 0 && item.length <= maxLength);
}
function positiveInteger(value: unknown, max: number): value is number { return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= max; }
