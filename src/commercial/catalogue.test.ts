import test from 'node:test';
import assert from 'node:assert/strict';
import { hasEffectiveResaleGrant, isEffectiveAt, recommendedCustomerPrice, validateProductRelationship, validateResellerPrice } from './catalogue.ts';

const period = { effectiveFrom: '2026-01-01T00:00:00.000Z', effectiveTo: '2027-01-01T00:00:00.000Z' };

test('recommendations require an explicit explanation and bundle membership requires a bundle parent', () => {
  assert.ok(validateProductRelationship({ sourceProductId: 'a', targetProductId: 'b', relationshipType: 'RECOMMENDS', quantity: 1, ...period, sourceIsBundle: false, targetIsBundle: false }).some(error => error.includes('explanation')));
  assert.ok(validateProductRelationship({ sourceProductId: 'a', targetProductId: 'b', relationshipType: 'BUNDLE_MEMBER', quantity: 1, ...period, sourceIsBundle: false, targetIsBundle: false }).some(error => error.includes('bundle')));
  assert.deepEqual(validateProductRelationship({ sourceProductId: 'bundle-a', targetProductId: 'item-b', relationshipType: 'BUNDLE_MEMBER', quantity: 2, ...period, sourceIsBundle: true, targetIsBundle: false }), []);
});

test('product relationship intervals are half-open and reject self-links or invalid quantity', () => {
  assert.equal(isEffectiveAt(period.effectiveFrom, period.effectiveTo, new Date('2027-01-01T00:00:00.000Z')), false);
  assert.ok(validateProductRelationship({ sourceProductId: 'same', targetProductId: 'same', relationshipType: 'ADD_ON', quantity: 0, ...period, sourceIsBundle: false, targetIsBundle: false }).length >= 2);
});

test('reseller pricing is validated and recommended customer price is computed from reseller cost', () => {
  assert.deepEqual(validateResellerPrice({ currency: 'ZAR', resellerCost: 800, minimumCustomerPrice: 900, recommendedMarkupPercent: 25, ...period }), []);
  assert.equal(recommendedCustomerPrice(800, 25), 1000);
  assert.ok(validateResellerPrice({ currency: 'ZAR', resellerCost: 800, minimumCustomerPrice: 700, recommendedMarkupPercent: 501, ...period }).length >= 2);
});

test('catalogue visibility never becomes resale permission without an exact effective organization/product grant', () => {
  const grants = [{ resellerOrganizationId: 'reseller-a', productId: 'prod-a', status: 'ACTIVE', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: null }];
  const asOf = new Date('2026-06-01T00:00:00Z');
  assert.equal(hasEffectiveResaleGrant({ resellerOrganizationId: 'reseller-a', productId: 'prod-a', grants, asOf }), true);
  assert.equal(hasEffectiveResaleGrant({ resellerOrganizationId: 'reseller-a', productId: 'prod-b', grants, asOf }), false);
  assert.equal(hasEffectiveResaleGrant({ resellerOrganizationId: 'reseller-b', productId: 'prod-a', grants, asOf }), false);
  assert.equal(hasEffectiveResaleGrant({ resellerOrganizationId: 'reseller-a', productId: 'prod-a', grants: [{ ...grants[0], status: 'EXPIRED', effectiveTo: '2026-05-01T00:00:00Z' }], asOf }), false);
});
