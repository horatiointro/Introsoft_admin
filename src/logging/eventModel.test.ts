import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAltilEvent } from './eventModel.ts';

test('shared event model tags local runs and never adds a testRunId to production events', () => {
  const local = makeAltilEvent({ category: 'API_REQUEST', action: 'GET /api/v1/customers', outcome: 'SUCCESS' }, { environment: 'local-test', testRunId: 'local-e2e-run-0001' });
  const production = makeAltilEvent({ category: 'API_REQUEST', action: 'GET /api/v1/customers', outcome: 'SUCCESS' }, { environment: 'production', testRunId: 'should-not-appear' });
  assert.equal(local.environment, 'local-test');
  assert.equal(local.testRunId, 'local-e2e-run-0001');
  assert.match(local.id, /^[0-9a-f-]{36}$/i);
  assert.match(local.requestId, /^[0-9a-f-]{36}$/i);
  assert.equal(production.environment, 'production');
  assert.equal(production.testRunId, undefined);
});

test('event model bounds and strips control characters from displayed fields', () => {
  const event = makeAltilEvent({ category: 'AUTHORIZATION', action: `deny\n${'x'.repeat(180)}`, outcome: 'DENIED', reason: 'scope\rblocked' }, { environment: 'development' });
  assert.equal(event.action.length, 128);
  assert.equal(event.action.includes('\n'), false);
  assert.equal(event.reason, 'scope blocked');
});
