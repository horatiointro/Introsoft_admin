import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ApiKey } from '../types.ts';
import { findApiKeyBySecret, hashApiKeySecret, storeIssuedApiKey, validateRuntimeApiKey } from './apiKeyCredential.ts';

function key(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'synthetic-key', customerId: 'org-A', appId: 'application-A', name: 'synthetic key',
    key: 'synthetic-api-key-secret', prefix: 'synthetic-prefix...', status: 'active', createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: null, rateLimitRpm: 60, scopes: ['read:inference'], ...overrides,
  };
}

describe('shared API-key credential security', () => {
  it('stores a digest and resolves only the exact secret, never its display prefix', () => {
    const stored = storeIssuedApiKey([], key());
    assert.equal(stored[0].key, '');
    assert.equal(stored[0].keyHash, hashApiKeySecret('synthetic-api-key-secret'));
    assert.equal(findApiKeyBySecret('synthetic-prefix', stored), undefined);
    assert.equal(findApiKeyBySecret('synthetic-api-key-secret', stored)?.id, 'synthetic-key');
  });

  it('requires the exact runtime scope and denies invalid, revoked, and expired keys', () => {
    assert.deepEqual(validateRuntimeApiKey({ key: undefined, requiredScope: 'read:inference' }), { allowed: false, status: 401, code: 'INVALID' });
    const wrongScope = validateRuntimeApiKey({ key: key({ scopes: ['read:models'] }), requiredScope: 'read:inference' });
    assert.equal('code' in wrongScope ? wrongScope.code : 'ALLOWED', 'SCOPE_REQUIRED');
    const revoked = validateRuntimeApiKey({ key: key({ status: 'revoked' }), requiredScope: 'read:inference' });
    assert.equal('code' in revoked ? revoked.code : 'ALLOWED', 'REVOKED');
    const expired = validateRuntimeApiKey({ key: key({ expiresAt: '2026-01-01T00:00:00.000Z' }), requiredScope: 'read:inference', now: Date.parse('2026-01-02T00:00:00.000Z') });
    assert.equal('code' in expired ? expired.code : 'ALLOWED', 'EXPIRED');
    const explicitlyExpired = validateRuntimeApiKey({ key: key({ status: 'expired', expiresAt: null }), requiredScope: 'read:inference' });
    assert.equal('code' in explicitlyExpired ? explicitlyExpired.code : 'ALLOWED', 'EXPIRED');
    const malformedExpiry = validateRuntimeApiKey({ key: key({ expiresAt: 'not-a-date' }), requiredScope: 'read:inference' });
    assert.equal('code' in malformedExpiry ? malformedExpiry.code : 'ALLOWED', 'EXPIRED');
    const expiryBoundary = validateRuntimeApiKey({ key: key({ expiresAt: '2026-01-02T00:00:00.000Z' }), requiredScope: 'read:inference', now: Date.parse('2026-01-02T00:00:00.000Z') });
    assert.equal('code' in expiryBoundary ? expiryBoundary.code : 'ALLOWED', 'EXPIRED');
    assert.equal(validateRuntimeApiKey({ key: key(), requiredScope: 'read:inference' }).allowed, true);
    assert.deepEqual(validateRuntimeApiKey({ key: key({ scopes: ['read:models'] }), requiredScope: 'read:models' }), { allowed: false, status: 403, code: 'UNSUPPORTED_SCOPE' });
    assert.deepEqual(validateRuntimeApiKey({ key: key(), requiredScope: undefined }), { allowed: false, status: 403, code: 'UNSUPPORTED_SCOPE' });
  });
});
