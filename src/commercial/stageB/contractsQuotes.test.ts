import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AcceptanceId, ContractId, ContractQuoteRepository, ContractQuoteService, ContractRecord,
  ContractVersionId, ContractVersionRecord, CustomerAcceptanceRecord, QuoteId, QuoteRecord,
  QuoteVersionId, QuoteVersionRecord, StageBDependencies, StageBError,
} from './contractsQuotes';
import {
  AuditEvent, AuditPort, AuthorizationPort, CommercialActor, CommercialActorId,
  CustomerId, EvidenceApprovalPort, IdempotencyPort, TechnicalTenantId,
} from '../stageA/partyAccount';

const actor: CommercialActor = { id: 'actor-synthetic-signer' as CommercialActorId, tenantId: 'tenant-synthetic-runtime' as TechnicalTenantId };
const customer = 'customer-synthetic-commercial' as CustomerId;
const otherCustomer = 'customer-synthetic-other' as CustomerId;
const instant = '2026-01-01T00:00:00.000Z';
const evidence = { evidenceReference: 'synthetic-evidence:case-1', approvedBy: 'actor-synthetic-approver' as CommercialActorId };

class MemoryRepository implements ContractQuoteRepository {
  contracts = new Map<ContractId, ContractRecord>();
  contractVersions = new Map<ContractVersionId, ContractVersionRecord>();
  quotes = new Map<QuoteId, QuoteRecord>();
  quoteVersions = new Map<QuoteVersionId, QuoteVersionRecord>();
  acceptances = new Map<AcceptanceId, CustomerAcceptanceRecord>();
  async getContract(id: ContractId) { return this.contracts.get(id) ?? null; }
  async getContractVersion(id: ContractVersionId) { return this.contractVersions.get(id) ?? null; }
  async listContractVersions(id: ContractId) { return [...this.contractVersions.values()].filter(v => v.contractId === id); }
  async listContractVersionsForAcceptedQuote(id: QuoteVersionId) { return [...this.contractVersions.values()].filter(v => v.quoteVersionId === id).map(v => v.id); }
  async insertContract(record: ContractRecord) { this.contracts.set(record.id, record); }
  async insertContractVersion(record: ContractVersionRecord) { this.contractVersions.set(record.id, record); }
  async getQuote(id: QuoteId) { return this.quotes.get(id) ?? null; }
  async getQuoteVersion(id: QuoteVersionId) { return this.quoteVersions.get(id) ?? null; }
  async listQuoteVersions(id: QuoteId) { return [...this.quoteVersions.values()].filter(v => v.quoteId === id); }
  async insertQuote(record: QuoteRecord) { this.quotes.set(record.id, record); }
  async insertQuoteVersion(record: QuoteVersionRecord) { this.quoteVersions.set(record.id, record); }
  async getAcceptance(id: AcceptanceId) { return this.acceptances.get(id) ?? null; }
  async findAcceptanceForQuoteVersion(id: QuoteVersionId) { return [...this.acceptances.values()].find(a => a.quoteVersionId === id) ?? null; }
  async insertAcceptance(record: CustomerAcceptanceRecord) { this.acceptances.set(record.id, record); }
}

class MemoryIdempotency implements IdempotencyPort {
  private values = new Map<string, Promise<unknown>>();
  execute<T>(scope: string, key: string, operation: () => Promise<T>): Promise<T> {
    const fullKey = `${scope}:${key}`;
    const prior = this.values.get(fullKey);
    if (prior) return prior as Promise<T>;
    const result = operation(); this.values.set(fullKey, result); return result;
  }
}
class MemoryAuthorization implements AuthorizationPort {
  allowed = true;
  requests: Parameters<AuthorizationPort['authorize']>[0][] = [];
  async authorize(input: Parameters<AuthorizationPort['authorize']>[0]) {
    this.requests.push(input);
    return { allowed: this.allowed && (!input.scope.customerId || input.scope.customerId === customer), decisionReference: `synthetic-auth:${input.operation}` };
  }
}
class MemoryEvidence implements EvidenceApprovalPort {
  verified = true;
  async verify(input: Parameters<EvidenceApprovalPort['verify']>[0]) { return { verified: this.verified, verificationReference: `synthetic-verified:${input.operation}` }; }
}
class MemoryAudit implements AuditPort { events: AuditEvent[] = []; async append(event: AuditEvent) { this.events.push(event); } }

function fixture() {
  const repository = new MemoryRepository(); const authorization = new MemoryAuthorization();
  const evidenceApprovals = new MemoryEvidence(); const audit = new MemoryAudit();
  let serial = 0;
  const deps: StageBDependencies = {
    repository, authorization, evidenceApprovals, audit,
    idempotency: new MemoryIdempotency(), clock: { now: () => instant },
    ids: { next: kind => `synthetic-${kind}-${++serial}` },
  };
  return { service: new ContractQuoteService(deps), repository, authorization, evidenceApprovals, audit };
}
function command(key: string) { return { reason: 'Synthetic test action', idempotencyKey: key, correlationId: `corr:${key}`, evidence }; }
async function issuedQuote(service: ContractQuoteService, contractId?: ContractId, contractVersionId?: ContractVersionId, customerId = customer) {
  const quote = await service.createQuote(actor, { ...command(`quote:${contractId ?? 'origin'}`), customerId, contractId });
  const version = await service.createQuoteVersion(actor, {
    ...command(`quote-version:${quote.id}`), quoteId: quote.id, validFrom: instant,
    validUntil: '2027-01-01T00:00:00.000Z', contractVersionId,
    snapshot: { currency: 'ZAR', quantity: 1, totalMinor: 8500 },
  });
  return { quote, version };
}

test('supports contract-first: executed contract version → issued quote version → explicit acceptance → order gate', async () => {
  const { service } = fixture();
  const contract = await service.createContract(actor, { ...command('contract'), customerId: customer, authorityPath: 'contract_first' });
  const contractVersion = await service.createContractVersion(actor, { ...command('contract-version'), contractId: contract.id, effectiveFrom: instant, terms: { paymentDays: 30 } });
  const { version } = await issuedQuote(service, contract.id, contractVersion.id);
  const before = await service.evaluateOrderAuthority(actor, { quoteVersionId: version.id, at: instant });
  assert.deepEqual(before, { ready: false, reason: 'acceptance_missing' });
  const acceptance = await service.acceptQuoteVersion(actor, { ...command('accept'), quoteVersionId: version.id, acceptingActorId: 'synthetic-person-7', method: 'synthetic-acceptance', acceptedAt: instant });
  const decision = await service.evaluateOrderAuthority(actor, { quoteVersionId: version.id, at: instant });
  assert.deepEqual(decision, { ready: true, path: 'contract_first', customerId: customer, quoteVersionId: version.id, contractVersionId: contractVersion.id, acceptanceId: acceptance.id });
});

test('supports quote-first: issued quote version → acceptance → contract and executed version → order gate', async () => {
  const { service } = fixture();
  const { version } = await issuedQuote(service);
  const acceptance = await service.acceptQuoteVersion(actor, { ...command('accept-first'), quoteVersionId: version.id, acceptingActorId: 'synthetic-person-8', method: 'synthetic-acceptance', acceptedAt: instant });
  const contract = await service.createContract(actor, { ...command('contract-after-acceptance'), customerId: customer, authorityPath: 'quote_first' });
  const contractVersion = await service.createContractVersion(actor, { ...command('version-after-acceptance'), contractId: contract.id, effectiveFrom: instant, terms: { source: 'accepted-quote' }, quoteVersionId: version.id, acceptanceId: acceptance.id });
  assert.deepEqual(await service.evaluateOrderAuthority(actor, { quoteVersionId: version.id, at: instant }), {
    ready: true, path: 'quote_first', customerId: customer, quoteVersionId: version.id, contractVersionId: contractVersion.id, acceptanceId: acceptance.id,
  });
});

test('acceptance is a separate immutable event; order creation, tenant existence and payment are not inputs', async () => {
  const { service, repository } = fixture(); const { version } = await issuedQuote(service);
  assert.equal(repository.acceptances.size, 0);
  assert.deepEqual(await service.evaluateOrderAuthority(actor, { quoteVersionId: version.id, at: instant }), { ready: false, reason: 'acceptance_missing' });
  const acceptance = await service.acceptQuoteVersion(actor, { ...command('accept-explicit'), quoteVersionId: version.id, acceptingActorId: 'synthetic-actor', method: 'synthetic-method', acceptedAt: instant });
  assert.equal(Object.isFrozen(acceptance), true);
  assert.throws(() => { (acceptance as { method: string }).method = 'rewritten'; }, TypeError);
});

test('denies unauthorized and cross-customer operations without creating commercial records', async () => {
  const f = fixture(); f.authorization.allowed = false;
  await assert.rejects(() => f.service.createContract(actor, { ...command('denied'), customerId: customer, authorityPath: 'contract_first' }), StageBError);
  f.authorization.allowed = true;
  await assert.rejects(() => f.service.createContract(actor, { ...command('cross-customer'), customerId: otherCustomer, authorityPath: 'contract_first' }), StageBError);
  assert.equal(f.repository.contracts.size, 0);
  assert.equal(f.authorization.requests[0].scope.tenantId, actor.tenantId);
  assert.equal(f.authorization.requests[0].scope.customerId, customer);
});

test('requires evidence reference and rejects a verifier denial for acceptance', async () => {
  const f = fixture(); const { version } = await issuedQuote(f.service);
  await assert.rejects(() => f.service.acceptQuoteVersion(actor, { ...command('missing-evidence'), evidence: { evidenceReference: '', approvedBy: evidence.approvedBy }, quoteVersionId: version.id, acceptingActorId: 'synthetic-person', method: 'synthetic', acceptedAt: instant }), StageBError);
  f.evidenceApprovals.verified = false;
  await assert.rejects(() => f.service.acceptQuoteVersion(actor, { ...command('rejected-evidence'), quoteVersionId: version.id, acceptingActorId: 'synthetic-person', method: 'synthetic', acceptedAt: instant }), StageBError);
  assert.equal(f.repository.acceptances.size, 0);
});

test('accepts only an exact currently valid quote version and rejects duplicate acceptance', async () => {
  const { service } = fixture(); const { version } = await issuedQuote(service);
  await assert.rejects(() => service.acceptQuoteVersion(actor, { ...command('future'), quoteVersionId: version.id, acceptingActorId: 'person', method: 'synthetic', acceptedAt: '2027-01-01T00:00:00.000Z' }), StageBError);
  const input = { ...command('exact-accept'), quoteVersionId: version.id, acceptingActorId: 'person', method: 'synthetic', acceptedAt: instant };
  await service.acceptQuoteVersion(actor, input);
  await assert.rejects(() => service.acceptQuoteVersion(actor, { ...input, idempotencyKey: 'second-accept' }), StageBError);
});

test('versions are frozen snapshots and amendments create new version IDs without rewriting prior history', async () => {
  const { service, repository } = fixture();
  const contract = await service.createContract(actor, { ...command('version-contract'), customerId: customer, authorityPath: 'contract_first' });
  const firstContract = await service.createContractVersion(actor, { ...command('first-contract-version'), contractId: contract.id, effectiveFrom: instant, effectiveTo: '2026-07-01T00:00:00.000Z', terms: { amount: 10 } });
  const secondContract = await service.createContractVersion(actor, { ...command('second-contract-version'), contractId: contract.id, predecessorId: firstContract.id, effectiveFrom: '2026-07-01T00:00:00.000Z', terms: { amount: 12 } });
  const quote = await service.createQuote(actor, { ...command('amendment-quote'), customerId: customer, contractId: contract.id });
  const quoteFirst = await service.createQuoteVersion(actor, { ...command('first-quote-version'), quoteId: quote.id, validFrom: instant, validUntil: '2026-07-01T00:00:00.000Z', contractVersionId: firstContract.id, snapshot: { totalMinor: 8500 } });
  const quoteSecond = await service.createQuoteVersion(actor, { ...command('second-quote-version'), quoteId: quote.id, predecessorId: quoteFirst.id, validFrom: '2026-07-01T00:00:00.000Z', contractVersionId: secondContract.id, snapshot: { totalMinor: 9000 } });
  assert.notEqual(firstContract.id, secondContract.id); assert.notEqual(quoteFirst.id, quoteSecond.id);
  assert.equal(repository.contractVersions.get(firstContract.id)?.terms.amount, 10);
  assert.equal(repository.quoteVersions.get(quoteFirst.id)?.snapshot.totalMinor, 8500);
  assert.equal(Object.isFrozen(firstContract.terms), true); assert.equal(Object.isFrozen(quoteFirst.snapshot), true);
  assert.throws(() => { (quoteFirst.snapshot as { totalMinor: number }).totalMinor = 1; }, TypeError);
});

test('records Stage A-compatible audit context and authorization separately from accepting actor', async () => {
  const f = fixture(); const { version } = await issuedQuote(f.service);
  const accepted = await f.service.acceptQuoteVersion(actor, { ...command('audit-accept'), quoteVersionId: version.id, acceptingActorId: 'synthetic-signer', method: 'synthetic', acceptedAt: instant });
  const event = f.audit.events.find(item => item.targetId === accepted.id)!;
  assert.equal(event.actorId, actor.id);
  assert.equal(event.tenantId, actor.tenantId);
  assert.equal(event.customerId, customer);
  assert.equal(event.operation, 'commercial.acceptance.record');
  assert.ok(event.authorizationDecisionReference);
  assert.ok(event.evidenceVerificationReference);
  assert.equal(event.correlationId, 'corr:audit-accept');
  assert.equal(event.outcome, 'succeeded');
  assert.equal(accepted.acceptingActorId, 'synthetic-signer');
  assert.notEqual(accepted.acceptingActorId, event.actorId);
});

test('a quote-first contract version must reference the exact accepted quote version and customer', async () => {
  const f = fixture(); const { version } = await issuedQuote(f.service);
  const acceptance = await f.service.acceptQuoteVersion(actor, { ...command('scope-accept'), quoteVersionId: version.id, acceptingActorId: 'signer', method: 'synthetic', acceptedAt: instant });
  const contract = await f.service.createContract(actor, { ...command('scope-contract'), customerId: customer, authorityPath: 'quote_first' });
  await assert.rejects(() => f.service.createContractVersion(actor, { ...command('bad-authority-reference'), contractId: contract.id, effectiveFrom: instant, terms: {}, quoteVersionId: version.id, acceptanceId: 'wrong-acceptance' as AcceptanceId }), StageBError);
  assert.equal(f.repository.contractVersions.size, 0);
  assert.equal(f.repository.acceptances.get(acceptance.id)?.quoteVersionId, version.id);
});
