/**
 * Stage A commercial-party domain boundary.
 *
 * This module deliberately has no database or HTTP dependency. A production
 * adapter must not be added until the Stage A evidence and authorization gates
 * establish the live schema and approved mapping policy.
 */

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type CustomerId = Brand<string, 'CustomerId'>;
export type OrganisationId = Brand<string, 'OrganisationId'>;
export type LegalEntityId = Brand<string, 'LegalEntityId'>;
export type BillingAccountId = Brand<string, 'BillingAccountId'>;
export type TechnicalTenantId = Brand<string, 'TechnicalTenantId'>;
export type CommercialActorId = Brand<string, 'CommercialActorId'>;
export type MappingId = Brand<string, 'MappingId'>;

export type CommercialRecordStatus = 'active' | 'inactive' | 'suspended' | 'closed';
export type MappingResolutionStatus = 'matched' | 'unlinked' | 'ambiguous';

export interface EvidenceApproval {
  /** Opaque reference to reviewed evidence; never a raw payload or secret. */
  readonly evidenceReference: string;
  readonly approvedBy: CommercialActorId;
}

interface CommercialRecordBase<Id extends string> {
  readonly id: Id;
  readonly displayName: string;
  readonly status: CommercialRecordStatus;
  readonly evidence: EvidenceApproval;
  readonly createdBy: CommercialActorId;
  readonly createdAt: string;
}

export interface CustomerRecord extends CommercialRecordBase<CustomerId> {}

export interface OrganisationRecord extends CommercialRecordBase<OrganisationId> {
  readonly customerId: CustomerId;
  readonly parentOrganisationId: OrganisationId | null;
}

export interface LegalEntityRecord extends CommercialRecordBase<LegalEntityId> {
  readonly customerId: CustomerId;
  readonly organisationId: OrganisationId | null;
  readonly jurisdiction: string;
  /** Protected source reference only; registration values are not stored here. */
  readonly registrationEvidenceReference: string;
}

export interface BillingAccountRecord extends CommercialRecordBase<BillingAccountId> {
  readonly customerId: CustomerId;
  readonly legalEntityId: LegalEntityId;
}

/**
 * An explicit, effective-dated business mapping. The tenant ID is a security
 * scope, not a source for constructing any commercial identifier.
 */
export interface TenantCommercialMapping {
  readonly id: MappingId;
  readonly tenantId: TechnicalTenantId;
  readonly customerId: CustomerId;
  readonly organisationId: OrganisationId | null;
  readonly legalEntityId: LegalEntityId | null;
  readonly billingAccountId: BillingAccountId | null;
  readonly effectiveFrom: string;
  /** Exclusive end instant; null means no scheduled end. */
  readonly effectiveTo: string | null;
  readonly evidenceReference: string;
  readonly approvedBy: CommercialActorId;
  readonly createdBy: CommercialActorId;
  readonly createdAt: string;
  readonly correlationId: string;
}

export interface CommercialActor {
  readonly id: CommercialActorId;
  readonly tenantId: TechnicalTenantId | null;
}

export type CommercialAuthorizationOperation =
  | 'commercial.party.create'
  | 'commercial.party.hierarchy.change'
  | 'commercial.mapping.create'
  | 'commercial.mapping.change'
  | 'commercial.mapping.read'
  | 'commercial.mapping.resolve'
  | 'commercial.contract.create'
  | 'commercial.contract.version.create'
  | 'commercial.quote.create'
  | 'commercial.quote.version.create'
  | 'commercial.acceptance.record'
  | 'commercial.order.authority.evaluate'
  | 'commercial.order.create'
  | 'commercial.order.amend'
  | 'commercial.order.lifecycle'
  | 'commercial.subscription.create'
  | 'commercial.subscription.amend'
  | 'commercial.subscription.lifecycle'
  | 'commercial.entitlement.create'
  | 'commercial.entitlement.lifecycle'
  | 'commercial.provisioning.eligibility.evaluate'
  | 'commercial.usage.record'
  | 'commercial.provider_cost.record'
  | 'commercial.rating.evaluate'
  | 'commercial.charge.create'
  | 'commercial.budget.evaluate'
  | 'financial.invoice.prepare' | 'financial.invoice.issue'
  | 'financial.payment.create' | 'financial.payment.capture'
  | 'financial.payment.allocate' | 'financial.payment.allocation.reverse'
  | 'financial.credit.create' | 'financial.refund.record'
  | 'financial.reconciliation.record' | 'financial.reconciliation.match'
  | 'financial.settlement.create' | 'financial.accounting.request';

export type CommercialAuthorizationTargetType = 'customer' | 'organisation' | 'legal_entity' | 'billing_account' | 'tenant_mapping' | 'contract' | 'contract_version' | 'quote' | 'quote_version' | 'customer_acceptance' | 'order' | 'order_version' | 'order_line' | 'subscription' | 'subscription_version' | 'entitlement' | 'provisioning_decision' | 'usage_event' | 'provider_cost' | 'rating' | 'customer_charge' | 'budget_policy' | 'financial_invoice' | 'financial_payment' | 'payment_allocation' | 'financial_credit' | 'financial_refund' | 'reconciliation_batch' | 'settlement' | 'accounting_posting_request';

export interface CommercialAuthorizationRequest {
  readonly actor: CommercialActor;
  readonly operation: CommercialAuthorizationOperation;
  /** Technical and commercial scopes are separate and may both be present. */
  readonly scope: {
    readonly tenantId?: TechnicalTenantId;
    readonly customerId?: CustomerId;
  };
  readonly target: {
    readonly type: CommercialAuthorizationTargetType;
    /** Omitted only before a new target receives its stable ID. */
    readonly id?: string;
  };
}

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly decisionReference: string;
}

export interface AuthorizationPort {
  /**
   * The adapter evaluates the supplied actor, operation, and both independent
   * scopes. A commercial relationship alone must never grant runtime tenant access.
   */
  authorize(input: CommercialAuthorizationRequest): Promise<AuthorizationDecision>;
}

export interface EvidenceApprovalPort {
  verify(input: {
    readonly actor: CommercialActor;
    readonly operation: 'commercial.party.create' | 'commercial.party.hierarchy.change' | 'commercial.mapping.create' | 'commercial.mapping.change' | 'commercial.contract.create' | 'commercial.contract.version.create' | 'commercial.quote.create' | 'commercial.quote.version.create' | 'commercial.acceptance.record' | 'commercial.order.create' | 'commercial.order.amend' | 'commercial.order.lifecycle' | 'commercial.subscription.create' | 'commercial.subscription.amend' | 'commercial.subscription.lifecycle' | 'commercial.entitlement.create' | 'commercial.entitlement.lifecycle' | 'commercial.provisioning.eligibility.evaluate' | 'commercial.usage.record' | 'commercial.provider_cost.record' | 'commercial.rating.evaluate' | 'commercial.charge.create' | 'commercial.budget.evaluate' | 'financial.invoice.prepare' | 'financial.invoice.issue' | 'financial.payment.create' | 'financial.payment.capture' | 'financial.payment.allocate' | 'financial.payment.allocation.reverse' | 'financial.credit.create' | 'financial.refund.record' | 'financial.reconciliation.record' | 'financial.reconciliation.match' | 'financial.settlement.create' | 'financial.accounting.request';
    readonly approval: EvidenceApproval;
    readonly scope: {
      readonly tenantId?: TechnicalTenantId;
      readonly customerId?: CustomerId;
    };
  }): Promise<{ verified: boolean; verificationReference: string }>;
}

export interface MappingCardinalityPolicyPort {
  /** Evidence/owner-approved policy identifier. No production default exists. */
  readonly policyReference: string;
  assertAllowed(candidate: TenantCommercialMapping, existing: readonly TenantCommercialMapping[]): void;
}

/**
 * Persistence for the commercial hierarchy. Before a production adapter binds
 * this port, it must establish the actual tables, columns, foreign keys,
 * indexes, nullability and uniqueness from supplied/live evidence. This
 * interface does not select or imply any physical schema.
 */
export interface CommercialPartyRepository {
  getCustomer(id: CustomerId): Promise<CustomerRecord | null>;
  getOrganisation(id: OrganisationId): Promise<OrganisationRecord | null>;
  getLegalEntity(id: LegalEntityId): Promise<LegalEntityRecord | null>;
  getBillingAccount(id: BillingAccountId): Promise<BillingAccountRecord | null>;
  insertCustomer(record: CustomerRecord): Promise<void>;
  insertOrganisation(record: OrganisationRecord): Promise<void>;
  insertLegalEntity(record: LegalEntityRecord): Promise<void>;
  insertBillingAccount(record: BillingAccountRecord): Promise<void>;
}

/**
 * Persistence for technical-tenant ↔ commercial-party mappings.
 * `withCardinalityGuard` must make the enclosed list/check/insert operation
 * safe against concurrent writes for the same technical tenant. An adapter
 * may use verified database constraints, transactional locking, serializable
 * or otherwise appropriate transaction semantics, application validation, or
 * a combination. It selects the mechanism from verified schema/operational
 * evidence. Effective-date overlap enforcement and transaction boundaries
 * must also be established by the adapter. This port assumes no database,
 * constraint, or transaction layout.
 */
export interface TenantCommercialMappingRepository {
  listMappingsForTenant(tenantId: TechnicalTenantId): Promise<readonly TenantCommercialMapping[]>;
  insertMapping(mapping: TenantCommercialMapping): Promise<void>;
  withCardinalityGuard<T>(tenantId: TechnicalTenantId, operation: () => Promise<T>): Promise<T>;
}

export interface IdempotencyPort {
  /** Implementations must atomically return the first result for a scoped key. */
  execute<T>(scope: string, key: string, operation: () => Promise<T>): Promise<T>;
}

export interface AuditEvent {
  readonly id: string;
  readonly actorId: CommercialActorId;
  readonly operation: CommercialAuthorizationOperation;
  readonly targetType: CommercialAuthorizationTargetType;
  readonly targetId: string;
  readonly tenantId: TechnicalTenantId | null;
  readonly customerId: CustomerId | null;
  readonly priorState: Readonly<Record<string, string | number | boolean | null>> | null;
  readonly newState: Readonly<Record<string, string | number | boolean | null>> | null;
  readonly reason: string;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly outcome: 'succeeded' | 'denied' | 'failed';
  readonly evidenceReference: string | null;
  readonly evidenceVerificationReference: string | null;
  readonly authorizationDecisionReference: string | null;
}

export interface AuditPort {
  /**
   * Preserve the event semantics without assuming the production `audit_logs`
   * schema can represent them. The adapter must establish durable-write and
   * persistence-failure recovery semantics before application integration.
   */
  append(event: AuditEvent): Promise<void>;
}

export interface ClockPort {
  now(): string;
}

export interface IdFactoryPort {
  next(kind: 'customer' | 'organisation' | 'legal_entity' | 'billing_account' | 'tenant_mapping' | 'audit'): string;
}

export interface PartyAccountServiceDependencies {
  parties: CommercialPartyRepository;
  mappings: TenantCommercialMappingRepository;
  authorization: AuthorizationPort;
  evidenceApprovals: EvidenceApprovalPort;
  idempotency: IdempotencyPort;
  audit: AuditPort;
  clock: ClockPort;
  ids: IdFactoryPort;
  /** Null until a reviewed cardinality policy is available. */
  mappingPolicy: MappingCardinalityPolicyPort | null;
}

export type PartyAccountServiceErrorCode =
  | 'INVALID_INPUT'
  | 'AUTHORIZATION_DENIED'
  | 'EVIDENCE_REQUIRED'
  | 'MAPPING_POLICY_REQUIRED'
  | 'MAPPING_CARDINALITY_CONFLICT'
  | 'ENTITY_NOT_FOUND'
  | 'HIERARCHY_MISMATCH';

export class PartyAccountServiceError extends Error {
  constructor(readonly code: PartyAccountServiceErrorCode, message: string) {
    super(message);
    this.name = 'PartyAccountServiceError';
  }
}

export interface CreateCommercialRecordInput {
  displayName: string;
  evidence: EvidenceApproval;
  reason: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface CreateOrganisationInput extends CreateCommercialRecordInput {
  customerId: CustomerId;
  parentOrganisationId?: OrganisationId | null;
}

export interface CreateLegalEntityInput extends CreateCommercialRecordInput {
  customerId: CustomerId;
  organisationId?: OrganisationId | null;
  jurisdiction: string;
  registrationEvidenceReference: string;
}

export interface CreateBillingAccountInput extends CreateCommercialRecordInput {
  customerId: CustomerId;
  legalEntityId: LegalEntityId;
}

export interface CreateTenantMappingInput {
  tenantId: TechnicalTenantId;
  customerId: CustomerId;
  organisationId?: OrganisationId | null;
  legalEntityId?: LegalEntityId | null;
  billingAccountId?: BillingAccountId | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  evidenceReference: string;
  approvedBy: CommercialActorId;
  reason: string;
  idempotencyKey: string;
  correlationId: string;
}

export type TenantMappingResolution =
  | { status: 'unlinked'; tenantId: TechnicalTenantId; asOf: string }
  | { status: 'matched'; tenantId: TechnicalTenantId; asOf: string; mapping: TenantCommercialMapping }
  | { status: 'ambiguous'; tenantId: TechnicalTenantId; asOf: string; candidates: readonly TenantCommercialMapping[] };

export class PartyAccountService {
  constructor(private readonly deps: PartyAccountServiceDependencies) {}

  async createCustomer(actor: CommercialActor, input: CreateCommercialRecordInput): Promise<CustomerRecord> {
    return this.createSimpleRecord(actor, input, 'customer', 'commercial.party.create', id => ({
      id: id as CustomerId,
      displayName: input.displayName.trim(),
      status: 'active',
      evidence: input.evidence,
      createdBy: actor.id,
      createdAt: this.deps.clock.now(),
    }), record => this.deps.parties.insertCustomer(record as CustomerRecord));
  }

  async createOrganisation(actor: CommercialActor, input: CreateOrganisationInput): Promise<OrganisationRecord> {
    return this.createSimpleRecord(actor, input, 'organisation', 'commercial.party.create', async id => {
      const customer = await this.deps.parties.getCustomer(input.customerId);
      if (!customer) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Approved customer record was not found.');
      const parentId = input.parentOrganisationId ?? null;
      if (parentId) {
        const parent = await this.deps.parties.getOrganisation(parentId);
        if (!parent) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Parent organisation was not found.');
        if (parent.customerId !== input.customerId) throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Organisation hierarchy must remain within its approved customer.');
      }
      return {
        id: id as OrganisationId,
        displayName: input.displayName.trim(),
        status: 'active',
        customerId: input.customerId,
        parentOrganisationId: parentId,
        evidence: input.evidence,
        createdBy: actor.id,
        createdAt: this.deps.clock.now(),
      };
    }, record => this.deps.parties.insertOrganisation(record as OrganisationRecord));
  }

  async createLegalEntity(actor: CommercialActor, input: CreateLegalEntityInput): Promise<LegalEntityRecord> {
    return this.createSimpleRecord(actor, input, 'legal_entity', 'commercial.party.create', async id => {
      if (!await this.deps.parties.getCustomer(input.customerId)) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Approved customer record was not found.');
      const organisationId = input.organisationId ?? null;
      if (organisationId) {
        const organisation = await this.deps.parties.getOrganisation(organisationId);
        if (!organisation) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Organisation was not found.');
        if (organisation.customerId !== input.customerId) throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Legal entity and organisation must belong to the same approved customer.');
      }
      assertNonEmpty(input.jurisdiction, 'jurisdiction');
      assertNonEmpty(input.registrationEvidenceReference, 'registrationEvidenceReference');
      return {
        id: id as LegalEntityId,
        displayName: input.displayName.trim(),
        status: 'active',
        customerId: input.customerId,
        organisationId,
        jurisdiction: input.jurisdiction.trim().toUpperCase(),
        registrationEvidenceReference: input.registrationEvidenceReference.trim(),
        evidence: input.evidence,
        createdBy: actor.id,
        createdAt: this.deps.clock.now(),
      };
    }, record => this.deps.parties.insertLegalEntity(record as LegalEntityRecord));
  }

  async createBillingAccount(actor: CommercialActor, input: CreateBillingAccountInput): Promise<BillingAccountRecord> {
    return this.createSimpleRecord(actor, input, 'billing_account', 'commercial.party.create', async id => {
      const customer = await this.deps.parties.getCustomer(input.customerId);
      const legalEntity = await this.deps.parties.getLegalEntity(input.legalEntityId);
      if (!customer || !legalEntity) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Approved customer and legal entity records are required.');
      if (legalEntity.customerId !== input.customerId) throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Billing account and legal entity must belong to the same approved customer.');
      return {
        id: id as BillingAccountId,
        displayName: input.displayName.trim(),
        status: 'active',
        customerId: input.customerId,
        legalEntityId: input.legalEntityId,
        evidence: input.evidence,
        createdBy: actor.id,
        createdAt: this.deps.clock.now(),
      };
    }, record => this.deps.parties.insertBillingAccount(record as BillingAccountRecord));
  }

  async createTenantMapping(actor: CommercialActor, input: CreateTenantMappingInput): Promise<TenantCommercialMapping> {
    validateCommonCommand(input);
    assertNonEmpty(input.tenantId, 'tenantId');
    try {
      assertNonEmpty(input.evidenceReference, 'evidenceReference');
      assertNonEmpty(input.approvedBy, 'approvedBy');
    } catch {
      throw new PartyAccountServiceError('EVIDENCE_REQUIRED', 'Mapping requires an evidence reference and explicit approver.');
    }
    assertIsoInstant(input.effectiveFrom, 'effectiveFrom');
    if (input.effectiveTo) {
      assertIsoInstant(input.effectiveTo, 'effectiveTo');
      if (Date.parse(input.effectiveTo) <= Date.parse(input.effectiveFrom)) throw new PartyAccountServiceError('INVALID_INPUT', 'effectiveTo must be later than effectiveFrom.');
    }
    const policy = this.deps.mappingPolicy;
    if (!policy || !policy.policyReference.trim()) throw new PartyAccountServiceError('MAPPING_POLICY_REQUIRED', 'An owner-approved mapping-cardinality policy is required; production cardinality is unknown.');

    const scope = `commercial.mapping.create:${actor.id}:${input.tenantId}`;
    return this.deps.idempotency.execute(scope, input.idempotencyKey, async () => {
      const authorizationRequest: CommercialAuthorizationRequest = {
        actor,
        operation: 'commercial.mapping.create',
        scope: { tenantId: input.tenantId, customerId: input.customerId },
        target: { type: 'tenant_mapping' },
      };
      const decision = await this.assertAuthorized(authorizationRequest);
      const evidenceVerification = await this.verifyEvidence(actor, 'commercial.mapping.create', {
        evidenceReference: input.evidenceReference,
        approvedBy: input.approvedBy,
      }, authorizationRequest.scope);
      const customer = await this.deps.parties.getCustomer(input.customerId);
      if (!customer) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Approved customer record was not found.');

      const organisationId = input.organisationId ?? null;
      const legalEntityId = input.legalEntityId ?? null;
      const billingAccountId = input.billingAccountId ?? null;
      let resolvedLegalEntity: LegalEntityRecord | null = null;
      if (organisationId) {
        const organisation = await this.deps.parties.getOrganisation(organisationId);
        if (!organisation) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Organisation was not found.');
        if (organisation.customerId !== input.customerId) throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Mapping organisation must belong to the mapped customer.');
      }
      if (legalEntityId) {
        resolvedLegalEntity = await this.deps.parties.getLegalEntity(legalEntityId);
        if (!resolvedLegalEntity) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Legal entity was not found.');
        if (resolvedLegalEntity.customerId !== input.customerId || (organisationId && resolvedLegalEntity.organisationId !== organisationId)) {
          throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Mapping legal entity must match the approved customer and organisation context.');
        }
      }
      if (billingAccountId) {
        const billingAccount = await this.deps.parties.getBillingAccount(billingAccountId);
        if (!billingAccount) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Billing account was not found.');
        if (billingAccount.customerId !== input.customerId || (legalEntityId && billingAccount.legalEntityId !== legalEntityId)) {
          throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Mapping billing account must match the approved customer and legal entity context.');
        }
        resolvedLegalEntity ??= await this.deps.parties.getLegalEntity(billingAccount.legalEntityId);
        if (!resolvedLegalEntity) throw new PartyAccountServiceError('ENTITY_NOT_FOUND', 'Billing account legal entity was not found.');
        if (resolvedLegalEntity.customerId !== input.customerId || (organisationId && resolvedLegalEntity.organisationId !== organisationId)) {
          throw new PartyAccountServiceError('HIERARCHY_MISMATCH', 'Mapping billing account legal entity must match the approved customer and organisation context.');
        }
      }

      const createdAt = this.deps.clock.now();
      const mapping: TenantCommercialMapping = {
        id: this.deps.ids.next('tenant_mapping') as MappingId,
        tenantId: input.tenantId,
        customerId: input.customerId,
        organisationId,
        legalEntityId,
        billingAccountId,
        effectiveFrom: input.effectiveFrom,
        effectiveTo: input.effectiveTo ?? null,
        evidenceReference: input.evidenceReference.trim(),
        approvedBy: input.approvedBy,
        createdBy: actor.id,
        createdAt,
        correlationId: input.correlationId.trim(),
      };
      return this.deps.mappings.withCardinalityGuard(input.tenantId, async () => {
        const existing = await this.deps.mappings.listMappingsForTenant(input.tenantId);
        policy.assertAllowed(mapping, existing);
        await this.deps.mappings.insertMapping(mapping);
        await this.appendAudit({
          actor,
          operation: 'commercial.mapping.create',
          targetType: 'tenant_mapping',
          targetId: mapping.id,
          tenantId: input.tenantId,
          customerId: input.customerId,
          priorState: null,
          newState: {
            mappingId: mapping.id,
            tenantId: mapping.tenantId,
            customerId: mapping.customerId,
            organisationId: mapping.organisationId,
            legalEntityId: mapping.legalEntityId,
            billingAccountId: mapping.billingAccountId,
            effectiveFrom: mapping.effectiveFrom,
            effectiveTo: mapping.effectiveTo,
            cardinalityPolicyReference: policy.policyReference,
          },
          reason: input.reason,
          correlationId: input.correlationId,
          evidenceReference: input.evidenceReference,
          evidenceVerificationReference: evidenceVerification,
          authorizationDecisionReference: decision.decisionReference,
        });
        return mapping;
      });
    });
  }

  async resolveTenantMapping(actor: CommercialActor, tenantId: TechnicalTenantId, asOf: string): Promise<TenantMappingResolution> {
    assertNonEmpty(tenantId, 'tenantId');
    assertIsoInstant(asOf, 'asOf');
    const decision = await this.deps.authorization.authorize({
      actor,
      operation: 'commercial.mapping.resolve',
      scope: { tenantId },
      target: { type: 'tenant_mapping' },
    });
    if (!decision.allowed) throw new PartyAccountServiceError('AUTHORIZATION_DENIED', 'Tenant mapping resolution was not authorized.');
    const instant = Date.parse(asOf);
    const candidates = (await this.deps.mappings.listMappingsForTenant(tenantId)).filter(mapping =>
      Date.parse(mapping.effectiveFrom) <= instant && (mapping.effectiveTo === null || instant < Date.parse(mapping.effectiveTo))
    );
    if (candidates.length === 0) return { status: 'unlinked', tenantId, asOf };
    if (candidates.length > 1) return { status: 'ambiguous', tenantId, asOf, candidates };
    return { status: 'matched', tenantId, asOf, mapping: candidates[0] };
  }

  private async createSimpleRecord<T extends CommercialRecordBase<string>, Input extends CreateCommercialRecordInput>(
    actor: CommercialActor,
    input: Input,
    kind: 'customer' | 'organisation' | 'legal_entity' | 'billing_account',
    permission: 'commercial.party.create',
    build: (id: string) => T | Promise<T>,
    insert: (record: T) => Promise<void>,
  ): Promise<T> {
    validateCommonCommand(input);
    assertNonEmpty(input.displayName, 'displayName');
    try {
      validateEvidence(input.evidence);
    } catch {
      throw new PartyAccountServiceError('EVIDENCE_REQUIRED', 'Commercial-party creation requires an evidence reference and explicit approver.');
    }
    const scope = `commercial.party.create:${kind}:${actor.id}`;
    return this.deps.idempotency.execute(scope, input.idempotencyKey, async () => {
      const customerId = 'customerId' in input ? input.customerId as CustomerId : undefined;
      const decision = await this.assertAuthorized({
        actor,
        operation: permission,
        scope: customerId ? { customerId } : {},
        target: { type: kind },
      });
      const evidenceVerification = await this.verifyEvidence(actor, permission, input.evidence, customerId ? { customerId } : {});
      const record = await build(this.deps.ids.next(kind));
      await insert(record);
      await this.appendAudit({
        actor,
        operation: permission,
        targetType: kind,
        targetId: record.id,
        tenantId: null,
        customerId: customerId ?? (kind === 'customer' ? record.id as CustomerId : null),
        priorState: null,
        newState: partyAuditState(record),
        reason: input.reason,
        correlationId: input.correlationId,
        evidenceReference: input.evidence.evidenceReference,
        evidenceVerificationReference: evidenceVerification,
        authorizationDecisionReference: decision.decisionReference,
      });
      return record;
    });
  }

  private async assertAuthorized(request: CommercialAuthorizationRequest): Promise<AuthorizationDecision> {
    const decision = await this.deps.authorization.authorize(request);
    if (!decision.allowed) throw new PartyAccountServiceError('AUTHORIZATION_DENIED', `Actor is not authorized for ${request.operation}.`);
    return decision;
  }

  private async verifyEvidence(
    actor: CommercialActor,
    action: 'commercial.party.create' | 'commercial.mapping.create',
    approval: EvidenceApproval,
    scope: { readonly tenantId?: TechnicalTenantId; readonly customerId?: CustomerId },
  ): Promise<string> {
    const result = await this.deps.evidenceApprovals.verify({ actor, operation: action, approval, scope });
    if (!result.verified || !result.verificationReference.trim()) {
      throw new PartyAccountServiceError('EVIDENCE_REQUIRED', 'The supplied evidence approval could not be verified.');
    }
    return result.verificationReference;
  }

  private async appendAudit(input: {
    actor: CommercialActor;
    operation: CommercialAuthorizationOperation;
    targetType: AuditEvent['targetType'];
    targetId: string;
    tenantId: TechnicalTenantId | null;
    customerId: CustomerId | null;
    priorState: AuditEvent['priorState'];
    newState: AuditEvent['newState'];
    reason: string;
    correlationId: string;
    evidenceReference: string | null;
    evidenceVerificationReference: string | null;
    authorizationDecisionReference: string | null;
  }): Promise<void> {
    await this.deps.audit.append({
      id: this.deps.ids.next('audit'),
      actorId: input.actor.id,
      operation: input.operation,
      targetType: input.targetType,
      targetId: input.targetId,
      tenantId: input.tenantId,
      customerId: input.customerId,
      priorState: input.priorState,
      newState: input.newState,
      reason: input.reason.trim(),
      correlationId: input.correlationId.trim(),
      occurredAt: this.deps.clock.now(),
      outcome: 'succeeded',
      evidenceReference: input.evidenceReference?.trim() ?? null,
      evidenceVerificationReference: input.evidenceVerificationReference,
      authorizationDecisionReference: input.authorizationDecisionReference,
    });
  }
}

export function assertNonEmpty(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) throw new PartyAccountServiceError('INVALID_INPUT', `${field} is required.`);
}

function partyAuditState(record: CommercialRecordBase<string>): Readonly<Record<string, string | number | boolean | null>> {
  const state: Record<string, string | number | boolean | null> = { id: record.id, status: record.status };
  if ('customerId' in record) state.customerId = auditScalar(record.customerId);
  if ('parentOrganisationId' in record) state.parentOrganisationId = auditScalar(record.parentOrganisationId);
  if ('organisationId' in record) state.organisationId = auditScalar(record.organisationId);
  if ('legalEntityId' in record) state.legalEntityId = auditScalar(record.legalEntityId);
  if ('jurisdiction' in record) state.jurisdiction = auditScalar(record.jurisdiction);
  return state;
}

function auditScalar(value: unknown): string | number | boolean | null {
  if (value === null) return null;
  switch (typeof value) {
    case 'string': return value;
    case 'number': return value;
    case 'boolean': return value;
    default: return null;
  }
}

function validateCommonCommand(input: { reason: string; idempotencyKey: string; correlationId: string }): void {
  assertNonEmpty(input.reason, 'reason');
  assertNonEmpty(input.idempotencyKey, 'idempotencyKey');
  assertNonEmpty(input.correlationId, 'correlationId');
}

function validateEvidence(evidence: EvidenceApproval): void {
  assertNonEmpty(evidence.evidenceReference, 'evidence.evidenceReference');
  assertNonEmpty(evidence.approvedBy, 'evidence.approvedBy');
}

function assertIsoInstant(value: string, field: string): void {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new PartyAccountServiceError('INVALID_INPUT', `${field} must be an ISO-8601 UTC timestamp.`);
  }
}
