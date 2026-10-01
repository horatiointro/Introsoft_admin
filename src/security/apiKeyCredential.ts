import { createHash } from 'node:crypto';
import type { ApiKey } from '../types.ts';
import { credentialScopeStatus } from './credentialScopeAuthority.ts';

export type StoredApiKey = ApiKey & { keyHash?: string };

/** Digests a runtime secret before it enters the in-memory or durable registry. */
export function hashApiKeySecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/** Retain only a digest for newly-issued keys; the plaintext remains in the one-time caller response. */
export function storeIssuedApiKey(records: readonly StoredApiKey[], record: ApiKey): StoredApiKey[] {
  return [{ ...record, key: '', keyHash: hashApiKeySecret(record.key) }, ...records];
}

/** Resolve exact credentials only. Prefixes are display identifiers, never authenticators. */
export function findApiKeyBySecret(secret: string, records: readonly StoredApiKey[]): ApiKey | undefined {
  if (!secret) return undefined;
  const digest = hashApiKeySecret(secret);
  const found = records.find(record => record.key === secret || record.keyHash === digest);
  return found ? { ...found, key: secret } : undefined;
}

export type RuntimeApiKeyDecision =
  | { readonly allowed: true; readonly key: ApiKey }
  | { readonly allowed: false; readonly status: 401 | 403; readonly code: 'INVALID' | 'REVOKED' | 'EXPIRED' | 'SCOPE_REQUIRED' | 'UNSUPPORTED_SCOPE' };

/** Shared runtime credential checks used before the inference handler continues. */
export function validateRuntimeApiKey(input: {
  readonly key?: ApiKey;
  readonly requiredScope?: string;
  readonly now?: number;
}): RuntimeApiKeyDecision {
  const key = input.key;
  if (!key) return { allowed: false, status: 401, code: 'INVALID' };
  if (key.status === 'revoked') return { allowed: false, status: 403, code: 'REVOKED' };
  if (key.status === 'expired') return { allowed: false, status: 403, code: 'EXPIRED' };
  if (key.status !== 'active') return { allowed: false, status: 403, code: 'REVOKED' };
  if (key.expiresAt) {
    const expiry = Date.parse(key.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= (input.now ?? Date.now())) return { allowed: false, status: 403, code: 'EXPIRED' };
  }
  if (!input.requiredScope || credentialScopeStatus(input.requiredScope) !== 'RUNTIME_ENFORCED') return { allowed: false, status: 403, code: 'UNSUPPORTED_SCOPE' };
  if (!Array.isArray(key.scopes) || !key.scopes.includes(input.requiredScope)) return { allowed: false, status: 403, code: 'SCOPE_REQUIRED' };
  return { allowed: true, key };
}
