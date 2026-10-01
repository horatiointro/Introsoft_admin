import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrchestrationResponse } from './orchestrationResponse.ts';

test('keeps gateway metrics unavailable when a successful response omits measurements', () => {
  const result = normalizeOrchestrationResponse({
    httpOk: true,
    attemptedAt: '2026-09-29T10:00:00.000Z',
    payload: { success: true, output: 'done' },
  });

  assert.equal(result.completed, true);
  assert.equal(result.response.metricsAvailable, false);
  assert.equal(result.response.durationSeconds, 0);
  assert.equal(result.response.tokensConsumed, 0);
  assert.equal(result.response.executedProvider, 'UNAVAILABLE');
  assert.equal(result.response.executedModel, 'UNAVAILABLE');
});

test('retains only metrics actually supplied by a successful gateway response', () => {
  const result = normalizeOrchestrationResponse({
    httpOk: true,
    payload: {
      success: true,
      status: 'SUCCESS',
      requestId: 'req-local-1',
      executedProvider: 'provider-a',
      executedModel: 'model-a',
      durationSeconds: 0.42,
      totalTokens: { input: 12, output: 8 },
      output: 'done',
    },
  });

  assert.equal(result.completed, true);
  assert.equal(result.response.metricsAvailable, true);
  assert.equal(result.response.durationSeconds, 0.42);
  assert.equal(result.response.tokensConsumed, 20);
  assert.equal(result.response.executedProvider, 'provider-a');
  assert.equal(result.response.executedModel, 'model-a');
});

test('does not report provider execution or metrics for an error response', () => {
  const result = normalizeOrchestrationResponse({
    httpOk: false,
    payload: {
      status: 'ERROR',
      error: { message: 'denied' },
      executedProvider: 'provider-a',
      executedModel: 'model-a',
      durationSeconds: 0.42,
      tokensConsumed: 20,
    },
  });

  assert.equal(result.completed, false);
  assert.equal(result.response.status, 'ERROR');
  assert.equal(result.response.metricsAvailable, false);
  assert.equal(result.response.executedProvider, 'UNAVAILABLE');
  assert.equal(result.response.executedModel, 'UNAVAILABLE');
  assert.equal(result.response.output, 'denied');
});
