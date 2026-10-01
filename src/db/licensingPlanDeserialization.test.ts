import assert from 'node:assert/strict';
import test from 'node:test';
import { deserializeLicensingPlanRows } from './mariadb';
import { INITIAL_LICENSING_PLANS } from '../data/licensingData';

const baseRow = {
  id: 'plan-test',
  name: 'Test plan',
  pricing_model: 'hybrid_base_metered',
  currency: 'ZAR',
  base_price: '125',
  billing_cycle: 'Monthly',
  included_transactions_quota: '5000',
  overage_rate_per_1k: '0.02',
  grace_period_days: '10',
  enforcement_rule: 'soft_warning',
  created_at: '2026-09-30T12:00:00.000Z',
};

test('deserializes licensing plan metadata returned as a JSON string', () => {
  const [plan] = deserializeLicensingPlanRows([{ ...baseRow, metadata_json: '{"applicationId":"app-string","features":["string-feature"]}' }]);
  assert.equal(plan.id, 'plan-test');
  assert.equal(plan.applicationId, 'app-string');
  assert.deepEqual(plan.features, ['string-feature']);
  assert.equal(plan.basePrice, 125);
  assert.equal(plan.currency, 'ZAR');
});

test('deserializes licensing plan metadata from a UTF-8 Buffer', () => {
  const metadata = Buffer.from('{"applicationName":"Buffer application","isPublished":false}', 'utf8');
  const [plan] = deserializeLicensingPlanRows([{ ...baseRow, metadata_json: metadata }]);
  assert.equal(plan.applicationName, 'Buffer application');
  assert.equal(plan.isPublished, false);
});

test('uses already-materialized metadata objects and arrays as-is', () => {
  const metadata = { applicationId: 'app-object', maxUsersAllowed: 23, features: ['object-feature'] };
  const [objectPlan] = deserializeLicensingPlanRows([{ ...baseRow, metadata_json: metadata }]);
  assert.equal(objectPlan.applicationId, 'app-object');
  assert.equal(objectPlan.maxUsersAllowed, 23);
  assert.deepEqual(objectPlan.features, ['object-feature']);

  const [arrayPlan] = deserializeLicensingPlanRows([{ ...baseRow, metadata_json: [{ arrayMetadata: true }] }]);
  assert.deepEqual((arrayPlan as unknown as Record<string, unknown>)['0'], { arrayMetadata: true });
});

test('malformed licensing metadata preserves the initial-plan fallback instead of rejecting the read', () => {
  const errors: unknown[] = [];
  const plans = deserializeLicensingPlanRows([{ ...baseRow, metadata_json: '{malformed' }], error => errors.push(error));
  assert.deepEqual(plans, INITIAL_LICENSING_PLANS);
  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof SyntaxError);
});

test('null, undefined, and empty licensing metadata use the existing default plan shape', () => {
  for (const metadata_json of [null, undefined, '']) {
    const [plan] = deserializeLicensingPlanRows([{ ...baseRow, metadata_json }]);
    assert.equal(plan.id, 'plan-test');
    assert.equal(plan.applicationId, 'all');
    assert.equal(plan.applicationName, 'All AI Platform Applications');
    assert.deepEqual(plan.features, ['24/7 SLA Guarantee', 'POPIA Redactor', 'Multi-Model Fallback']);
    assert.equal(plan.isPublished, true);
    assert.equal(plan.createdDate, '2026-09-30');
  }
});
