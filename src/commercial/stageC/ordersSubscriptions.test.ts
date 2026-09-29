import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditEvent, AuditPort, AuthorizationPort, CommercialActor, CommercialActorId, CustomerId, EvidenceApprovalPort, IdempotencyPort, TechnicalTenantId, TenantMappingResolution } from '../stageA/partyAccount';
import { AcceptanceId, ContractId, ContractQuoteRepository, ContractQuoteService, ContractRecord, ContractVersionId, ContractVersionRecord, CustomerAcceptanceRecord, QuoteId, QuoteRecord, QuoteVersionId, QuoteVersionRecord, StageBDependencies } from '../stageB/contractsQuotes';
import { CommercialOrderStatus, EntitlementId, EntitlementLifecycleEvent, EntitlementRecord, EntitlementStatus, OrderLifecycleEvent, OrderRecord, OrderSubscriptionService, OrderVersionId, OrderVersionRecord, ProductPriceSnapshot, StageCDependencies, StageCError, StageCOrderId, StageCRepository, StageCOrderLineId, SubscriptionId, SubscriptionLifecycleEvent, SubscriptionRecord, SubscriptionStatus, SubscriptionVersionId, SubscriptionVersionRecord } from './ordersSubscriptions';

const actor: CommercialActor = { id: 'actor-stagec-owner' as CommercialActorId, tenantId: 'tenant-technical-a' as TechnicalTenantId };
const customerA = 'customer-commercial-a' as CustomerId; const customerB = 'customer-commercial-b' as CustomerId;
const t0 = '2026-01-01T00:00:00.000Z'; const t1 = '2026-01-01T00:00:01.000Z'; const t2 = '2026-01-01T00:00:02.000Z'; const t3 = '2026-01-01T00:00:03.000Z'; const t4 = '2026-01-01T00:00:04.000Z';
const approval = { evidenceReference: 'synthetic-stagec-evidence:approved', approvedBy: 'actor-stagec-approver' as CommercialActorId };
const product: ProductPriceSnapshot = Object.freeze({ productId: 'synthetic-product-seat', sku: 'SYN-SEAT', description: 'Synthetic monthly service', billingUnit: 'seat_month', recurring: true, cadence: 'monthly', unitPrice: '85.000000', currency: 'ZAR', priceVersionReference: 'synthetic-price:v1', attributes: Object.freeze({ seats: 1 }) });
const line = (unitPrice = '85.000000') => ({ existingLineId: null, acceptedQuoteLineReference: 'synthetic-quote-line:seat', priceSnapshotEvidenceReference: `synthetic-price-evidence:${unitPrice}`, product: { ...product, unitPrice, priceVersionReference: `synthetic-price:${unitPrice}`, attributes: { seats: 1 } }, quantity: 1, lineTotal: unitPrice, serviceStart: t0, serviceEnd: '2026-12-31T00:00:00.000Z', serviceScope: 'synthetic-ai-seat', entitlementType: 'ai-seat', entitlementLimit: 1 });

class Idempotency implements IdempotencyPort { private entries = new Map<string, Promise<unknown>>(); execute<T>(scope: string, key: string, op: () => Promise<T>): Promise<T> { const k = `${scope}:${key}`; const prior = this.entries.get(k); if (prior) return prior as Promise<T>; const result = op(); this.entries.set(k, result); return result; } }
class Auth implements AuthorizationPort { allowed = true; requests: Parameters<AuthorizationPort['authorize']>[0][] = []; async authorize(input: Parameters<AuthorizationPort['authorize']>[0]) { this.requests.push(input); return { allowed: this.allowed && input.scope.customerId !== customerB, decisionReference: `synthetic-auth:${input.operation}` }; } }
class Evidence implements EvidenceApprovalPort { verified = true; async verify(input: Parameters<EvidenceApprovalPort['verify']>[0]) { return { verified: this.verified, verificationReference: `synthetic-approval:${input.operation}` }; } }
class Audit implements AuditPort { events: AuditEvent[] = []; async append(e: AuditEvent) { this.events.push(e); } }
class IDs { private value = 0; next(kind: string) { return `synthetic-${kind}-${++this.value}`; } }

class SyntheticStageBRepository implements ContractQuoteRepository {
  contracts = new Map<ContractId, ContractRecord>(); contractVersions = new Map<ContractVersionId, ContractVersionRecord>(); quotes = new Map<QuoteId, QuoteRecord>(); quoteVersions = new Map<QuoteVersionId, QuoteVersionRecord>(); acceptances = new Map<AcceptanceId, CustomerAcceptanceRecord>();
  async getContract(id: ContractId) { return this.contracts.get(id) ?? null; } async getContractVersion(id: ContractVersionId) { return this.contractVersions.get(id) ?? null; } async listContractVersions(id: ContractId) { return [...this.contractVersions.values()].filter(v => v.contractId === id); } async listContractVersionsForAcceptedQuote(id: QuoteVersionId) { return [...this.contractVersions.values()].filter(v => v.quoteVersionId === id).map(v => v.id); } async insertContract(v: ContractRecord) { this.contracts.set(v.id, v); } async insertContractVersion(v: ContractVersionRecord) { this.contractVersions.set(v.id, v); }
  async getQuote(id: QuoteId) { return this.quotes.get(id) ?? null; } async getQuoteVersion(id: QuoteVersionId) { return this.quoteVersions.get(id) ?? null; } async listQuoteVersions(id: QuoteId) { return [...this.quoteVersions.values()].filter(v => v.quoteId === id); } async insertQuote(v: QuoteRecord) { this.quotes.set(v.id, v); } async insertQuoteVersion(v: QuoteVersionRecord) { this.quoteVersions.set(v.id, v); }
  async getAcceptance(id: AcceptanceId) { return this.acceptances.get(id) ?? null; } async findAcceptanceForQuoteVersion(id: QuoteVersionId) { return [...this.acceptances.values()].find(a => a.quoteVersionId === id) ?? null; } async insertAcceptance(v: CustomerAcceptanceRecord) { this.acceptances.set(v.id, v); }
}

class SyntheticStageCRepository implements StageCRepository {
  orders = new Map<StageCOrderId, OrderRecord>(); orderVersions = new Map<OrderVersionId, OrderVersionRecord>(); orderEvents: OrderLifecycleEvent[] = [];
  subscriptions = new Map<SubscriptionId, SubscriptionRecord>(); subscriptionVersions = new Map<SubscriptionVersionId, SubscriptionVersionRecord>(); subscriptionEvents: SubscriptionLifecycleEvent[] = [];
  entitlements = new Map<EntitlementId, EntitlementRecord>(); entitlementEvents: EntitlementLifecycleEvent[] = [];
  private guards = new Map<string, Promise<void>>();
  private async guard<T>(key: string, operation: () => Promise<T>): Promise<T> { const previous = this.guards.get(key) ?? Promise.resolve(); let release!: () => void; const current = new Promise<void>(resolve => { release = resolve; }); this.guards.set(key, current); await previous; try { return await operation(); } finally { release(); if (this.guards.get(key) === current) this.guards.delete(key); } }
  withOrderAuthorityGuard<T>(quoteVersionId: QuoteVersionId, acceptanceId: AcceptanceId, operation: () => Promise<T>) { return this.guard(`order:${quoteVersionId}:${acceptanceId}`, operation); }
  withSubscriptionSourceGuard<T>(orderVersionId: OrderVersionId, orderLineId: StageCOrderLineId, operation: () => Promise<T>) { return this.guard(`subscription:${orderVersionId}:${orderLineId}`, operation); }
  withEntitlementSourceGuard<T>(versionId: SubscriptionVersionId, type: string, target: EntitlementRecord['target'], operation: () => Promise<T>) { return this.guard(`entitlement:${versionId}:${type}:${targetId(target)}`, operation); }
  async findOrderForAuthority(quoteVersionId: QuoteVersionId, acceptanceId: AcceptanceId) { return [...this.orders.values()].find(v => v.quoteVersionId === quoteVersionId && v.acceptanceId === acceptanceId) ?? null; } async insertOrder(v: OrderRecord) { this.orders.set(v.id, v); } async getOrder(id: StageCOrderId) { return this.orders.get(id) ?? null; } async listOrderVersions(id: StageCOrderId) { return [...this.orderVersions.values()].filter(v => v.orderId === id); } async insertOrderVersion(v: OrderVersionRecord) { this.orderVersions.set(v.id, v); } async listOrderEvents(id: StageCOrderId) { return this.orderEvents.filter(e => e.orderId === id); } async appendOrderEvent(e: OrderLifecycleEvent) { this.orderEvents.push(e); } async getOrderVersion(id: OrderVersionId) { return this.orderVersions.get(id) ?? null; }
  async insertSubscription(v: SubscriptionRecord) { this.subscriptions.set(v.id, v); } async getSubscription(id: SubscriptionId) { return this.subscriptions.get(id) ?? null; } async findSubscriptionForSource(orderVersionId: OrderVersionId, orderLineId: StageCOrderLineId) { const v = [...this.subscriptionVersions.values()].find(x => x.orderVersionId === orderVersionId && this.subscriptions.get(x.subscriptionId)?.orderLineId === orderLineId); return v ? this.subscriptions.get(v.subscriptionId) ?? null : null; } async listSubscriptionVersions(id: SubscriptionId) { return [...this.subscriptionVersions.values()].filter(v => v.subscriptionId === id); } async insertSubscriptionVersion(v: SubscriptionVersionRecord) { this.subscriptionVersions.set(v.id, v); } async listSubscriptionEvents(id: SubscriptionId) { return this.subscriptionEvents.filter(e => e.subscriptionId === id); } async appendSubscriptionEvent(e: SubscriptionLifecycleEvent) { this.subscriptionEvents.push(e); } async getSubscriptionVersion(id: SubscriptionVersionId) { return this.subscriptionVersions.get(id) ?? null; }
  async insertEntitlement(v: EntitlementRecord) { this.entitlements.set(v.id, v); } async getEntitlement(id: EntitlementId) { return this.entitlements.get(id) ?? null; } async findEntitlementForSource(versionId: SubscriptionVersionId, type: string, target: EntitlementRecord['target']) { return [...this.entitlements.values()].find(e => e.subscriptionVersionId === versionId && e.entitlementType === type && targetId(e.target) === targetId(target)) ?? null; } async listEntitlementEvents(id: EntitlementId) { return this.entitlementEvents.filter(e => e.entitlementId === id); } async appendEntitlementEvent(e: EntitlementLifecycleEvent) { this.entitlementEvents.push(e); }
}

function fixture(contractEnd = '2027-01-01T00:00:00.000Z') {
  const auth = new Auth(); const evidence = new Evidence(); const audit = new Audit(); const stageBRepo = new SyntheticStageBRepository(); const stageCRepo = new SyntheticStageCRepository(); const ids = new IDs(); let now = t0; let quoteLineMatches = true;
  const bDeps: StageBDependencies = { repository: stageBRepo, authorization: auth, evidenceApprovals: evidence, idempotency: new Idempotency(), audit, clock: { now: () => now }, ids: { next: kind => ids.next(`b-${kind}`) } };
  const stageB = new ContractQuoteService(bDeps);
  const scope = { async resolveTenantMapping(_actor: CommercialActor, tenantId: TechnicalTenantId, asOf: string): Promise<TenantMappingResolution> { return tenantId === actor.tenantId && Date.parse(asOf) >= Date.parse(t0) ? { status: 'matched', tenantId, asOf, mapping: { id: 'synthetic-map' as never, tenantId, customerId: customerA, organisationId: null, legalEntityId: null, billingAccountId: null, effectiveFrom: t0, effectiveTo: null, evidenceReference: 'synthetic-map-evidence', approvedBy: actor.id, createdBy: actor.id, createdAt: t0, correlationId: 'synthetic-map-corr' } } : { status: 'unlinked', tenantId, asOf }; } };
  const cDeps: StageCDependencies = { repository: stageCRepo, authority: stageB, commercialScope: scope, acceptedQuoteLines: { async verify({ line }) { return { matched: quoteLineMatches && line.acceptedQuoteLineReference.startsWith('synthetic-quote-line:') && line.product.productId === product.productId, verificationReference: 'synthetic-accepted-line-verification' }; } }, authorization: auth, evidenceApprovals: evidence, idempotency: new Idempotency(), audit, clock: { now: () => now }, ids: { next: kind => ids.next(`c-${kind}`) } };
  const stageC = new OrderSubscriptionService(cDeps);
  return { stageB, stageC, stageBRepo, stageCRepo, auth, evidence, audit, setNow: (value: string) => { now = value; }, setQuoteLineMatches: (value: boolean) => { quoteLineMatches = value; }, contractEnd };
}
function cmd(key: string) { return { reason: 'Synthetic Stage C operation', idempotencyKey: key, correlationId: `corr:${key}`, evidence: approval }; }
async function authority(f: ReturnType<typeof fixture>) {
  const contract = await f.stageB.createContract(actor, { ...cmd('b-contract'), customerId: customerA, authorityPath: 'contract_first' });
  const contractVersion = await f.stageB.createContractVersion(actor, { ...cmd('b-contract-version'), contractId: contract.id, effectiveFrom: t0, effectiveTo: f.contractEnd, terms: { synthetic: true } });
  const quote = await f.stageB.createQuote(actor, { ...cmd('b-quote'), customerId: customerA, contractId: contract.id });
  const quoteVersion = await f.stageB.createQuoteVersion(actor, { ...cmd('b-quote-version'), quoteId: quote.id, validFrom: t0, validUntil: '2027-01-01T00:00:00.000Z', contractVersionId: contractVersion.id, snapshot: { currency: 'ZAR', amount: 85 } });
  const acceptance = await f.stageB.acceptQuoteVersion(actor, { ...cmd('b-acceptance'), quoteVersionId: quoteVersion.id, acceptingActorId: 'synthetic-signer', method: 'synthetic', acceptedAt: t0 });
  return { contract, contractVersion, quote, quoteVersion, acceptance };
}
async function acceptedAmendmentAuthority(f: ReturnType<typeof fixture>, base: Awaited<ReturnType<typeof authority>>, key: string, effectiveFrom: string) {
  const quote = await f.stageB.createQuote(actor, { ...cmd(`${key}-quote`), customerId: customerA, contractId: base.contract.id });
  const quoteVersion = await f.stageB.createQuoteVersion(actor, { ...cmd(`${key}-qv`), quoteId: quote.id, validFrom: effectiveFrom, validUntil: '2027-01-01T00:00:00.000Z', contractVersionId: base.contractVersion.id, snapshot: { currency: 'ZAR', amount: 90 } });
  const acceptance = await f.stageB.acceptQuoteVersion(actor, { ...cmd(`${key}-accept`), quoteVersionId: quoteVersion.id, acceptingActorId: `signer-${key}`, method: 'synthetic-amendment-acceptance', acceptedAt: effectiveFrom });
  return { quoteVersion, acceptance };
}
async function createOrder(f: ReturnType<typeof fixture>, opts: { customer?: CustomerId; at?: string; quoteVersionId?: QuoteVersionId; expectedAcceptanceId?: AcceptanceId; lines?: readonly ReturnType<typeof line>[]; existingOrderId?: string } = {}) {
  const authorityRefs = await authority(f); const input = { ...cmd(`order:${opts.at ?? t0}`), customerId: opts.customer ?? customerA, quoteVersionId: opts.quoteVersionId ?? authorityRefs.quoteVersion.id, expectedContractVersionId: authorityRefs.contractVersion.id, expectedAcceptanceId: opts.expectedAcceptanceId ?? authorityRefs.acceptance.id, effectiveFrom: opts.at ?? t0, technicalTenantId: actor.tenantId, existingOrderId: opts.existingOrderId, lines: opts.lines ?? [line()] };
  return { authorityRefs, input, result: await f.stageC.createOrder(actor, input) };
}
function targetId(target: EntitlementRecord['target']): string { return target ? `${target.type}:${target.id}` : 'null'; }

test('creates an order only from exact accepted Stage B authority and preserves immutable price/line snapshots', async () => {
  const f = fixture(); const { authorityRefs, input, result } = await createOrder(f); const retry = await f.stageC.createOrder(actor, input);
  assert.equal(retry.order.id, result.order.id); assert.equal(retry.version.id, result.version.id); assert.equal(f.stageCRepo.orders.size, 1);
  assert.equal(result.order.customerId, customerA); assert.equal(result.order.quoteVersionId, authorityRefs.quoteVersion.id); assert.equal(result.order.acceptanceId, authorityRefs.acceptance.id);
  assert.equal(result.version.lines[0].existingLineId, null); assert.equal(result.version.lines[0].product.unitPrice, '85.000000'); assert.equal(result.version.currency, 'ZAR');
  assert.equal(f.stageBRepo.acceptances.size, 1, 'order creation did not manufacture a Stage B acceptance');
  assert.equal(Object.isFrozen(result.version), true); assert.equal(Object.isFrozen(result.version.lines[0].product), true);
  assert.throws(() => { (result.version.lines[0].product as { unitPrice: string }).unitPrice = '0'; }, TypeError);
  await assert.rejects(() => f.stageC.createOrder(actor, { ...cmd('second-order-same-authority'), customerId: customerA, quoteVersionId: authorityRefs.quoteVersion.id, expectedContractVersionId: authorityRefs.contractVersion.id, expectedAcceptanceId: authorityRefs.acceptance.id, effectiveFrom: t0, technicalTenantId: actor.tenantId, lines: [line()] }), StageCError);
});

test('concurrent distinct commands cannot create two orders for one accepted quote authority', async () => {
  const f = fixture(); const refs = await authority(f); const base = { ...cmd('order-concurrent-a'), customerId: customerA, quoteVersionId: refs.quoteVersion.id, expectedContractVersionId: refs.contractVersion.id, expectedAcceptanceId: refs.acceptance.id, effectiveFrom: t0, technicalTenantId: actor.tenantId, lines: [line()] };
  const outcomes = await Promise.allSettled([f.stageC.createOrder(actor, base), f.stageC.createOrder(actor, { ...base, ...cmd('order-concurrent-b') })]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1); assert.equal(f.stageCRepo.orders.size, 1); assert.equal(f.stageCRepo.orderVersions.size, 1);
});

test('preserves supplied legacy order and order-line identifiers and rejects a price snapshot not verified against the accepted quote', async () => {
  const f = fixture();
  const { result } = await createOrder(f, { existingOrderId: 'legacy-order-id-1', lines: [{ ...line(), existingLineId: 'legacy-order-line-id-1' }] });
  assert.equal(result.order.id, 'legacy-order-id-1'); assert.equal(result.order.existingOrderId, 'legacy-order-id-1');
  assert.equal(result.version.lines[0].id, 'legacy-order-line-id-1');
  const denied = fixture(); denied.setQuoteLineMatches(false);
  await assert.rejects(() => createOrder(denied), StageCError);
  assert.equal(denied.stageCRepo.orders.size, 0);
});

test('rejects missing acceptance, wrong version, expired authority and cross-customer authority', async () => {
  const noAccept = fixture();
  const contract = await noAccept.stageB.createContract(actor, { ...cmd('missing-contract'), customerId: customerA, authorityPath: 'contract_first' });
  const cv = await noAccept.stageB.createContractVersion(actor, { ...cmd('missing-cv'), contractId: contract.id, effectiveFrom: t0, effectiveTo: '2027-01-01T00:00:00.000Z', terms: {} });
  const q = await noAccept.stageB.createQuote(actor, { ...cmd('missing-q'), customerId: customerA, contractId: contract.id });
  const qv = await noAccept.stageB.createQuoteVersion(actor, { ...cmd('missing-qv'), quoteId: q.id, validFrom: t0, validUntil: '2027-01-01T00:00:00.000Z', contractVersionId: cv.id, snapshot: {} });
  await assert.rejects(() => noAccept.stageC.createOrder(actor, { ...cmd('order-no-acceptance'), customerId: customerA, quoteVersionId: qv.id, expectedContractVersionId: cv.id, expectedAcceptanceId: 'nonexistent' as AcceptanceId, effectiveFrom: t0, technicalTenantId: actor.tenantId, lines: [line()] }), StageCError);
  const f = fixture(); const auth = await authority(f);
  await assert.rejects(() => f.stageC.createOrder(actor, { ...cmd('order-wrong-acceptance'), customerId: customerA, quoteVersionId: auth.quoteVersion.id, expectedContractVersionId: auth.contractVersion.id, expectedAcceptanceId: 'wrong' as AcceptanceId, effectiveFrom: t0, technicalTenantId: actor.tenantId, lines: [line()] }), StageCError);
  const wrongVersion = await acceptedAmendmentAuthority(f, auth, 'wrong-quote-version', t1);
  await assert.rejects(() => f.stageC.createOrder(actor, { ...cmd('order-wrong-version'), customerId: customerA, quoteVersionId: wrongVersion.quoteVersion.id, expectedContractVersionId: auth.contractVersion.id, expectedAcceptanceId: auth.acceptance.id, effectiveFrom: t1, technicalTenantId: actor.tenantId, lines: [{ ...line(), serviceStart: t1 }] }), StageCError);
  await assert.rejects(() => f.stageC.createOrder(actor, { ...cmd('order-cross-customer'), customerId: customerB, quoteVersionId: auth.quoteVersion.id, expectedContractVersionId: auth.contractVersion.id, expectedAcceptanceId: auth.acceptance.id, effectiveFrom: t0, technicalTenantId: actor.tenantId, lines: [line()] }), StageCError);
  const expired = fixture('2026-04-01T00:00:00.000Z'); const expiredAuthority = await authority(expired);
  await assert.rejects(() => expired.stageC.createOrder(actor, { ...cmd('order-expired'), customerId: customerA, quoteVersionId: expiredAuthority.quoteVersion.id, expectedContractVersionId: expiredAuthority.contractVersion.id, expectedAcceptanceId: expiredAuthority.acceptance.id, effectiveFrom: '2026-04-01T00:00:00.000Z', technicalTenantId: actor.tenantId, lines: [{ ...line('90.000000'), serviceStart: '2026-04-01T00:00:00.000Z' }] }), StageCError);
  assert.equal(f.stageCRepo.orders.size, 0);
});

test('requires explicit active Stage A mapping for technical tenant scope and rejects unlinked scope', async () => {
  const f = fixture(); const refs = await authority(f);
  await assert.rejects(() => f.stageC.createOrder(actor, { ...cmd('unlinked-tenant'), customerId: customerA, quoteVersionId: refs.quoteVersion.id, expectedContractVersionId: refs.contractVersion.id, expectedAcceptanceId: refs.acceptance.id, effectiveFrom: t0, technicalTenantId: 'tenant-no-map' as TechnicalTenantId, lines: [line()] }), StageCError);
  assert.equal(f.stageCRepo.orders.size, 0);
});

test('denies unauthorized creation, amendment and subscription activation', async () => {
  const f = fixture(); const refs = await authority(f); f.auth.allowed = false;
  await assert.rejects(() => f.stageC.createOrder(actor, { ...cmd('unauthorized-order'), customerId: customerA, quoteVersionId: refs.quoteVersion.id, expectedContractVersionId: refs.contractVersion.id, expectedAcceptanceId: refs.acceptance.id, effectiveFrom: t0, technicalTenantId: actor.tenantId, lines: [line()] }), StageCError);
  f.auth.allowed = true; const { result } = await createOrder(f);
  await f.stageC.transitionOrder(actor, { ...cmd('activate-order'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const amendAuth = await acceptedAmendmentAuthority(f, refs, 'denied-amendment', t2);
  const sub = await f.stageC.createSubscription(actor, { ...cmd('subscription-denied-activation'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id });
  f.auth.allowed = false;
  await assert.rejects(() => f.stageC.amendOrder(actor, { ...cmd('denied-amend'), orderId: result.order.id, predecessorId: result.version.id, effectiveFrom: t2, quoteVersionId: amendAuth.quoteVersion.id, contractVersionId: refs.contractVersion.id, acceptanceId: amendAuth.acceptance.id, lines: [{ ...line('90.000000'), serviceStart: t2 }] }), StageCError);
  await assert.rejects(() => f.stageC.transitionSubscription(actor, { ...cmd('activation-denied'), subscriptionId: sub.subscription.id, to: 'active', effectiveAt: t2 }), StageCError);
});

test('amendments append multiple effective versions, retain history, and reject duplicate/overlapping starts', async () => {
  const f = fixture(); const base = await authority(f); const { result } = await createOrder(f);
  await f.stageC.transitionOrder(actor, { ...cmd('amend-active'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const a1 = await acceptedAmendmentAuthority(f, base, 'amendment-1', t2);
  const amend1Input = { ...cmd('amend1'), orderId: result.order.id, predecessorId: result.version.id, effectiveFrom: t2, quoteVersionId: a1.quoteVersion.id, contractVersionId: base.contractVersion.id, acceptanceId: a1.acceptance.id, lines: [{ ...line('90.000000'), serviceStart: t2 }] };
  const amend1 = await f.stageC.amendOrder(actor, amend1Input); const amend1Retry = await f.stageC.amendOrder(actor, amend1Input);
  assert.equal(amend1Retry.id, amend1.id); assert.equal(f.stageCRepo.orderVersions.size, 2);
  const a2 = await acceptedAmendmentAuthority(f, base, 'amendment-2', t3);
  const amend2 = await f.stageC.amendOrder(actor, { ...cmd('amend2'), orderId: result.order.id, predecessorId: amend1.id, effectiveFrom: t3, quoteVersionId: a2.quoteVersion.id, contractVersionId: base.contractVersion.id, acceptanceId: a2.acceptance.id, lines: [{ ...line('95.000000'), serviceStart: t3 }] });
  assert.equal(amend1.sequence, 2); assert.equal(amend2.sequence, 3); assert.equal(amend2.predecessorId, amend1.id);
  assert.equal(f.stageCRepo.orderVersions.get(result.version.id)?.lines[0].product.unitPrice, '85.000000');
  await assert.rejects(() => f.stageC.amendOrder(actor, { ...cmd('overlap'), orderId: result.order.id, predecessorId: amend2.id, effectiveFrom: t3, quoteVersionId: a2.quoteVersion.id, contractVersionId: base.contractVersion.id, acceptanceId: a2.acceptance.id, lines: [line()] }), StageCError);
});

test('cancellation is an explicit lifecycle event and blocks later subscription creation', async () => {
  const f = fixture(); const { result } = await createOrder(f);
  const cancelled = await f.stageC.transitionOrder(actor, { ...cmd('cancel-order'), orderId: result.order.id, to: 'cancelled', effectiveAt: t1 });
  assert.equal(cancelled.to, 'cancelled'); assert.equal(await f.stageC.getOrderStatus(result.order.id, t1), 'cancelled');
  f.setNow(t2);
  await assert.rejects(() => f.stageC.createSubscription(actor, { ...cmd('sub-cancelled'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id }), StageCError);
  assert.equal(f.stageCRepo.orderVersions.size, 1);
});

test('subscription creation is idempotent and creates a distinct pending version from an authorized order line', async () => {
  const f = fixture(); const { result } = await createOrder(f); const input = { ...cmd('subscription-create'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id };
  const first = await f.stageC.createSubscription(actor, input); const retry = await f.stageC.createSubscription(actor, input);
  assert.equal(first.subscription.id, retry.subscription.id); assert.equal(first.version.id, retry.version.id); assert.equal(first.version.status, 'pending');
  assert.equal(first.version.customerId, customerA); assert.equal(first.version.orderVersionId, result.version.id); assert.equal(f.stageCRepo.subscriptions.size, 1);
  await assert.rejects(() => f.stageC.createSubscription(actor, { ...input, ...cmd('subscription-second-command') }), StageCError);
});

test('concurrent distinct commands cannot create two subscriptions for one accepted order line', async () => {
  const f = fixture(); const { result } = await createOrder(f); const base = { ...cmd('subscription-concurrent-a'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id };
  const outcomes = await Promise.allSettled([f.stageC.createSubscription(actor, base), f.stageC.createSubscription(actor, { ...base, ...cmd('subscription-concurrent-b') })]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1); assert.equal(f.stageCRepo.subscriptions.size, 1); assert.equal(f.stageCRepo.subscriptionVersions.size, 1);
});

test('subscription activation, amendment linkage, cancellation and expiry use append-only lifecycle/version records', async () => {
  const f = fixture(); const base = await authority(f); const { result } = await createOrder(f);
  await f.stageC.transitionOrder(actor, { ...cmd('order-active'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const created = await f.stageC.createSubscription(actor, { ...cmd('subscription-one'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id });
  await f.stageC.transitionSubscription(actor, { ...cmd('subscription-active'), subscriptionId: created.subscription.id, to: 'active', effectiveAt: t2 });
  const amendmentAuthority = await acceptedAmendmentAuthority(f, base, 'sub-order-amendment-authority', t3);
  const amendedOrder = await f.stageC.amendOrder(actor, { ...cmd('sub-order-amend'), orderId: result.order.id, predecessorId: result.version.id, effectiveFrom: t3, quoteVersionId: amendmentAuthority.quoteVersion.id, contractVersionId: base.contractVersion.id, acceptanceId: amendmentAuthority.acceptance.id, lines: [{ ...line('90.000000'), serviceStart: t3 }] });
  const amendedSub = await f.stageC.amendSubscription(actor, { ...cmd('subscription-amend'), subscriptionId: created.subscription.id, predecessorId: created.version.id, orderVersionId: amendedOrder.id, orderLineId: amendedOrder.lines[0].id });
  assert.equal(amendedSub.predecessorId, created.version.id); assert.equal(amendedSub.orderVersionId, amendedOrder.id); assert.equal(created.version.product.unitPrice, '85.000000');
  await f.stageC.transitionSubscription(actor, { ...cmd('subscription-cancel'), subscriptionId: created.subscription.id, to: 'cancelled', effectiveAt: t4 });
  assert.deepEqual((await f.stageCRepo.listSubscriptionEvents(created.subscription.id)).map(e => e.to), ['pending', 'active', 'pending', 'cancelled']);
});

test('subscription expiration is effective only at the contractually defined service end', async () => {
  const f = fixture(); const { result } = await createOrder(f); await f.stageC.transitionOrder(actor, { ...cmd('expire-order-active'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const sub = await f.stageC.createSubscription(actor, { ...cmd('expire-sub-create'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id });
  await f.stageC.transitionSubscription(actor, { ...cmd('expire-sub-active'), subscriptionId: sub.subscription.id, to: 'active', effectiveAt: t2 });
  await assert.rejects(() => f.stageC.transitionSubscription(actor, { ...cmd('early-expire'), subscriptionId: sub.subscription.id, to: 'expired', effectiveAt: t3 }), StageCError);
  const end = '2026-12-31T00:00:00.000Z';
  await f.stageC.transitionSubscription(actor, { ...cmd('at-service-end'), subscriptionId: sub.subscription.id, to: 'expired', effectiveAt: end });
  assert.equal((await f.stageCRepo.listSubscriptionEvents(sub.subscription.id)).at(-1)?.to, 'expired');
});

test('entitlement remains distinct, scoped, limited and non-provisioning; it activates only with active subscription', async () => {
  const f = fixture(); const { result } = await createOrder(f); await f.stageC.transitionOrder(actor, { ...cmd('ord-active'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const sub = await f.stageC.createSubscription(actor, { ...cmd('sub-ent'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id });
  const target = { type: 'application' as const, id: 'application-explicit-synthetic', tenantId: actor.tenantId! };
  const ent = await f.stageC.createEntitlement(actor, { ...cmd('ent-create'), subscriptionId: sub.subscription.id, subscriptionVersionId: sub.version.id, entitlementType: 'ai-seat', limit: 1, effectiveFrom: t0, effectiveTo: '2026-12-31T00:00:00.000Z', target });
  assert.equal(ent.customerId, customerA); assert.equal(ent.target?.id, target.id); assert.equal('status' in ent, false, 'lifecycle is stored as append-only events'); assert.equal(ent.limit, 1);
  await assert.rejects(() => f.stageC.transitionEntitlement(actor, { ...cmd('ent-early-active'), entitlementId: ent.id, to: 'active', effectiveAt: t1 }), StageCError);
  await f.stageC.transitionSubscription(actor, { ...cmd('sub-ent-active'), subscriptionId: sub.subscription.id, to: 'active', effectiveAt: t2 });
  await f.stageC.transitionEntitlement(actor, { ...cmd('ent-active'), entitlementId: ent.id, to: 'active', effectiveAt: t3 });
  await f.stageC.transitionEntitlement(actor, { ...cmd('ent-expired'), entitlementId: ent.id, to: 'expired', effectiveAt: '2026-12-31T00:00:00.000Z' });
  assert.equal(f.stageCRepo.entitlements.size, 1); assert.equal(f.stageCRepo.entitlementEvents.at(-1)?.to, 'expired');
});

test('entitlement creation is idempotent, source-unique under concurrent commands, and authorization-gated', async () => {
  const f = fixture(); const { result } = await createOrder(f); await f.stageC.transitionOrder(actor, { ...cmd('ent-idem-order-active'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const sub = await f.stageC.createSubscription(actor, { ...cmd('ent-idem-sub'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id });
  const base = { ...cmd('entitlement-concurrent-a'), subscriptionId: sub.subscription.id, subscriptionVersionId: sub.version.id, entitlementType: 'api-seat', effectiveFrom: t0, effectiveTo: '2026-12-31T00:00:00.000Z', limit: 1 };
  const second = { ...base, ...cmd('entitlement-concurrent-b') }; const outcomes = await Promise.allSettled([f.stageC.createEntitlement(actor, base), f.stageC.createEntitlement(actor, second)]);
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1); assert.equal(f.stageCRepo.entitlements.size, 1); assert.equal(f.stageCRepo.entitlementEvents.length, 1);
  const existing = [...f.stageCRepo.entitlements.values()][0]; const winningInput = outcomes[0].status === 'fulfilled' ? base : second; const retry = await f.stageC.createEntitlement(actor, winningInput);
  assert.equal(retry.id, existing.id); assert.equal(f.stageCRepo.entitlements.size, 1);
  const denied = fixture(); const dOrder = await createOrder(denied); const dSub = await denied.stageC.createSubscription(actor, { ...cmd('entitlement-denied-sub'), orderId: dOrder.result.order.id, orderVersionId: dOrder.result.version.id, orderLineId: dOrder.result.version.lines[0].id }); denied.auth.allowed = false;
  await assert.rejects(() => denied.stageC.createEntitlement(actor, { ...cmd('entitlement-denied'), subscriptionId: dSub.subscription.id, subscriptionVersionId: dSub.version.id, entitlementType: 'api-seat', effectiveFrom: t0, effectiveTo: '2026-12-31T00:00:00.000Z' }), StageCError);
  assert.equal(denied.stageCRepo.entitlements.size, 0);
});

test('does not infer entitlement target from the technical tenant and rejects cross-tenant targets', async () => {
  const f = fixture(); const { result } = await createOrder(f); await f.stageC.transitionOrder(actor, { ...cmd('scope-order-active'), orderId: result.order.id, to: 'active', effectiveAt: t1 });
  const sub = await f.stageC.createSubscription(actor, { ...cmd('scope-sub'), orderId: result.order.id, orderVersionId: result.version.id, orderLineId: result.version.lines[0].id });
  const entitlement = await f.stageC.createEntitlement(actor, { ...cmd('no-inference-entitlement'), subscriptionId: sub.subscription.id, subscriptionVersionId: sub.version.id, entitlementType: 'ai-seat', effectiveFrom: t0, effectiveTo: '2026-12-31T00:00:00.000Z' });
  assert.equal(entitlement.target, null);
  await assert.rejects(() => f.stageC.createEntitlement(actor, { ...cmd('wrong-target-entitlement'), subscriptionId: sub.subscription.id, subscriptionVersionId: sub.version.id, entitlementType: 'ai-seat', effectiveFrom: t0, effectiveTo: '2026-12-31T00:00:00.000Z', target: { type: 'technical_tenant', id: 'tenant-technical-b' as TechnicalTenantId } }), StageCError);
});

test('audit carries commercial and technical scope, actor, evidence, authority and correlation', async () => {
  const f = fixture(); const { result } = await createOrder(f); const entry = f.audit.events.find(e => e.targetId === result.order.id)!;
  assert.equal(entry.customerId, customerA); assert.equal(entry.tenantId, actor.tenantId); assert.equal(entry.actorId, actor.id); assert.ok(entry.authorizationDecisionReference); assert.ok(entry.evidenceVerificationReference); assert.equal(entry.correlationId, 'corr:order:2026-01-01T00:00:00.000Z');
});
