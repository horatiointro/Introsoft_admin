import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocatePayment, calculateTax, createAccountingRequest, createCredit, createPayment,
  createSettlement, convertCurrency, FinancialDomainError, invoiceOutstanding,
  issueInvoice, prepareInvoice, recordCapture, recordRefund, reconcileBatch,
  requireSupportedCurrency, reverseAllocation, authorizeFinancialOperation,
  type AllocationGuard, type AllocationState, type FinancialInvoice,
  type FinancialPayment, type PaymentAllocation, type PaymentCapture, type ReconciliationBatch,
} from './financialLifecycle';
import type { CustomerCharge } from '../stageD/usageRating';
import type { CustomerId, TechnicalTenantId } from '../stageA/partyAccount';

const customer = 'cust-a' as CustomerId;
const tenant = 'tenant-technical' as TechnicalTenantId;
const charge = (id: string, amount: number, currency = 'ZAR', customerId = customer): CustomerCharge => ({
  id: id as CustomerCharge['id'], sourceIdentity: `source:${id}`, usageEventId: 'usage-1' as CustomerCharge['usageEventId'],
  ratingId: 'rating-v1' as CustomerCharge['ratingId'], customerId, entitlementId: 'ent-1' as CustomerCharge['entitlementId'],
  subscriptionId: 'sub-1' as CustomerCharge['subscriptionId'], productId: 'prod-seat', providerCostAmount: null,
  providerCostCurrency: null, customerMarkupAmount: null, amount, currency, status: 'ready_for_financial_processing',
  effectiveAt: '2026-01-01T00:00:00Z', correlationId: 'corr-charge', createdAt: '2026-01-01T00:00:00Z', supersedesChargeId: null,
});
const invoice = (id: string, total: number, overrides: Partial<FinancialInvoice> = {}): FinancialInvoice => prepareInvoice({
  id: id as FinancialInvoice['id'], invoiceNumber: `INV-${id}`, customerId: customer, tenantScope: tenant, currency: 'ZAR',
  charges: [charge(`charge-${id}`, total)], chargeKinds: {}, descriptions: {}, dueAt: '2026-02-01', preparedAt: '2026-01-01',
  correlationId: `corr-${id}`, idempotencyKey: `prepare-${id}`,
  ...overrides,
});
const payment = (id: string, total: number, customerId = customer): FinancialPayment => createPayment({
  id: id as FinancialPayment['id'], customerId, tenantScope: tenant, provider: 'synthetic', currency: 'ZAR', amount: total,
  fees: 0, providerReference: null, externalReference: `ext-${id}`, createdAt: '2026-01-01', correlationId: `corr-${id}`, idempotencyKey: `create-${id}`,
});
const capture = (p: FinancialPayment, amount: number, key = `capture-${p.id}`): PaymentCapture => ({
  id: `cap-${key}`, paymentId: p.id, amount, fees: 0, currency: 'ZAR' as PaymentCapture['currency'],
  providerReference: `provider-${key}`, capturedAt: '2026-01-02', idempotencyKey: key, correlationId: `corr-${key}`,
});
const allocation = (p: FinancialPayment, i: FinancialInvoice, value: number, key: string): PaymentAllocation => ({
  id: `alloc-${key}` as PaymentAllocation['id'], paymentId: p.id, invoiceId: i.id, customerId: customer,
  amount: value, currency: 'ZAR' as PaymentAllocation['currency'], createdAt: '2026-01-03', actorId: 'actor', correlationId: `corr-${key}`, idempotencyKey: key,
});
function fakeGuard(initial: AllocationState): AllocationGuard {
  let latest = initial; let tail = Promise.resolve();
  return { withAllocationGuards: async (_payment, _invoice, work) => {
    let release!: () => void; const previous = tail; tail = new Promise<void>(resolve => { release = resolve; }); await previous;
    try { const result = await work(latest); latest = { ...latest, allocations: [...latest.allocations, result as PaymentAllocation] }; return result; } finally { release(); }
  } };
}

test('invoice snapshots support one/many charges, recurring and usage, issue immutably', () => {
  const one = prepareInvoice({ id: 'one' as FinancialInvoice['id'], invoiceNumber: 'INV-one', customerId: customer, currency: 'ZAR', charges: [charge('recurring', 85)], chargeKinds: { recurring: 'recurring' }, descriptions: {}, ratingVersions: { recurring: 'rule-v2' }, orderVersionIds: { recurring: 'order-version-1' }, dueAt: '2026-02-01', preparedAt: '2026-01-01', correlationId: 'corr-one', idempotencyKey: 'prepare-one' });
  assert.equal(one.total, 85); assert.equal(one.lines[0].kind, 'recurring'); assert.equal(one.lines[0].ratingVersion, 'rule-v2'); assert.equal(one.lines[0].orderVersionId, 'order-version-1'); assert.equal(one.lines[0].unit, 'charge');
  const many = prepareInvoice({ id: 'many' as FinancialInvoice['id'], invoiceNumber: 'INV-M', customerId: customer, currency: 'ZAR', charges: [charge('a', 40), charge('b', 45)], chargeKinds: { a: 'recurring', b: 'usage' }, descriptions: {}, dueAt: '2026-02-01', preparedAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'k' });
  assert.equal(many.lines.length, 2); assert.equal(many.total, 85); assert.deepEqual(many.lines.map(l => l.kind), ['recurring', 'usage']); assert.equal(many.lines[0].ratingVersion, null);
  const issued = issueInvoice(one, '2026-01-04'); assert.equal(issued.status, 'issued'); assert.equal(one.status, 'draft');
  assert.throws(() => issueInvoice(issued, '2026-01-05'), FinancialDomainError);
});

test('invoice preparation blocks duplicate, already invoiced, cross-customer and currency-mismatched charges', () => {
  assert.throws(() => prepareInvoice({ id: 'i' as FinancialInvoice['id'], invoiceNumber: 'i', customerId: customer, currency: 'ZAR', charges: [charge('dup', 1), charge('dup', 1)], chargeKinds: {}, descriptions: {}, dueAt: '2026-02-01', preparedAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'k' }), /already present/);
  assert.throws(() => prepareInvoice({ id: 'i' as FinancialInvoice['id'], invoiceNumber: 'i', customerId: customer, currency: 'ZAR', charges: [charge('old', 1)], chargeKinds: {}, descriptions: {}, dueAt: '2026-02-01', preparedAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'k', alreadyInvoicedChargeIds: new Set(['old']) }), /already present/);
  assert.throws(() => prepareInvoice({ id: 'i' as FinancialInvoice['id'], invoiceNumber: 'i', customerId: customer, currency: 'USD', charges: [charge('fx', 1)], chargeKinds: {}, descriptions: {}, dueAt: '2026-02-01', preparedAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'k' }), /currencies must match/);
  assert.throws(() => prepareInvoice({ id: 'i' as FinancialInvoice['id'], invoiceNumber: 'i', customerId: customer, currency: 'ZAR', charges: [charge('foreign', 1, 'ZAR', 'cust-b' as CustomerId)], chargeKinds: {}, descriptions: {}, dueAt: '2026-02-01', preparedAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'k' }), /different commercial customers/);
});

test('payment capture is separate, idempotent, bounded and currency checked', () => {
  const p = payment('p', 100); const event = capture(p, 60); const first = recordCapture(p, event, []);
  assert.equal(recordCapture(p, event, [first]), first); assert.equal(p.capturedAmount, 0); assert.equal(p.status, 'pending');
  assert.throws(() => recordCapture(p, capture(p, 50, 'too-much'), [first]), /cannot exceed/);
  assert.throws(() => recordCapture(p, { ...capture(p, 2, 'usd'), currency: 'USD' as PaymentCapture['currency'] }, []), /Capture currency/);
});

test('allocations support partial/many-to-many/unapplied funds and preserve source records', async () => {
  const p = payment('p', 150); const cap = recordCapture(p, capture(p, 150), []); const i1 = issueInvoice(invoice('i1', 100), '2026-01-02'); const i2 = issueInvoice(invoice('i2', 80), '2026-01-02');
  const state: AllocationState = { payments: [p], invoices: [i1, i2], captures: [cap], allocations: [], reversals: [] }; const guard = fakeGuard(state);
  const a1 = await allocatePayment(state, guard, allocation(p, i1, 60, 'a1'));
  const a2 = await allocatePayment({ ...state, allocations: [a1] }, guard, allocation(p, i2, 50, 'a2'));
  assert.equal(a1.amount, 60); assert.equal(a2.amount, 50); assert.equal(p.capturedAmount, 0); assert.equal(i1.total, 100);
  assert.equal(invoiceOutstanding(i1, [a1], [], []), 40); assert.equal(invoiceOutstanding(i2, [a2], [], []), 30);
  await assert.rejects(allocatePayment({ ...state, allocations: [a1] }, { withAllocationGuards: async (_p, _i, work) => work({ ...state, allocations: [a1] }) }, allocation(p, i1, 41, 'over-invoice')), /invoice outstanding/);
  await assert.rejects(allocatePayment({ ...state, allocations: [a1, a2] }, { withAllocationGuards: async (_p, _i, work) => work({ ...state, allocations: [a1, a2] }) }, allocation(p, i1, 41, 'over-pay')), /payment funds/);
  const p2 = payment('p2', 40); const c2 = recordCapture(p2, capture(p2, 40), []);
  const a3 = await allocatePayment({ ...state, payments: [p2], captures: [c2], invoices: [i1], allocations: [a1] }, { withAllocationGuards: async (_p, _i, work) => work({ ...state, payments: [p2], captures: [c2], invoices: [i1], allocations: [a1] }) }, allocation(p2, i1, 40, 'a3'));
  assert.equal(a3.amount, 40); assert.equal(invoiceOutstanding(i1, [a1, a3], [], []), 0);
});

test('allocation concurrency re-reads state under the two-key guard', async () => {
  const p = payment('race', 100); const cap = recordCapture(p, capture(p, 100), []); const i = issueInvoice(invoice('race', 100), '2026-01-02');
  const state: AllocationState = { payments: [p], invoices: [i], captures: [cap], allocations: [], reversals: [] }; const guard = fakeGuard(state);
  const outcomes = await Promise.allSettled([allocatePayment(state, guard, allocation(p, i, 70, 'race-a')), allocatePayment(state, guard, allocation(p, i, 70, 'race-b'))]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1); assert.equal(outcomes.filter(x => x.status === 'rejected').length, 1);
});

test('allocation reversal appends immutable history and is idempotent/bounded', () => {
  const p = payment('p', 50); const i = invoice('i', 50); const a = allocation(p, i, 30, 'a'); const reverse = { id: 'r' as any, allocationId: a.id, amount: 10, createdAt: '2026-01-04', actorId: 'actor', reason: 'correction', correlationId: 'c', idempotencyKey: 'r1' };
  const r = reverseAllocation(a, [], reverse); assert.equal(reverseAllocation(a, [r], reverse), r); assert.throws(() => reverseAllocation(a, [r], { ...reverse, amount: 21, id: 'r2' as any, idempotencyKey: 'r2' }), /exceeds/); assert.equal(a.amount, 30);
});

test('credits reduce receivable without refunding cash; refunds remain payment-linked', () => {
  const i = issueInvoice(invoice('credit', 100), '2026-01-02'); const credit = createCredit(i, { id: 'cr' as any, customerId: customer, invoiceId: i.id, amount: 25, currency: 'ZAR' as any, reason: 'service credit', status: 'issued', issuedAt: '2026-01-03', idempotencyKey: 'credit-1', correlationId: 'c' }, [], [], []);
  assert.equal(invoiceOutstanding(i, [], [], [credit]), 75); assert.equal(i.total, 100);
  const p = payment('refund', 50); const cap = recordCapture(p, capture(p, 50), []); const refund = recordRefund(p, [cap], [], { id: 'rf' as any, paymentId: p.id, customerId: customer, amount: 20, currency: 'ZAR' as any, status: 'requested', providerReference: null, reason: 'refund request', createdAt: '2026-01-03', correlationId: 'c', idempotencyKey: 'refund-1' });
  assert.equal(refund.paymentId, p.id); assert.equal(i.total, 100); assert.throws(() => recordRefund(p, [cap], [refund], { ...refund, id: 'rf2' as any, amount: 31, idempotencyKey: 'refund-2' }), /exceeds captured/);
});

test('reconciliation distinguishes matched, partial, unmatched, duplicate and exception', () => {
  const batch = reconcileBatch({ id: 'b' as ReconciliationBatch['id'], provider: 'synthetic', statementReference: 'stmt', currency: 'ZAR' as ReconciliationBatch['currency'], createdAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'b1', items: [
    { id: '1' as any, externalReference: 'match', paymentId: 'p' as any, expectedAmount: 10, actualGross: 10, fees: 1, net: 9, currency: 'ZAR' as any, status: 'unmatched', reason: null },
    { id: '2' as any, externalReference: 'partial', paymentId: 'p' as any, expectedAmount: 10, actualGross: 5, fees: 1, net: 4, currency: 'ZAR' as any, status: 'unmatched', reason: null },
    { id: '3' as any, externalReference: 'none', paymentId: null, expectedAmount: null, actualGross: 2, fees: 0, net: 2, currency: 'ZAR' as any, status: 'unmatched', reason: null },
    { id: '4' as any, externalReference: 'match', paymentId: 'p' as any, expectedAmount: 10, actualGross: 10, fees: 1, net: 9, currency: 'ZAR' as any, status: 'unmatched', reason: null },
    { id: '5' as any, externalReference: 'bad', paymentId: 'p' as any, expectedAmount: 10, actualGross: 8, fees: 1, net: 2, currency: 'ZAR' as any, status: 'unmatched', reason: null },
  ] }, new Set(['external-old']));
  assert.deepEqual(batch.items.map(i => i.status), ['matched', 'partially_matched', 'unmatched', 'duplicate', 'exception']);
});

test('settlement requires reconciled matching gross/fee/net and accounting handoff balances', () => {
  const p = payment('settle', 100); const raw = { id: 'ri' as any, externalReference: 'ref', paymentId: p.id, expectedAmount: 100, actualGross: 100, fees: 3, net: 97, currency: 'ZAR' as any, status: 'unmatched' as const, reason: null };
  const batch = reconcileBatch({ id: 'rb' as any, provider: 'synthetic', statementReference: 'stmt', currency: 'ZAR' as any, items: [raw], createdAt: '2026-01-01', correlationId: 'c', idempotencyKey: 'b' }, new Set()); const item = batch.items[0];
  const settlement = createSettlement(batch, item, { id: 's' as any, reconciliationBatchId: batch.id, paymentId: p.id, provider: 'synthetic', gross: 100, fees: 3, net: 97, currency: 'ZAR' as any, settledAt: '2026-01-05', status: 'reconciled', correlationId: 'c', idempotencyKey: 's' }); assert.equal(settlement.status, 'ready_for_accounting');
  const request = createAccountingRequest({ id: 'ar' as any, sourceType: 'settlement', sourceId: settlement.id, customerId: customer, tenantScope: tenant, currency: 'ZAR' as any, description: 'Settlement handoff', lines: [{ accountCode: 'bank', accountName: 'Bank', debit: 97, credit: 0, memo: 'net' }, { accountCode: 'fee', accountName: 'Fees', debit: 3, credit: 0, memo: 'fee' }, { accountCode: 'clearing', accountName: 'Clearing', debit: 0, credit: 100, memo: 'gross' }], correlationId: 'c', idempotencyKey: 'accounting-1', createdAt: '2026-01-05', status: 'ready_for_accounting' });
  assert.equal(request.status, 'ready_for_accounting'); assert.equal(request.lines.reduce((s, l) => s + l.debit, 0), request.lines.reduce((s, l) => s + l.credit, 0)); assert.ok(Object.isFrozen(request) && Object.isFrozen(request.lines));
  assert.throws(() => createAccountingRequest({ ...request, lines: [{ accountCode: 'a', accountName: 'a', debit: 10, credit: 0, memo: 'x' }, { accountCode: 'b', accountName: 'b', debit: 0, credit: 9, memo: 'y' }] }), /not balanced/);
  assert.throws(() => createSettlement(batch, { ...item, status: 'unmatched' }, { ...settlement, id: 's2' as any, idempotencyKey: 's2' }), /requires the matching reconciled/);
});

test('tax and FX decisions are explicit, versioned, and stale/unsupported conversions fail', () => {
  assert.equal(calculateTax(115, 0.15, true, 'ZAR', 'ZA', 'synthetic-tax-rule', 'v1').taxAmount, 15);
  assert.equal(calculateTax(100, 0.15, false, 'ZAR', 'ZA', 'synthetic-tax-rule', 'v1').taxAmount, 15);
  const fx = { from: 'USD' as any, to: 'ZAR' as any, rate: 18, version: 'fx-v1', effectiveAt: '2026-01-01', sourceReference: 'synthetic' };
  assert.equal(convertCurrency(2, 'USD', 'ZAR', fx, '2026-01-02', 48 * 3600000), 36);
  assert.equal(convertCurrency(2, 'ZAR', 'ZAR', null, '2026-01-02', 1), 2);
  assert.throws(() => convertCurrency(2, 'USD', 'ZAR', null, '2026-01-02', 1), /FX snapshot is required/);
  assert.throws(() => convertCurrency(2, 'USD', 'ZAR', fx, '2026-02-01', 1), /stale/);
  assert.throws(() => createPayment({ ...payment('unsupported', 1), currency: 'US' }), /three-letter/);
  assert.throws(() => requireSupportedCurrency('XYZ', { supports: code => code === 'ZAR' || code === 'USD' }), /not supported/);
});

test('financial authorization and evidence approval are mandatory before audit success', async () => {
  const actor = { id: 'actor' as any, tenantId: tenant }; const context = { actor, operation: 'financial.invoice.issue' as const, targetType: 'financial_invoice' as const, targetId: 'invoice-1', customerId: customer, tenantId: tenant, reason: 'synthetic test', correlationId: 'corr-auth', evidence: { evidenceReference: 'synthetic-evidence', approvedBy: 'approver' as any } };
  const appended: unknown[] = [];
  const base = { audit: { append: async (event: unknown) => { appended.push(event); } } as any, evidence: { verify: async () => ({ verified: true, verificationReference: 'verified' }) } as any };
  await assert.rejects(authorizeFinancialOperation({ ...base, authorization: { authorize: async () => ({ allowed: false, decisionReference: 'denied' }) } as any }, context), /not authorized/);
  await assert.rejects(authorizeFinancialOperation({ ...base, authorization: { authorize: async () => ({ allowed: true, decisionReference: 'allowed' }) } as any, evidence: { verify: async () => ({ verified: false, verificationReference: 'missing' }) } as any }, context), /evidence\/approval is required/);
  assert.equal(appended.length, 2);
  await authorizeFinancialOperation({ ...base, authorization: { authorize: async () => ({ allowed: true, decisionReference: 'allowed' }) } as any }, context);
  assert.equal(appended.length, 3);
});
