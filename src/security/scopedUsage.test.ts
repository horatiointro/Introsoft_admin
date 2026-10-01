import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeScopedUsage, type TenantUsageActivity } from './scopedUsage.ts';

const activity = (overrides: Partial<TenantUsageActivity> = {}): TenantUsageActivity => ({
  totalRequests: 4,
  totalInputTokens: 10,
  totalOutputTokens: 7,
  capabilities: { reasoning: 3 },
  applications: { appA: 4 },
  models: { 'model-a': 4 },
  lastSeenAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

describe('scoped usage aggregation', () => {
  it('aggregates only activities inside resolved organization scope', () => {
    const result = summarizeScopedUsage([
      ['tenant-a', activity()],
      ['tenant-child', activity({ totalRequests: 2, totalInputTokens: 5, totalOutputTokens: 2, capabilities: { reasoning: 1, embedding: 1 }, applications: { appB: 2 }, models: { 'model-b': 2 }, lastSeenAt: '2026-09-02T10:00:00.000Z' })],
      ['tenant-sibling', activity({ totalRequests: 900 })],
    ], new Set(['tenant-a', 'tenant-child']));

    assert.deepEqual(result, {
      tenantCount: 2,
      requests: 6,
      inputTokens: 15,
      outputTokens: 9,
      byCapability: { reasoning: 4, embedding: 1 },
      byApplication: { appA: 4, appB: 2 },
      byModel: { 'model-a': 4, 'model-b': 2 },
      lastRequestAt: '2026-09-02T10:00:00.000Z',
    });
  });

  it('returns unavailable rather than zero when no scoped activity rows exist', () => {
    assert.equal(summarizeScopedUsage([['other-tenant', activity()]], new Set(['tenant-a'])), null);
    assert.equal(summarizeScopedUsage([], new Set(['tenant-a'])), null);
  });

  it('ignores invalid or negative per-key counts', () => {
    const result = summarizeScopedUsage([['tenant-a', activity({ capabilities: { valid: 2, bad: Number.NaN, negative: -3 } })]], new Set(['tenant-a']));
    assert.deepEqual(result?.byCapability, { valid: 2 });
  });
});
