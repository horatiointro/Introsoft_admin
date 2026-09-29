import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditEvent, AuditPort, AuthorizationPort, CommercialActor, CommercialActorId, CustomerId, EvidenceApprovalPort, IdempotencyPort, TechnicalTenantId } from '../stageA/partyAccount';
import { EntitlementId, EntitlementLifecycleEvent, EntitlementRecord, OrderVersionId, SubscriptionId, SubscriptionLifecycleEvent, SubscriptionRecord, SubscriptionVersionId, SubscriptionVersionRecord } from '../stageC/ordersSubscriptions';
import { BudgetPolicyId, BudgetQuotaPolicy, BudgetQuotaRepository, CustomerCharge, CustomerChargeId, CustomerChargeRepository, FxRate, ProviderCost, ProviderCostId, ProviderCostRepository, ProviderModelRegistryReadPort, ProviderModelResolution, RatingDecision, RatingId, RatingRepository, RatingRule, RatingRuleRepository, StageDDependencies, StageDRepository, UsageAttributionResolution, UsageEvent, UsageEventId, UsageEventRepository, UsageProcessingAttempt, UsageProcessingAttemptRepository, UsageRatingService, evaluateBudgetQuota, evaluateProvisioningEligibility } from './usageRating';

const actor: CommercialActor = { id: 'stage-d-synthetic-actor' as CommercialActorId, tenantId: 'tenant-tech-a' as TechnicalTenantId };
const customerA = 'customer-commercial-a' as CustomerId; const customerB = 'customer-commercial-b' as CustomerId;
const tenantA = 'tenant-tech-a' as TechnicalTenantId; const entitlementId = 'entitlement-a' as EntitlementId; const subscriptionId = 'subscription-a' as SubscriptionId;
const t0 = '2026-01-01T00:00:00.000Z'; const t1 = '2026-01-02T00:00:00.000Z'; const t2 = '2026-01-03T00:00:00.000Z';
const evidence = { evidenceReference: 'synthetic-stage-d-evidence', approvedBy: 'synthetic-approver' as CommercialActorId };

class Idempotency implements IdempotencyPort { private results = new Map<string, Promise<unknown>>(); execute<T>(scope: string, key: string, operation: () => Promise<T>): Promise<T> { const full = `${scope}:${key}`; const prior = this.results.get(full); if (prior) return prior as Promise<T>; const current = operation(); this.results.set(full, current); return current; } }
class Auth implements AuthorizationPort { allowed = true; requests: Parameters<AuthorizationPort['authorize']>[0][] = []; async authorize(input: Parameters<AuthorizationPort['authorize']>[0]) { this.requests.push(input); return { allowed: this.allowed, decisionReference: `synthetic-auth:${input.operation}` }; } }
class Evidence implements EvidenceApprovalPort { verified = true; async verify(input: Parameters<EvidenceApprovalPort['verify']>[0]) { return { verified: this.verified, verificationReference: `synthetic-evidence:${input.operation}` }; } }
class Audit implements AuditPort { events: AuditEvent[] = []; async append(event: AuditEvent) { this.events.push(event); } }
class IDs { private n = 0; next(kind: string) { return `synthetic-${kind}-${++this.n}`; } }
class Guard { private locks = new Map<string, Promise<void>>(); async run<T>(key: string, operation: () => Promise<T>): Promise<T> { const previous = this.locks.get(key) ?? Promise.resolve(); let release!: () => void; const current = new Promise<void>(resolve => { release = resolve; }); this.locks.set(key, current); await previous; try { return await operation(); } finally { release(); if (this.locks.get(key) === current) this.locks.delete(key); } } }

class UsageRepo implements UsageEventRepository {
  rows = new Map<UsageEventId, UsageEvent>(); private guards = new Guard();
  withSourceGuard<T>(ns: string, sourceId: string, operation: () => Promise<T>) { return this.guards.run(`${ns}:${sourceId}`, operation); }
  async findBySource(ns: string, sourceId: string) { return [...this.rows.values()].find(r => r.sourceNamespace === ns && r.sourceEventId === sourceId) ?? null; }
  async get(id: UsageEventId) { return this.rows.get(id) ?? null; }
  async insert(event: UsageEvent) { this.rows.set(event.id, event); }
}
class UsageAttemptsRepo implements UsageProcessingAttemptRepository {
  rows: UsageProcessingAttempt[] = []; private guards = new Guard();
  withEventGuard<T>(id: UsageEventId, operation: () => Promise<T>) { return this.guards.run(String(id), operation); }
  async listForEvent(id: UsageEventId) { return this.rows.filter(row => row.usageEventId === id); }
  async append(value: UsageProcessingAttempt) { this.rows.push(value); }
}
class CostRepo implements ProviderCostRepository {
  rows = new Map<ProviderCostId, ProviderCost>(); private guards = new Guard();
  withEventGuard<T>(id: UsageEventId, version: string, operation: () => Promise<T>) { return this.guards.run(`${id}:${version}`, operation); }
  async findForEvent(id: UsageEventId, version?: string) { return [...this.rows.values()].find(r => r.usageEventId === id && (!version || r.priceVersion === version)) ?? null; }
  async get(id: ProviderCostId) { return this.rows.get(id) ?? null; }
  async insert(cost: ProviderCost) { this.rows.set(cost.id, cost); }
}
class RulesRepo implements RatingRuleRepository {
  rows = new Map<string, RatingRule>(); async get(id: string, version: string) { return this.rows.get(`${id}:${version}`) ?? null; }
}
class RatingsRepo implements RatingRepository {
  rows = new Map<RatingId, RatingDecision>(); private guards = new Guard();
  withSourceGuard<T>(source: string, operation: () => Promise<T>) { return this.guards.run(source, operation); }
  async findForSource(source: string) { return [...this.rows.values()].find(r => r.sourceIdentity === source) ?? null; }
  async findSupersededRating(eventId: UsageEventId, ruleId: string) { return [...this.rows.values()].filter(r => r.usageEventId === eventId && r.ruleId === ruleId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null; }
  async findRatingById(id: RatingId) { return this.rows.get(id) ?? null; }
  async insert(value: RatingDecision) { this.rows.set(value.id, value); }
}
class ChargesRepo implements CustomerChargeRepository {
  rows = new Map<CustomerChargeId, CustomerCharge>(); failNext = false;
  async findForSource(source: string) { return [...this.rows.values()].find(r => r.sourceIdentity === source) ?? null; }
  async insert(value: CustomerCharge) { if (this.failNext) { this.failNext = false; throw new Error('synthetic partial write failure'); } this.rows.set(value.id, value); }
}
class BudgetsRepo implements BudgetQuotaRepository {
  policy: BudgetQuotaPolicy | null = null; quantity = 0; spend = 0;
  async getPolicy() { return this.policy; }
  async getConsumption() { return { quantity: this.quantity, spend: this.spend }; }
}

function fixture() {
  const auth = new Auth(); const evidenceVerifier = new Evidence(); const audit = new Audit(); const ids = new IDs();
  const repo: StageDRepository = { usage: new UsageRepo(), usageAttempts: new UsageAttemptsRepo(), providerCosts: new CostRepo(), ratingRules: new RulesRepo(), ratings: new RatingsRepo(), charges: new ChargesRepo(), budgets: new BudgetsRepo() };
  let now = t1; let resolution: UsageAttributionResolution = { status: 'linked', customerId: customerA, entitlementId, subscriptionId, orderVersionId: 'order-version-a' as OrderVersionId, subscriptionVersionId: 'subscription-version-a' as SubscriptionVersionId };
  let modelResolution: ProviderModelResolution = { providerId: 'provider-synthetic', modelId: 'model-synthetic', status: 'resolved', approved: true, available: true, capabilities: ['chat'], region: 'synthetic-region', pricingReference: 'synthetic-catalog-ref', pricingVersion: 'catalog-v1' };
  const deps: StageDDependencies = { repository: repo, attribution: { async resolve() { return resolution; } }, providerModels: { async resolve() { return modelResolution; } }, authorization: auth, evidenceApprovals: evidenceVerifier, idempotency: new Idempotency(), audit, clock: { now: () => now }, ids: { next: kind => ids.next(kind) } };
  const service = new UsageRatingService(deps);
  return { service, repo, auth, evidenceVerifier, audit, setNow: (v: string) => { now = v; }, setResolution: (v: UsageAttributionResolution) => { resolution = v; }, setModelResolution: (v: ProviderModelResolution) => { modelResolution = v; } };
}
function usageInput(sourceEventId: string, overrides: Partial<Parameters<UsageRatingService['recordUsage']>[1]> = {}) {
  return { sourceNamespace: 'synthetic-gateway', sourceEventId, providerId: 'provider-synthetic', modelId: 'model-synthetic', requestId: `request:${sourceEventId}`, correlationId: `corr:${sourceEventId}`, occurredAt: t0, technicalTenantId: tenantA, applicationId: 'app-synthetic', apiConsumerId: 'consumer-synthetic', serviceAccountId: null, credentialId: 'credential-ref-synthetic', userId: null, claimedCustomerId: null, claimedEntitlementId: null, claimedSubscriptionId: null, quantity: 100, unit: 'token' as const, usageCurrency: null, dataClassification: 'synthetic-public', policyReference: 'policy-v1', source: 'synthetic', reason: 'synthetic usage ingestion', evidence, idempotencyKey: `usage:${sourceEventId}`, ...overrides };
}
const usageRule = (overrides: Partial<RatingRule> = {}): RatingRule => ({ id: 'rule-synthetic', version: 'v1', model: 'usage_based', productId: 'product-synthetic', service: 'model-inference', usageUnit: 'token', customerCurrency: 'USD', effectiveFrom: t0, effectiveTo: null, requiresEntitlement: true, unitPrice: 0.002, ...overrides } as RatingRule);
async function record(f: ReturnType<typeof fixture>, input = usageInput('event-a')) { return f.service.recordUsage(actor, input); }
async function cost(f: ReturnType<typeof fixture>, event: UsageEvent, overrides: Partial<Parameters<UsageRatingService['recordProviderCost']>[1]> = {}) { return f.service.recordProviderCost(actor, { usageEventId: event.id, providerId: event.providerId, modelId: event.modelId, usageBasis: event.unit, quantity: event.quantity, unitCost: 0.001, currency: 'USD', priceVersion: 'provider-price-v1', provenance: 'synthetic', effectiveAt: event.occurredAt, correlationId: event.correlationId, reason: 'synthetic provider cost', evidence, idempotencyKey: `cost:${event.id}`, ...overrides }); }
async function rate(f: ReturnType<typeof fixture>, event: UsageEvent, rule: RatingRule, overrides: Partial<Parameters<UsageRatingService['rateAndCreateCharge']>[1]> = {}) { (f.repo.ratingRules as RulesRepo).rows.set(`${rule.id}:${rule.version}`, rule); return f.service.rateAndCreateCharge(actor, { usageEventId: event.id, rule, correlationId: event.correlationId, reason: 'synthetic rating', evidence, idempotencyKey: `rate:${event.id}:${rule.version}`, ...overrides }); }

test('provisioning eligibility distinguishes eligible, authority, expiry, suspension, missing target and invalid entitlement', async () => {
  const entitlement = { id: entitlementId, customerId: customerA, subscriptionId, subscriptionVersionId: 'subscription-version-a' as SubscriptionVersionId, orderId: 'order-a' as never, orderVersionId: 'order-version-a' as OrderVersionId, productId: 'product-a', entitlementType: 'model-access', quantity: 1, limit: 100, effectiveFrom: t0, effectiveTo: t2, target: { type: 'technical_tenant' as const, id: tenantA }, createdAt: t0, createdBy: actor.id } satisfies EntitlementRecord;
  const subscription = { id: subscriptionId, customerId: customerA, orderId: entitlement.orderId, orderLineId: 'line-a' as never, createdAt: t0, createdBy: actor.id } satisfies SubscriptionRecord;
  const subVersion = { id: 'subscription-version-a' as SubscriptionVersionId, subscriptionId, sequence: 1, predecessorId: null, orderVersionId: entitlement.orderVersionId, customerId: customerA, product: {} as never, quantity: 1, serviceScope: 'model', serviceStart: t0, serviceEnd: t2, cadence: 'monthly', status: 'pending', createdAt: t0, createdBy: actor.id } satisfies SubscriptionVersionRecord;
  const entitlementEvents: EntitlementLifecycleEvent[] = [{ id: 'ent-active', entitlementId, from: 'pending', to: 'active', effectiveAt: t0, reason: 'synthetic', actorId: actor.id, correlationId: 'corr' }];
  const subscriptionEvents: SubscriptionLifecycleEvent[] = [{ id: 'sub-active', subscriptionId, from: 'pending', to: 'active', effectiveAt: t0, reason: 'synthetic', actorId: actor.id, correlationId: 'corr' }];
  const base = { entitlement, entitlementEvents, subscription, subscriptionVersion: subVersion, subscriptionEvents, asOf: t1, commercialAuthorityVerified: true, targetScopeVerified: true, requiredPolicyConditionsSatisfied: true, targetRequired: true };
  assert.equal(evaluateProvisioningEligibility(base).reason, 'eligible');
  assert.equal(evaluateProvisioningEligibility({ ...base, commercialAuthorityVerified: false }).reason, 'missing_authority');
  assert.equal(evaluateProvisioningEligibility({ ...base, asOf: t2 }).reason, 'expired');
  assert.equal(evaluateProvisioningEligibility({ ...base, entitlementEvents: [...entitlementEvents, { ...entitlementEvents[0], to: 'suspended', effectiveAt: t1 }] }).reason, 'suspended');
  assert.equal(evaluateProvisioningEligibility({ ...base, entitlement: { ...entitlement, target: null } }).reason, 'missing_required_technical_target');
  assert.equal(evaluateProvisioningEligibility({ ...base, targetScopeVerified: false }).reason, 'not_eligible');
  assert.equal(evaluateProvisioningEligibility({ ...base, requiredPolicyConditionsSatisfied: false }).reason, 'not_eligible');
  assert.equal(evaluateProvisioningEligibility({ ...base, subscriptionVersion: { ...subVersion, customerId: customerB } }).reason, 'invalid_entitlement');
  const f = fixture(); const decision = await f.service.evaluateProvisioning(actor, { ...base, reason: 'eligibility review', correlationId: 'prov-corr', evidence });
  assert.equal(decision.eligible, true); assert.equal('createUser' in f.service, false); assert.equal('provision' in f.service, false);
});

test('usage retains explicit separate identities, unlinked/ambiguous states, duplicates and late events', async () => {
  const f = fixture(); const event = await record(f); const duplicate = await f.service.recordUsage(actor, { ...usageInput('event-a'), idempotencyKey: 'usage-replay-different-key' });
  assert.equal(event.id, duplicate.id); assert.equal((f.repo.usage as UsageRepo).rows.size, 1); assert.equal(event.customerId, customerA); assert.equal(event.technicalTenantId, tenantA); assert.notEqual(event.customerId as string, event.technicalTenantId as string);
  f.setResolution({ status: 'unlinked' }); const unlinked = await record(f, usageInput('unlinked')); assert.equal(unlinked.customerId, null); assert.equal(unlinked.entitlementId, null);
  f.setResolution({ status: 'ambiguous', reason: 'multiple_matches' }); const ambiguous = await record(f, usageInput('ambiguous')); assert.equal(ambiguous.attributionStatus, 'ambiguous'); assert.equal(ambiguous.customerId, null);
  f.setResolution({ status: 'linked', customerId: customerA, entitlementId, subscriptionId, orderVersionId: 'order-version-a' as OrderVersionId, subscriptionVersionId: 'subscription-version-a' as SubscriptionVersionId });
  const late = await record(f, usageInput('late', { lateThresholdMs: 1 })); assert.equal(late.status, 'late');
  await assert.rejects(() => record(f, usageInput('spoof-customer', { claimedCustomerId: customerB })), /Claimed customer/);
  await assert.rejects(() => f.service.rateAndCreateCharge(actor, { usageEventId: unlinked.id, rule: usageRule(), correlationId: 'c', reason: 'test', evidence, idempotencyKey: 'u' }), /Unlinked usage/);
});

test('usage source identity guard serializes concurrent duplicate delivery and failed attribution remains unbillable', async () => {
  const f = fixture(); const input = usageInput('race'); const results = await Promise.all([f.service.recordUsage(actor, input), f.service.recordUsage(actor, { ...input, idempotencyKey: 'race-alt-key' })]);
  assert.equal(results[0].id, results[1].id); assert.equal((f.repo.usage as UsageRepo).rows.size, 1);
  await assert.rejects(() => record(f, usageInput('race', { quantity: 101, idempotencyKey: 'conflicting-replay-key' })), /conflicting immutable usage data/);
  f.setResolution({ status: 'linked', customerId: customerA, entitlementId, subscriptionId, orderVersionId: 'order-version-a' as OrderVersionId, subscriptionVersionId: 'subscription-version-a' as SubscriptionVersionId });
  const failed = await record(f, usageInput('retryable', { sourceEventId: 'retryable' })); assert.equal(failed.status, 'recorded');
});

test('same request ID with different source event IDs remains distinguishable pending source-specific reconciliation', async () => {
  const f = fixture(); const first = await record(f, usageInput('same-request-event-1', { requestId: 'same-request' })); const second = await record(f, usageInput('same-request-event-2', { requestId: 'same-request' }));
  assert.notEqual(first.id, second.id); assert.equal(first.requestId, second.requestId); assert.equal((f.repo.usage as UsageRepo).rows.size, 2);
});

test('out-of-order arrivals preserve event time and received time independently', async () => {
  const f = fixture(); f.setNow(t2); const later = await record(f, usageInput('later', { occurredAt: t1 })); f.setNow(t1); const earlier = await record(f, usageInput('earlier', { occurredAt: t0 }));
  assert.equal(later.occurredAt, t1); assert.equal(earlier.occurredAt, t0); assert.ok(later.receivedAt > earlier.receivedAt); assert.equal((f.repo.usage as UsageRepo).rows.size, 2);
});

test('failed usage processing retains an attempt and can retry explicitly without rewriting the raw event', async () => {
  const f = fixture(); const event = await record(f); const failed = await f.service.recordUsageOutcome(actor, { usageEventId: event.id, outcome: 'failed', reason: 'synthetic transient failure', correlationId: 'failure-corr', evidence, idempotencyKey: 'attempt-1' });
  await assert.rejects(() => rate(f, event, usageRule()), /failed or rejected processing outcome/);
  const accepted = await f.service.recordUsageOutcome(actor, { usageEventId: event.id, outcome: 'accepted', retryOfAttemptId: failed.id, reason: 'synthetic retry succeeded', correlationId: 'retry-corr', evidence, idempotencyKey: 'attempt-2' });
  assert.equal(accepted.attempt, 2); assert.equal(accepted.retryOfAttemptId, failed.id); assert.equal((await rate(f, event, usageRule())).charge.status, 'ready_for_financial_processing');
  assert.equal((await f.repo.usage.get(event.id))?.status, 'recorded');
});

test('provider cost records retain measured basis, price version, currency, provenance and idempotent identity', async () => {
  const f = fixture(); const event = await record(f); const first = await cost(f, event); const retry = await cost(f, event, { idempotencyKey: 'provider-cost-replay' });
  assert.equal(first.id, retry.id); assert.equal(first.amount, 0.1); assert.equal(first.currency, 'USD'); assert.equal(first.priceVersion, 'provider-price-v1'); assert.equal(first.provenance, 'synthetic');
  await assert.rejects(() => cost(f, event, { quantity: event.quantity + 1 }), /measured basis/);
});

test('deterministic rating supports fixed/unit, request packs and usage pricing', async () => {
  const f = fixture(); const event = await record(f, usageInput('pricing', { quantity: 23, unit: 'request' }));
  const fixed = await rate(f, event, usageRule({ id: 'fixed', model: 'fixed_unit', usageUnit: 'request', unitPrice: 0.25 })); assert.equal(fixed.rating.customerCharge, 5.75); assert.equal(fixed.charge.status, 'ready_for_financial_processing');
  const packedEvent = await record(f, usageInput('pack-pricing', { quantity: 23, unit: 'request' }));
  const pack = await rate(f, packedEvent, usageRule({ id: 'pack', model: 'request_pack', usageUnit: 'request', packSize: 10, packPrice: 4 })); assert.equal(pack.rating.customerCharge, 12);
  const usageEvent = await record(f, usageInput('unit-pricing', { quantity: 100, unit: 'token' })); const perUnit = await rate(f, usageEvent, usageRule()); assert.equal(perUnit.rating.customerCharge, 0.2);
});

test('cost-plus preserves provider cost, markup and customer charge separately with explicit FX', async () => {
  const f = fixture(); const event = await record(f); const provider = await cost(f, event, { unitCost: 0.01, currency: 'USD' });
  const rule = usageRule({ id: 'cost-plus', model: 'cost_plus', customerCurrency: 'ZAR', markupPercent: 25 });
  const fx: FxRate = { fromCurrency: 'USD', toCurrency: 'ZAR', rate: 18.5, version: 'fx-v7', effectiveAt: t0, sourceReference: 'synthetic-fx-evidence' };
  const result = await rate(f, event, rule, { providerCostId: provider.id, fxRate: fx });
  assert.equal(result.rating.providerCostAmount, 1); assert.equal(result.rating.providerCostCurrency, 'USD'); assert.equal(result.rating.convertedProviderCost, 18.5); assert.equal(result.rating.markupAmount, 4.625); assert.equal(result.rating.customerCharge, 23.125); assert.equal(result.charge.currency, 'ZAR'); assert.equal(result.charge.providerCostAmount, 1); assert.equal(result.charge.customerMarkupAmount, 4.625);
  assert.equal(result.rating.fxRateVersion, 'fx-v7'); assert.equal(result.rating.fxRateSourceReference, 'synthetic-fx-evidence');
  const sameCurrency = await rate(f, event, usageRule({ id: 'cost-plus-same-currency', model: 'cost_plus', customerCurrency: 'USD', markupPercent: 50 }), { providerCostId: provider.id });
  assert.equal(sameCurrency.rating.convertedProviderCost, 1); assert.equal(sameCurrency.rating.markupAmount, 0.5); assert.equal(sameCurrency.rating.customerCharge, 1.5); assert.equal(sameCurrency.rating.fxRateVersion, null);
  const needsFx = await record(f, usageInput('fx-missing')); const foreignCost = await cost(f, needsFx, { unitCost: 0.01, currency: 'EUR', priceVersion: 'eur-price' });
  await assert.rejects(() => rate(f, needsFx, usageRule({ id: 'eur-costplus', model: 'cost_plus', customerCurrency: 'USD', markupPercent: 10 }), { providerCostId: foreignCost.id }), /FX rate/);
  await assert.rejects(() => rate(f, needsFx, usageRule({ id: 'wrong-fx', model: 'cost_plus', customerCurrency: 'USD', markupPercent: 10 }), { providerCostId: foreignCost.id, fxRate: { ...fx, fromCurrency: 'GBP' } }), /FX rate/);
});

test('rating and charge retries are source-idempotent; changed versions append linked results', async () => {
  const f = fixture(); const event = await record(f); const rule = usageRule(); const first = await rate(f, event, rule); const retry = await f.service.rateAndCreateCharge(actor, { usageEventId: event.id, rule, correlationId: event.correlationId, reason: 'retry', evidence, idempotencyKey: 'different-idempotency-key' });
  assert.equal(first.rating.id, retry.rating.id); assert.equal(first.charge.id, retry.charge.id); assert.equal((f.repo.charges as ChargesRepo).rows.size, 1);
  const changed = await rate(f, event, usageRule({ version: 'v2', unitPrice: 0.003 })); assert.notEqual(changed.rating.id, first.rating.id); assert.equal(changed.rating.supersedesRatingId, first.rating.id); assert.equal(changed.charge.supersedesChargeId, first.charge.id); assert.equal(changed.charge.status, 'held', 'superseding charge is not invoice-ready until Stage E resolves correction treatment'); assert.equal((f.repo.charges as ChargesRepo).rows.size, 2);
});

test('partial charge failure retries from durable rating without duplicate rating or charge', async () => {
  const f = fixture(); const event = await record(f); (f.repo.charges as ChargesRepo).failNext = true;
  await assert.rejects(() => rate(f, event, usageRule())); assert.equal((f.repo.ratings as RatingsRepo).rows.size, 1); assert.equal((f.repo.charges as ChargesRepo).rows.size, 0);
  const recovered = await f.service.rateAndCreateCharge(actor, { usageEventId: event.id, rule: usageRule(), correlationId: event.correlationId, reason: 'retry after partial failure', evidence, idempotencyKey: 'recovery-command' });
  assert.equal((f.repo.ratings as RatingsRepo).rows.size, 1); assert.equal((f.repo.charges as ChargesRepo).rows.size, 1); assert.equal(recovered.charge.ratingId, recovered.rating.id);
});

test('rating enforces effective dates and registry approval; no provider approval is inferred from existence', async () => {
  const f = fixture(); const event = await record(f, usageInput('capability-event', { capability: 'chat' }));
  await assert.rejects(() => rate(f, event, usageRule({ effectiveFrom: t1 })), /not effective/);
  f.setModelResolution({ providerId: event.providerId, modelId: event.modelId, status: 'resolved', approved: false, available: true, capabilities: [], region: null, pricingReference: null, pricingVersion: null });
  await assert.rejects(() => rate(f, event, usageRule({ id: 'unapproved' })), /explicitly resolved, approved/);
  f.setModelResolution({ providerId: event.providerId, modelId: event.modelId, status: 'resolved', approved: true, available: true, capabilities: ['embeddings'], region: null, pricingReference: null, pricingVersion: null });
  await assert.rejects(() => rate(f, event, usageRule({ id: 'capability-mismatch' })), /support the requested capability/);
});

test('budget/quota decisions distinguish allowance, warning, exceeded, blocked and reset periods', async () => {
  const f = fixture(); const repo = f.repo.budgets as BudgetsRepo; const policy: BudgetQuotaPolicy = { id: 'budget-policy-a' as BudgetPolicyId, version: 'v1', customerId: customerA, entitlementId, effectiveFrom: t0, effectiveTo: t2, allowanceQuantity: 100, warningThresholdPercent: 80, budgetAmount: 20, budgetCurrency: 'USD', hardBlockOnAllowance: true, hardBlockOnBudget: true };
  repo.policy = policy; repo.quantity = 50; repo.spend = 10;
  const within = await f.service.evaluateBudget(actor, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 10, attemptedSpend: 1, currency: 'USD', reason: 'budget', correlationId: 'budget-1', evidence }); assert.equal(within.status, 'within_allowance'); assert.equal(within.allowed, true);
  const warning = await f.service.evaluateBudget(actor, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 35, attemptedSpend: 1, currency: 'USD', reason: 'budget', correlationId: 'budget-2', evidence }); assert.equal(warning.status, 'warning_threshold');
  const exceeded = await evaluateBudgetQuota(repo, { ...policy, allowanceQuantity: 50, hardBlockOnAllowance: false }, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 1, attemptedSpend: 1, currency: 'USD' }); assert.equal(exceeded.status, 'allowance_exceeded'); assert.equal(exceeded.allowed, true);
  const budgetExceeded = await evaluateBudgetQuota(repo, { ...policy, allowanceQuantity: null, budgetAmount: 10, hardBlockOnBudget: false }, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 1, attemptedSpend: 1, currency: 'USD' }); assert.equal(budgetExceeded.status, 'budget_exceeded');
  const blocked = await f.service.evaluateBudget(actor, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 51, attemptedSpend: 1, currency: 'USD', reason: 'budget', correlationId: 'budget-3', evidence }); assert.equal(blocked.status, 'blocked'); assert.equal(blocked.allowed, false);
  const mismatch = await f.service.evaluateBudget(actor, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 1, attemptedSpend: 1, currency: 'ZAR', reason: 'budget', correlationId: 'budget-4', evidence }); assert.equal(mismatch.status, 'currency_mismatch');
  assert.equal((await evaluateBudgetQuota(repo, { ...policy, effectiveTo: t1 }, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 1, attemptedSpend: 1, currency: 'USD' })).status, 'no_policy');
  assert.equal((await evaluateBudgetQuota(repo, null, { customerId: customerA, entitlementId, asOf: t1, attemptedQuantity: 1, attemptedSpend: 1, currency: 'USD' })).allowed, false);
});

test('authorization/evidence failures cannot persist usage and customer/tenant scopes remain separate', async () => {
  const denied = fixture(); denied.auth.allowed = false; await assert.rejects(() => record(denied), /not authorized/); assert.equal((denied.repo.usage as UsageRepo).rows.size, 0);
  const noEvidence = fixture(); noEvidence.evidenceVerifier.verified = false; await assert.rejects(() => record(noEvidence), /evidence was not verified/); assert.equal((noEvidence.repo.usage as UsageRepo).rows.size, 0);
  const crossScope = fixture(); crossScope.setResolution({ status: 'linked', customerId: customerB, entitlementId, subscriptionId, orderVersionId: 'order-version-b' as OrderVersionId, subscriptionVersionId: 'subscription-version-b' as SubscriptionVersionId });
  await assert.rejects(() => record(crossScope, usageInput('customer-spoof', { claimedCustomerId: customerA })), /Claimed customer/);
  crossScope.setResolution({ status: 'linked', customerId: customerA, entitlementId, subscriptionId, orderVersionId: 'order-version-a' as OrderVersionId, subscriptionVersionId: 'subscription-version-a' as SubscriptionVersionId }); const event = await record(crossScope);
  assert.equal(event.customerId, customerA);
  const requests = crossScope.auth.requests.filter(r => r.operation === 'commercial.usage.record'); assert.equal(requests[0].scope.tenantId, tenantA); assert.equal(requests[0].scope.customerId, customerA);
  const usageAudit = crossScope.audit.events.find(e => e.operation === 'commercial.usage.record'); assert.equal(usageAudit?.evidenceReference, evidence.evidenceReference); assert.ok(usageAudit?.evidenceVerificationReference); assert.ok(usageAudit?.authorizationDecisionReference); assert.equal(usageAudit?.correlationId, 'corr:event-a');
});

test('logical charge is ready for Stage E only and cannot create financial-core records', async () => {
  const f = fixture(); const event = await record(f); const result = await rate(f, event, usageRule());
  assert.equal(result.charge.status, 'ready_for_financial_processing');
  assert.equal('invoiceId' in result.charge, false); assert.equal('paymentIntentId' in result.charge, false); assert.equal('journalId' in result.charge, false);
  assert.equal('createInvoice' in f.service, false); assert.equal('postLedgerEntry' in f.service, false); assert.equal('createAccountingJournal' in f.service, false);
});
