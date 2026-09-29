/**
 * Stage C local commercial lifecycle domain. HTTP/database independent.
 *
 * A future adapter may present an existing billing order through these ports,
 * preserving its identifier and snapshots. This in-memory/domain contract is
 * not a second persisted order ledger and never writes legacy billing/licensing
 * records. No provisioning operation is implemented here.
 */
import {
  AuditPort, AuthorizationPort, CommercialActor, CommercialAuthorizationOperation,
  CommercialAuthorizationTargetType, CustomerId, EvidenceApproval, EvidenceApprovalPort,
  IdempotencyPort, TechnicalTenantId,
  TenantMappingResolution,
} from '../stageA/partyAccount';
import { ContractQuoteService, OrderAuthorityDecision, QuoteVersionId, ContractVersionId, AcceptanceId } from '../stageB/contractsQuotes';

type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type StageCOrderId = Brand<string, 'StageCOrderId'>;
export type StageCOrderLineId = Brand<string, 'StageCOrderLineId'>;
export type OrderVersionId = Brand<string, 'OrderVersionId'>;
export type SubscriptionId = Brand<string, 'SubscriptionId'>;
export type SubscriptionVersionId = Brand<string, 'SubscriptionVersionId'>;
export type EntitlementId = Brand<string, 'EntitlementId'>;

export type StageCOperation = Extract<CommercialAuthorizationOperation,
  'commercial.order.create' | 'commercial.order.amend' | 'commercial.order.lifecycle' |
  'commercial.subscription.create' | 'commercial.subscription.amend' | 'commercial.subscription.lifecycle' |
  'commercial.entitlement.create' | 'commercial.entitlement.lifecycle'>;
export type StageCTarget = Extract<CommercialAuthorizationTargetType,
  'order' | 'order_version' | 'order_line' | 'subscription' | 'subscription_version' | 'entitlement'>;
type EvidenceOperation = StageCOperation;

export interface StageCIds { next(kind: 'order' | 'order_line' | 'order_version' | 'order_event' | 'subscription' | 'subscription_version' | 'subscription_event' | 'entitlement' | 'entitlement_event'): string }
export interface StageCClock { now(): string }

/** Snapshot of the offer applicable to this accepted line; never live catalogue lookup. */
export interface ProductPriceSnapshot {
  readonly productId: string;
  readonly sku: string | null;
  readonly description: string;
  readonly billingUnit: string;
  readonly recurring: boolean;
  readonly cadence: string | null;
  /** Decimal text preserves source precision without selecting a currency scale. */
  readonly unitPrice: string;
  readonly currency: string;
  readonly priceVersionReference: string | null;
  readonly attributes: Readonly<Record<string, string | number | boolean | null>>;
}

export interface OrderLineInput {
  readonly existingLineId?: string | null;
  /** Stable line reference in the exact accepted quote version. */
  readonly acceptedQuoteLineReference: string;
  /** Opaque source/evidence reference for the frozen product-price snapshot. */
  readonly priceSnapshotEvidenceReference: string;
  readonly product: ProductPriceSnapshot;
  readonly quantity: number;
  readonly lineTotal: string;
  readonly serviceStart: string;
  readonly serviceEnd?: string | null;
  readonly serviceScope: string;
  readonly entitlementType: string;
  readonly entitlementLimit?: number | null;
}

export interface OrderLineSnapshot extends OrderLineInput {
  readonly id: StageCOrderLineId;
  readonly existingLineId: string | null;
  readonly serviceEnd: string | null;
  readonly entitlementLimit: number | null;
}

export interface OrderRecord {
  readonly id: StageCOrderId;
  /** Existing billing order ID, when this domain is adapted to a legacy order. */
  readonly existingOrderId: string | null;
  readonly customerId: CustomerId;
  readonly technicalTenantId: TechnicalTenantId | null;
  readonly quoteVersionId: QuoteVersionId;
  readonly contractVersionId: ContractVersionId;
  readonly acceptanceId: AcceptanceId;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface OrderVersionRecord {
  readonly id: OrderVersionId;
  readonly orderId: StageCOrderId;
  readonly sequence: number;
  readonly predecessorId: OrderVersionId | null;
  /** Effective intervals are [effectiveFrom, next version's effectiveFrom). */
  readonly effectiveFrom: string;
  readonly status: 'authorized' | 'amended';
  readonly quoteVersionId: QuoteVersionId;
  readonly contractVersionId: ContractVersionId;
  readonly acceptanceId: AcceptanceId;
  readonly currency: string;
  readonly lines: readonly OrderLineSnapshot[];
  readonly createdAt: string;
  readonly createdBy: string;
}

export type CommercialOrderStatus = 'authorized' | 'active' | 'amended' | 'suspended' | 'cancelled' | 'expired';
export interface OrderLifecycleEvent {
  readonly id: string;
  readonly orderId: StageCOrderId;
  readonly from: CommercialOrderStatus | null;
  readonly to: CommercialOrderStatus;
  readonly effectiveAt: string;
  readonly reason: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export type SubscriptionStatus = 'pending' | 'active' | 'suspended' | 'cancelled' | 'expired';
export interface SubscriptionRecord {
  readonly id: SubscriptionId;
  readonly customerId: CustomerId;
  readonly orderId: StageCOrderId;
  readonly orderLineId: StageCOrderLineId;
  readonly createdAt: string;
  readonly createdBy: string;
}
export interface SubscriptionVersionRecord {
  readonly id: SubscriptionVersionId;
  readonly subscriptionId: SubscriptionId;
  readonly sequence: number;
  readonly predecessorId: SubscriptionVersionId | null;
  readonly orderVersionId: OrderVersionId;
  readonly customerId: CustomerId;
  readonly product: ProductPriceSnapshot;
  readonly quantity: number;
  readonly serviceScope: string;
  readonly serviceStart: string;
  readonly serviceEnd: string | null;
  readonly cadence: string | null;
  readonly status: 'pending';
  readonly createdAt: string;
  readonly createdBy: string;
}
export interface SubscriptionLifecycleEvent {
  readonly id: string;
  readonly subscriptionId: SubscriptionId;
  readonly from: SubscriptionStatus | null;
  readonly to: SubscriptionStatus;
  readonly effectiveAt: string;
  readonly reason: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export type EntitlementTechnicalTarget =
  | { readonly type: 'technical_tenant'; readonly id: TechnicalTenantId }
  | { readonly type: 'application'; readonly id: string; readonly tenantId: TechnicalTenantId }
  | { readonly type: 'api_consumer'; readonly id: string; readonly tenantId: TechnicalTenantId };
export type EntitlementStatus = 'pending' | 'active' | 'suspended' | 'revoked' | 'expired';
export interface EntitlementRecord {
  readonly id: EntitlementId;
  readonly customerId: CustomerId;
  readonly subscriptionId: SubscriptionId;
  readonly subscriptionVersionId: SubscriptionVersionId;
  readonly orderId: StageCOrderId;
  readonly orderVersionId: OrderVersionId;
  readonly productId: string;
  readonly entitlementType: string;
  readonly quantity: number;
  readonly limit: number | null;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  /** Null until an explicitly supplied, authorized runtime target is approved. */
  readonly target: EntitlementTechnicalTarget | null;
  readonly createdAt: string;
  readonly createdBy: string;
}
export interface EntitlementLifecycleEvent {
  readonly id: string;
  readonly entitlementId: EntitlementId;
  readonly from: EntitlementStatus | null;
  readonly to: EntitlementStatus;
  readonly effectiveAt: string;
  readonly reason: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface StageCCommand {
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly evidence: EvidenceApproval;
}
export interface StageCRepository {
  /** Serialize the authority check plus writes for one accepted quote/acceptance pair. */
  withOrderAuthorityGuard<T>(quoteVersionId: QuoteVersionId, acceptanceId: AcceptanceId, operation: () => Promise<T>): Promise<T>;
  /** Serialize the source check plus writes for one accepted order-version/line pair. */
  withSubscriptionSourceGuard<T>(orderVersionId: OrderVersionId, orderLineId: StageCOrderLineId, operation: () => Promise<T>): Promise<T>;
  /** Serialize entitlement source uniqueness independently of idempotency-key retries. */
  withEntitlementSourceGuard<T>(versionId: SubscriptionVersionId, type: string, target: EntitlementTechnicalTarget | null, operation: () => Promise<T>): Promise<T>;
  findOrderForAuthority(quoteVersionId: QuoteVersionId, acceptanceId: AcceptanceId): Promise<OrderRecord | null>;
  insertOrder(order: OrderRecord): Promise<void>;
  getOrder(id: StageCOrderId): Promise<OrderRecord | null>;
  listOrderVersions(id: StageCOrderId): Promise<readonly OrderVersionRecord[]>;
  insertOrderVersion(version: OrderVersionRecord): Promise<void>;
  listOrderEvents(id: StageCOrderId): Promise<readonly OrderLifecycleEvent[]>;
  appendOrderEvent(event: OrderLifecycleEvent): Promise<void>;
  getOrderVersion(id: OrderVersionId): Promise<OrderVersionRecord | null>;
  insertSubscription(subscription: SubscriptionRecord): Promise<void>;
  getSubscription(id: SubscriptionId): Promise<SubscriptionRecord | null>;
  findSubscriptionForSource(orderVersionId: OrderVersionId, orderLineId: StageCOrderLineId): Promise<SubscriptionRecord | null>;
  listSubscriptionVersions(id: SubscriptionId): Promise<readonly SubscriptionVersionRecord[]>;
  insertSubscriptionVersion(version: SubscriptionVersionRecord): Promise<void>;
  listSubscriptionEvents(id: SubscriptionId): Promise<readonly SubscriptionLifecycleEvent[]>;
  appendSubscriptionEvent(event: SubscriptionLifecycleEvent): Promise<void>;
  getSubscriptionVersion(id: SubscriptionVersionId): Promise<SubscriptionVersionRecord | null>;
  insertEntitlement(record: EntitlementRecord): Promise<void>;
  getEntitlement(id: EntitlementId): Promise<EntitlementRecord | null>;
  findEntitlementForSource(versionId: SubscriptionVersionId, type: string, target: EntitlementTechnicalTarget | null): Promise<EntitlementRecord | null>;
  listEntitlementEvents(id: EntitlementId): Promise<readonly EntitlementLifecycleEvent[]>;
  appendEntitlementEvent(event: EntitlementLifecycleEvent): Promise<void>;
}
/** Verifies that supplied line snapshots are the exact contents of accepted quote lines. */
export interface AcceptedQuoteLineVerifier {
  verify(input: { readonly quoteVersionId: QuoteVersionId; readonly line: OrderLineInput }): Promise<{ readonly matched: boolean; readonly verificationReference: string }>;
}
export interface StageCDependencies {
  readonly repository: StageCRepository;
  readonly authority: ContractQuoteService;
  /** Adapter over Stage A's explicit, effective-dated mapping resolver. */
  readonly commercialScope: { resolveTenantMapping(actor: CommercialActor, tenantId: TechnicalTenantId, asOf: string): Promise<TenantMappingResolution> };
  readonly acceptedQuoteLines: AcceptedQuoteLineVerifier;
  readonly authorization: AuthorizationPort;
  readonly evidenceApprovals: EvidenceApprovalPort;
  readonly idempotency: IdempotencyPort;
  readonly audit: AuditPort;
  readonly clock: StageCClock;
  readonly ids: StageCIds;
}

export class StageCError extends Error {
  constructor(readonly code: 'INVALID_INPUT' | 'AUTHORIZATION_DENIED' | 'EVIDENCE_REQUIRED' | 'NOT_FOUND' | 'SCOPE_MISMATCH' | 'AUTHORITY_NOT_SATISFIED' | 'INVALID_TRANSITION' | 'VERSION_CONFLICT' | 'IDEMPOTENCY_CONFLICT', message: string) {
    super(message); this.name = 'StageCError';
  }
}

export class OrderSubscriptionService {
  constructor(private readonly deps: StageCDependencies) {}

  async createOrder(actor: CommercialActor, input: StageCCommand & {
    customerId: CustomerId; quoteVersionId: QuoteVersionId; expectedContractVersionId: ContractVersionId;
    expectedAcceptanceId: AcceptanceId; effectiveFrom: string; lines: readonly OrderLineInput[];
    existingOrderId?: string | null; technicalTenantId?: TechnicalTenantId | null;
  }): Promise<{ order: OrderRecord; version: OrderVersionRecord }> {
    validateCommand(input); instant(input.effectiveFrom, 'effectiveFrom'); validateLines(input.lines);
    return this.deps.idempotency.execute(`stageC.order.create:${input.customerId}:${input.quoteVersionId}`, input.idempotencyKey, async () => {
      const auth = await this.authorize(actor, 'commercial.order.create', 'order', input.customerId, input.technicalTenantId ?? null);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.order.create', input.evidence, input.customerId, input.technicalTenantId ?? null);
      const authority = await this.deps.authority.evaluateOrderAuthority(actor, { quoteVersionId: input.quoteVersionId, at: input.effectiveFrom });
      assertAuthorityMatches(authority, input.customerId, input.expectedContractVersionId, input.expectedAcceptanceId);
      await this.verifyAcceptedLines(input.quoteVersionId, input.lines);
      if (input.technicalTenantId) {
        const mapping = await this.deps.commercialScope.resolveTenantMapping(actor, input.technicalTenantId, input.effectiveFrom);
        if (mapping.status !== 'matched' || mapping.mapping.customerId !== input.customerId) throw new StageCError('SCOPE_MISMATCH', 'An explicit effective Stage A tenant-to-commercial mapping is required for technical order scope.');
      }
      return this.deps.repository.withOrderAuthorityGuard(input.quoteVersionId, input.expectedAcceptanceId, async () => {
        if (await this.deps.repository.findOrderForAuthority(input.quoteVersionId, input.expectedAcceptanceId)) throw new StageCError('IDEMPOTENCY_CONFLICT', 'An order already exists for this accepted quote version and acceptance.');
        const existingOrderId = input.existingOrderId?.trim() || null;
        const order: OrderRecord = freeze({
          id: (existingOrderId ?? this.deps.ids.next('order')) as StageCOrderId,
          existingOrderId,
          customerId: input.customerId, technicalTenantId: input.technicalTenantId ?? null,
          quoteVersionId: input.quoteVersionId, contractVersionId: input.expectedContractVersionId,
          acceptanceId: input.expectedAcceptanceId, createdAt: this.deps.clock.now(), createdBy: actor.id,
        });
        const version = this.makeOrderVersion(order, input.lines, input.effectiveFrom, null, 1, 'authorized', actor);
        await this.deps.repository.insertOrder(order);
        await this.deps.repository.insertOrderVersion(version);
        await this.deps.repository.appendOrderEvent(this.orderEvent(order.id, null, 'authorized', input.effectiveFrom, input.reason, input.correlationId, actor));
        await this.audit(actor, 'commercial.order.create', 'order', order.id, order.customerId, order.technicalTenantId, input, null, { id: order.id, customerId: order.customerId, quoteVersionId: order.quoteVersionId, contractVersionId: order.contractVersionId, acceptanceId: order.acceptanceId, status: 'authorized', existingOrderId: order.existingOrderId }, verifiedEvidence, auth.decisionReference);
        return { order, version };
      });
    });
  }

  async amendOrder(actor: CommercialActor, input: StageCCommand & {
    orderId: StageCOrderId; predecessorId: OrderVersionId; effectiveFrom: string;
    quoteVersionId: QuoteVersionId; contractVersionId: ContractVersionId; acceptanceId: AcceptanceId;
    lines: readonly OrderLineInput[];
  }): Promise<OrderVersionRecord> {
    validateCommand(input); instant(input.effectiveFrom, 'effectiveFrom'); validateLines(input.lines);
    return this.deps.idempotency.execute(`stageC.order.amend:${input.orderId}`, input.idempotencyKey, async () => {
      const order = await this.requireOrder(input.orderId);
      const auth = await this.authorize(actor, 'commercial.order.amend', 'order', order.customerId, order.technicalTenantId);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.order.amend', input.evidence, order.customerId, order.technicalTenantId);
      const authority = await this.deps.authority.evaluateOrderAuthority(actor, { quoteVersionId: input.quoteVersionId, at: input.effectiveFrom });
      assertAuthorityMatches(authority, order.customerId, input.contractVersionId, input.acceptanceId);
      await this.verifyAcceptedLines(input.quoteVersionId, input.lines);
      const versions = await this.deps.repository.listOrderVersions(order.id);
      const prior = versions.find(v => v.id === input.predecessorId);
      if (!prior || prior.id !== latestVersion(versions)?.id) throw new StageCError('VERSION_CONFLICT', 'Amendment must reference the latest immutable order version.');
      if (Date.parse(input.effectiveFrom) <= Date.parse(prior.effectiveFrom)) throw new StageCError('VERSION_CONFLICT', 'Amendment effective time must follow its predecessor.');
      if (input.quoteVersionId === prior.quoteVersionId || input.acceptanceId === prior.acceptanceId) throw new StageCError('AUTHORITY_NOT_SATISFIED', 'An amendment requires a new accepted quote version and acceptance.');
      const priorStatus = statusAt(await this.deps.repository.listOrderEvents(order.id), input.effectiveFrom);
      if (!['authorized', 'active', 'amended'].includes(priorStatus)) throw new StageCError('INVALID_TRANSITION', 'Only an authorized, active or previously amended order may be amended.');
      const version = this.makeOrderVersion({ ...order, quoteVersionId: input.quoteVersionId, contractVersionId: input.contractVersionId, acceptanceId: input.acceptanceId }, input.lines, input.effectiveFrom, prior.id, prior.sequence + 1, 'amended', actor);
      await this.deps.repository.insertOrderVersion(version);
      await this.deps.repository.appendOrderEvent(this.orderEvent(order.id, priorStatus as CommercialOrderStatus, 'amended', input.effectiveFrom, input.reason, input.correlationId, actor));
      await this.audit(actor, 'commercial.order.amend', 'order_version', version.id, order.customerId, order.technicalTenantId, input, { orderId: order.id, predecessorId: prior.id, status: priorStatus }, { orderId: order.id, versionId: version.id, predecessorId: version.predecessorId, sequence: version.sequence, effectiveFrom: version.effectiveFrom, status: version.status }, verifiedEvidence, auth.decisionReference);
      return version;
    });
  }

  async transitionOrder(actor: CommercialActor, input: StageCCommand & { orderId: StageCOrderId; to: CommercialOrderStatus; effectiveAt: string }): Promise<OrderLifecycleEvent> {
    validateCommand(input); instant(input.effectiveAt, 'effectiveAt');
    return this.deps.idempotency.execute(`stageC.order.lifecycle:${input.orderId}:${input.to}`, input.idempotencyKey, async () => {
      const order = await this.requireOrder(input.orderId);
      const auth = await this.authorize(actor, 'commercial.order.lifecycle', 'order', order.customerId, order.technicalTenantId);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.order.lifecycle', input.evidence, order.customerId, order.technicalTenantId);
      const events = await this.deps.repository.listOrderEvents(order.id); const prior = statusAt<CommercialOrderStatus, OrderLifecycleEvent>(events, input.effectiveAt);
      assertTransition(prior, input.to, input.effectiveAt, events);
      const event = this.orderEvent(order.id, prior, input.to, input.effectiveAt, input.reason, input.correlationId, actor);
      await this.deps.repository.appendOrderEvent(event);
      await this.audit(actor, 'commercial.order.lifecycle', 'order', order.id, order.customerId, order.technicalTenantId, input, { status: prior }, { status: input.to, effectiveAt: input.effectiveAt }, verifiedEvidence, auth.decisionReference);
      return event;
    });
  }

  async createSubscription(actor: CommercialActor, input: StageCCommand & { orderId: StageCOrderId; orderVersionId: OrderVersionId; orderLineId: StageCOrderLineId }): Promise<{ subscription: SubscriptionRecord; version: SubscriptionVersionRecord }> {
    validateCommand(input);
    return this.deps.idempotency.execute(`stageC.subscription.create:${input.orderVersionId}:${input.orderLineId}`, input.idempotencyKey, async () => {
      const order = await this.requireOrder(input.orderId); const orderVersion = await this.requireOrderVersion(input.orderVersionId);
      if (order.id !== orderVersion.orderId || order.id !== input.orderId || !orderVersion.lines.some(l => l.id === input.orderLineId)) throw new StageCError('SCOPE_MISMATCH', 'Subscription source order/version/line do not match.');
      const lifecycle = await this.deps.repository.listOrderEvents(order.id);
      const state = statusAt(lifecycle, orderVersion.effectiveFrom);
      if (!['authorized', 'active', 'amended'].includes(state)) throw new StageCError('AUTHORITY_NOT_SATISFIED', 'Subscription requires an authorized, non-cancelled order version.');
      const line = orderVersion.lines.find(item => item.id === input.orderLineId)!;
      const checkedAt = Date.parse(this.deps.clock.now()) > Date.parse(line.serviceStart) ? this.deps.clock.now() : line.serviceStart;
      if (statusAt<CommercialOrderStatus, OrderLifecycleEvent>(lifecycle, checkedAt) === 'cancelled') throw new StageCError('AUTHORITY_NOT_SATISFIED', 'A cancelled order cannot create a new subscription.');
      const sourceAuthority = await this.deps.authority.evaluateOrderAuthority(actor, { quoteVersionId: orderVersion.quoteVersionId, at: line.serviceStart });
      assertAuthorityMatches(sourceAuthority, order.customerId, orderVersion.contractVersionId, orderVersion.acceptanceId);
      const auth = await this.authorize(actor, 'commercial.subscription.create', 'subscription', order.customerId, order.technicalTenantId);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.subscription.create', input.evidence, order.customerId, order.technicalTenantId);
      return this.deps.repository.withSubscriptionSourceGuard(orderVersion.id, line.id, async () => {
        if (await this.deps.repository.findSubscriptionForSource(orderVersion.id, line.id)) throw new StageCError('IDEMPOTENCY_CONFLICT', 'A subscription already exists for this accepted order version and line.');
        const subscription: SubscriptionRecord = freeze({ id: this.deps.ids.next('subscription') as SubscriptionId, customerId: order.customerId, orderId: order.id, orderLineId: line.id, createdAt: this.deps.clock.now(), createdBy: actor.id });
        const version: SubscriptionVersionRecord = freeze({
          id: this.deps.ids.next('subscription_version') as SubscriptionVersionId, subscriptionId: subscription.id,
          sequence: 1, predecessorId: null, orderVersionId: orderVersion.id, customerId: order.customerId,
          product: cloneProduct(line.product), quantity: line.quantity, serviceScope: line.serviceScope,
          serviceStart: line.serviceStart, serviceEnd: line.serviceEnd, cadence: line.product.cadence,
          status: 'pending', createdAt: this.deps.clock.now(), createdBy: actor.id,
        });
        await this.deps.repository.insertSubscription(subscription); await this.deps.repository.insertSubscriptionVersion(version);
        await this.deps.repository.appendSubscriptionEvent(this.subscriptionEvent(subscription.id, null, 'pending', line.serviceStart, input.reason, input.correlationId, actor));
        await this.audit(actor, 'commercial.subscription.create', 'subscription', subscription.id, subscription.customerId, order.technicalTenantId, input, null, { id: subscription.id, customerId: subscription.customerId, orderId: order.id, orderVersionId: orderVersion.id, orderLineId: line.id, versionId: version.id, status: 'pending' }, verifiedEvidence, auth.decisionReference);
        return { subscription, version };
      });
    });
  }

  async amendSubscription(actor: CommercialActor, input: StageCCommand & { subscriptionId: SubscriptionId; predecessorId: SubscriptionVersionId; orderVersionId: OrderVersionId; orderLineId: StageCOrderLineId }): Promise<SubscriptionVersionRecord> {
    validateCommand(input);
    return this.deps.idempotency.execute(`stageC.subscription.amend:${input.subscriptionId}`, input.idempotencyKey, async () => {
      const sub = await this.requireSubscription(input.subscriptionId); const prior = await this.requireSubscriptionVersion(input.predecessorId);
      const orderVersion = await this.requireOrderVersion(input.orderVersionId);
      if (prior.subscriptionId !== sub.id || orderVersion.orderId !== sub.orderId || !orderVersion.lines.some(line => line.id === input.orderLineId) || orderVersion.effectiveFrom <= prior.serviceStart) throw new StageCError('SCOPE_MISMATCH', 'Subscription amendment must link a later accepted order version and a line on the same order.');
      const latest = latestVersion(await this.deps.repository.listSubscriptionVersions(sub.id));
      if (!latest || latest.id !== prior.id) throw new StageCError('VERSION_CONFLICT', 'Subscription amendment must reference its latest version.');
      const order = await this.requireOrder(sub.orderId);
      const auth = await this.authorize(actor, 'commercial.subscription.amend', 'subscription_version', sub.customerId, order.technicalTenantId);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.subscription.amend', input.evidence, sub.customerId, order.technicalTenantId);
      const line = orderVersion.lines.find(item => item.id === input.orderLineId)!;
      if (await this.deps.repository.findSubscriptionForSource(orderVersion.id, line.id)) throw new StageCError('IDEMPOTENCY_CONFLICT', 'A subscription already exists for this accepted order version and line.');
      const sourceAuthority = await this.deps.authority.evaluateOrderAuthority(actor, { quoteVersionId: orderVersion.quoteVersionId, at: line.serviceStart });
      assertAuthorityMatches(sourceAuthority, sub.customerId, orderVersion.contractVersionId, orderVersion.acceptanceId);
      const version: SubscriptionVersionRecord = freeze({ id: this.deps.ids.next('subscription_version') as SubscriptionVersionId, subscriptionId: sub.id, sequence: latest.sequence + 1, predecessorId: latest.id, orderVersionId: orderVersion.id, customerId: sub.customerId, product: cloneProduct(line.product), quantity: line.quantity, serviceScope: line.serviceScope, serviceStart: line.serviceStart, serviceEnd: line.serviceEnd, cadence: line.product.cadence, status: 'pending', createdAt: this.deps.clock.now(), createdBy: actor.id });
      await this.deps.repository.insertSubscriptionVersion(version);
      await this.deps.repository.appendSubscriptionEvent(this.subscriptionEvent(sub.id, statusAt(await this.deps.repository.listSubscriptionEvents(sub.id), line.serviceStart), 'pending', line.serviceStart, input.reason, input.correlationId, actor));
      await this.audit(actor, 'commercial.subscription.amend', 'subscription_version', version.id, sub.customerId, order.technicalTenantId, input, { versionId: latest.id }, { versionId: version.id, predecessorId: latest.id, orderVersionId: orderVersion.id, effectiveFrom: version.serviceStart }, verifiedEvidence, auth.decisionReference);
      return version;
    });
  }

  async transitionSubscription(actor: CommercialActor, input: StageCCommand & { subscriptionId: SubscriptionId; to: SubscriptionStatus; effectiveAt: string }): Promise<SubscriptionLifecycleEvent> {
    validateCommand(input); instant(input.effectiveAt, 'effectiveAt');
    return this.deps.idempotency.execute(`stageC.subscription.lifecycle:${input.subscriptionId}:${input.to}`, input.idempotencyKey, async () => {
      const sub = await this.requireSubscription(input.subscriptionId); const order = await this.requireOrder(sub.orderId);
      const auth = await this.authorize(actor, 'commercial.subscription.lifecycle', 'subscription', sub.customerId, order.technicalTenantId);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.subscription.lifecycle', input.evidence, sub.customerId, order.technicalTenantId);
      const events = await this.deps.repository.listSubscriptionEvents(sub.id); const prior = statusAt<SubscriptionStatus, SubscriptionLifecycleEvent>(events, input.effectiveAt);
      assertTransition(prior, input.to, input.effectiveAt, events);
      if (input.to === 'active') {
        const versions = await this.deps.repository.listSubscriptionVersions(sub.id); const version = effectiveVersion(versions, input.effectiveAt);
        if (!version || !isWithin(version.serviceStart, version.serviceEnd, input.effectiveAt)) throw new StageCError('INVALID_TRANSITION', 'Subscription cannot activate outside its service period.');
        if (statusAt(await this.deps.repository.listOrderEvents(order.id), input.effectiveAt) === 'cancelled') throw new StageCError('AUTHORITY_NOT_SATISFIED', 'A cancelled order cannot activate a subscription.');
      }
      if (input.to === 'expired') {
        const version = effectiveVersion(await this.deps.repository.listSubscriptionVersions(sub.id), input.effectiveAt);
        if (!version?.serviceEnd || Date.parse(input.effectiveAt) < Date.parse(version.serviceEnd)) throw new StageCError('INVALID_TRANSITION', 'Subscription may expire only at or after its defined service end.');
      }
      const event = this.subscriptionEvent(sub.id, prior, input.to, input.effectiveAt, input.reason, input.correlationId, actor);
      await this.deps.repository.appendSubscriptionEvent(event);
      await this.audit(actor, 'commercial.subscription.lifecycle', 'subscription', sub.id, sub.customerId, order.technicalTenantId, input, { status: prior }, { status: input.to, effectiveAt: input.effectiveAt }, verifiedEvidence, auth.decisionReference);
      return event;
    });
  }

  async createEntitlement(actor: CommercialActor, input: StageCCommand & { subscriptionId: SubscriptionId; subscriptionVersionId: SubscriptionVersionId; entitlementType: string; limit?: number | null; effectiveFrom: string; effectiveTo?: string | null; target?: EntitlementTechnicalTarget | null }): Promise<EntitlementRecord> {
    validateCommand(input); instant(input.effectiveFrom, 'effectiveFrom'); validateOptionalEnd(input.effectiveFrom, input.effectiveTo ?? null);
    if (!input.entitlementType.trim() || (input.limit != null && (!Number.isFinite(input.limit) || input.limit < 0))) throw new StageCError('INVALID_INPUT', 'Entitlement type and a non-negative limit are required.');
    return this.deps.idempotency.execute(`stageC.entitlement.create:${input.subscriptionVersionId}:${input.entitlementType}:${targetKey(input.target ?? null)}`, input.idempotencyKey, async () => {
      const sub = await this.requireSubscription(input.subscriptionId); const version = await this.requireSubscriptionVersion(input.subscriptionVersionId);
      if (version.subscriptionId !== sub.id || sub.customerId !== version.customerId) throw new StageCError('SCOPE_MISMATCH', 'Entitlement requires the specified subscription version.');
      if (Date.parse(input.effectiveFrom) < Date.parse(version.serviceStart) || (version.serviceEnd && (!input.effectiveTo || Date.parse(input.effectiveTo) > Date.parse(version.serviceEnd)))) throw new StageCError('INVALID_INPUT', 'Entitlement validity must remain within its subscription service period.');
      const order = await this.requireOrder(sub.orderId);
      if (input.target && targetTenant(input.target) !== order.technicalTenantId && order.technicalTenantId !== null) throw new StageCError('SCOPE_MISMATCH', 'Explicit technical target is outside the order technical scope.');
      if (input.target) {
        const mapping = await this.deps.commercialScope.resolveTenantMapping(actor, targetTenant(input.target), input.effectiveFrom);
        if (mapping.status !== 'matched' || mapping.mapping.customerId !== sub.customerId) throw new StageCError('SCOPE_MISMATCH', 'An explicit effective Stage A mapping is required for the entitlement technical target.');
      }
      const auth = await this.authorize(actor, 'commercial.entitlement.create', 'entitlement', sub.customerId, input.target ? targetTenant(input.target) : order.technicalTenantId);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.entitlement.create', input.evidence, sub.customerId, input.target ? targetTenant(input.target) : order.technicalTenantId);
      return this.deps.repository.withEntitlementSourceGuard(version.id, input.entitlementType, input.target ?? null, async () => {
        const existing = await this.deps.repository.findEntitlementForSource(version.id, input.entitlementType, input.target ?? null);
        if (existing) throw new StageCError('IDEMPOTENCY_CONFLICT', 'An entitlement already exists for this subscription version, type and target.');
        const record: EntitlementRecord = freeze({
          id: this.deps.ids.next('entitlement') as EntitlementId, customerId: sub.customerId,
          subscriptionId: sub.id, subscriptionVersionId: version.id, orderId: sub.orderId,
          orderVersionId: version.orderVersionId, productId: version.product.productId,
          entitlementType: input.entitlementType.trim(), quantity: version.quantity, limit: input.limit ?? null,
          effectiveFrom: input.effectiveFrom, effectiveTo: input.effectiveTo ?? null,
          target: input.target ?? null, createdAt: this.deps.clock.now(), createdBy: actor.id,
        });
        await this.deps.repository.insertEntitlement(record);
        await this.deps.repository.appendEntitlementEvent(this.entitlementEvent(record.id, null, 'pending', record.effectiveFrom, input.reason, input.correlationId, actor));
        await this.audit(actor, 'commercial.entitlement.create', 'entitlement', record.id, record.customerId, record.target ? targetTenant(record.target) : order.technicalTenantId, input, null, { id: record.id, customerId: record.customerId, subscriptionId: record.subscriptionId, subscriptionVersionId: record.subscriptionVersionId, entitlementType: record.entitlementType, quantity: record.quantity, limit: record.limit, effectiveFrom: record.effectiveFrom, effectiveTo: record.effectiveTo, targetType: record.target?.type ?? null }, verifiedEvidence, auth.decisionReference);
        return record;
      });
    });
  }

  async transitionEntitlement(actor: CommercialActor, input: StageCCommand & { entitlementId: EntitlementId; to: EntitlementStatus; effectiveAt: string }): Promise<EntitlementLifecycleEvent> {
    validateCommand(input); instant(input.effectiveAt, 'effectiveAt');
    return this.deps.idempotency.execute(`stageC.entitlement.lifecycle:${input.entitlementId}:${input.to}`, input.idempotencyKey, async () => {
      const entitlement = await this.requireEntitlement(input.entitlementId); const sub = await this.requireSubscription(entitlement.subscriptionId); const order = await this.requireOrder(sub.orderId);
      const target = entitlement.target ? targetTenant(entitlement.target) : order.technicalTenantId;
      const auth = await this.authorize(actor, 'commercial.entitlement.lifecycle', 'entitlement', entitlement.customerId, target);
      const verifiedEvidence = await this.verifyEvidence(actor, 'commercial.entitlement.lifecycle', input.evidence, entitlement.customerId, target);
      const events = await this.deps.repository.listEntitlementEvents(entitlement.id); const prior = statusAt<EntitlementStatus, EntitlementLifecycleEvent>(events, input.effectiveAt);
      assertTransition(prior, input.to, input.effectiveAt, events);
      if (input.to === 'active') {
        const subscriptionState = statusAt(await this.deps.repository.listSubscriptionEvents(sub.id), input.effectiveAt);
        if (subscriptionState !== 'active') throw new StageCError('AUTHORITY_NOT_SATISFIED', 'Entitlement can become active only while its subscription is active.');
        if (!isWithin(entitlement.effectiveFrom, entitlement.effectiveTo, input.effectiveAt)) throw new StageCError('INVALID_TRANSITION', 'Entitlement cannot activate outside its effective period.');
      }
      if (input.to === 'expired' && (!entitlement.effectiveTo || Date.parse(input.effectiveAt) < Date.parse(entitlement.effectiveTo))) throw new StageCError('INVALID_TRANSITION', 'Entitlement may expire only at or after its defined effective end.');
      const event = this.entitlementEvent(entitlement.id, prior, input.to, input.effectiveAt, input.reason, input.correlationId, actor);
      await this.deps.repository.appendEntitlementEvent(event);
      await this.audit(actor, 'commercial.entitlement.lifecycle', 'entitlement', entitlement.id, entitlement.customerId, target, input, { status: prior }, { status: input.to, effectiveAt: input.effectiveAt }, verifiedEvidence, auth.decisionReference);
      return event;
    });
  }

  /** Read-only event projection; no writes to legacy license records. */
  async getOrderStatus(id: StageCOrderId, at: string): Promise<CommercialOrderStatus> { instant(at, 'at'); const order = await this.requireOrder(id); return statusAt<CommercialOrderStatus, OrderLifecycleEvent>(await this.deps.repository.listOrderEvents(order.id), at); }

  private makeOrderVersion(order: OrderRecord, inputs: readonly OrderLineInput[], effectiveFrom: string, predecessorId: OrderVersionId | null, sequence: number, status: 'authorized' | 'amended', actor: CommercialActor): OrderVersionRecord {
    const currencies = [...new Set(inputs.map(line => line.product.currency.toUpperCase()))];
    if (currencies.length !== 1) throw new StageCError('INVALID_INPUT', 'One order version must use one currency.');
    return freeze({ id: this.deps.ids.next('order_version') as OrderVersionId, orderId: order.id, sequence, predecessorId, effectiveFrom, status, quoteVersionId: order.quoteVersionId, contractVersionId: order.contractVersionId, acceptanceId: order.acceptanceId, currency: currencies[0], lines: inputs.map(line => freeze({ ...line, id: (line.existingLineId?.trim() || this.deps.ids.next('order_line')) as StageCOrderLineId, existingLineId: line.existingLineId?.trim() || null, product: cloneProduct(line.product), serviceEnd: line.serviceEnd ?? null, entitlementLimit: line.entitlementLimit ?? null })), createdAt: this.deps.clock.now(), createdBy: actor.id });
  }
  private async authorize(actor: CommercialActor, operation: StageCOperation, targetType: StageCTarget, customerId: CustomerId, tenantId: TechnicalTenantId | null) {
    const decision = await this.deps.authorization.authorize({ actor, operation, scope: { customerId, ...(tenantId ? { tenantId } : {}) }, target: { type: targetType } });
    if (!decision.allowed) throw new StageCError('AUTHORIZATION_DENIED', `${operation} was not authorized.`); return decision;
  }
  private async verifyEvidence(actor: CommercialActor, operation: EvidenceOperation, evidence: EvidenceApproval, customerId: CustomerId, tenantId: TechnicalTenantId | null): Promise<string> {
    if (!evidence?.evidenceReference?.trim() || !evidence.approvedBy?.trim()) throw new StageCError('EVIDENCE_REQUIRED', 'Stage C authoritative operations require evidence and an approver.');
    const result = await this.deps.evidenceApprovals.verify({ actor, operation, approval: evidence, scope: { customerId, ...(tenantId ? { tenantId } : {}) } });
    if (!result.verified || !result.verificationReference.trim()) throw new StageCError('EVIDENCE_REQUIRED', 'Evidence approval was not verified.'); return result.verificationReference;
  }
  private async verifyAcceptedLines(quoteVersionId: QuoteVersionId, lines: readonly OrderLineInput[]): Promise<void> {
    for (const line of lines) {
      const result = await this.deps.acceptedQuoteLines.verify({ quoteVersionId, line });
      if (!result.matched || !result.verificationReference.trim()) throw new StageCError('AUTHORITY_NOT_SATISFIED', 'Order line does not match its exact accepted quote-line snapshot.');
    }
  }
  private async audit(actor: CommercialActor, operation: StageCOperation, targetType: StageCTarget, targetId: string, customerId: CustomerId, tenantId: TechnicalTenantId | null, input: StageCCommand,
    priorState: Readonly<Record<string, string | number | boolean | null>> | null,
    newState: Readonly<Record<string, string | number | boolean | null>> | null, evidenceReference: string, authRef: string): Promise<void> {
    await this.deps.audit.append({ id: `stageC-audit:${targetId}:${operation}:${input.idempotencyKey}`, actorId: actor.id, operation, targetType, targetId, tenantId, customerId,
      priorState, newState, reason: input.reason.trim(), correlationId: input.correlationId.trim(), occurredAt: this.deps.clock.now(), outcome: 'succeeded',
      evidenceReference: input.evidence.evidenceReference, evidenceVerificationReference: evidenceReference, authorizationDecisionReference: authRef });
  }
  private orderEvent(orderId: StageCOrderId, from: CommercialOrderStatus | null, to: CommercialOrderStatus, effectiveAt: string, reason: string, correlationId: string, actor: CommercialActor): OrderLifecycleEvent {
    return freeze({ id: this.deps.ids.next('order_event'), orderId, from, to, effectiveAt, reason: reason.trim(), actorId: actor.id, correlationId: correlationId.trim() });
  }
  private subscriptionEvent(id: SubscriptionId, from: SubscriptionStatus | null, to: SubscriptionStatus, effectiveAt: string, reason: string, correlationId: string, actor: CommercialActor): SubscriptionLifecycleEvent {
    return freeze({ id: this.deps.ids.next('subscription_event'), subscriptionId: id, from, to, effectiveAt, reason: reason.trim(), actorId: actor.id, correlationId: correlationId.trim() });
  }
  private entitlementEvent(id: EntitlementId, from: EntitlementStatus | null, to: EntitlementStatus, effectiveAt: string, reason: string, correlationId: string, actor: CommercialActor): EntitlementLifecycleEvent {
    return freeze({ id: this.deps.ids.next('entitlement_event'), entitlementId: id, from, to, effectiveAt, reason: reason.trim(), actorId: actor.id, correlationId: correlationId.trim() });
  }
  private async requireOrder(id: StageCOrderId) { const value = await this.deps.repository.getOrder(id); if (!value) throw new StageCError('NOT_FOUND', 'Order domain record was not found.'); return value; }
  private async requireOrderVersion(id: OrderVersionId) { const value = await this.deps.repository.getOrderVersion(id); if (!value) throw new StageCError('NOT_FOUND', 'Order version was not found.'); return value; }
  private async requireSubscription(id: SubscriptionId) { const value = await this.deps.repository.getSubscription(id); if (!value) throw new StageCError('NOT_FOUND', 'Subscription was not found.'); return value; }
  private async requireSubscriptionVersion(id: SubscriptionVersionId) { const value = await this.deps.repository.getSubscriptionVersion(id); if (!value) throw new StageCError('NOT_FOUND', 'Subscription version was not found.'); return value; }
  private async requireEntitlement(id: EntitlementId) { const value = await this.deps.repository.getEntitlement(id); if (!value) throw new StageCError('NOT_FOUND', 'Entitlement was not found.'); return value; }
}

function assertAuthorityMatches(authority: OrderAuthorityDecision, customerId: CustomerId, contractVersionId: ContractVersionId, acceptanceId: AcceptanceId): asserts authority is Extract<OrderAuthorityDecision, { ready: true }> {
  if (authority.ready === false) throw new StageCError('AUTHORITY_NOT_SATISFIED', `Order authority is not satisfied: ${authority.reason}.`);
  if (authority.contractVersionId !== contractVersionId || authority.acceptanceId !== acceptanceId) throw new StageCError('SCOPE_MISMATCH', 'Order must reference the exact accepted contract and quote versions.');
  if (authority.customerId !== customerId) throw new StageCError('SCOPE_MISMATCH', 'Accepted authority belongs to another commercial customer.');
}
function validateCommand(input: StageCCommand): void { if (!input.reason?.trim() || !input.idempotencyKey?.trim() || !input.correlationId?.trim()) throw new StageCError('INVALID_INPUT', 'Reason, idempotency key and correlation ID are required.'); if (!input.evidence?.evidenceReference?.trim() || !input.evidence.approvedBy?.trim()) throw new StageCError('EVIDENCE_REQUIRED', 'Evidence reference and approver are required.'); }
function instant(value: string, field: string): void { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) throw new StageCError('INVALID_INPUT', `${field} must be an ISO-8601 UTC instant.`); }
function validateOptionalEnd(from: string, to: string | null): void { if (to !== null) { instant(to, 'effectiveTo'); if (Date.parse(to) <= Date.parse(from)) throw new StageCError('INVALID_INPUT', 'Effective end must follow start.'); } }
function validateLines(lines: readonly OrderLineInput[]): void {
  if (!lines.length || lines.length > 100) throw new StageCError('INVALID_INPUT', 'Order must have between one and 100 lines.');
  for (const line of lines) {
    if (!line.acceptedQuoteLineReference?.trim() || !line.priceSnapshotEvidenceReference?.trim() || !line.product.productId?.trim() || !line.product.description?.trim() || !line.product.billingUnit?.trim() || !/^[A-Z]{3}$/.test(line.product.currency) || !decimal(line.product.unitPrice) || !decimal(line.lineTotal) || !Number.isFinite(line.quantity) || line.quantity <= 0 || !line.serviceScope.trim() || !line.entitlementType.trim()) throw new StageCError('INVALID_INPUT', 'Order line must link the accepted quote line and include immutable product/price/currency, quantity, service period and entitlement snapshots.');
    instant(line.serviceStart, 'serviceStart'); validateOptionalEnd(line.serviceStart, line.serviceEnd ?? null);
    if (line.entitlementLimit != null && (!Number.isFinite(line.entitlementLimit) || line.entitlementLimit < 0)) throw new StageCError('INVALID_INPUT', 'Entitlement limit must be non-negative.');
  }
  if (new Set(lines.map(l => l.product.currency)).size !== 1) throw new StageCError('INVALID_INPUT', 'Mixed-currency order versions require an explicit policy and are not supported by this domain boundary.');
}
function decimal(value: string): boolean { return typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(value); }
function freeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) if (child && typeof child === 'object') freeze(child); } return value; }
function cloneProduct(product: ProductPriceSnapshot): ProductPriceSnapshot { return freeze({ ...product, attributes: { ...product.attributes } }); }
function targetKey(target: EntitlementTechnicalTarget | null): string { return target ? `${target.type}:${target.id}` : 'unassigned'; }
function targetTenant(target: EntitlementTechnicalTarget): TechnicalTenantId { return target.type === 'technical_tenant' ? target.id : target.tenantId; }
function isWithin(from: string, to: string | null, at: string): boolean { const time = Date.parse(at); return Date.parse(from) <= time && (to === null || time < Date.parse(to)); }
function latestVersion<T extends { readonly sequence: number }>(versions: readonly T[]): T | null { return [...versions].sort((a, b) => b.sequence - a.sequence)[0] ?? null; }
function effectiveVersion(versions: readonly SubscriptionVersionRecord[], at: string): SubscriptionVersionRecord | null { return [...versions].filter(v => Date.parse(v.serviceStart) <= Date.parse(at)).sort((a, b) => Date.parse(b.serviceStart) - Date.parse(a.serviceStart))[0] ?? null; }
function statusAt<S extends string, T extends { readonly effectiveAt: string; readonly to: S }>(events: readonly T[], at: string): S {
  const event = [...events].filter(e => Date.parse(e.effectiveAt) <= Date.parse(at)).sort((a, b) => Date.parse(b.effectiveAt) - Date.parse(a.effectiveAt))[0];
  if (!event) throw new StageCError('INVALID_TRANSITION', 'No lifecycle state is effective at the requested time.'); return event.to;
}
function assertTransition<S extends string, T extends { readonly effectiveAt: string; readonly to: S }>(prior: S, to: S, effectiveAt: string, events: readonly T[]): void {
  if (events.some(e => e.effectiveAt === effectiveAt)) throw new StageCError('VERSION_CONFLICT', 'Lifecycle events may not share the same effective instant.');
  const allowed: Record<string, readonly string[]> = {
    authorized: ['active', 'cancelled', 'expired'], active: ['amended', 'suspended', 'cancelled', 'expired'],
    amended: ['active', 'amended', 'suspended', 'cancelled', 'expired'], suspended: ['active', 'cancelled', 'expired'],
    pending: ['active', 'suspended', 'cancelled', 'expired'], cancelled: [], expired: [],
    revoked: [],
  };
  if (!allowed[prior]?.includes(to)) throw new StageCError('INVALID_TRANSITION', `Transition ${prior} → ${to} is not allowed.`);
  if (events.some(e => Date.parse(e.effectiveAt) > Date.parse(effectiveAt))) throw new StageCError('VERSION_CONFLICT', 'A backdated state transition cannot reorder recorded lifecycle events.');
}
