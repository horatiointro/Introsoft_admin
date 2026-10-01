import { createHash, randomUUID } from 'node:crypto';
import { withMariaDbTransaction } from '../db/mariadb';
import { appendDurablyPersistedEvent, makeCurrentAltilEvent } from '../logging/eventLogger';

type Invoice = {
  id: string; number: string; tenantId: string; tenantName: string; currency: string;
  total: number; paid: number; status: string; [key: string]: unknown;
};

export class ManualInvoicePaymentError extends Error {
  constructor(message: string, readonly statusCode: number) { super(message); }
}

function parseJson<T>(value: unknown): T {
  if (typeof value === 'string') return JSON.parse(value) as T;
  if (Buffer.isBuffer(value)) return JSON.parse(value.toString('utf8')) as T;
  if (value && typeof value === 'object') return value as T;
  throw new Error('Persisted invoice payload is invalid.');
}

function decimalPlaces(currency: string): number {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits; }
  catch { throw new ManualInvoicePaymentError('Invoice currency is invalid.', 409); }
}

export async function recordManualInvoicePayment(input: {
  invoiceId: string; amount: unknown; currency?: unknown; evidenceReference: unknown;
  idempotencyKey: unknown; actorId?: string; actorEmail: string; canWriteTenant: (tenantId: string) => boolean;
}) {
  if (typeof input.idempotencyKey !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey)) {
    throw new ManualInvoicePaymentError('A valid Idempotency-Key header (8–128 safe characters) is required.', 400);
  }
  if (typeof input.evidenceReference !== 'string' || input.evidenceReference.trim().length < 3 || input.evidenceReference.trim().length > 120) {
    throw new ManualInvoicePaymentError('A receipt or payment evidence reference (3–120 characters) is required.', 400);
  }
  const evidenceReference = input.evidenceReference.trim();
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new ManualInvoicePaymentError('Payment amount must be a positive number.', 400);
  const keyHash = createHash('sha256').update(input.idempotencyKey).digest('hex');
  const ledgerId = `manual-${keyHash.slice(0, 64)}`;
  const now = new Date();
  const sqlNow = now.toISOString().slice(0, 23).replace('T', ' ');
  const event = makeCurrentAltilEvent({
    actorId: input.actorId, actorEmail: input.actorEmail, tenantId: '', category: 'AUDIT',
    action: 'billing.manual_payment.recorded', resourceType: 'invoice', resourceId: input.invoiceId,
    outcome: 'SUCCESS', requiredPermission: 'billing.write', detail: 'Manual receipt recorded; provider settlement not confirmed.',
  });

  const result = await withMariaDbTransaction(async connection => {
    const [invoiceRows] = await connection.execute<any[]>('SELECT payload_json FROM billing_invoices WHERE id=? FOR UPDATE', [input.invoiceId]);
    if (!invoiceRows.length) throw new ManualInvoicePaymentError('Invoice not found.', 404);
    const invoice = parseJson<Invoice>(invoiceRows[0].payload_json);
    if (!input.canWriteTenant(invoice.tenantId)) throw new ManualInvoicePaymentError('Invoice not found.', 404);
    if (input.currency !== undefined && String(input.currency).toUpperCase() !== invoice.currency.toUpperCase()) {
      throw new ManualInvoicePaymentError('Payment currency must match the invoice currency.', 400);
    }
    const digits = decimalPlaces(invoice.currency);
    if (Number(amount.toFixed(digits)) !== amount) throw new ManualInvoicePaymentError(`Payment amount supports at most ${digits} decimal places for ${invoice.currency}.`, 400);

    const [existingRows] = await connection.execute<any[]>('SELECT payload_json FROM billing_ledger_entries WHERE id=? LIMIT 1', [ledgerId]);
    if (existingRows.length) {
      const existing = parseJson<any>(existingRows[0].payload_json);
      if (existing.invoiceId !== invoice.id || existing.idempotencyKeyHash !== keyHash || Number(existing.amount) !== amount || existing.evidenceReference !== evidenceReference) {
        throw new ManualInvoicePaymentError('Idempotency key was already used for a different payment request.', 409);
      }
      return { invoice, payment: existing, replayed: true, event: null };
    }

    const balance = Number((Number(invoice.total) - Number(invoice.paid)).toFixed(6));
    if (!Number.isFinite(balance) || amount > balance + 0.000001) throw new ManualInvoicePaymentError('Payment cannot exceed the outstanding invoice balance.', 400);
    if (!['issued', 'partial', 'overdue'].includes(invoice.status)) throw new ManualInvoicePaymentError('This invoice cannot accept a payment.', 409);

    const paid = Number((Number(invoice.paid) + amount).toFixed(6));
    const updated: Invoice = { ...invoice, paid, status: paid >= Number(invoice.total) - 0.000001 ? 'paid' : 'partial' };
    const payment = {
      id: ledgerId, tenantId: invoice.tenantId, invoiceId: invoice.id, kind: 'manual_recorded',
      paymentOrigin: 'manual_recorded',
      amount, currency: invoice.currency.toUpperCase(), evidenceReference,
      reference: evidenceReference, idempotencyKeyHash: keyHash, providerConfirmed: false,
      actorId: input.actorId, actor: input.actorEmail, createdAt: now.toISOString(),
    };
    const journalId = `journal-${ledgerId}`;
    event.tenantId = invoice.tenantId;
    event.resourceId = invoice.id;
    const lines = [
      { id: `jln-${ledgerId}-suspense`, code: '1090', name: 'Unverified manual receipt clearing', debit: amount, credit: 0, memo: payment.evidenceReference },
      { id: `jln-${ledgerId}-ar`, code: '1200', name: 'Accounts receivable', debit: 0, credit: amount, memo: `Allocation to ${invoice.number}` },
    ];
    const [journalRows] = await connection.execute<any[]>('SELECT id FROM accounting_journals WHERE source_type=? AND source_id=? LIMIT 1', ['manual_payment', ledgerId]);
    if (journalRows.length) throw new Error('Payment journal already exists without its idempotency ledger record. Manual review is required.');

    await connection.execute('UPDATE billing_invoices SET status=?,paid=?,payload_json=? WHERE id=?', [updated.status, updated.paid, JSON.stringify(updated), invoice.id]);
    await connection.execute('INSERT INTO billing_ledger_entries (id,tenant_id,kind,amount,currency,reference,created_at,payload_json) VALUES (?,?,?,?,?,?,?,?)', [ledgerId, invoice.tenantId, 'payment', amount, invoice.currency.toUpperCase(), payment.reference, sqlNow, JSON.stringify(payment)]);
    await connection.execute('INSERT INTO accounting_journals (id,tenant_id,source_type,source_id,currency,description,posted_at,actor) VALUES (?,?,?,?,?,?,?,?)', [journalId, invoice.tenantId, 'manual_payment', ledgerId, invoice.currency.toUpperCase(), `Manual receipt recorded for ${invoice.number}`, sqlNow, input.actorEmail.slice(0, 190)]);
    for (const line of lines) await connection.execute('INSERT INTO accounting_journal_lines (id,journal_id,account_code,account_name,debit,credit,memo) VALUES (?,?,?,?,?,?,?)', [line.id, journalId, line.code, line.name, line.debit, line.credit, line.memo.slice(0, 500)]);
    const auditDetail = JSON.stringify(event);
    await connection.execute('INSERT INTO audit_logs (id,timestamp,tenant_id,user_email,action_type,category,severity,request_payload,raw_response_payload,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)', [event.id, now, invoice.tenantId, input.actorEmail, event.action, 'AUDIT', 'INFO', JSON.stringify({ invoiceId: invoice.id, amount, currency: invoice.currency, evidenceReference: payment.evidenceReference, idempotencyKeyHash: keyHash }), JSON.stringify({ outcome: 'SUCCESS', providerConfirmed: false, event: auditDetail }), sqlNow]);
    return { invoice: updated, payment, replayed: false, event };
  });

  if (result.event) {
    try { await appendDurablyPersistedEvent(result.event); }
    catch (error) { console.error('[Audit] Manual payment is durably audited in the database; local event-file append failed.', error instanceof Error ? error.message : 'unknown error'); }
  }
  return { invoice: result.invoice, payment: result.payment, replayed: result.replayed, providerConfirmed: false };
}
