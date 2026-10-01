import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnonymousDiagnosticRateLimiter, parseAnonymousDiagnostic } from './anonymousDiagnostic.ts';

test('anonymous diagnostic accepts only bounded enumerated fields', () => {
  assert.deepEqual(parseAnonymousDiagnostic({ code: 'UI_RENDER_ERROR', component: 'Login.Screen' }), { code: 'UI_RENDER_ERROR', component: 'Login.Screen' });
  assert.equal(parseAnonymousDiagnostic({ code: 'UI_RENDER_ERROR', message: 'free-form content' }), null);
  assert.equal(parseAnonymousDiagnostic({ code: 'unknown' }), null);
  assert.equal(parseAnonymousDiagnostic({ code: 'CLIENT_RUNTIME_ERROR', component: '../private/path' }), null);
  assert.equal(parseAnonymousDiagnostic('not an object'), null);
});

test('anonymous diagnostic limiter enforces a window and bounds client cardinality', () => {
  const limit = createAnonymousDiagnosticRateLimiter({ maxRequests: 2, windowMs: 100, maxClients: 1 });
  assert.equal(limit('client-a', 0), true);
  assert.equal(limit('client-a', 1), true);
  assert.equal(limit('client-a', 2), false);
  assert.equal(limit('client-b', 3), false);
  assert.equal(limit('client-a', 101), true);
});
