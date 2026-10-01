import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { executeQuery, getMariaDbPool, setDatabaseConnected, testAndInitMariaDb } from './mariadb';
import { recordManualInvoicePayment } from '../billing/manualInvoicePayment';

const invoices: string[] = [];
const blockers: string[] = [];
const ledgerIds = new Set<string>();
let tenantId = '';
let tenantName = '';

function jsonColumn(value: unknown): any {
  if (typeof value === 'string') return JSON.parse(value);
  if (Buffer.isBuffer(value)) return JSON.parse(value.toString('utf8'));
  return value;
}

async function createInvoice(overrides: Record<string, unknown> = {}) {
  const id = `manual-e2e-${randomUUID()}`;
  invoices.push(id);
  const invoice = {
    id, number: `E2E-${id.slice(-8)}`, tenantId, tenantName, currency: 'ZAR',
    total: 100, paid: 0, status: 'issued', createdAt: new Date().toISOString(),
    ...overrides,
  };
  const now = new Date().toISOString().slice(0, 23).replace('T', ' ');
  await executeQuery('INSERT INTO billing_invoices (id,invoice_number,tenant_id,status,currency,due_at,total,paid,created_at,payload_json) VALUES (?,?,?,?,?,?,?,?,?,?)', [id, invoice.number, tenantId, invoice.status, invoice.currency, '2099-01-01', invoice.total, invoice.paid, now, JSON.stringify(invoice)]);
  return invoice;
}

function record(invoiceId: string, overrides: Record<string, unknown> = {}) {
  const idempotencyKey = String(overrides.idempotencyKey || `key-${invoiceId}`);
  ledgerIds.add(`manual-${createHash('sha256').update(idempotencyKey).digest('hex')}`);
  return recordManualInvoicePayment({
    invoiceId, amount: 25, currency: 'ZAR', evidenceReference: `receipt-${invoiceId}`,
    idempotencyKey, actorId: 'synthetic-e2e-actor', actorEmail: 'synthetic-e2e@example.invalid',
    canWriteTenant: target => target === tenantId,
    ...overrides,
  });
}

before(async () => {
  assert.equal(process.env.ALTIL_LOCAL_E2E, 'true');
  assert.equal(process.env.ALTIL_LOCAL_E2E_DATABASE, 'altil_e2e_test');
  assert.equal(process.env.MARIADB_HOST, '127.0.0.1');
  assert.equal(process.env.MARIADB_DATABASE, 'altil_e2e_test');
  const database = await testAndInitMariaDb();
  assert.equal(database.connected, true);
  const tenants = await executeQuery<{ id: string; name: string }>('SELECT id,name FROM tenants ORDER BY id LIMIT 1');
  assert.ok(tenants[0]?.id);
  tenantId = tenants[0].id;
  tenantName = tenants[0].name;
});

after(async () => {
  for (const id of invoices) {
    await executeQuery("DELETE FROM audit_logs WHERE action_type='billing.manual_payment.recorded' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.invoiceId'))=?", [id]);
    for (const ledgerId of ledgerIds) {
      const journalId = `journal-${ledgerId}`;
      await executeQuery('DELETE FROM accounting_journal_lines WHERE journal_id=?', [journalId]);
      await executeQuery('DELETE FROM accounting_journals WHERE id=? AND source_type=? AND source_id=?', [journalId, 'manual_payment', ledgerId]);
      await executeQuery("DELETE FROM billing_ledger_entries WHERE id=? AND JSON_UNQUOTE(JSON_EXTRACT(payload_json,'$.invoiceId'))=?", [ledgerId, id]);
    }
    await executeQuery('DELETE FROM billing_invoices WHERE id=?', [id]);
  }
  for (const id of blockers) await executeQuery('DELETE FROM accounting_journals WHERE id=?', [id]);
  setDatabaseConnected(false);
  await getMariaDbPool().end();
});

test('manual receipt atomically updates invoice, ledger, suspense journal and audit without provider confirmation', async () => {
  const invoice = await createInvoice();
  const result = await record(invoice.id);
  assert.equal(result.invoice.paid, 25);
  assert.equal(result.invoice.status, 'partial');
  assert.equal(result.payment.kind, 'manual_recorded');
  assert.equal(result.providerConfirmed, false);
  const [ledger] = await executeQuery<any>('SELECT payload_json FROM billing_ledger_entries WHERE id=?', [result.payment.id]);
  assert.equal(jsonColumn(ledger.payload_json).providerConfirmed, false);
  const journals = await executeQuery<any>('SELECT j.id,l.account_code,l.debit,l.credit FROM accounting_journals j JOIN accounting_journal_lines l ON l.journal_id=j.id WHERE j.source_type=\'manual_payment\' AND j.source_id=? ORDER BY l.account_code', [result.payment.id]);
  assert.deepEqual(journals.map(row => row.account_code).sort(), ['1090', '1200']);
  assert.equal(journals.reduce((sum, row) => sum + Number(row.debit), 0), 25);
  assert.equal(journals.reduce((sum, row) => sum + Number(row.credit), 0), 25);
  const audits = await executeQuery<any>("SELECT id,request_payload,raw_response_payload FROM audit_logs WHERE action_type='billing.manual_payment.recorded' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.invoiceId'))=?", [invoice.id]);
  assert.equal(audits.length, 1);
  assert.equal(jsonColumn(audits[0].raw_response_payload).providerConfirmed, false);
});

test('partial receipts are supported and an exact same-key retry returns one durable record', async () => {
  const invoice = await createInvoice();
  const input = { amount: 20, evidenceReference: 'bank-ref-partial-1', idempotencyKey: `same-${randomUUID()}` };
  const first = await record(invoice.id, input);
  const retry = await record(invoice.id, input);
  assert.equal(retry.replayed, true);
  assert.equal(retry.invoice.paid, 20);
  const rows = await executeQuery<any>('SELECT COUNT(*) count FROM billing_ledger_entries WHERE id=?', [first.payment.id]);
  assert.equal(Number(rows[0].count), 1);
});
test('a full manual receipt closes the invoice but remains distinct from provider-confirmed payment', async () => {
  const invoice = await createInvoice();
  const result = await record(invoice.id, { amount: 100, evidenceReference: 'full-receipt-evidence', idempotencyKey: `full-${randomUUID()}` });
  assert.equal(result.invoice.paid, 100);
  assert.equal(result.invoice.status, 'paid');
  assert.equal(result.payment.kind, 'manual_recorded');
  assert.equal(result.providerConfirmed, false);
});

test('an idempotency key cannot be reused for a different amount or evidence reference', async () => {
  const invoice = await createInvoice();
  const key = `reuse-${randomUUID()}`;
  await record(invoice.id, { amount: 20, evidenceReference: 'bank-reference-a', idempotencyKey: key });
  await assert.rejects(record(invoice.id, { amount: 21, evidenceReference: 'bank-reference-a', idempotencyKey: key }), /already used/);
});

test('rejects invalid amount, overpayment, currency mismatch, and unauthorized tenant without writes', async () => {
  const invoice = await createInvoice();
  await assert.rejects(record(invoice.id, { amount: 0 }), /positive/);
  await assert.rejects(record(invoice.id, { amount: 101 }), /cannot exceed/);
  await assert.rejects(record(invoice.id, { currency: 'USD' }), /must match/);
  await assert.rejects(record(invoice.id, { canWriteTenant: () => false }), /Invoice not found/);
  const rows = await executeQuery<any>('SELECT paid,status FROM billing_invoices WHERE id=?', [invoice.id]);
  assert.equal(Number(rows[0].paid), 0);
  assert.equal(rows[0].status, 'issued');
});

test('a journal primary-key failure rolls back invoice and ledger changes', async () => {
  const invoice = await createInvoice();
  const idempotencyKey = `rollback-${randomUUID()}`;
  const ledgerId = `manual-${createHash('sha256').update(idempotencyKey).digest('hex')}`;
  const journalId = `journal-${ledgerId}`;
  blockers.push(journalId);
  await executeQuery('INSERT INTO accounting_journals (id,tenant_id,source_type,source_id,currency,description,posted_at,actor) VALUES (?,?,?,?,?,?,?,?)', [journalId, tenantId, 'test_blocker', randomUUID(), 'ZAR', 'Synthetic rollback blocker', new Date().toISOString().slice(0, 23).replace('T', ' '), 'synthetic test']);
  await assert.rejects(record(invoice.id, { amount: 10, idempotencyKey, evidenceReference: 'rollback-test-ref' }));
  const rows = await executeQuery<any>('SELECT paid,status FROM billing_invoices WHERE id=?', [invoice.id]);
  assert.equal(Number(rows[0].paid), 0);
  assert.equal(rows[0].status, 'issued');
  const ledger = await executeQuery<any>('SELECT id FROM billing_ledger_entries WHERE id=?', [ledgerId]);
  assert.equal(ledger.length, 0);
  const audits = await executeQuery<any>("SELECT id FROM audit_logs WHERE action_type='billing.manual_payment.recorded' AND JSON_UNQUOTE(JSON_EXTRACT(request_payload,'$.invoiceId'))=?", [invoice.id]);
  assert.equal(audits.length, 0);
});
