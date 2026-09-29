/**
 * Stage E local financial domain. This module models immutable financial facts
 * and accounting handoffs only; it has no database, HTTP, provider or route
 * dependency. Production compatibility remains evidence-gated.
 */
import {
  AuditPort, AuthorizationPort, CommercialActor, CommercialAuthorizationOperation,
  CommercialAuthorizationTargetType, CustomerId, EvidenceApproval,
  EvidenceApprovalPort, IdempotencyPort, TechnicalTenantId,
} from '../stageA/partyAccount';
import { CustomerCharge, CustomerChargeId } from '../stageD/usageRating';

type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type FinancialInvoiceId = Brand<string, 'FinancialInvoiceId'>;
export type FinancialPaymentId = Brand<string, 'FinancialPaymentId'>;
export type PaymentAllocationId = Brand<string, 'PaymentAllocationId'>;
export type AllocationReversalId = Brand<string, 'AllocationReversalId'>;
export type CreditNoteId = Brand<string, 'CreditNoteId'>;
export type FinancialRefundId = Brand<string, 'FinancialRefundId'>;
export type ReconciliationBatchId = Brand<string, 'ReconciliationBatchId'>;
export type ReconciliationItemId = Brand<string, 'ReconciliationItemId'>;
export type FinancialSettlementId = Brand<string, 'FinancialSettlementId'>;
export type AccountingRequestId = Brand<string, 'AccountingRequestId'>;
export type CurrencyCode = string & { readonly __brand: 'CurrencyCode' };

export class FinancialDomainError extends Error {
  constructor(readonly code: 'INVALID_INPUT' | 'CONFLICT' | 'NOT_FOUND' | 'FORBIDDEN' | 'EVIDENCE_REQUIRED' | 'CURRENCY_MISMATCH' | 'INSUFFICIENT_BALANCE' | 'DUPLICATE', message: string) { super(message); this.name = 'FinancialDomainError'; }
}

const required = (s: string, name: string): string => { if (!s?.trim()) throw new FinancialDomainError('INVALID_INPUT', `${name} is required.`); return s.trim(); };
const amount = (n: number, name = 'amount'): number => { if (!Number.isFinite(n) || n < 0) throw new FinancialDomainError('INVALID_INPUT', `${name} must be a finite non-negative amount.`); return round(n); };
const positive = (n: number, name = 'amount'): number => { const v = amount(n, name); if (v <= 0) throw new FinancialDomainError('INVALID_INPUT', `${name} must be greater than zero.`); return v; };
const round = (n: number): number => Number(n.toFixed(6));
export function currencyCode(value: string): CurrencyCode { const v = required(value, 'currency').toUpperCase(); if (!/^[A-Z]{3}$/.test(v)) throw new FinancialDomainError('INVALID_INPUT', 'Currency must be a three-letter code.'); return v as CurrencyCode; }
export interface CurrencyPolicyPort { supports(currency: CurrencyCode): boolean }
export function requireSupportedCurrency(value: string, policy: CurrencyPolicyPort): CurrencyCode { const currency = currencyCode(value); if (!policy.supports(currency)) throw new FinancialDomainError('INVALID_INPUT', `Currency ${currency} is not supported by the supplied policy.`); return currency; }
function instant(value: string, name: string): string { const d = new Date(value); if (!Number.isFinite(d.getTime())) throw new FinancialDomainError('INVALID_INPUT', `${name} must be a valid timestamp.`); return d.toISOString(); }

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
export type ChargeKind = 'usage' | 'recurring' | 'adjustment';
export interface InvoiceLine {
  readonly id: string; readonly chargeId: CustomerChargeId; readonly sourceIdentity: string;
  readonly usageEventId: string; readonly subscriptionId: string; readonly entitlementId: string;
  /** Null when the upstream rating rule version was not supplied; never guessed from a rating ID. */
  readonly ratingVersion: string | null; readonly orderVersionId: string | null;
  readonly providerCostAmount: number | null; readonly providerCostCurrency: CurrencyCode | null; readonly customerMarkupAmount: number | null;
  readonly productId: string; readonly description: string; readonly kind: ChargeKind;
  readonly quantity: number; readonly unit: string; readonly unitAmount: number;
  readonly subtotal: number; readonly taxAmount: number; readonly currency: CurrencyCode;
  readonly ratingId: string; readonly effectiveAt: string;
}
export interface FinancialInvoice {
  readonly id: FinancialInvoiceId; readonly invoiceNumber: string; readonly customerId: CustomerId;
  /** Technical scope is compatibility metadata, never the source of customer identity. */
  readonly tenantScope: TechnicalTenantId | null; readonly currency: CurrencyCode;
  readonly lines: readonly InvoiceLine[]; readonly subtotal: number; readonly tax: number;
  readonly total: number; readonly dueAt: string; readonly status: InvoiceStatus;
  readonly preparedAt: string; readonly issuedAt: string | null; readonly correlationId: string;
  readonly idempotencyKey: string; readonly snapshotVersion: string;
}
export interface InvoicePreparationInput {
  readonly id: FinancialInvoiceId; readonly invoiceNumber: string; readonly customerId: CustomerId;
  readonly tenantScope?: TechnicalTenantId | null; readonly currency: string;
  readonly charges: readonly CustomerCharge[]; readonly chargeKinds: Readonly<Record<string, ChargeKind>>;
  readonly descriptions: Readonly<Record<string, string>>; readonly quantities?: Readonly<Record<string, number>>;
  readonly taxByCharge?: Readonly<Record<string, number>>; readonly ratingVersions?: Readonly<Record<string, string>>;
  readonly orderVersionIds?: Readonly<Record<string, string>>; readonly dueAt: string; readonly preparedAt: string;
  readonly correlationId: string; readonly idempotencyKey: string; readonly alreadyInvoicedChargeIds?: ReadonlySet<string>;
}
/** Creates a reproducible, immutable invoice snapshot from ready charges. */
export function prepareInvoice(input: InvoicePreparationInput): FinancialInvoice {
  const currency = currencyCode(input.currency); required(input.invoiceNumber, 'invoiceNumber'); required(input.correlationId, 'correlationId'); required(input.idempotencyKey, 'idempotencyKey');
  if (!input.charges.length) throw new FinancialDomainError('INVALID_INPUT', 'At least one charge is required.');
  const seen = new Set<string>();
  const lines = input.charges.map((charge, index): InvoiceLine => {
    if (charge.status !== 'ready_for_financial_processing') throw new FinancialDomainError('CONFLICT', `Charge ${charge.id} is not ready for financial processing.`);
    if (charge.customerId !== input.customerId) throw new FinancialDomainError('FORBIDDEN', 'Charges from different commercial customers cannot be combined.');
    if (currencyCode(charge.currency) !== currency) throw new FinancialDomainError('CURRENCY_MISMATCH', 'Invoice and charge currencies must match; conversion requires an explicit FX decision.');
    if (seen.has(charge.id) || input.alreadyInvoicedChargeIds?.has(charge.id)) throw new FinancialDomainError('DUPLICATE', `Charge ${charge.id} is already present on an invoice.`);
    seen.add(charge.id);
    const quantity = positive(input.quantities?.[charge.id] ?? 1, 'quantity');
    const lineTax = amount(input.taxByCharge?.[charge.id] ?? 0, 'tax');
    const ratingVersion = input.ratingVersions?.[charge.id]?.trim() || null;
    const orderVersionId = input.orderVersionIds?.[charge.id]?.trim() || null;
    return Object.freeze({ id: `line:${input.id}:${index + 1}`, chargeId: charge.id, sourceIdentity: charge.sourceIdentity, usageEventId: charge.usageEventId, subscriptionId: charge.subscriptionId, entitlementId: charge.entitlementId, ratingVersion, orderVersionId, providerCostAmount: charge.providerCostAmount, providerCostCurrency: charge.providerCostCurrency ? currencyCode(charge.providerCostCurrency) : null, customerMarkupAmount: charge.customerMarkupAmount, productId: charge.productId, description: required(input.descriptions?.[charge.id] ?? charge.productId, 'description'), kind: input.chargeKinds[charge.id] ?? 'usage', quantity, unit: 'charge', unitAmount: round(charge.amount / quantity), subtotal: charge.amount, taxAmount: lineTax, currency, ratingId: charge.ratingId, effectiveAt: instant(charge.effectiveAt, 'charge effectiveAt') });
  });
  const subtotal = round(lines.reduce((sum, line) => sum + line.subtotal, 0)); const tax = round(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  return Object.freeze({ id: input.id, invoiceNumber: input.invoiceNumber, customerId: input.customerId, tenantScope: input.tenantScope ?? null, currency, lines: Object.freeze(lines), subtotal, tax, total: round(subtotal + tax), dueAt: instant(input.dueAt, 'dueAt'), status: 'draft', preparedAt: instant(input.preparedAt, 'preparedAt'), issuedAt: null, correlationId: input.correlationId, idempotencyKey: input.idempotencyKey, snapshotVersion: '1' });
}
export function issueInvoice(invoice: FinancialInvoice, issuedAt: string): FinancialInvoice {
  if (invoice.status !== 'draft') throw new FinancialDomainError('CONFLICT', 'Only a draft invoice can be issued.');
  return Object.freeze({ ...invoice, lines: Object.freeze(invoice.lines.map(line => Object.freeze({ ...line }))), status: 'issued', issuedAt: instant(issuedAt, 'issuedAt') });
}

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'partially_refunded' | 'refunded' | 'failed' | 'cancelled';
export interface FinancialPayment {
  readonly id: FinancialPaymentId; readonly customerId: CustomerId; readonly tenantScope: TechnicalTenantId | null;
  /** Optional legacy direct invoice reference; never substitutes for allocations. */
  readonly legacyInvoiceId: FinancialInvoiceId | null;
  readonly provider: string; readonly currency: CurrencyCode; readonly amount: number; readonly capturedAmount: number;
  readonly fees: number; readonly providerReference: string | null; readonly externalReference: string;
  readonly status: PaymentStatus; readonly createdAt: string; readonly correlationId: string; readonly idempotencyKey: string;
}
export interface PaymentCapture { readonly id: string; readonly paymentId: FinancialPaymentId; readonly amount: number; readonly fees: number; readonly currency: CurrencyCode; readonly providerReference: string; readonly capturedAt: string; readonly idempotencyKey: string; readonly correlationId: string; }
export function createPayment(input: Omit<FinancialPayment, 'capturedAmount' | 'status' | 'currency' | 'amount' | 'fees' | 'legacyInvoiceId'> & { readonly currency: string; readonly amount: number; readonly fees?: number; readonly legacyInvoiceId?: FinancialInvoiceId | null }): FinancialPayment {
  return Object.freeze({ ...input, legacyInvoiceId: input.legacyInvoiceId ?? null, provider: required(input.provider, 'provider'), externalReference: required(input.externalReference, 'externalReference'), currency: currencyCode(input.currency), amount: positive(input.amount), capturedAmount: 0, fees: amount(input.fees ?? 0, 'fees'), status: 'pending', createdAt: instant(input.createdAt, 'createdAt'), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
}
/** Capture is a separate immutable event; the payment snapshot is never mutated. */
export function recordCapture(payment: FinancialPayment, capture: PaymentCapture, priorCaptures: readonly PaymentCapture[]): PaymentCapture {
  const prior = priorCaptures.find(c => c.paymentId === payment.id && c.idempotencyKey === capture.idempotencyKey);
  if (prior) return prior;
  const total = round(priorCaptures.filter(c => c.paymentId === payment.id).reduce((s, c) => s + c.amount, 0) + positive(capture.amount));
  if (total > payment.amount + 0.000001) throw new FinancialDomainError('INSUFFICIENT_BALANCE', 'Captures cannot exceed the payment amount.');
  if (currencyCode(capture.currency) !== payment.currency) throw new FinancialDomainError('CURRENCY_MISMATCH', 'Capture currency must match payment currency.');
  return Object.freeze({ ...capture, amount: positive(capture.amount), fees: amount(capture.fees, 'fees'), currency: currencyCode(capture.currency), providerReference: required(capture.providerReference, 'providerReference'), capturedAt: instant(capture.capturedAt, 'capturedAt'), idempotencyKey: required(capture.idempotencyKey, 'idempotencyKey'), correlationId: required(capture.correlationId, 'correlationId') });
}

export interface PaymentAllocation { readonly id: PaymentAllocationId; readonly paymentId: FinancialPaymentId; readonly invoiceId: FinancialInvoiceId; readonly customerId: CustomerId; readonly amount: number; readonly currency: CurrencyCode; readonly createdAt: string; readonly actorId: string; readonly correlationId: string; readonly idempotencyKey: string; }
export interface PaymentAllocationReversal { readonly id: AllocationReversalId; readonly allocationId: PaymentAllocationId; readonly amount: number; readonly createdAt: string; readonly actorId: string; readonly reason: string; readonly correlationId: string; readonly idempotencyKey: string; }
export interface AllocationState { readonly invoices: readonly FinancialInvoice[]; readonly payments: readonly FinancialPayment[]; readonly captures: readonly PaymentCapture[]; readonly allocations: readonly PaymentAllocation[]; readonly reversals: readonly PaymentAllocationReversal[]; readonly refunds?: readonly FinancialRefund[]; readonly credits?: readonly CreditNote[]; }
export interface AllocationGuard { /** Acquire both scopes in a consistent order and provide state re-read inside the critical section. */ withAllocationGuards<T>(paymentId: FinancialPaymentId, invoiceId: FinancialInvoiceId, work: (lockedState: AllocationState) => Promise<T>): Promise<T> }
export function invoiceOutstanding(invoice: FinancialInvoice, allocations: readonly PaymentAllocation[], reversals: readonly PaymentAllocationReversal[], credits: readonly CreditNote[] = []): number {
  const allocated = allocations.filter(a => a.invoiceId === invoice.id).reduce((sum, a) => sum + Math.max(0, a.amount - reversals.filter(r => r.allocationId === a.id).reduce((x, r) => x + r.amount, 0)), 0);
  const credited = credits.filter(c => c.invoiceId === invoice.id && c.status === 'issued').reduce((s, c) => s + c.amount, 0);
  const outstanding = round(invoice.total - allocated - credited);
  if (outstanding < -0.000001) throw new FinancialDomainError('CONFLICT', 'Financial history would over-allocate or over-credit an invoice.');
  return Math.max(0, outstanding);
}
export async function allocatePayment(state: AllocationState, guard: AllocationGuard, input: PaymentAllocation): Promise<PaymentAllocation> {
  const duplicate = state.allocations.find(a => a.idempotencyKey === input.idempotencyKey); if (duplicate) return duplicate;
  return guard.withAllocationGuards(input.paymentId, input.invoiceId, async lockedState => {
    const prior = lockedState.allocations.find(a => a.idempotencyKey === input.idempotencyKey); if (prior) return prior;
    const payment = lockedState.payments.find(p => p.id === input.paymentId); const invoice = lockedState.invoices.find(i => i.id === input.invoiceId);
    if (!payment || !invoice) throw new FinancialDomainError('NOT_FOUND', 'Payment or invoice was not found.');
    if (payment.customerId !== input.customerId || invoice.customerId !== input.customerId) throw new FinancialDomainError('FORBIDDEN', 'Payment and invoice must belong to the requested commercial customer.');
    const currency = currencyCode(input.currency); if (currency !== payment.currency || currency !== invoice.currency) throw new FinancialDomainError('CURRENCY_MISMATCH', 'Payment allocation requires matching payment and invoice currencies.');
    if (invoice.status === 'draft' || invoice.status === 'void') throw new FinancialDomainError('CONFLICT', 'Only issued invoices can receive allocations.');
    const captured = lockedState.captures.filter(c => c.paymentId === payment.id).reduce((s, c) => s + c.amount, 0);
    const refunded = (lockedState.refunds ?? []).filter(r => r.paymentId === payment.id && r.status === 'succeeded').reduce((s, r) => s + r.amount, 0);
    const allocated = lockedState.allocations.filter(a => a.paymentId === payment.id).reduce((s, a) => s + Math.max(0, a.amount - lockedState.reversals.filter(r => r.allocationId === a.id).reduce((x, r) => x + r.amount, 0)), 0);
    const requested = positive(input.amount); if (requested > captured - refunded - allocated + 0.000001) throw new FinancialDomainError('INSUFFICIENT_BALANCE', 'Allocation exceeds captured, unrefunded, unallocated payment funds.');
    if (requested > invoiceOutstanding(invoice, lockedState.allocations, lockedState.reversals, lockedState.credits) + 0.000001) throw new FinancialDomainError('INSUFFICIENT_BALANCE', 'Allocation exceeds invoice outstanding amount.');
    return Object.freeze({ ...input, amount: requested, currency, createdAt: instant(input.createdAt, 'createdAt'), actorId: required(input.actorId, 'actorId'), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
  });
}
export function reverseAllocation(allocation: PaymentAllocation, existing: readonly PaymentAllocationReversal[], input: PaymentAllocationReversal): PaymentAllocationReversal {
  const duplicate = existing.find(r => r.idempotencyKey === input.idempotencyKey); if (duplicate) return duplicate;
  const reversed = existing.filter(r => r.allocationId === allocation.id).reduce((s, r) => s + r.amount, 0); const value = positive(input.amount);
  if (value > allocation.amount - reversed + 0.000001) throw new FinancialDomainError('INSUFFICIENT_BALANCE', 'Allocation reversal exceeds the unreversed amount.');
  return Object.freeze({ ...input, amount: value, createdAt: instant(input.createdAt, 'createdAt'), reason: required(input.reason, 'reason'), actorId: required(input.actorId, 'actorId'), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
}

export interface CreditNote { readonly id: CreditNoteId; readonly customerId: CustomerId; readonly invoiceId: FinancialInvoiceId; readonly amount: number; readonly currency: CurrencyCode; readonly reason: string; readonly status: 'draft' | 'issued' | 'void'; readonly issuedAt: string | null; readonly idempotencyKey: string; readonly correlationId: string; }
export function createCredit(invoice: FinancialInvoice, input: CreditNote, existing: readonly CreditNote[], allocations: readonly PaymentAllocation[], reversals: readonly PaymentAllocationReversal[]): CreditNote {
  const old = existing.find(c => c.idempotencyKey === input.idempotencyKey); if (old) return old;
  if (invoice.customerId !== input.customerId || invoice.id !== input.invoiceId) throw new FinancialDomainError('FORBIDDEN', 'Credit and invoice commercial scope must match.');
  if (currencyCode(input.currency) !== invoice.currency) throw new FinancialDomainError('CURRENCY_MISMATCH', 'Credit and invoice currency must match.');
  if (positive(input.amount) > invoiceOutstanding(invoice, allocations, reversals, existing) + 0.000001) throw new FinancialDomainError('INSUFFICIENT_BALANCE', 'Credit exceeds outstanding invoice receivable.');
  return Object.freeze({ ...input, amount: positive(input.amount), currency: currencyCode(input.currency), reason: required(input.reason, 'reason'), status: input.status ?? 'issued', issuedAt: instant(input.issuedAt ?? new Date().toISOString(), 'issuedAt'), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
}
export interface FinancialRefund { readonly id: FinancialRefundId; readonly paymentId: FinancialPaymentId; readonly customerId: CustomerId; readonly amount: number; readonly currency: CurrencyCode; readonly status: 'requested' | 'submitted' | 'succeeded' | 'failed' | 'reversed'; readonly providerReference: string | null; readonly reason: string; readonly createdAt: string; readonly correlationId: string; readonly idempotencyKey: string; }
export function recordRefund(payment: FinancialPayment, captures: readonly PaymentCapture[], refunds: readonly FinancialRefund[], input: FinancialRefund): FinancialRefund {
  const duplicate = refunds.find(r => r.idempotencyKey === input.idempotencyKey); if (duplicate) return duplicate;
  if (payment.customerId !== input.customerId) throw new FinancialDomainError('FORBIDDEN', 'Refund commercial scope does not match payment.');
  if (currencyCode(input.currency) !== payment.currency) throw new FinancialDomainError('CURRENCY_MISMATCH', 'Refund currency must match payment currency.');
  const captured = captures.filter(c => c.paymentId === payment.id).reduce((s, c) => s + c.amount, 0);
  const reserved = refunds.filter(r => r.paymentId === payment.id && !['failed', 'reversed'].includes(r.status)).reduce((s, r) => s + r.amount, 0);
  if (positive(input.amount) > captured - reserved + 0.000001) throw new FinancialDomainError('INSUFFICIENT_BALANCE', 'Refund exceeds captured funds not already refunded or reserved.');
  return Object.freeze({ ...input, amount: positive(input.amount), currency: currencyCode(input.currency), reason: required(input.reason, 'reason'), createdAt: instant(input.createdAt, 'createdAt'), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
}

export type ReconciliationStatus = 'matched' | 'partially_matched' | 'unmatched' | 'exception' | 'duplicate';
export interface ReconciliationItem { readonly id: ReconciliationItemId; readonly externalReference: string; readonly paymentId: FinancialPaymentId | null; readonly expectedAmount: number | null; readonly actualGross: number; readonly fees: number; readonly net: number; readonly currency: CurrencyCode; readonly status: ReconciliationStatus; readonly reason: string | null; }
export interface ReconciliationBatch { readonly id: ReconciliationBatchId; readonly provider: string; readonly statementReference: string; readonly currency: CurrencyCode; readonly items: readonly ReconciliationItem[]; readonly createdAt: string; readonly correlationId: string; readonly idempotencyKey: string; }
export function reconcileBatch(input: ReconciliationBatch, priorReferences: ReadonlySet<string>): ReconciliationBatch {
  const refs = new Set<string>(); const items = input.items.map(item => {
    if (refs.has(item.externalReference) || priorReferences.has(item.externalReference)) return Object.freeze({ ...item, status: 'duplicate' as const, reason: 'duplicate_external_reference' });
    refs.add(item.externalReference);
    if (currencyCode(item.currency) !== currencyCode(input.currency) || Math.abs(item.actualGross - item.fees - item.net) > 0.000001) return Object.freeze({ ...item, status: 'exception' as const, reason: 'currency_or_gross_fee_net_mismatch' });
    if (!item.paymentId) return Object.freeze({ ...item, status: 'unmatched' as const });
    const expected = item.expectedAmount == null ? null : amount(item.expectedAmount, 'expectedAmount');
    if (expected == null) return Object.freeze({ ...item, status: 'exception' as const, reason: 'expected_amount_missing' });
    if (Math.abs(item.actualGross - expected) < 0.000001) return Object.freeze({ ...item, status: 'matched' as const });
    if (item.actualGross > 0 && item.actualGross < expected) return Object.freeze({ ...item, status: 'partially_matched' as const });
    return Object.freeze({ ...item, status: 'exception' as const, reason: 'amount_mismatch' });
  });
  return Object.freeze({ ...input, provider: required(input.provider, 'provider'), statementReference: required(input.statementReference, 'statementReference'), currency: currencyCode(input.currency), items: Object.freeze(items), createdAt: instant(input.createdAt, 'createdAt'), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
}

export interface FinancialSettlement { readonly id: FinancialSettlementId; readonly reconciliationBatchId: ReconciliationBatchId; readonly paymentId: FinancialPaymentId; readonly provider: string; readonly gross: number; readonly fees: number; readonly net: number; readonly currency: CurrencyCode; readonly settledAt: string; readonly status: 'reconciled' | 'ready_for_accounting' | 'exception'; readonly correlationId: string; readonly idempotencyKey: string; }
export function createSettlement(batch: ReconciliationBatch, item: ReconciliationItem, input: FinancialSettlement): FinancialSettlement {
  if (!batch.items.some(row => row.id === item.id) || item.status !== 'matched' || item.paymentId !== input.paymentId) throw new FinancialDomainError('CONFLICT', 'Settlement requires the matching reconciled payment item.');
  if (currencyCode(input.currency) !== batch.currency || currencyCode(input.currency) !== item.currency) throw new FinancialDomainError('CURRENCY_MISMATCH', 'Settlement currency must match reconciliation evidence.');
  if (Math.abs(input.gross - input.fees - input.net) > 0.000001 || round(input.gross) !== round(item.actualGross) || round(input.fees) !== round(item.fees) || round(input.net) !== round(item.net)) throw new FinancialDomainError('CONFLICT', 'Settlement gross, fees and net must agree with matched statement evidence.');
  return Object.freeze({ ...input, provider: required(input.provider, 'provider'), currency: currencyCode(input.currency), gross: amount(input.gross), fees: amount(input.fees), net: amount(input.net), settledAt: instant(input.settledAt, 'settledAt'), status: 'ready_for_accounting', correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey') });
}

export interface AccountingLine { readonly accountCode: string; readonly accountName: string; readonly debit: number; readonly credit: number; readonly memo: string; }
export interface AccountingPostingRequest { readonly id: AccountingRequestId; readonly sourceType: string; readonly sourceId: string; readonly customerId: CustomerId; readonly tenantScope: TechnicalTenantId | null; readonly currency: CurrencyCode; readonly description: string; readonly lines: readonly AccountingLine[]; readonly correlationId: string; readonly idempotencyKey: string; readonly createdAt: string; readonly status: 'ready_for_accounting'; }
export function createAccountingRequest(input: AccountingPostingRequest): AccountingPostingRequest {
  if (!input.lines.length) throw new FinancialDomainError('INVALID_INPUT', 'At least two balanced accounting lines are required.');
  const lines = input.lines.map(line => Object.freeze({ ...line, accountCode: required(line.accountCode, 'accountCode'), accountName: required(line.accountName, 'accountName'), debit: amount(line.debit, 'debit'), credit: amount(line.credit, 'credit'), memo: required(line.memo, 'memo') }));
  if (lines.some(line => line.debit > 0 && line.credit > 0) || !lines.some(line => line.debit > 0) || !lines.some(line => line.credit > 0)) throw new FinancialDomainError('INVALID_INPUT', 'Each journal line must be debit or credit and both sides are required.');
  const debit = round(lines.reduce((s, line) => s + line.debit, 0)); const credit = round(lines.reduce((s, line) => s + line.credit, 0));
  if (debit !== credit) throw new FinancialDomainError('CONFLICT', 'Accounting request is not balanced.');
  return Object.freeze({ ...input, sourceType: required(input.sourceType, 'sourceType'), sourceId: required(input.sourceId, 'sourceId'), currency: currencyCode(input.currency), description: required(input.description, 'description'), lines: Object.freeze(lines), correlationId: required(input.correlationId, 'correlationId'), idempotencyKey: required(input.idempotencyKey, 'idempotencyKey'), createdAt: instant(input.createdAt, 'createdAt'), status: 'ready_for_accounting' });
}

export interface TaxDecision { readonly jurisdiction: string; readonly taxReference: string; readonly inclusive: boolean; readonly rate: number; readonly taxableBase: number; readonly taxAmount: number; readonly currency: CurrencyCode; readonly version: string; }
export function calculateTax(amountValue: number, rate: number, inclusive: boolean, currency: string, jurisdiction: string, taxReference: string, version: string): TaxDecision {
  const gross = positive(amountValue); if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new FinancialDomainError('INVALID_INPUT', 'Tax rate must be between zero and one.');
  const taxAmount = round(inclusive ? gross - gross / (1 + rate) : gross * rate); const taxableBase = round(inclusive ? gross - taxAmount : gross);
  return Object.freeze({ jurisdiction: required(jurisdiction, 'jurisdiction'), taxReference: required(taxReference, 'taxReference'), inclusive, rate, taxableBase, taxAmount, currency: currencyCode(currency), version: required(version, 'version') });
}
export interface FxSnapshot { readonly from: CurrencyCode; readonly to: CurrencyCode; readonly rate: number; readonly version: string; readonly effectiveAt: string; readonly sourceReference: string; }
export function convertCurrency(value: number, from: string, to: string, fx: FxSnapshot | null, asOf: string, maximumAgeMs: number): number {
  const source = currencyCode(from); const target = currencyCode(to); const v = amount(value);
  if (source === target) return v;
  if (!fx) throw new FinancialDomainError('CURRENCY_MISMATCH', 'An explicit FX snapshot is required for cross-currency conversion.');
  if (currencyCode(fx.from) !== source || currencyCode(fx.to) !== target || !Number.isFinite(fx.rate) || fx.rate <= 0) throw new FinancialDomainError('CURRENCY_MISMATCH', 'FX snapshot direction or rate is invalid.');
  const age = new Date(asOf).getTime() - new Date(fx.effectiveAt).getTime(); if (!Number.isFinite(age) || age < 0 || age > maximumAgeMs) throw new FinancialDomainError('INVALID_INPUT', 'FX snapshot is future-dated or stale.');
  required(fx.version, 'FX version'); required(fx.sourceReference, 'FX source'); return round(v * fx.rate);
}

/**
 * Required service boundary for a future evidence-reviewed adapter. Adapters
 * must determine live tables/columns, constraints, nullability, transaction
 * requirements, lifecycle semantics and safe allocation concurrency strategy;
 * this contract intentionally selects none of them.
 */
export interface FinancialCompatibilityAdapter {
  loadInvoice(id: FinancialInvoiceId): Promise<FinancialInvoice | null>;
  saveInvoiceSnapshot(invoice: FinancialInvoice): Promise<void>;
  loadPayment(id: FinancialPaymentId): Promise<FinancialPayment | null>;
  savePaymentIntentCompatible(payment: FinancialPayment): Promise<void>;
  appendAllocation(allocation: PaymentAllocation): Promise<void>;
  appendAllocationReversal(reversal: PaymentAllocationReversal): Promise<void>;
  appendCredit(credit: CreditNote): Promise<void>;
  appendRefund(refund: FinancialRefund): Promise<void>;
  appendReconciliation(batch: ReconciliationBatch): Promise<void>;
  appendSettlement(settlement: FinancialSettlement): Promise<void>;
  submitAccountingRequest(request: AccountingPostingRequest): Promise<void>;
  readonly allocationGuard: AllocationGuard;
  /** Atomic scoped-key execution; an adapter must establish its durable semantics from evidence. */
  readonly idempotency: IdempotencyPort;
}
export interface FinancialAuthorizationContext {
  readonly actor: CommercialActor; readonly operation: Extract<CommercialAuthorizationOperation, `financial.${string}`>;
  readonly targetType: Extract<CommercialAuthorizationTargetType, 'financial_invoice' | 'financial_payment' | 'payment_allocation' | 'financial_credit' | 'financial_refund' | 'reconciliation_batch' | 'settlement' | 'accounting_posting_request'>;
  readonly targetId?: string; readonly customerId: CustomerId; readonly tenantId?: TechnicalTenantId;
  readonly reason: string; readonly correlationId: string; readonly evidence: EvidenceApproval;
}
/** Call every persisted Stage E command through the shared atomic scoped-key port. */
export function executeFinancialIdempotently<T>(port: IdempotencyPort, operation: string, scope: string, key: string, work: () => Promise<T>): Promise<T> {
  return port.execute(`${required(operation, 'operation')}:${required(scope, 'scope')}`, required(key, 'idempotencyKey'), work);
}
/** Shared A-stage authorization/evidence/audit infrastructure remains mandatory. */
export async function authorizeFinancialOperation(ports: { readonly authorization: AuthorizationPort; readonly evidence: EvidenceApprovalPort; readonly audit: AuditPort }, context: FinancialAuthorizationContext): Promise<void> {
  required(context.reason, 'reason'); required(context.correlationId, 'correlationId'); required(context.evidence.evidenceReference, 'evidenceReference');
  const scope = { customerId: context.customerId, ...(context.tenantId ? { tenantId: context.tenantId } : {}) };
  const decision = await ports.authorization.authorize({ actor: context.actor, operation: context.operation, scope, target: { type: context.targetType, ...(context.targetId ? { id: context.targetId } : {}) } });
  if (!decision.allowed) {
    await ports.audit.append({ id: `audit:${context.operation}:${context.correlationId}`, actorId: context.actor.id, operation: context.operation, targetType: context.targetType, targetId: context.targetId ?? 'pending', tenantId: context.tenantId ?? null, customerId: context.customerId, priorState: null, newState: { result: 'denied' }, reason: context.reason, correlationId: context.correlationId, occurredAt: new Date().toISOString(), outcome: 'denied', evidenceReference: context.evidence.evidenceReference, evidenceVerificationReference: null, authorizationDecisionReference: decision.decisionReference });
    throw new FinancialDomainError('FORBIDDEN', 'Financial operation is not authorized.');
  }
  const proof = await ports.evidence.verify({ actor: context.actor, operation: context.operation, approval: context.evidence, scope });
  if (!proof.verified) {
    await ports.audit.append({ id: `audit:${context.operation}:${context.correlationId}`, actorId: context.actor.id, operation: context.operation, targetType: context.targetType, targetId: context.targetId ?? 'pending', tenantId: context.tenantId ?? null, customerId: context.customerId, priorState: null, newState: { result: 'evidence_rejected' }, reason: context.reason, correlationId: context.correlationId, occurredAt: new Date().toISOString(), outcome: 'failed', evidenceReference: context.evidence.evidenceReference, evidenceVerificationReference: proof.verificationReference, authorizationDecisionReference: decision.decisionReference });
    throw new FinancialDomainError('EVIDENCE_REQUIRED', 'Verified evidence/approval is required for the financial operation.');
  }
  await ports.audit.append({ id: `audit:${context.operation}:${context.correlationId}`, actorId: context.actor.id, operation: context.operation, targetType: context.targetType, targetId: context.targetId ?? 'pending', tenantId: context.tenantId ?? null, customerId: context.customerId, priorState: null, newState: null, reason: context.reason, correlationId: context.correlationId, occurredAt: new Date().toISOString(), outcome: 'succeeded', evidenceReference: context.evidence.evidenceReference, evidenceVerificationReference: proof.verificationReference, authorizationDecisionReference: decision.decisionReference });
}
