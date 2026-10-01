import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseDate, databaseStatus, mapDsarRow, mapDsarStatus, statutoryBasis } from './dsarPersistenceMapping';

test('DSAR persistence maps the application lifecycle states to the statutory database states', () => {
  assert.equal(databaseStatus('pending'), 'NEW');
  assert.equal(databaseStatus('in_progress'), 'PROCESSING');
  assert.equal(databaseStatus('fulfilled'), 'FULFILLED');
  assert.equal(databaseStatus('rejected'), 'REJECTED');
  assert.equal(mapDsarStatus('IDENTITY_VERIFIED'), 'in_progress');
});

test('DSAR persistence records the applicable statutory basis for POPIA and GDPR requests', () => {
  assert.equal(statutoryBasis('POPIA', 'access'), 'POPIA_SECTION_23');
  assert.equal(statutoryBasis('POPIA', 'rectification'), 'POPIA_SECTION_24');
  assert.equal(statutoryBasis('GDPR', 'erasure'), 'GDPR_ARTICLE_17');
  assert.equal(statutoryBasis('GDPR', 'portability'), 'GDPR_ARTICLE_20');
});

test('DSAR retrieval restores the complete current API shape from the durable columns', () => {
  assert.deepEqual(mapDsarRow({
    id: 'dsar-local-test', tenant_id: 'tenant-test', framework: 'GDPR', request_type: 'ERASURE',
    data_subject_ref: 'masked-reference', requestor_name: 'Synthetic Subject', app_id: 'app-test',
    status: 'PROCESSING', created_at: '2026-09-30 10:00:00', due_date: '2026-10-30', notes: 'Synthetic note',
  }), {
    id: 'dsar-local-test', tenantId: 'tenant-test', framework: 'GDPR', requestType: 'erasure',
    subjectIdentifier: 'masked-reference', requestorName: 'Synthetic Subject', appId: 'app-test',
    status: 'in_progress', createdAt: '2026-09-30 10:00:00', dueAt: '2026-10-30', notes: 'Synthetic note',
  });
});

test('DSAR date serialization rejects invalid or absent dates before database writes', () => {
  assert.equal(databaseDate('2026-10-01 10:30:00', 'createdAt'), '2026-10-01');
  assert.throws(() => databaseDate('', 'dueAt'), /valid YYYY-MM-DD/);
  assert.throws(() => databaseDate('not-a-date', 'dueAt'), /valid YYYY-MM-DD/);
  assert.throws(() => databaseDate('2026-02-31', 'dueAt'), /valid YYYY-MM-DD/);
});
