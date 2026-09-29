import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AuditEvent,
  AuditPort,
  AuthorizationPort,
  BillingAccountId,
  BillingAccountRecord,
  CommercialActor,
  CommercialActorId,
  CustomerId,
  CustomerRecord,
  EvidenceApprovalPort,
  IdempotencyPort,
  IdFactoryPort,
  LegalEntityId,
  LegalEntityRecord,
  MappingCardinalityPolicyPort,
  MappingId,
  OrganisationId,
  OrganisationRecord,
  CommercialPartyRepository,
  PartyAccountService,
  PartyAccountServiceError,
  TechnicalTenantId,
  TenantCommercialMapping,
  TenantCommercialMappingRepository,
} from './partyAccount';

const actor: CommercialActor = { id: 'actor-synthetic-owner' as CommercialActorId, tenantId: null };
const tenantId = 'tenant-synthetic-runtime' as TechnicalTenantId;
const customerId = 'customer-synthetic-001' as CustomerId;
const orgId = 'org-synthetic-001' as OrganisationId;
const legalEntityId = 'legal-synthetic-001' as LegalEntityId;
const billingAccountId = 'account-synthetic-001' as BillingAccountId;

class SyntheticRepository implements CommercialPartyRepository, TenantCommercialMappingRepository {
  customers = new Map<CustomerId, CustomerRecord>();
  organisations = new Map<OrganisationId, OrganisationRecord>();
  legalEntities = new Map<LegalEntityId, LegalEntityRecord>();
  billingAccounts = new Map<BillingAccountId, BillingAccountRecord>();
  mappings: TenantCommercialMapping[] = [];
  private mappingLocks = new Map<TechnicalTenantId, Promise<void>>();

  async getCustomer(id: CustomerId) { return this.customers.get(id) ?? null; }
  async getOrganisation(id: OrganisationId) { return this.organisations.get(id) ?? null; }
  async getLegalEntity(id: LegalEntityId) { return this.legalEntities.get(id) ?? null; }
  async getBillingAccount(id: BillingAccountId) { return this.billingAccounts.get(id) ?? null; }
  async insertCustomer(record: CustomerRecord) { this.customers.set(record.id, record); }
  async insertOrganisation(record: OrganisationRecord) { this.organisations.set(record.id, record); }
  async insertLegalEntity(record: LegalEntityRecord) { this.legalEntities.set(record.id, record); }
  async insertBillingAccount(record: BillingAccountRecord) { this.billingAccounts.set(record.id, record); }
  async listMappingsForTenant(id: TechnicalTenantId) { return this.mappings.filter(mapping => mapping.tenantId === id); }
  async insertMapping(mapping: TenantCommercialMapping) { this.mappings.push(mapping); }
  async withCardinalityGuard<T>(tenantId: TechnicalTenantId, operation: () => Promise<T>): Promise<T> {
    const prior = this.mappingLocks.get(tenantId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => { release = resolve; });
    this.mappingLocks.set(tenantId, current);
    await prior;
    try {
      return await operation();
    } finally {
      release();
      if (this.mappingLocks.get(tenantId) === current) this.mappingLocks.delete(tenantId);
    }
  }
}

class SyntheticIdempotency implements IdempotencyPort {
  private results = new Map<string, Promise<unknown>>();
  execute<T>(scope: string, key: string, operation: () => Promise<T>): Promise<T> {
    const composite = `${scope}:${key}`;
    const existing = this.results.get(composite);
    if (existing) return existing as Promise<T>;
    const result = operation();
    this.results.set(composite, result);
    return result;
  }
}

class SyntheticIds implements IdFactoryPort {
  private nextValue = 0;
  next(kind: Parameters<IdFactoryPort['next']>[0]) { this.nextValue += 1; return `synthetic-${kind}-${this.nextValue}`; }
}

class SyntheticAudit implements AuditPort {
  events: AuditEvent[] = [];
  async append(event: AuditEvent) { this.events.push(event); }
}

class SyntheticAuthorization implements AuthorizationPort {
  allowed = true;
  requests: Parameters<AuthorizationPort['authorize']>[0][] = [];
  async authorize(input: Parameters<AuthorizationPort['authorize']>[0]) {
    this.requests.push(input);
    return { allowed: this.allowed, decisionReference: `synthetic-decision:${input.operation}` };
  }
}

class TenantBoundAuthorization extends SyntheticAuthorization {
  async authorize(input: Parameters<AuthorizationPort['authorize']>[0]) {
    const decision = await super.authorize(input);
    const crossesTenantBoundary = Boolean(input.actor.tenantId && input.scope.tenantId && input.actor.tenantId !== input.scope.tenantId);
    return { ...decision, allowed: decision.allowed && !crossesTenantBoundary };
  }
}

class SyntheticEvidenceApprovals implements EvidenceApprovalPort {
  verified = true;
  async verify(input: Parameters<EvidenceApprovalPort['verify']>[0]) {
    return { verified: this.verified, verificationReference: `synthetic-evidence-verification:${input.operation}` };
  }
}

class OneActiveMappingPerTenant implements MappingCardinalityPolicyPort {
  readonly policyReference = 'synthetic-owner-approved-policy-v1';
  assertAllowed(candidate: TenantCommercialMapping, existing: readonly TenantCommercialMapping[]) {
    const candidateEnd = candidate.effectiveTo ? Date.parse(candidate.effectiveTo) : Number.POSITIVE_INFINITY;
    const overlaps = existing.some(item => {
      const itemEnd = item.effectiveTo ? Date.parse(item.effectiveTo) : Number.POSITIVE_INFINITY;
      return Date.parse(candidate.effectiveFrom) < itemEnd && Date.parse(item.effectiveFrom) < candidateEnd;
    });
    if (overlaps) throw new PartyAccountServiceError('MAPPING_CARDINALITY_CONFLICT', 'Synthetic policy allows only one overlapping mapping per technical tenant.');
  }
}

function makeService(options: { policy?: MappingCardinalityPolicyPort | null; authorization?: SyntheticAuthorization; evidenceApprovals?: SyntheticEvidenceApprovals } = {}) {
  const repository = new SyntheticRepository();
  const audit = new SyntheticAudit();
  const authorization = options.authorization ?? new SyntheticAuthorization();
  const evidenceApprovals = options.evidenceApprovals ?? new SyntheticEvidenceApprovals();
  let clockValue = '2026-01-01T00:00:00.000Z';
  let idValue = 0;
  const service = new PartyAccountService({
    parties: repository,
    mappings: repository,
    authorization,
    evidenceApprovals,
    idempotency: new SyntheticIdempotency(),
    audit,
    clock: { now: () => clockValue },
    ids: { next: kind => `${kind}-synthetic-${++idValue}` },
    mappingPolicy: options.policy === undefined ? new OneActiveMappingPerTenant() : options.policy,
  });
  return { service, repository, audit, authorization, evidenceApprovals, setNow: (value: string) => { clockValue = value; } };
}

function evidence() {
  return { evidenceReference: 'synthetic-evidence:owner-approved-fixture', approvedBy: 'actor-synthetic-owner' as CommercialActorId };
}

function createCustomerInput(idempotencyKey = 'create-customer-1') {
  return { displayName: 'Synthetic Example Customer', evidence: evidence(), reason: 'Synthetic domain test', idempotencyKey, correlationId: `corr:${idempotencyKey}` };
}

async function seedHierarchy(service: PartyAccountService) {
  const customer = await service.createCustomer(actor, createCustomerInput());
  const organisation = await service.createOrganisation(actor, { ...createCustomerInput('create-org-1'), customerId: customer.id, displayName: 'Synthetic Org' });
  const legalEntity = await service.createLegalEntity(actor, { ...createCustomerInput('create-legal-1'), customerId: customer.id, organisationId: organisation.id, jurisdiction: 'za', registrationEvidenceReference: 'synthetic-registration-ref', displayName: 'Synthetic Legal Entity' });
  const account = await service.createBillingAccount(actor, { ...createCustomerInput('create-account-1'), customerId: customer.id, legalEntityId: legalEntity.id, displayName: 'Synthetic Billing Account' });
  return { customer, organisation, legalEntity, account };
}

function mappingInput(ids: { customerId: CustomerId; organisationId?: OrganisationId; legalEntityId?: LegalEntityId; billingAccountId?: BillingAccountId }, overrides: Partial<Parameters<PartyAccountService['createTenantMapping']>[1]> = {}) {
  return {
    tenantId,
    customerId: ids.customerId,
    organisationId: ids.organisationId ?? null,
    legalEntityId: ids.legalEntityId ?? null,
    billingAccountId: ids.billingAccountId ?? null,
    effectiveFrom: '2026-02-01T00:00:00.000Z',
    effectiveTo: null,
    evidenceReference: 'synthetic-evidence:mapping',
    approvedBy: 'actor-synthetic-owner' as CommercialActorId,
    reason: 'Synthetic mapping test',
    idempotencyKey: 'mapping-1',
    correlationId: 'corr:mapping-1',
    ...overrides,
  };
}

test('commercial identity records have distinct IDs and are never derived from a tenant ID', async () => {
  const { service } = makeService();
  const hierarchy = await seedHierarchy(service);
  for (const record of Object.values(hierarchy)) assert.notEqual(record.id, tenantId);
  assert.equal(hierarchy.organisation.customerId, hierarchy.customer.id);
  assert.equal(hierarchy.legalEntity.organisationId, hierarchy.organisation.id);
  assert.equal(hierarchy.account.legalEntityId, hierarchy.legalEntity.id);
});

test('party creation requires owner evidence and validates hierarchy consistency', async () => {
  const { service } = makeService();
  await assert.rejects(
    service.createCustomer(actor, { ...createCustomerInput(), evidence: { evidenceReference: '', approvedBy: actor.id } }),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'EVIDENCE_REQUIRED',
  );
  const customer = await service.createCustomer(actor, createCustomerInput());
  await assert.rejects(
    service.createBillingAccount(actor, { ...createCustomerInput('account-mismatch'), customerId, legalEntityId: 'missing' as LegalEntityId, displayName: 'Bad synthetic account' }),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'ENTITY_NOT_FOUND',
  );
  assert.ok(customer.id);
});

test('organisation, legal entity and billing account reject cross-customer hierarchy links', async () => {
  const { service } = makeService();
  const customerA = await service.createCustomer(actor, createCustomerInput('hierarchy-customer-a'));
  const customerB = await service.createCustomer(actor, createCustomerInput('hierarchy-customer-b'));
  const orgA = await service.createOrganisation(actor, {
    ...createCustomerInput('hierarchy-org-a'), customerId: customerA.id, displayName: 'Synthetic Org A',
  });
  await assert.rejects(
    service.createOrganisation(actor, {
      ...createCustomerInput('hierarchy-org-b'), customerId: customerB.id, parentOrganisationId: orgA.id,
    }),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'HIERARCHY_MISMATCH',
  );
  await assert.rejects(
    service.createLegalEntity(actor, {
      ...createCustomerInput('hierarchy-legal-mismatch'), customerId: customerB.id, organisationId: orgA.id,
      jurisdiction: 'za', registrationEvidenceReference: 'synthetic-registration-ref',
    }),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'HIERARCHY_MISMATCH',
  );
  const legalA = await service.createLegalEntity(actor, {
    ...createCustomerInput('hierarchy-legal-a'), customerId: customerA.id, organisationId: orgA.id,
    jurisdiction: 'za', registrationEvidenceReference: 'synthetic-registration-ref-a',
  });
  await assert.rejects(
    service.createBillingAccount(actor, {
      ...createCustomerInput('hierarchy-account-mismatch'), customerId: customerB.id, legalEntityId: legalA.id,
    }),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'HIERARCHY_MISMATCH',
  );
  const legalB = await service.createLegalEntity(actor, {
    ...createCustomerInput('hierarchy-legal-b'), customerId: customerB.id, jurisdiction: 'za',
    registrationEvidenceReference: 'synthetic-registration-ref-b',
  });
  const accountB = await service.createBillingAccount(actor, {
    ...createCustomerInput('hierarchy-account-b'), customerId: customerB.id, legalEntityId: legalB.id,
  });
  await assert.rejects(
    service.createTenantMapping(actor, mappingInput({ customerId: customerA.id, organisationId: orgA.id, legalEntityId: legalA.id, billingAccountId: accountB.id }, { idempotencyKey: 'hierarchy-mapping-mismatch' })),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'HIERARCHY_MISMATCH',
  );
});

test('caller-asserted evidence is rejected when the evidence approval verifier denies it', async () => {
  const evidenceApprovals = new SyntheticEvidenceApprovals();
  evidenceApprovals.verified = false;
  const { service, repository, audit } = makeService({ evidenceApprovals });
  await assert.rejects(
    service.createCustomer(actor, createCustomerInput('unverified-evidence')),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'EVIDENCE_REQUIRED',
  );
  assert.equal(repository.customers.size, 0);
  assert.equal(audit.events.length, 0);
});

test('repeating the same party creation command returns one identity and one audit event', async () => {
  const { service, repository, audit } = makeService();
  const input = createCustomerInput('repeat-party-create');
  const [first, retry] = await Promise.all([
    service.createCustomer(actor, input),
    service.createCustomer(actor, input),
  ]);
  assert.equal(first.id, retry.id);
  assert.equal(repository.customers.size, 1);
  assert.equal(audit.events.filter(event => event.targetId === first.id).length, 1);
});

test('one commercial billing account can be explicitly mapped to multiple technical tenants', async () => {
  const { service } = makeService();
  const { customer, organisation, legalEntity, account } = await seedHierarchy(service);
  const tenantA = 'tenant-synthetic-a' as TechnicalTenantId;
  const tenantB = 'tenant-synthetic-b' as TechnicalTenantId;
  const base = mappingInput({ customerId: customer.id, organisationId: organisation.id, legalEntityId: legalEntity.id, billingAccountId: account.id });
  await service.createTenantMapping(actor, { ...base, tenantId: tenantA, idempotencyKey: 'shared-account-tenant-a' });
  await service.createTenantMapping(actor, { ...base, tenantId: tenantB, idempotencyKey: 'shared-account-tenant-b' });
  const resolvedA = await service.resolveTenantMapping(actor, tenantA, '2026-02-15T00:00:00.000Z');
  const resolvedB = await service.resolveTenantMapping(actor, tenantB, '2026-02-15T00:00:00.000Z');
  assert.equal(resolvedA.status, 'matched');
  assert.equal(resolvedB.status, 'matched');
  if (resolvedA.status === 'matched' && resolvedB.status === 'matched') {
    assert.equal(resolvedA.mapping.billingAccountId, account.id);
    assert.equal(resolvedB.mapping.billingAccountId, account.id);
    assert.notEqual(resolvedA.mapping.tenantId, resolvedB.mapping.tenantId);
  }
});

test('mapping creation requires an explicit approved cardinality policy', async () => {
  const { service } = makeService({ policy: null });
  const { customer } = await seedHierarchy(service);
  await assert.rejects(
    service.createTenantMapping(actor, mappingInput({ customerId: customer.id })),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'MAPPING_POLICY_REQUIRED',
  );
});

test('mapping cardinality is policy-injected; approved policy rejects overlapping links but allows successive intervals', async () => {
  const { service } = makeService();
  const { customer, organisation, legalEntity, account } = await seedHierarchy(service);
  await service.createTenantMapping(actor, mappingInput({ customerId: customer.id, organisationId: organisation.id, legalEntityId: legalEntity.id, billingAccountId: account.id }));
  await assert.rejects(
    service.createTenantMapping(actor, mappingInput({ customerId: customer.id }, { idempotencyKey: 'mapping-overlap', effectiveFrom: '2026-06-01T00:00:00.000Z' })),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'MAPPING_CARDINALITY_CONFLICT',
  );
  const nextTenant = 'tenant-synthetic-runtime-2' as TechnicalTenantId;
  const nextCustomer = await service.createCustomer(actor, createCustomerInput('create-customer-2'));
  await service.createTenantMapping(actor, mappingInput({ customerId: nextCustomer.id }, { tenantId: nextTenant, effectiveFrom: '2027-02-01T00:00:00.000Z', idempotencyKey: 'mapping-successor' }));
});

test('cardinality guard serializes concurrent conflicting mapping writes', async () => {
  const { service, repository } = makeService();
  const customerA = await service.createCustomer(actor, createCustomerInput('concurrent-customer-a'));
  const customerB = await service.createCustomer(actor, createCustomerInput('concurrent-customer-b'));
  const attempts = await Promise.allSettled([
    service.createTenantMapping(actor, mappingInput({ customerId: customerA.id }, { idempotencyKey: 'concurrent-map-a' })),
    service.createTenantMapping(actor, mappingInput({ customerId: customerB.id }, { idempotencyKey: 'concurrent-map-b' })),
  ]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(result => result.status === 'rejected').length, 1);
  assert.equal(repository.mappings.length, 1);
});

test('effective date intervals use inclusive start and exclusive end', async () => {
  const { service } = makeService();
  const { customer } = await seedHierarchy(service);
  await service.createTenantMapping(actor, mappingInput({ customerId: customer.id }, { effectiveFrom: '2026-02-01T00:00:00.000Z', effectiveTo: '2026-03-01T00:00:00.000Z' }));

  assert.equal((await service.resolveTenantMapping(actor, tenantId, '2026-01-31T23:59:59.999Z')).status, 'unlinked');
  assert.equal((await service.resolveTenantMapping(actor, tenantId, '2026-02-01T00:00:00.000Z')).status, 'matched');
  assert.equal((await service.resolveTenantMapping(actor, tenantId, '2026-03-01T00:00:00.000Z')).status, 'unlinked');
});

test('unlinked and ambiguous mappings are returned as such rather than selecting a commercial identity', async () => {
  const { service, repository } = makeService();
  const first = await service.createCustomer(actor, createCustomerInput());
  assert.equal((await service.resolveTenantMapping(actor, tenantId, '2026-02-15T00:00:00.000Z')).status, 'unlinked');
  const valid = mappingInput({ customerId: first.id });
  const mapping1: TenantCommercialMapping = { ...valid, id: 'mapping-a' as MappingId, createdBy: actor.id, createdAt: '2026-01-01T00:00:00.000Z' };
  const second = await service.createCustomer(actor, createCustomerInput('create-customer-2'));
  const mapping2: TenantCommercialMapping = { ...mappingInput({ customerId: second.id }, { idempotencyKey: 'mapping-b' }), id: 'mapping-b' as MappingId, createdBy: actor.id, createdAt: '2026-01-01T00:00:00.000Z' };
  repository.mappings.push(mapping1, mapping2);
  const result = await service.resolveTenantMapping(actor, tenantId, '2026-02-15T00:00:00.000Z');
  assert.equal(result.status, 'ambiguous');
  if (result.status === 'ambiguous') assert.equal(result.candidates.length, 2);
});

test('idempotent mapping retries return the same mapping and append one correlated audit event', async () => {
  const { service, audit } = makeService();
  const { customer } = await seedHierarchy(service);
  const input = mappingInput({ customerId: customer.id });
  const [first, retry] = await Promise.all([service.createTenantMapping(actor, input), service.createTenantMapping(actor, input)]);
  assert.equal(first.id, retry.id);
  assert.equal(audit.events.filter(event => event.targetType === 'tenant_mapping').length, 1);
  const event = audit.events.find(item => item.targetType === 'tenant_mapping');
  assert.equal(event?.correlationId, input.correlationId);
  assert.equal(event?.tenantId, tenantId);
  assert.equal(event?.authorizationDecisionReference, 'synthetic-decision:commercial.mapping.create');
});

test('mapping write authorization is tenant-scoped and denied writes persist no mapping or audit', async () => {
  const authorization = new SyntheticAuthorization();
  const { service, repository, audit } = makeService({ authorization });
  const { customer } = await seedHierarchy(service);
  authorization.allowed = false;
  await assert.rejects(
    service.createTenantMapping(actor, mappingInput({ customerId: customer.id })),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'AUTHORIZATION_DENIED',
  );
  assert.equal(repository.mappings.length, 0);
  assert.equal(audit.events.filter(event => event.targetType === 'tenant_mapping').length, 0);
  assert.deepEqual(authorization.requests.at(-1), {
    actor,
    operation: 'commercial.mapping.create',
    scope: { tenantId, customerId: customer.id },
    target: { type: 'tenant_mapping' },
  });
});

test('mapping reads authorize the supplied actor and remain tenant scoped', async () => {
  const authorization = new SyntheticAuthorization();
  const { service } = makeService({ authorization });
  const result = await service.resolveTenantMapping(actor, tenantId, '2026-02-01T00:00:00.000Z');
  assert.equal(result.status, 'unlinked');
  assert.deepEqual(authorization.requests.at(-1), {
    actor,
    operation: 'commercial.mapping.resolve',
    scope: { tenantId },
    target: { type: 'tenant_mapping' },
  });
  authorization.allowed = false;
  await assert.rejects(
    service.resolveTenantMapping(actor, tenantId, '2026-02-01T00:00:00.000Z'),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'AUTHORIZATION_DENIED',
  );
});

test('cross-tenant mapping read is denied for a tenant-bound actor', async () => {
  const authorization = new TenantBoundAuthorization();
  const { service, repository, audit } = makeService({ authorization });
  const actorA: CommercialActor = { id: 'actor-tenant-a' as CommercialActorId, tenantId: 'tenant-synthetic-a' as TechnicalTenantId };
  const tenantB = 'tenant-synthetic-b' as TechnicalTenantId;
  const { customer } = await seedHierarchy(service);
  await assert.rejects(
    service.resolveTenantMapping(actorA, tenantB, '2026-02-01T00:00:00.000Z'),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'AUTHORIZATION_DENIED',
  );
  await assert.rejects(
    service.createTenantMapping(actorA, mappingInput({ customerId: customer.id }, { tenantId: tenantB, idempotencyKey: 'cross-tenant-write' })),
    (error: unknown) => error instanceof PartyAccountServiceError && error.code === 'AUTHORIZATION_DENIED',
  );
  assert.equal(repository.mappings.length, 0);
  assert.equal(audit.events.filter(event => event.targetType === 'tenant_mapping').length, 0);
  assert.deepEqual(authorization.requests.slice(-2), [
    { actor: actorA, operation: 'commercial.mapping.resolve', scope: { tenantId: tenantB }, target: { type: 'tenant_mapping' } },
    { actor: actorA, operation: 'commercial.mapping.create', scope: { tenantId: tenantB, customerId: customer.id }, target: { type: 'tenant_mapping' } },
  ]);
});

test('audit is required for party creation and records actor, evidence and correlation', async () => {
  const { service, audit } = makeService();
  const input = createCustomerInput('audit-check');
  const customer = await service.createCustomer(actor, input);
  const event = audit.events.find(item => item.targetId === customer.id);
  assert.ok(event);
  assert.equal(event?.actorId, actor.id);
  assert.equal(event?.evidenceReference, input.evidence.evidenceReference);
  assert.equal(event?.evidenceVerificationReference, 'synthetic-evidence-verification:commercial.party.create');
  assert.equal(event?.correlationId, input.correlationId);
});
