import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allowsInMemoryIamFallback,
  persistAuthenticationSession,
  resolveAuthenticationRecord,
  resolveAuthenticationSession,
} from './authenticationBoundary.ts';

describe('production authentication boundary', () => {
  it('allows test fixtures and explicitly enabled development demo identities', () => {
    assert.equal(allowsInMemoryIamFallback({ NODE_ENV: 'test' }), true);
    assert.equal(allowsInMemoryIamFallback({ NODE_ENV: 'development' }), false);
    assert.equal(allowsInMemoryIamFallback({ NODE_ENV: 'development', ALTIL_ENABLE_DEMO_IAM_FALLBACK: 'true' }), true);
  });

  it('can resolve in-memory fixtures in the explicit test runtime', async () => {
    let fallbackCalled = false;
    const result = await resolveAuthenticationRecord({
      env: { NODE_ENV: 'test' },
      databaseAvailable: false,
      databaseLookup: async () => null,
      memoryLookup: () => { fallbackCalled = true; return { id: 'synthetic-test-user' }; },
    });
    assert.deepEqual(result, { id: 'synthetic-test-user' });
    assert.equal(fallbackCalled, true);
  });

  it('never enables demo identities in production, even if the development flag is set', () => {
    assert.equal(allowsInMemoryIamFallback({ NODE_ENV: 'production', ALTIL_ENABLE_DEMO_IAM_FALLBACK: 'true' }), false);
  });

  it('does not use an in-memory identity after production database failure', async () => {
    let fallbackCalled = false;
    const result = await resolveAuthenticationRecord({
      env: { NODE_ENV: 'production' },
      databaseAvailable: true,
      databaseLookup: async () => { throw new Error('synthetic database failure'); },
      memoryLookup: () => { fallbackCalled = true; return { id: 'demo' }; },
    });
    assert.equal(result, null);
    assert.equal(fallbackCalled, false);
  });

  it('does not treat a successful database miss as a development fallback', async () => {
    let fallbackCalled = false;
    const result = await resolveAuthenticationRecord({
      env: { NODE_ENV: 'development', ALTIL_ENABLE_DEMO_IAM_FALLBACK: 'true' },
      databaseAvailable: true,
      databaseLookup: async () => null,
      memoryLookup: () => { fallbackCalled = true; return { id: 'demo' }; },
    });
    assert.equal(result, null);
    assert.equal(fallbackCalled, false);
  });

  it('does not use a production in-memory session after a database failure or miss', async () => {
    let fallbackCalled = false;
    const result = await resolveAuthenticationSession({
      env: { NODE_ENV: 'production' },
      databaseAvailable: true,
      databaseLookup: async () => { throw new Error('synthetic database failure'); },
      memoryLookup: () => { fallbackCalled = true; return { id: 'session' }; },
    });
    assert.equal(result, null);
    assert.equal(fallbackCalled, false);
  });

  it('does not use a production in-memory session after a successful database miss', async () => {
    let fallbackCalled = false;
    const result = await resolveAuthenticationSession({
      env: { NODE_ENV: 'production' },
      databaseAvailable: true,
      databaseLookup: async () => null,
      memoryLookup: () => { fallbackCalled = true; return { id: 'session' }; },
    });
    assert.equal(result, null);
    assert.equal(fallbackCalled, false);
  });

  it('fails production session creation when the database is unavailable', async () => {
    let memoryWriteCalled = false;
    await assert.rejects(() => persistAuthenticationSession({
      env: { NODE_ENV: 'production' },
      databaseAvailable: false,
      persist: async () => undefined,
      memoryPersist: () => { memoryWriteCalled = true; return { id: 'session' }; },
    }), /session storage is unavailable/i);
    assert.equal(memoryWriteCalled, false);
  });

  it('fails production session creation after a database write error without memory fallback', async () => {
    let memoryWriteCalled = false;
    await assert.rejects(() => persistAuthenticationSession({
      env: { NODE_ENV: 'production' },
      databaseAvailable: true,
      persist: async () => { throw new Error('synthetic database failure'); },
      memoryPersist: () => { memoryWriteCalled = true; return { id: 'session' }; },
    }), /session storage is unavailable/i);
    assert.equal(memoryWriteCalled, false);
  });

  it('retains explicitly permitted test session persistence', async () => {
    const result = await persistAuthenticationSession({
      env: { NODE_ENV: 'test' },
      databaseAvailable: false,
      persist: async () => undefined,
      memoryPersist: () => ({ id: 'synthetic-test-session' }),
    });
    assert.deepEqual(result, { id: 'synthetic-test-session' });
  });
});
