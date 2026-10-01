import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiKeyHasScope, validateApiKeyRestrictions, validateApplicationProfileUpdate } from './commercialMutationValidation.ts';

test('application update accepts supported profile fields but rejects ownership and relationship reassignment', () => {
  assert.deepEqual(validateApplicationProfileUpdate({ name: 'Portal', status: 'active', assignedPolicyIds: ['policy-a'] }), { name: 'Portal', status: 'active', assignedPolicyIds: ['policy-a'] });
  assert.equal(validateApplicationProfileUpdate({ customerId: 'other-org' }), null);
  assert.equal(validateApplicationProfileUpdate({ parentApplicationId: 'other-app' }), null);
  assert.equal(validateApplicationProfileUpdate({ isSuperAdmin: true }), null);
  assert.equal(validateApplicationProfileUpdate({ rateLimitRpm: 0 }), null);
});

test('API key restrictions accept only bounded supported scopes and address restrictions', () => {
  assert.deepEqual(validateApiKeyRestrictions({ scopes: ['read:inference'], ipWhitelist: ['192.0.2.10'], rateLimitRpm: 50 }), {
    scopes: ['read:inference'], ipWhitelist: ['192.0.2.10'], expiresAt: null, rateLimitRpm: 50,
  });
  assert.equal(validateApiKeyRestrictions({ scopes: ['read:models'] }), null);
  assert.equal(validateApiKeyRestrictions({ scopes: ['write:inference'] }), null);
  assert.equal(validateApiKeyRestrictions({ scopes: ['read:capabilities'] }), null);
  assert.equal(validateApiKeyRestrictions({ scopes: ['write:telemetry'] }), null);
  assert.equal(validateApiKeyRestrictions({ scopes: ['*'] }), null);
  assert.equal(validateApiKeyRestrictions({ scopes: ['write:admin'] }), null);
  assert.equal(validateApiKeyRestrictions({ ipWhitelist: ['not-an-address'] }), null);
  assert.equal(validateApiKeyRestrictions({ rateLimitRpm: -1 }), null);
});

test('API-key inference access requires the existing inference scope', () => {
  assert.equal(apiKeyHasScope(['read:inference', 'read:models'], 'read:inference'), true);
  assert.equal(apiKeyHasScope(['read:models'], 'read:inference'), false);
  assert.equal(apiKeyHasScope(undefined, 'read:inference'), false);
});
