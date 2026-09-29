/**
 * Stage D local domain boundary: provisioning eligibility, raw usage,
 * provider cost, rating, logical customer charge, and budget decisions.
 * Database-, provider-API-, gateway-, and HTTP-independent by design.
 * A CustomerCharge is only "ready for financial processing"; this module has
 * no invoice, payment, ledger, reconciliation, or journal capability.
 */
import {
  AuditPort, AuthorizationPort, CommercialActor, CommercialAuthorizationOperation,
  CommercialAuthorizationTargetType, CustomerId, EvidenceApproval, EvidenceApprovalPort,
  IdempotencyPort, TechnicalTenantId,
} from '../stageA/partyAccount';
import { EntitlementId, EntitlementLifecycleEvent, EntitlementRecord, OrderVersionId, SubscriptionId, SubscriptionLifecycleEvent, SubscriptionRecord, SubscriptionVersionId, SubscriptionVersionRecord } from '../stageC/ordersSubscriptions';

type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type UsageEventId = Brand<string, 'UsageEventId'>;
export type UsageAttemptId = Brand<string, 'UsageAttemptId'>;
export type ProviderCostId = Brand<string, 'ProviderCostId'>;
export type RatingId = Brand<string, 'RatingId'>;
export type CustomerChargeId = Brand<string, 'CustomerChargeId'>;
export type BudgetPolicyId = Brand<string, 'BudgetPolicyId'>;
export type UsageUnit = 'request' | 'token' | 'input_token' | 'output_token' | 'operation' | 'unit';
export type UsageEventStatus = 'recorded' | 'accepted' | 'rejected' | 'failed' | 'late';
export type AttributionStatus = 'linked' | 'unlinked' | 'ambiguous';
export type RatingStatus = 'rated' | 'unrated' | 'rejected' | 'failed';
export type ChargeStatus = 'ready_for_financial_processing' | 'held' | 'reversed';
export type StageDOperation = Extract<CommercialAuthorizationOperation,
  'commercial.provisioning.eligibility.evaluate' | 'commercial.usage.record' | 'commercial.provider_cost.record' |
  'commercial.rating.evaluate' | 'commercial.charge.create' | 'commercial.budget.evaluate'>;
export type StageDTarget = Extract<CommercialAuthorizationTargetType,
  'provisioning_decision' | 'usage_event' | 'provider_cost' | 'rating' | 'customer_charge' | 'budget_policy'>;

export interface ProvisioningEligibilityInput {
  readonly entitlement: EntitlementRecord | null;
  readonly entitlementEvents: readonly EntitlementLifecycleEvent[];
  readonly subscription: SubscriptionRecord | null;
  readonly subscriptionVersion: SubscriptionVersionRecord | null;
  readonly subscriptionEvents: readonly SubscriptionLifecycleEvent[];
  readonly asOf: string;
  readonly commercialAuthorityVerified: boolean;
  /** Confirms the explicit target is covered by the same approved entitlement scope. */
  readonly targetScopeVerified: boolean;
  readonly requiredPolicyConditionsSatisfied: boolean;
  readonly targetRequired: boolean;
}
export type ProvisioningEligibilityReason = 'eligible' | 'not_eligible' | 'expired' | 'suspended' | 'missing_authority' | 'missing_required_technical_target' | 'invalid_entitlement';
export interface ProvisioningEligibilityDecision { readonly eligible: boolean; readonly reason: ProvisioningEligibilityReason; readonly asOf: string; readonly entitlementId: EntitlementId | null; readonly subscriptionId: SubscriptionId | null; readonly target: EntitlementRecord['target'] | null }

/** Pure decision only: it never creates users, apps, keys, credentials, or grants. */
export function evaluateProvisioningEligibility(input: ProvisioningEligibilityInput): ProvisioningEligibilityDecision {
  const at = instant(input.asOf);
  const e = input.entitlement;
  const decision = (reason: ProvisioningEligibilityReason): ProvisioningEligibilityDecision => Object.freeze({ eligible: reason === 'eligible', reason, asOf: new Date(at).toISOString(), entitlementId: e?.id ?? null, subscriptionId: input.subscription?.id ?? null, target: e?.target ?? null });
  if (!e || !input.subscription || !input.subscriptionVersion || input.subscriptionVersion.subscriptionId !== input.subscription.id || input.subscriptionVersion.customerId !== input.subscription.customerId || e.subscriptionId !== input.subscription.id || e.subscriptionVersionId !== input.subscriptionVersion.id || e.customerId !== input.subscription.customerId) return decision('invalid_entitlement');
  if (!input.commercialAuthorityVerified) return decision('missing_authority');
  if (!input.targetRequired && !input.requiredPolicyConditionsSatisfied) return decision('not_eligible');
  if (input.targetRequired && !e.target) return decision('missing_required_technical_target');
  if (e.target && !input.targetScopeVerified) return decision('not_eligible');
  if (!isEffective(e.effectiveFrom, e.effectiveTo, at) || !isEffective(input.subscriptionVersion.serviceStart, input.subscriptionVersion.serviceEnd, at)) return decision('expired');
  const entState = stateAt(input.entitlementEvents, at);
  const subState = stateAt(input.subscriptionEvents, at);
  if (entState === 'expired' || subState === 'expired') return decision('expired');
  if (entState === 'suspended' || subState === 'suspended') return decision('suspended');
  if (entState !== 'active' || subState !== 'active') return decision('not_eligible');
  if (!input.requiredPolicyConditionsSatisfied) return decision('not_eligible');
  return decision('eligible');
}

export interface UsageAttributionRequest {
  readonly technicalTenantId: TechnicalTenantId | null;
  readonly applicationId: string | null;
  readonly apiConsumerId: string | null;
  readonly serviceAccountId: string | null;
  readonly credentialId: string | null;
  readonly userId: string | null;
  readonly claimedCustomerId: CustomerId | null;
  readonly claimedEntitlementId: EntitlementId | null;
  readonly claimedSubscriptionId: SubscriptionId | null;
  readonly occurredAt: string;
}
export type UsageAttributionAmbiguityReason = 'multiple_matches' | 'conflicting_scope' | 'unverified_identity';
export type UsageAttributionResolution =
  | { readonly status: 'linked'; readonly customerId: CustomerId; readonly entitlementId: EntitlementId; readonly subscriptionId: SubscriptionId; readonly orderVersionId: OrderVersionId; readonly subscriptionVersionId: SubscriptionVersionId }
  | { readonly status: 'unlinked' }
  | { readonly status: 'ambiguous'; readonly reason: UsageAttributionAmbiguityReason };
export interface UsageAttributionResolver { resolve(input: UsageAttributionRequest): Promise<UsageAttributionResolution> }

export interface UsageEvent {
  readonly id: UsageEventId;
  readonly sourceNamespace: string;
  readonly sourceEventId: string;
  readonly attributionStatus: AttributionStatus;
  readonly attributionReason: string | null;
  readonly customerId: CustomerId | null;
  readonly technicalTenantId: TechnicalTenantId | null;
  readonly applicationId: string | null;
  readonly apiConsumerId: string | null;
  readonly serviceAccountId: string | null;
  /** Reference only; never credential material or a key hash. */
  readonly credentialId: string | null;
  readonly userId: string | null;
  readonly entitlementId: EntitlementId | null;
  readonly subscriptionId: SubscriptionId | null;
  readonly orderVersionId: OrderVersionId | null;
  readonly subscriptionVersionId: SubscriptionVersionId | null;
  readonly providerId: string;
  readonly modelId: string;
  readonly capability: string | null;
  readonly requestId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly receivedAt: string;
  readonly quantity: number;
  readonly unit: UsageUnit;
  readonly usageCurrency: string | null;
  readonly dataClassification: string | null;
  readonly policyReference: string | null;
  readonly source: string;
  readonly status: UsageEventStatus;
}
/** Append-only processing outcomes preserve raw usage while allowing explicit retry history. */
export interface UsageProcessingAttempt {
  readonly id: UsageAttemptId;
  readonly usageEventId: UsageEventId;
  readonly attempt: number;
  readonly outcome: 'accepted' | 'rejected' | 'failed';
  readonly reason: string;
  readonly retryOfAttemptId: UsageAttemptId | null;
  readonly actorId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
}
export interface RecordUsageOutcomeInput { readonly usageEventId: UsageEventId; readonly outcome: UsageProcessingAttempt['outcome']; readonly retryOfAttemptId?: UsageAttemptId | null; readonly reason: string; readonly correlationId: string; readonly evidence: EvidenceApproval; readonly idempotencyKey: string }
export interface RecordUsageInput extends UsageAttributionRequest {
  readonly sourceNamespace: string;
  readonly sourceEventId: string;
  readonly providerId: string;
  readonly modelId: string;
  readonly capability?: string | null;
  readonly requestId: string;
  readonly correlationId: string;
  readonly quantity: number;
  readonly unit: UsageUnit;
  readonly usageCurrency?: string | null;
  readonly dataClassification?: string | null;
  readonly policyReference?: string | null;
  readonly source: string;
  readonly lateThresholdMs?: number;
  readonly evidence: EvidenceApproval;
  readonly reason: string;
  readonly idempotencyKey: string;
}

export interface ProviderCost {
  readonly id: ProviderCostId;
  readonly usageEventId: UsageEventId;
  readonly providerId: string;
  readonly modelId: string;
  readonly usageBasis: UsageUnit;
  readonly quantity: number;
  readonly unitCost: number;
  readonly currency: string;
  readonly amount: number;
  readonly providerReference: string | null;
  readonly priceVersion: string;
  readonly provenance: 'provider_reported' | 'registry_estimate' | 'synthetic';
  readonly effectiveAt: string;
  readonly correlationId: string;
  readonly createdAt: string;
}
export interface RecordProviderCostInput {
  readonly usageEventId: UsageEventId;
  readonly providerId: string;
  readonly modelId: string;
  readonly usageBasis: UsageUnit;
  readonly quantity: number;
  readonly unitCost: number;
  readonly currency: string;
  readonly providerReference?: string | null;
  readonly priceVersion: string;
  readonly provenance: ProviderCost['provenance'];
  readonly effectiveAt: string;
  readonly correlationId: string;
  readonly reason: string;
  readonly evidence: EvidenceApproval;
  readonly idempotencyKey: string;
}

export interface RatingRuleBase {
  readonly id: string;
  readonly version: string;
  readonly productId: string;
  readonly service: string;
  readonly usageUnit: UsageUnit;
  readonly customerCurrency: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly requiresEntitlement: boolean;
}
export type RatingRule = RatingRuleBase & (
  | { readonly model: 'fixed_unit' | 'usage_based'; readonly unitPrice: number; readonly markupPercent?: never; readonly packSize?: never; readonly packPrice?: never }
  | { readonly model: 'request_pack'; readonly packSize: number; readonly packPrice: number; readonly unitPrice?: never; readonly markupPercent?: never }
  | { readonly model: 'cost_plus'; readonly markupPercent: number; readonly unitPrice?: never; readonly packSize?: never; readonly packPrice?: never }
);
export interface FxRate {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  readonly rate: number;
  readonly version: string;
  readonly effectiveAt: string;
  readonly sourceReference: string;
}
export interface RatingDecision {
  readonly id: RatingId;
  readonly sourceIdentity: string;
  readonly usageEventId: UsageEventId;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly model: RatingRule['model'];
  readonly productId: string;
  readonly service: string;
  readonly quantity: number;
  readonly usageUnit: UsageUnit;
  readonly customerCurrency: string;
  readonly providerCostId: ProviderCostId | null;
  readonly providerCostAmount: number | null;
  readonly providerCostCurrency: string | null;
  readonly providerRegion: string | null;
  readonly providerPricingReference: string | null;
  readonly providerPricingVersion: string | null;
  readonly fxRateVersion: string | null;
  readonly fxRate: number | null;
  readonly fxRateSourceReference: string | null;
  readonly convertedProviderCost: number | null;
  readonly markupPercent: number;
  readonly markupAmount: number | null;
  readonly customerCharge: number;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly supersedesRatingId: RatingId | null;
}
export interface CustomerCharge {
  readonly id: CustomerChargeId;
  /** Stable unique key: usage source identity + rating rule/version + charge kind. */
  readonly sourceIdentity: string;
  readonly usageEventId: UsageEventId;
  readonly ratingId: RatingId;
  readonly customerId: CustomerId;
  readonly entitlementId: EntitlementId;
  readonly subscriptionId: SubscriptionId;
  readonly productId: string;
  readonly providerCostAmount: number | null;
  readonly providerCostCurrency: string | null;
  readonly customerMarkupAmount: number | null;
  readonly amount: number;
  readonly currency: string;
  readonly status: ChargeStatus;
  readonly effectiveAt: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly supersedesChargeId: CustomerChargeId | null;
}
export interface RateUsageInput {
  readonly usageEventId: UsageEventId;
  readonly rule: RatingRule;
  readonly providerCostId?: ProviderCostId | null;
  readonly fxRate?: FxRate | null;
  readonly correlationId: string;
  readonly reason: string;
  readonly evidence: EvidenceApproval;
  readonly idempotencyKey: string;
}

export interface ProviderModelResolution {
  readonly providerId: string;
  readonly modelId: string;
  readonly status: 'resolved' | 'missing' | 'ambiguous';
  readonly approved: boolean;
  readonly available: boolean;
  readonly capabilities: readonly string[];
  readonly region: string | null;
  readonly pricingReference: string | null;
  readonly pricingVersion: string | null;
}
export interface ProviderModelRegistryReadPort { resolve(providerId: string, modelId: string): Promise<ProviderModelResolution> }

export interface UsageEventRepository {
  /** Atomically serialize source lookup + insert for one namespace/event key; production mechanism remains adapter-specific. */
  withSourceGuard<T>(namespace: string, sourceEventId: string, operation: () => Promise<T>): Promise<T>;
  findBySource(namespace: string, sourceEventId: string): Promise<UsageEvent | null>;
  get(id: UsageEventId): Promise<UsageEvent | null>;
  insert(event: UsageEvent): Promise<void>;
}
export interface UsageProcessingAttemptRepository {
  withEventGuard<T>(eventId: UsageEventId, operation: () => Promise<T>): Promise<T>;
  listForEvent(eventId: UsageEventId): Promise<readonly UsageProcessingAttempt[]>;
  append(attempt: UsageProcessingAttempt): Promise<void>;
}
export interface ProviderCostRepository {
  /** Enforce one provider-cost version per usage event under concurrent writes. */
  withEventGuard<T>(eventId: UsageEventId, pricingVersion: string, operation: () => Promise<T>): Promise<T>;
  findForEvent(eventId: UsageEventId, pricingVersion?: string): Promise<ProviderCost | null>;
  get(id: ProviderCostId): Promise<ProviderCost | null>;
  insert(cost: ProviderCost): Promise<void>;
}
export interface RatingRuleRepository { get(id: string, version: string): Promise<RatingRule | null> }
export interface RatingRepository {
  /** Serialize rating lookup, append and logical-charge source claim as one adapter-defined recovery boundary. */
  withSourceGuard<T>(sourceIdentity: string, operation: () => Promise<T>): Promise<T>;
  findForSource(sourceIdentity: string): Promise<RatingDecision | null>;
  findSupersededRating(eventId: UsageEventId, ruleId: string): Promise<RatingDecision | null>;
  findRatingById(id: RatingId): Promise<RatingDecision | null>;
  insert(decision: RatingDecision): Promise<void>;
}
export interface CustomerChargeRepository {
  findForSource(sourceIdentity: string): Promise<CustomerCharge | null>;
  insert(charge: CustomerCharge): Promise<void>;
}
export interface BudgetQuotaPolicy {
  readonly id: BudgetPolicyId;
  readonly version: string;
  readonly customerId: CustomerId;
  readonly entitlementId: EntitlementId;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly allowanceQuantity: number | null;
  readonly warningThresholdPercent: number;
  readonly budgetAmount: number | null;
  readonly budgetCurrency: string | null;
  readonly hardBlockOnAllowance: boolean;
  readonly hardBlockOnBudget: boolean;
}
export interface BudgetQuotaRepository {
  getPolicy(customerId: CustomerId, entitlementId: EntitlementId, asOf: string): Promise<BudgetQuotaPolicy | null>;
  getConsumption(input: { customerId: CustomerId; entitlementId: EntitlementId; from: string; to: string; currency: string | null }): Promise<{ quantity: number; spend: number }>;
}
export type BudgetDecisionStatus = 'within_allowance' | 'warning_threshold' | 'allowance_exceeded' | 'budget_exceeded' | 'blocked' | 'no_policy' | 'currency_mismatch';
export interface BudgetQuotaDecision { readonly status: BudgetDecisionStatus; readonly allowed: boolean; readonly usedQuantity: number; readonly attemptedQuantity: number; readonly allowanceQuantity: number | null; readonly usedSpend: number; readonly attemptedSpend: number; readonly budgetAmount: number | null; readonly currency: string | null; readonly policyId: BudgetPolicyId | null; readonly policyVersion: string | null }

export interface StageDRepository {
  /** Implementations must derive transaction/locking/uniqueness strategy from verified schema; no production mechanism is assumed here. */
  readonly usage: UsageEventRepository;
  readonly usageAttempts: UsageProcessingAttemptRepository;
  readonly providerCosts: ProviderCostRepository;
  readonly ratingRules: RatingRuleRepository;
  readonly ratings: RatingRepository;
  readonly charges: CustomerChargeRepository;
  readonly budgets: BudgetQuotaRepository;
}
export interface StageDIds { next(kind: 'usage_event' | 'usage_attempt' | 'provider_cost' | 'rating' | 'customer_charge' | 'audit'): string }
export interface StageDDependencies {
  readonly repository: StageDRepository;
  readonly attribution: UsageAttributionResolver;
  readonly providerModels: ProviderModelRegistryReadPort;
  readonly authorization: AuthorizationPort;
  readonly evidenceApprovals: EvidenceApprovalPort;
  readonly idempotency: IdempotencyPort;
  readonly audit: AuditPort;
  readonly clock: { now(): string };
  readonly ids: StageDIds;
}

export class StageDError extends Error {
  constructor(readonly code: 'INVALID_INPUT' | 'AUTHORIZATION_DENIED' | 'EVIDENCE_REQUIRED' | 'NOT_FOUND' | 'DUPLICATE_CONFLICT' | 'AMBIGUOUS_ATTRIBUTION' | 'UNLINKED_ATTRIBUTION' | 'AUTHORITY_NOT_SATISFIED' | 'PROVIDER_NOT_APPROVED' | 'RATING_RULE_INVALID' | 'FX_REQUIRED' | 'CURRENCY_MISMATCH', message: string) { super(message); this.name = 'StageDError'; }
}

export class UsageRatingService {
  constructor(private readonly deps: StageDDependencies) {}

  async evaluateProvisioning(actor: CommercialActor, input: ProvisioningEligibilityInput & { readonly reason: string; readonly correlationId: string; readonly evidence: EvidenceApproval }): Promise<ProvisioningEligibilityDecision> {
    const decision = evaluateProvisioningEligibility(input);
    const targetTenant = decision.target ? decision.target.type === 'technical_tenant' ? decision.target.id : decision.target.tenantId : null;
    const auth = await this.authorize(actor, 'commercial.provisioning.eligibility.evaluate', 'provisioning_decision', decision.entitlementId ?? 'unresolved', input.entitlement?.customerId ?? null, targetTenant);
    const evidence = await this.verify(actor, 'commercial.provisioning.eligibility.evaluate', input.evidence, input.entitlement?.customerId ?? null, targetTenant);
    await this.audit(actor, 'commercial.provisioning.eligibility.evaluate', 'provisioning_decision', decision.entitlementId ?? 'unresolved', input.entitlement?.customerId ?? null, targetTenant, input.reason, input.correlationId, null, { reason: decision.reason, eligible: decision.eligible, targetType: decision.target?.type ?? null }, input.evidence.evidenceReference, evidence, auth);
    return decision;
  }

  async recordUsage(actor: CommercialActor, input: RecordUsageInput): Promise<UsageEvent> {
    this.validateUsageInput(input);
    return this.deps.idempotency.execute(`stageD.usage:${input.sourceNamespace}:${input.sourceEventId}`, input.idempotencyKey, async () => {
      const resolution = await this.deps.attribution.resolve(input);
      if (resolution.status === 'linked') {
        if (input.claimedCustomerId && resolution.customerId !== input.claimedCustomerId) throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Claimed customer does not match explicit verified entitlement attribution.');
        if (input.claimedEntitlementId && resolution.entitlementId !== input.claimedEntitlementId) throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Claimed entitlement does not match the verified technical/commercial attribution.');
        if (input.claimedSubscriptionId && resolution.subscriptionId !== input.claimedSubscriptionId) throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Claimed subscription does not match the verified entitlement.');
      }
      const customerId = resolution.status === 'linked' ? resolution.customerId : null;
      const tenantId = input.technicalTenantId;
      const auth = await this.authorize(actor, 'commercial.usage.record', 'usage_event', `${input.sourceNamespace}:${input.sourceEventId}`, customerId, tenantId);
      const evidence = await this.verify(actor, 'commercial.usage.record', input.evidence, customerId, tenantId);
      const createdAt = this.deps.clock.now();
      const receivedAt = instant(createdAt);
      const occurred = instant(input.occurredAt);
      if (input.usageCurrency && !normalizeCurrency(input.usageCurrency)) throw new StageDError('INVALID_INPUT', 'Usage currency must be a three-letter currency code when present.');
      const late = input.lateThresholdMs != null && input.lateThresholdMs >= 0 && receivedAt - occurred > input.lateThresholdMs;
      const event: UsageEvent = Object.freeze({
        id: this.deps.ids.next('usage_event') as UsageEventId, sourceNamespace: input.sourceNamespace, sourceEventId: input.sourceEventId,
        attributionStatus: resolution.status, attributionReason: resolution.status === 'ambiguous' ? resolution.reason : null,
        customerId, technicalTenantId: input.technicalTenantId, applicationId: input.applicationId, apiConsumerId: input.apiConsumerId,
        serviceAccountId: input.serviceAccountId, credentialId: input.credentialId, userId: input.userId,
        entitlementId: resolution.status === 'linked' ? resolution.entitlementId : null, subscriptionId: resolution.status === 'linked' ? resolution.subscriptionId : null,
        orderVersionId: resolution.status === 'linked' ? resolution.orderVersionId : null, subscriptionVersionId: resolution.status === 'linked' ? resolution.subscriptionVersionId : null,
        providerId: input.providerId, modelId: input.modelId, capability: input.capability ?? null, requestId: input.requestId, correlationId: input.correlationId,
        occurredAt: new Date(occurred).toISOString(), receivedAt: new Date(receivedAt).toISOString(), quantity: input.quantity, unit: input.unit,
        usageCurrency: normalizeCurrency(input.usageCurrency), dataClassification: input.dataClassification ?? null, policyReference: input.policyReference ?? null,
        source: input.source, status: late ? 'late' : 'recorded',
      });
      const persisted = await this.deps.repository.usage.withSourceGuard(input.sourceNamespace, input.sourceEventId, async () => {
        const prior = await this.deps.repository.usage.findBySource(input.sourceNamespace, input.sourceEventId);
        if (prior) { if (!sameUsagePayload(prior, event)) throw new StageDError('DUPLICATE_CONFLICT', 'A source event identity was replayed with conflicting immutable usage data.'); return prior; }
        await this.deps.repository.usage.insert(event); return event;
      });
      await this.audit(actor, 'commercial.usage.record', 'usage_event', persisted.id, persisted.customerId, persisted.technicalTenantId, input.reason, input.correlationId, null, { status: persisted.status, attributionStatus: persisted.attributionStatus, quantity: persisted.quantity, unit: persisted.unit, providerId: persisted.providerId, modelId: persisted.modelId }, input.evidence.evidenceReference, evidence, auth);
      return persisted;
    });
  }

  async recordUsageOutcome(actor: CommercialActor, input: RecordUsageOutcomeInput): Promise<UsageProcessingAttempt> {
    validateCommand(input.reason, input.idempotencyKey, input.correlationId, input.evidence);
    const event = await this.requireUsage(input.usageEventId);
    const auth = await this.authorize(actor, 'commercial.usage.record', 'usage_event', event.id, event.customerId, event.technicalTenantId);
    const evidence = await this.verify(actor, 'commercial.usage.record', input.evidence, event.customerId, event.technicalTenantId);
    return this.deps.idempotency.execute(`stageD.usage.outcome:${event.id}`, input.idempotencyKey, () => this.deps.repository.usageAttempts.withEventGuard(event.id, async () => {
      const attempts = [...await this.deps.repository.usageAttempts.listForEvent(event.id)].sort((a, b) => a.attempt - b.attempt);
      const latest = attempts.at(-1) ?? null;
      if (latest && (!input.retryOfAttemptId || input.retryOfAttemptId !== latest.id || latest.outcome !== 'failed')) throw new StageDError('DUPLICATE_CONFLICT', 'A retry must explicitly reference the latest failed processing attempt.');
      if (!latest && input.retryOfAttemptId) throw new StageDError('DUPLICATE_CONFLICT', 'A first processing attempt cannot reference a prior attempt.');
      const outcome: UsageProcessingAttempt = Object.freeze({ id: this.deps.ids.next('usage_attempt') as UsageAttemptId, usageEventId: event.id, attempt: attempts.length + 1, outcome: input.outcome, reason: input.reason, retryOfAttemptId: input.retryOfAttemptId ?? null, actorId: actor.id, correlationId: input.correlationId, occurredAt: this.deps.clock.now() });
      await this.deps.repository.usageAttempts.append(outcome);
      await this.audit(actor, 'commercial.usage.record', 'usage_event', event.id, event.customerId, event.technicalTenantId, input.reason, input.correlationId, latest ? { processingOutcome: latest.outcome, attempt: latest.attempt } : null, { processingOutcome: outcome.outcome, attempt: outcome.attempt, retryOfAttemptId: outcome.retryOfAttemptId }, input.evidence.evidenceReference, evidence, auth);
      return outcome;
    }));
  }

  async recordProviderCost(actor: CommercialActor, input: RecordProviderCostInput): Promise<ProviderCost> {
    validateCommand(input.reason, input.idempotencyKey, input.correlationId, input.evidence);
    const event = await this.requireUsage(input.usageEventId);
    if (event.providerId !== input.providerId || event.modelId !== input.modelId || event.unit !== input.usageBasis || event.quantity !== input.quantity) throw new StageDError('INVALID_INPUT', 'Provider cost must identify the provider/model and measured basis of the source usage event.');
    validateAmount(input.unitCost, 'unitCost'); const currency = normalizeCurrency(input.currency); if (!currency) throw new StageDError('INVALID_INPUT', 'Provider cost currency is required.');
    if (!input.priceVersion.trim()) throw new StageDError('INVALID_INPUT', 'Provider price version is required.');
    const auth = await this.authorize(actor, 'commercial.provider_cost.record', 'provider_cost', `${event.id}:${input.priceVersion}`, event.customerId, event.technicalTenantId);
    const evidence = await this.verify(actor, 'commercial.provider_cost.record', input.evidence, event.customerId, event.technicalTenantId);
    return this.deps.idempotency.execute(`stageD.provider-cost:${event.id}:${input.priceVersion}`, input.idempotencyKey, () => this.deps.repository.providerCosts.withEventGuard(event.id, input.priceVersion, async () => {
      const prior = await this.deps.repository.providerCosts.findForEvent(event.id, input.priceVersion); if (prior) return prior;
      const effectiveAt = new Date(instant(input.effectiveAt)).toISOString();
      const cost: ProviderCost = Object.freeze({ id: this.deps.ids.next('provider_cost') as ProviderCostId, usageEventId: event.id, providerId: input.providerId, modelId: input.modelId, usageBasis: input.usageBasis, quantity: input.quantity, unitCost: round(input.unitCost, 10), currency, amount: round(event.quantity * input.unitCost, 8), providerReference: input.providerReference ?? null, priceVersion: input.priceVersion, provenance: input.provenance, effectiveAt, correlationId: input.correlationId, createdAt: this.deps.clock.now() });
      await this.deps.repository.providerCosts.insert(cost);
      await this.audit(actor, 'commercial.provider_cost.record', 'provider_cost', cost.id, event.customerId, event.technicalTenantId, input.reason, input.correlationId, null, { usageEventId: event.id, providerId: cost.providerId, modelId: cost.modelId, amount: cost.amount, currency: cost.currency, provenance: cost.provenance, priceVersion: cost.priceVersion }, input.evidence.evidenceReference, evidence, auth);
      return cost;
    }));
  }

  /** Rates and creates only a logical charge; an existing rating can recover a partial charge-write retry. */
  async rateAndCreateCharge(actor: CommercialActor, input: RateUsageInput): Promise<{ rating: RatingDecision; charge: CustomerCharge }> {
    validateCommand(input.reason, input.idempotencyKey, input.correlationId, input.evidence);
    const event = await this.requireUsage(input.usageEventId);
    if (event.attributionStatus === 'ambiguous') throw new StageDError('AMBIGUOUS_ATTRIBUTION', 'Ambiguous usage attribution cannot become a customer charge.');
    if (event.attributionStatus !== 'linked' || !event.customerId || !event.entitlementId || !event.subscriptionId) throw new StageDError('UNLINKED_ATTRIBUTION', 'Unlinked usage remains raw evidence and cannot become a customer charge.');
    if (event.status === 'rejected' || event.status === 'failed') throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Rejected or failed usage cannot be rated.');
    const latestAttempt = [...await this.deps.repository.usageAttempts.listForEvent(event.id)].sort((a, b) => a.attempt - b.attempt).at(-1);
    if (latestAttempt?.outcome === 'failed' || latestAttempt?.outcome === 'rejected') throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Usage with a failed or rejected processing outcome cannot be rated until an approved retry succeeds.');
    const rule = await this.deps.repository.ratingRules.get(input.rule.id, input.rule.version);
    if (!rule || !sameRule(rule, input.rule)) throw new StageDError('RATING_RULE_INVALID', 'Rating rule/version must be resolved from the read-only rating rule repository.');
    if (!isEffective(rule.effectiveFrom, rule.effectiveTo, instant(event.occurredAt))) throw new StageDError('RATING_RULE_INVALID', 'Rating rule is not effective at the usage event time.');
    if (rule.requiresEntitlement && !event.entitlementId) throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Rating requires an explicit entitlement.');
    const providerModel = await this.deps.providerModels.resolve(event.providerId, event.modelId);
    if (providerModel.status !== 'resolved' || !providerModel.approved || !providerModel.available || (event.capability !== null && !providerModel.capabilities.includes(event.capability))) throw new StageDError('PROVIDER_NOT_APPROVED', 'Provider/model must be explicitly resolved, approved, available, and support the requested capability; registry existence alone is insufficient.');
    const cost = input.providerCostId ? await this.requireCost(input.providerCostId) : null;
    if (cost && cost.usageEventId !== event.id) throw new StageDError('AUTHORITY_NOT_SATISFIED', 'Provider cost belongs to another usage event.');
    if (rule.model === 'cost_plus' && !cost) throw new StageDError('RATING_RULE_INVALID', 'Cost-plus rating requires a separate provider cost record.');
    const auth = await this.authorize(actor, 'commercial.rating.evaluate', 'rating', `${event.id}:${rule.id}:${rule.version}`, event.customerId, event.technicalTenantId);
    const evidence = await this.verify(actor, 'commercial.rating.evaluate', input.evidence, event.customerId, event.technicalTenantId);
    const sourceIdentity = ratingSourceIdentity(event, rule);
    return this.deps.idempotency.execute(`stageD.rating:${sourceIdentity}`, input.idempotencyKey, () => this.deps.repository.ratings.withSourceGuard(sourceIdentity, async () => {
      let rating = await this.deps.repository.ratings.findForSource(sourceIdentity);
      if (!rating) {
        const calculated = calculateCharge(rule, event, cost, input.fxRate ?? null);
        const previous = await this.deps.repository.ratings.findSupersededRating(event.id, rule.id);
        rating = Object.freeze({ id: this.deps.ids.next('rating') as RatingId, sourceIdentity, usageEventId: event.id, ruleId: rule.id, ruleVersion: rule.version, model: rule.model, productId: rule.productId, service: rule.service, quantity: event.quantity, usageUnit: event.unit, customerCurrency: rule.customerCurrency, providerCostId: cost?.id ?? null, providerCostAmount: cost?.amount ?? null, providerCostCurrency: cost?.currency ?? null, providerRegion: providerModel.region, providerPricingReference: providerModel.pricingReference, providerPricingVersion: providerModel.pricingVersion, fxRateVersion: calculated.fxRateVersion, fxRate: calculated.fxRate, fxRateSourceReference: calculated.fxRateVersion ? input.fxRate?.sourceReference ?? null : null, convertedProviderCost: calculated.convertedCost, markupPercent: calculated.markupPercent, markupAmount: calculated.markupAmount, customerCharge: calculated.amount, effectiveFrom: rule.effectiveFrom, effectiveTo: rule.effectiveTo, correlationId: input.correlationId, createdAt: this.deps.clock.now(), supersedesRatingId: previous?.id ?? null });
        await this.deps.repository.ratings.insert(rating);
        await this.audit(actor, 'commercial.rating.evaluate', 'rating', rating.id, event.customerId, event.technicalTenantId, input.reason, input.correlationId, null, { usageEventId: event.id, providerId: event.providerId, modelId: event.modelId, providerRegion: rating.providerRegion, providerPricingReference: rating.providerPricingReference, providerPricingVersion: rating.providerPricingVersion, ruleId: rule.id, ruleVersion: rule.version, amount: rating.customerCharge, currency: rating.customerCurrency, providerCostAmount: rating.providerCostAmount, providerCostCurrency: rating.providerCostCurrency, markupPercent: rating.markupPercent, fxRateVersion: rating.fxRateVersion }, input.evidence.evidenceReference, evidence, auth);
      }
      const chargeSource = rating.sourceIdentity;
      const priorCharge = await this.deps.repository.charges.findForSource(chargeSource);
      if (priorCharge) return { rating, charge: priorCharge };
      const chargeAuth = await this.authorize(actor, 'commercial.charge.create', 'customer_charge', chargeSource, event.customerId, event.technicalTenantId);
      const chargeEvidence = await this.verify(actor, 'commercial.charge.create', input.evidence, event.customerId, event.technicalTenantId);
      const priorRating = rating.supersedesRatingId ? await this.deps.repository.ratings.findRatingById(rating.supersedesRatingId) : null;
      const priorChargeForAdjustment = priorRating ? await this.deps.repository.charges.findForSource(priorRating.sourceIdentity) : null;
      const charge: CustomerCharge = Object.freeze({ id: this.deps.ids.next('customer_charge') as CustomerChargeId, sourceIdentity: chargeSource, usageEventId: event.id, ratingId: rating.id, customerId: event.customerId!, entitlementId: event.entitlementId!, subscriptionId: event.subscriptionId!, productId: rule.productId, providerCostAmount: rating.providerCostAmount, providerCostCurrency: rating.providerCostCurrency, customerMarkupAmount: rating.markupAmount, amount: rating.customerCharge, currency: rating.customerCurrency, status: priorChargeForAdjustment ? 'held' : 'ready_for_financial_processing', effectiveAt: event.occurredAt, correlationId: event.correlationId, createdAt: this.deps.clock.now(), supersedesChargeId: priorChargeForAdjustment?.id ?? null });
      await this.deps.repository.charges.insert(charge);
      await this.audit(actor, 'commercial.charge.create', 'customer_charge', charge.id, event.customerId, event.technicalTenantId, input.reason, input.correlationId, null, { usageEventId: event.id, ratingId: rating.id, amount: charge.amount, currency: charge.currency, status: charge.status, financialProcessing: charge.status === 'held' ? 'held for linked re-rating review' : 'ready' }, input.evidence.evidenceReference, chargeEvidence, chargeAuth);
      return { rating, charge };
    }));
  }

  async evaluateBudget(actor: CommercialActor, input: { readonly customerId: CustomerId; readonly entitlementId: EntitlementId; readonly asOf: string; readonly attemptedQuantity: number; readonly attemptedSpend: number; readonly currency: string; readonly reason: string; readonly correlationId: string; readonly evidence: EvidenceApproval }): Promise<BudgetQuotaDecision> {
    validateCommand(input.reason, 'budget-evaluation', input.correlationId, input.evidence); validateAmount(input.attemptedQuantity, 'attemptedQuantity'); validateAmount(input.attemptedSpend, 'attemptedSpend');
    const asOf = new Date(instant(input.asOf)).toISOString(); const currency = normalizeCurrency(input.currency); if (!currency) throw new StageDError('INVALID_INPUT', 'Budget decision currency is required.');
    const auth = await this.authorize(actor, 'commercial.budget.evaluate', 'budget_policy', input.entitlementId, input.customerId, actor.tenantId);
    const evidence = await this.verify(actor, 'commercial.budget.evaluate', input.evidence, input.customerId, actor.tenantId);
    const policy = await this.deps.repository.budgets.getPolicy(input.customerId, input.entitlementId, asOf);
    const decision = await evaluateBudgetQuota(this.deps.repository.budgets, policy, { customerId: input.customerId, entitlementId: input.entitlementId, asOf, attemptedQuantity: input.attemptedQuantity, attemptedSpend: input.attemptedSpend, currency });
    await this.audit(actor, 'commercial.budget.evaluate', 'budget_policy', policy?.id ?? input.entitlementId, input.customerId, actor.tenantId, input.reason, input.correlationId, null, { status: decision.status, allowed: decision.allowed, usedQuantity: decision.usedQuantity, allowanceQuantity: decision.allowanceQuantity, usedSpend: decision.usedSpend, budgetAmount: decision.budgetAmount, currency: decision.currency }, input.evidence.evidenceReference, evidence, auth);
    return decision;
  }

  private validateUsageInput(input: RecordUsageInput): void {
    validateCommand(input.reason, input.idempotencyKey, input.correlationId, input.evidence);
    for (const [name, value] of Object.entries({ sourceNamespace: input.sourceNamespace, sourceEventId: input.sourceEventId, providerId: input.providerId, modelId: input.modelId, requestId: input.requestId, source: input.source })) if (!value?.trim()) throw new StageDError('INVALID_INPUT', `${name} is required.`);
    validateAmount(input.quantity, 'quantity'); if (!input.unit) throw new StageDError('INVALID_INPUT', 'Usage unit is required.');
    instant(input.occurredAt); if (input.lateThresholdMs != null) validateAmount(input.lateThresholdMs, 'lateThresholdMs');
  }
  private async requireUsage(id: UsageEventId): Promise<UsageEvent> { const found = await this.deps.repository.usage.get(id); if (!found) throw new StageDError('NOT_FOUND', `Usage event ${id} was not found.`); return found; }
  private async requireCost(id: ProviderCostId): Promise<ProviderCost> { const found = await this.deps.repository.providerCosts.get(id); if (!found) throw new StageDError('NOT_FOUND', `Provider cost ${id} was not found.`); return found; }
  private async authorize(actor: CommercialActor, operation: StageDOperation, targetType: StageDTarget, targetId: string, customerId: CustomerId | null, tenantId: TechnicalTenantId | null) {
    const request = { actor, operation, scope: { ...(customerId ? { customerId } : {}), ...(tenantId ? { tenantId } : {}) }, target: { type: targetType, id: targetId } };
    const decision = await this.deps.authorization.authorize(request); if (!decision.allowed) throw new StageDError('AUTHORIZATION_DENIED', `${operation} was not authorized.`); return decision.decisionReference;
  }
  private async verify(actor: CommercialActor, operation: StageDOperation, evidence: EvidenceApproval, customerId: CustomerId | null, tenantId: TechnicalTenantId | null) {
    const result = await this.deps.evidenceApprovals.verify({ actor, operation, approval: evidence, scope: { ...(customerId ? { customerId } : {}), ...(tenantId ? { tenantId } : {}) } });
    if (!result.verified) throw new StageDError('EVIDENCE_REQUIRED', `${operation} evidence was not verified.`); return result.verificationReference;
  }
  private async audit(actor: CommercialActor, operation: StageDOperation, targetType: StageDTarget, targetId: string, customerId: CustomerId | null, tenantId: TechnicalTenantId | null, reason: string, correlationId: string, priorState: Record<string, string | number | boolean | null> | null, newState: Record<string, string | number | boolean | null> | null, evidenceReference: string, evidenceVerificationReference: string, authorizationDecisionReference: string): Promise<void> {
    await this.deps.audit.append({ id: this.deps.ids.next('audit'), actorId: actor.id, operation, targetType, targetId, tenantId, customerId, priorState, newState, reason, correlationId, occurredAt: this.deps.clock.now(), outcome: 'succeeded', evidenceReference, evidenceVerificationReference, authorizationDecisionReference });
  }
}

export async function evaluateBudgetQuota(repository: BudgetQuotaRepository, policy: BudgetQuotaPolicy | null, input: { customerId: CustomerId; entitlementId: EntitlementId; asOf: string; attemptedQuantity: number; attemptedSpend: number; currency: string }): Promise<BudgetQuotaDecision> {
  if (!policy || policy.customerId !== input.customerId || policy.entitlementId !== input.entitlementId || !isEffective(policy.effectiveFrom, policy.effectiveTo, instant(input.asOf))) return Object.freeze({ status: 'no_policy', allowed: false, usedQuantity: 0, attemptedQuantity: input.attemptedQuantity, allowanceQuantity: null, usedSpend: 0, attemptedSpend: input.attemptedSpend, budgetAmount: null, currency: input.currency, policyId: null, policyVersion: null });
  if (policy.budgetAmount != null && policy.budgetCurrency !== input.currency) return Object.freeze({ status: 'currency_mismatch', allowed: false, usedQuantity: 0, attemptedQuantity: input.attemptedQuantity, allowanceQuantity: policy.allowanceQuantity, usedSpend: 0, attemptedSpend: input.attemptedSpend, budgetAmount: policy.budgetAmount, currency: policy.budgetCurrency, policyId: policy.id, policyVersion: policy.version });
  const usage = await repository.getConsumption({ customerId: input.customerId, entitlementId: input.entitlementId, from: policy.effectiveFrom, to: input.asOf, currency: policy.budgetCurrency });
  const totalQuantity = usage.quantity + input.attemptedQuantity; const totalSpend = usage.spend + input.attemptedSpend;
  const allowanceExceeded = policy.allowanceQuantity != null && totalQuantity > policy.allowanceQuantity;
  const budgetExceeded = policy.budgetAmount != null && totalSpend > policy.budgetAmount;
  const warning = policy.allowanceQuantity != null && policy.allowanceQuantity > 0 && totalQuantity / policy.allowanceQuantity * 100 >= policy.warningThresholdPercent && !allowanceExceeded;
  const status: BudgetDecisionStatus = budgetExceeded ? policy.hardBlockOnBudget ? 'blocked' : 'budget_exceeded' : allowanceExceeded ? policy.hardBlockOnAllowance ? 'blocked' : 'allowance_exceeded' : warning ? 'warning_threshold' : 'within_allowance';
  return Object.freeze({ status, allowed: status !== 'blocked', usedQuantity: usage.quantity, attemptedQuantity: input.attemptedQuantity, allowanceQuantity: policy.allowanceQuantity, usedSpend: usage.spend, attemptedSpend: input.attemptedSpend, budgetAmount: policy.budgetAmount, currency: policy.budgetCurrency ?? input.currency, policyId: policy.id, policyVersion: policy.version });
}

function calculateCharge(rule: RatingRule, event: UsageEvent, cost: ProviderCost | null, fx: FxRate | null): { amount: number; convertedCost: number | null; markupPercent: number; markupAmount: number | null; fxRateVersion: string | null; fxRate: number | null } {
  if (rule.usageUnit !== event.unit || !Number.isFinite(event.quantity) || event.quantity < 0) throw new StageDError('RATING_RULE_INVALID', 'Usage unit or quantity does not match the rating rule.');
  const currency = normalizeCurrency(rule.customerCurrency); if (!currency) throw new StageDError('RATING_RULE_INVALID', 'Customer charge currency is invalid.');
  if (rule.model === 'fixed_unit' || rule.model === 'usage_based') { validateAmount(rule.unitPrice, 'unitPrice'); const amount = round(event.quantity * rule.unitPrice, 8); return { amount, convertedCost: null, markupPercent: 0, markupAmount: null, fxRateVersion: null, fxRate: null }; }
  if (rule.model === 'request_pack') { validateAmount(rule.packSize, 'packSize'); if (rule.packSize <= 0) throw new StageDError('RATING_RULE_INVALID', 'Request pack size must be positive.'); validateAmount(rule.packPrice, 'packPrice'); const amount = round(Math.ceil(event.quantity / rule.packSize) * rule.packPrice, 8); return { amount, convertedCost: null, markupPercent: 0, markupAmount: null, fxRateVersion: null, fxRate: null }; }
  if (!cost) throw new StageDError('RATING_RULE_INVALID', 'Cost-plus requires a provider-cost record.');
  validateAmount(rule.markupPercent, 'markupPercent');
  const costCurrency = normalizeCurrency(cost.currency)!;
  let convertedCost = cost.amount; let usedRate: FxRate | null = null;
  if (costCurrency !== currency) {
    if (!fx || normalizeCurrency(fx.fromCurrency) !== costCurrency || normalizeCurrency(fx.toCurrency) !== currency || !Number.isFinite(fx.rate) || fx.rate <= 0 || !fx.version.trim() || !fx.sourceReference.trim() || instant(fx.effectiveAt) > instant(event.occurredAt)) throw new StageDError('FX_REQUIRED', 'An explicit correctly directed, positive, event-effective FX rate/version/source is required.');
    convertedCost = round(cost.amount * fx.rate, 8); usedRate = fx;
  } else if (fx && (normalizeCurrency(fx.fromCurrency) !== costCurrency || normalizeCurrency(fx.toCurrency) !== currency)) throw new StageDError('CURRENCY_MISMATCH', 'FX pair does not match provider-cost and customer-charge currencies.');
  const markupAmount = round(convertedCost * rule.markupPercent / 100, 8); const amount = round(convertedCost + markupAmount, 8);
  return { amount, convertedCost, markupPercent: rule.markupPercent, markupAmount, fxRateVersion: usedRate?.version ?? null, fxRate: usedRate?.rate ?? null };
}
function ratingSourceIdentity(event: UsageEvent, rule: RatingRule): string { return JSON.stringify([event.sourceNamespace, event.sourceEventId, rule.id, rule.version, 'usage_charge']); }
function sameUsagePayload(a: UsageEvent, b: UsageEvent): boolean {
  return a.sourceNamespace === b.sourceNamespace && a.sourceEventId === b.sourceEventId && a.technicalTenantId === b.technicalTenantId &&
    a.applicationId === b.applicationId && a.apiConsumerId === b.apiConsumerId && a.serviceAccountId === b.serviceAccountId &&
    a.credentialId === b.credentialId && a.userId === b.userId && a.providerId === b.providerId && a.modelId === b.modelId &&
    a.capability === b.capability && a.requestId === b.requestId && a.correlationId === b.correlationId && a.occurredAt === b.occurredAt &&
    a.quantity === b.quantity && a.unit === b.unit && a.usageCurrency === b.usageCurrency && a.dataClassification === b.dataClassification &&
    a.policyReference === b.policyReference && a.source === b.source;
}
function sameRule(a: RatingRule, b: RatingRule): boolean {
  const shared = a.id === b.id && a.version === b.version && a.productId === b.productId && a.service === b.service && a.usageUnit === b.usageUnit && a.customerCurrency === b.customerCurrency && a.effectiveFrom === b.effectiveFrom && a.effectiveTo === b.effectiveTo && a.requiresEntitlement === b.requiresEntitlement && a.model === b.model;
  if (!shared || a.model !== b.model) return false;
  if (a.model === 'fixed_unit' || a.model === 'usage_based') return b.model === a.model && a.unitPrice === b.unitPrice;
  if (a.model === 'request_pack') return b.model === a.model && a.packSize === b.packSize && a.packPrice === b.packPrice;
  return b.model === a.model && a.markupPercent === b.markupPercent;
}
function stateAt<T extends { readonly effectiveAt: string; readonly to: string }>(events: readonly T[], at: number): string | null { return events.filter(e => instant(e.effectiveAt) <= at).sort((a, b) => instant(b.effectiveAt) - instant(a.effectiveAt))[0]?.to ?? null; }
function isEffective(from: string, to: string | null, at: number): boolean { const start = instant(from); return start <= at && (to == null || at < instant(to)); }
function instant(value: string): number { const parsed = Date.parse(value); if (!Number.isFinite(parsed)) throw new StageDError('INVALID_INPUT', 'A valid ISO date/time is required.'); return parsed; }
function validateAmount(value: number, field: string): void { if (!Number.isFinite(value) || value < 0) throw new StageDError('INVALID_INPUT', `${field} must be a finite non-negative number.`); }
function validateCommand(reason: string, idempotencyKey: string, correlationId: string, evidence: EvidenceApproval): void { if (!reason?.trim() || !idempotencyKey?.trim() || !correlationId?.trim() || !evidence?.evidenceReference?.trim() || !evidence?.approvedBy) throw new StageDError('INVALID_INPUT', 'Reason, idempotency key, correlation ID, and evidence approval reference are required.'); }
function normalizeCurrency(value?: string | null): string | null { if (!value) return null; const normalized = value.trim().toUpperCase(); return /^[A-Z]{3}$/.test(normalized) ? normalized : null; }
function round(value: number, decimals: number): number { const factor = 10 ** decimals; return Math.round((value + Number.EPSILON) * factor) / factor; }
