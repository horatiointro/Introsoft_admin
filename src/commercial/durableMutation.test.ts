import test from 'node:test';
import assert from 'node:assert/strict';
import { CommercialMutationError, runDurableCommercialMutation, type CommercialMutationSql } from './durableMutation.ts';

type RecordRow = { id: string; actor_id: string; application_key: string; operation: string; idempotency_key_hash: string; request_fingerprint: string; resource_type: string; resource_id: string | null; response_status: number | null; response_body_json: string | null; state: string; expires_at: Date };

class TransactionalMemoryDb {
  records = new Map<string, RecordRow>();
  audits: unknown[][] = [];
  resources: string[] = [];
  private tail: Promise<void> = Promise.resolve();

  async transaction<T>(work: (tx: CommercialMutationSql) => Promise<T>): Promise<T> {
    let unlock!: () => void;
    const previous = this.tail;
    this.tail = new Promise<void>(resolve => { unlock = resolve; });
    await previous;
    const snapshot = structuredClone({ records: [...this.records], audits: this.audits, resources: this.resources });
    try { return await work({ execute: (sql, params = []) => this.execute(sql, params) }); }
    catch (error) {
      this.records = new Map(snapshot.records);
      this.audits = snapshot.audits;
      this.resources = snapshot.resources;
      throw error;
    } finally { unlock(); }
  }

  private async execute(sql: string, params: unknown[]): Promise<[unknown, unknown]> {
    if (sql.startsWith('INSERT INTO commercial_idempotency_records')) {
      const [id, actor, operation, keyHash, fingerprint, resourceType] = params as string[];
      const key = `${actor}|ALTIL_CONTROL_PLANE_API|${operation}|${keyHash}`;
      if (!this.records.has(key)) {
        this.records.set(key, { id, actor_id: actor, application_key: 'ALTIL_CONTROL_PLANE_API', operation, idempotency_key_hash: keyHash, request_fingerprint: fingerprint, resource_type: resourceType, resource_id: null, response_status: null, response_body_json: null, state: 'IN_PROGRESS', expires_at: new Date(Date.now() + 86400000) });
        return [{ affectedRows: 1 }, []];
      }
      const error = new Error('Duplicate key') as Error & { code: string };
      error.code = 'ER_DUP_ENTRY';
      throw error;
    }
    if (sql.startsWith('SELECT id,request_fingerprint')) {
      const [actor, , operation, keyHash] = params as string[];
      const record = this.records.get(`${actor}|ALTIL_CONTROL_PLANE_API|${operation}|${keyHash}`);
      return [record ? [record] : [], []];
    }
    if (sql.startsWith('UPDATE commercial_idempotency_records SET request_fingerprint')) {
      const [fingerprint, resourceType, id] = params as string[];
      const record = [...this.records.values()].find(item => item.id === id)!;
      Object.assign(record, { request_fingerprint: fingerprint, resource_type: resourceType, resource_id: null, response_status: null, response_body_json: null, state: 'IN_PROGRESS', expires_at: new Date(Date.now() + 86400000) });
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('INSERT INTO audit_logs')) {
      this.audits.push(params);
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('UPDATE commercial_idempotency_records SET resource_id')) {
      const [resourceId, status, response, state, id] = params as [string | null, number, string, string, string];
      const record = [...this.records.values()].find(item => item.id === id)!;
      Object.assign(record, { resource_id: resourceId, response_status: status, response_body_json: response, state });
      return [{ affectedRows: 1 }, []];
    }
    if (sql.startsWith('INSERT INTO test_resources')) { this.resources.push(String(params[0])); return [{ affectedRows: 1 }, []]; }
    throw new Error(`Unexpected test SQL: ${sql}`);
  }
}

const input = (key: string, fingerprint: unknown = { name: 'Synthetic' }) => ({
  actorId: 'synthetic-actor', actorEmail: 'actor@example.invalid', operation: 'commercial.customer.create', resourceType: 'commercial_customer', idempotencyKey: key, fingerprintInput: fingerprint,
  audit: { category: 'AUDIT' as const, action: 'commercial.customer.create', organizationId: 'org-synthetic' },
});

test('sequential idempotent retry replays one resource and one atomic audit event', async () => {
  const db = new TransactionalMemoryDb(); let created = 0;
  const invoke = () => db.transaction(tx => runDurableCommercialMutation(tx, input('repeat-customer-key'), async () => {
    const id = `cust-${++created}`; await tx.execute('INSERT INTO test_resources VALUES (?)', [id]);
    return { statusCode: 201, resourceId: id, body: { id } };
  }));
  const first = await invoke(); const replay = await invoke();
  assert.equal(first.body.id, replay.body.id);
  assert.equal(replay.replayed, true);
  assert.equal(db.resources.length, 1);
  assert.equal(db.audits.length, 1);
});

test('concurrent identical retries converge to one resource and one audit event', async () => {
  const db = new TransactionalMemoryDb(); let created = 0;
  const invoke = () => db.transaction(tx => runDurableCommercialMutation(tx, input('concurrent-key-01'), async () => {
    const id = `cust-${++created}`; await tx.execute('INSERT INTO test_resources VALUES (?)', [id]);
    return { statusCode: 201, resourceId: id, body: { id } };
  }));
  const [first, second] = await Promise.all([invoke(), invoke()]);
  assert.equal(first.body.id, second.body.id);
  assert.equal(db.resources.length, 1);
  assert.equal(db.audits.length, 1);
});

test('reusing an idempotency key with a different fingerprint conflicts without mutation', async () => {
  const db = new TransactionalMemoryDb();
  await db.transaction(tx => runDurableCommercialMutation(tx, input('payload-key-01'), async () => ({ statusCode: 201, resourceId: 'cust-1', body: { id: 'cust-1' } })));
  await assert.rejects(db.transaction(tx => runDurableCommercialMutation(tx, input('payload-key-01', { name: 'Different' }), async () => ({ statusCode: 201, resourceId: 'cust-2', body: { id: 'cust-2' } }))), error => error instanceof CommercialMutationError && error.statusCode === 409);
  assert.equal(db.audits.length, 1);
});

test('failure during atomic audit rolls back the business mutation and leaves the claim retryable', async () => {
  const db = new TransactionalMemoryDb();
  // Exercise transaction rollback at the adapter boundary with a deterministic failing audit sink.
  await assert.rejects(db.transaction(async inner => {
    const failing = { execute: async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith('INSERT INTO audit_logs')) throw new Error('synthetic audit write failure');
      return inner.execute(sql, params);
    } } as CommercialMutationSql;
    return runDurableCommercialMutation(failing, input('rollback-key-001'), async () => {
      await inner.execute('INSERT INTO test_resources VALUES (?)', ['cust-rollback']);
      return { statusCode: 201, resourceId: 'cust-rollback', body: { id: 'cust-rollback' } };
    });
  }), /synthetic audit write failure/);
  assert.equal(db.resources.length, 0);
  assert.equal(db.audits.length, 0);
  assert.equal(db.records.size, 0);
});
