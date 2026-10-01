import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ComplianceRepository } from './complianceRepository';
import { executeQuery, getMariaDbPool, setDatabaseConnected, testAndInitMariaDb } from './mariadb';
import type { DataSubjectRequest } from '../types';

const createdIds: string[] = [];
let tenantId = '';

function request(id: string, overrides: Partial<DataSubjectRequest> = {}): DataSubjectRequest {
  const now = new Date();
  const due = new Date(now.getTime() + 30 * 86400000);
  const asSqlDateTime = (date: Date) => date.toISOString().replace('T', ' ').slice(0, 19);
  return {
    id, tenantId, framework: 'POPIA', requestType: 'access', subjectIdentifier: 'MASKED-SYNTHETIC-E2E-REF',
    requestorName: 'Synthetic E2E Data Subject', appId: 'e2e-test-application', status: 'pending',
    createdAt: asSqlDateTime(now), dueAt: asSqlDateTime(due), notes: 'Synthetic database persistence test.',
    ...overrides,
  };
}

before(async () => {
  assert.equal(process.env.ALTIL_LOCAL_E2E, 'true');
  assert.equal(process.env.ALTIL_LOCAL_E2E_DATABASE, 'altil_e2e_test');
  assert.equal(process.env.MARIADB_HOST, '127.0.0.1');
  assert.equal(process.env.MARIADB_DATABASE, 'altil_e2e_test');
  const database = await testAndInitMariaDb();
  assert.equal(database.connected, true, 'isolated test database must be reachable and migrated');
  const tenants = await executeQuery<{ id: string }>('SELECT id FROM tenants ORDER BY id LIMIT 1');
  assert.ok(tenants[0]?.id, 'the isolated test database must contain a tenant for the real tenant foreign key');
  tenantId = tenants[0].id;
});

after(async () => {
  if (tenantId) {
    for (const id of createdIds) {
      await executeQuery('DELETE FROM compliance_dsar_requests WHERE id = ?', [id]);
    }
  }
  setDatabaseConnected(false);
  await getMariaDbPool().end();
});

test('persists a DSAR transactionally and retrieves the same durable record', async () => {
  const id = `dsar-e2e-${randomUUID()}`;
  createdIds.push(id);
  const saved = await ComplianceRepository.saveDsarRequest(request(id));
  assert.equal(saved.id, id);
  assert.equal(saved.status, 'pending');
  const rows = await ComplianceRepository.getDsarRequests(tenantId);
  assert.deepEqual(rows.find(row => row.id === id), saved);
  const durable = await executeQuery<{ count: number }>('SELECT COUNT(*) AS count FROM compliance_dsar_requests WHERE id = ?', [id]);
  assert.equal(Number(durable[0]?.count), 1);
});

test('retries with the same DSAR id update one row and are safely repeatable', async () => {
  const id = `dsar-e2e-${randomUUID()}`;
  createdIds.push(id);
  await ComplianceRepository.saveDsarRequest(request(id));
  const update = request(id, { status: 'in_progress', notes: 'Synthetic retried update.' });
  const first = await ComplianceRepository.saveDsarRequest(update);
  const second = await ComplianceRepository.saveDsarRequest(update);
  assert.equal(first.status, 'in_progress');
  assert.equal(second.status, 'in_progress');
  const rows = await executeQuery<{ count: number }>('SELECT COUNT(*) AS count FROM compliance_dsar_requests WHERE id = ?', [id]);
  assert.equal(Number(rows[0]?.count), 1);
});

test('a real tenant foreign-key failure rolls back the DSAR and returns an error', async () => {
  const id = `dsar-e2e-${randomUUID()}`;
  createdIds.push(id);
  await assert.rejects(
    ComplianceRepository.saveDsarRequest(request(id, { tenantId: `missing-${randomUUID()}`.slice(0, 64) })),
  );
  const rows = await executeQuery<{ count: number }>('SELECT COUNT(*) AS count FROM compliance_dsar_requests WHERE id = ?', [id]);
  assert.equal(Number(rows[0]?.count), 0);
  assert.equal((await ComplianceRepository.getDsarRequests('all')).some(row => row.id === id), false);
});

test('DSAR reads and writes fail closed when MariaDB is unavailable', async () => {
  setDatabaseConnected(false);
  await assert.rejects(ComplianceRepository.getDsarRequests(), /persistence is unavailable/);
  await assert.rejects(ComplianceRepository.saveDsarRequest(request(`dsar-e2e-${randomUUID()}`)), /persistence is unavailable/);
  setDatabaseConnected(true);
});
