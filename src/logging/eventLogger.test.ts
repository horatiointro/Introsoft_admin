import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { configureEventLogger, emitAltilEvent, runWithEventRequestId } from './eventLogger.ts';

test('LOCAL E2E logger persists the same event to its database sink and structured file', async () => {
  const testRunId = `logger-test-${randomUUID()}`;
  const filePath = path.resolve('.altil-data', 'logs', `events-${testRunId}.ndjson`);
  await mkdir(path.dirname(filePath), { recursive: true });
  const persisted: unknown[] = [];
  configureEventLogger({ environment: 'local-test', testRunId, localLogFile: filePath, persist: async event => { persisted.push(event); } });
  try {
    const correlatedRequestId = randomUUID();
    const emitted = await runWithEventRequestId(correlatedRequestId, () => emitAltilEvent({ category: 'AUDIT', action: 'customer.create', resourceType: 'customer', resourceId: 'synthetic-customer', outcome: 'SUCCESS' }));
    const fileEvents = (await readFile(filePath, 'utf8')).trim().split(/\r?\n/).map(line => JSON.parse(line));
    assert.equal(persisted.length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(persisted[0])), JSON.parse(JSON.stringify(emitted)));
    assert.deepEqual(fileEvents, [JSON.parse(JSON.stringify(emitted))]);
    assert.equal(emitted.testRunId, testRunId);
    assert.equal(emitted.requestId, correlatedRequestId);
  } finally {
    configureEventLogger({ environment: 'development' });
    await rm(filePath, { force: true });
  }
});

test('local test logger rejects a log path outside the ignored data directory', () => {
  assert.throws(() => configureEventLogger({ environment: 'local-test', testRunId: 'valid-run-id', localLogFile: path.resolve('logs', 'unsafe.ndjson'), persist: async () => undefined }), /under .altil-data\/logs/);
  configureEventLogger({ environment: 'development' });
});
