/**
 * Stage B contract, quote and acceptance domain boundary.
 *
 * This module is database/HTTP independent. It does not create or update orders,
 * connect to existing routes, or imply any production table, signature method,
 * authorization rule, audit schema, or contractual path.
 */
import {
  AuditPort, AuthorizationPort, CommercialActor, CommercialAuthorizationOperation,
  CommercialAuthorizationTargetType, CustomerId, EvidenceApproval, EvidenceApprovalPort,
  IdempotencyPort,
} from '../stageA/partyAccount';

type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type ContractId = Brand<string, 'ContractId'>;
export type ContractVersionId = Brand<string, 'ContractVersionId'>;
export type QuoteId = Brand<string, 'QuoteId'>;
export type QuoteVersionId = Brand<string, 'QuoteVersionId'>;
export type AcceptanceId = Brand<string, 'AcceptanceId'>;

export type ContractAuthorityPath = 'contract_first' | 'quote_first';
export type StageBOperation = Extract<CommercialAuthorizationOperation,
  | 'commercial.contract.create' | 'commercial.contract.version.create'
  | 'commercial.quote.create' | 'commercial.quote.version.create'
  | 'commercial.acceptance.record' | 'commercial.order.authority.evaluate'>;
type StageBEvidenceOperation = Exclude<StageBOperation, 'commercial.order.authority.evaluate'>;
export type StageBTargetType = Extract<CommercialAuthorizationTargetType,
  'contract' | 'contract_version' | 'quote' | 'quote_version' | 'customer_acceptance'>;

export interface StageBClock { now(): string }
export interface StageBIds { next(kind: 'contract' | 'contract_version' | 'quote' | 'quote_version' | 'acceptance'): string }

export interface ContractRecord {
  readonly id: ContractId;
  readonly customerId: CustomerId;
  readonly authorityPath: ContractAuthorityPath;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface ContractVersionRecord {
  readonly id: ContractVersionId;
  readonly contractId: ContractId;
  readonly customerId: CustomerId;
  readonly sequence: number;
  readonly predecessorId: ContractVersionId | null;
  readonly status: 'executed';
  readonly effectiveFrom: string;
  /** Exclusive end; null means no scheduled end. */
  readonly effectiveTo: string | null;
  readonly terms: Readonly<Record<string, string | number | boolean | null>>;
  readonly evidenceReference: string;
  readonly authorityPath: ContractAuthorityPath;
  readonly quoteVersionId: QuoteVersionId | null;
  readonly acceptanceId: AcceptanceId | null;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface QuoteRecord {
  readonly id: QuoteId;
  readonly customerId: CustomerId;
  readonly contractId: ContractId | null;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface QuoteVersionRecord {
  readonly id: QuoteVersionId;
  readonly quoteId: QuoteId;
  readonly customerId: CustomerId;
  readonly sequence: number;
  readonly predecessorId: QuoteVersionId | null;
  readonly status: 'issued';
  readonly validFrom: string;
  /** Exclusive end; null means no scheduled expiry. */
  readonly validUntil: string | null;
  readonly contractVersionId: ContractVersionId | null;
  readonly snapshot: Readonly<Record<string, string | number | boolean | null>>;
  readonly evidenceReference: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface CustomerAcceptanceRecord {
  readonly id: AcceptanceId;
  readonly customerId: CustomerId;
  readonly quoteId: QuoteId;
  readonly quoteVersionId: QuoteVersionId;
  /** Person/system who accepted, distinct from authorization to accept. */
  readonly acceptingActorId: string;
  readonly authorizationDecisionReference: string;
  readonly acceptedAt: string;
  readonly method: string;
  readonly evidenceReference: string;
  readonly correlationId: string;
  readonly status: 'accepted';
}

export interface ContractQuoteRepository {
  getContract(id: ContractId): Promise<ContractRecord | null>;
  getContractVersion(id: ContractVersionId): Promise<ContractVersionRecord | null>;
  listContractVersions(contractId: ContractId): Promise<readonly ContractVersionRecord[]>;
  insertContract(record: ContractRecord): Promise<void>;
  insertContractVersion(record: ContractVersionRecord): Promise<void>;
  getQuote(id: QuoteId): Promise<QuoteRecord | null>;
  getQuoteVersion(id: QuoteVersionId): Promise<QuoteVersionRecord | null>;
  listQuoteVersions(quoteId: QuoteId): Promise<readonly QuoteVersionRecord[]>;
  insertQuote(record: QuoteRecord): Promise<void>;
  insertQuoteVersion(record: QuoteVersionRecord): Promise<void>;
  getAcceptance(id: AcceptanceId): Promise<CustomerAcceptanceRecord | null>;
  findAcceptanceForQuoteVersion(id: QuoteVersionId): Promise<CustomerAcceptanceRecord | null>;
  /** Optional domain index for quote-first authority lookup; no storage layout implied. */
  listContractVersionsForAcceptedQuote?(id: QuoteVersionId): Promise<readonly ContractVersionId[]>;
  insertAcceptance(record: CustomerAcceptanceRecord): Promise<void>;
}

export interface StageBDependencies {
  readonly repository: ContractQuoteRepository;
  readonly authorization: AuthorizationPort;
  readonly evidenceApprovals: EvidenceApprovalPort;
  readonly idempotency: IdempotencyPort;
  readonly audit: AuditPort;
  readonly clock: StageBClock;
  readonly ids: StageBIds;
}

export interface StageBCommand {
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly evidence: EvidenceApproval;
}

export class StageBError extends Error {
  constructor(readonly code: 'INVALID_INPUT' | 'AUTHORIZATION_DENIED' | 'EVIDENCE_REQUIRED' | 'NOT_FOUND' | 'SCOPE_MISMATCH' | 'INVALID_TRANSITION' | 'VERSION_CONFLICT' | 'AUTHORITY_NOT_SATISFIED', message: string) {
    super(message);
    this.name = 'StageBError';
  }
}

export type OrderAuthorityDecision =
  | { readonly ready: true; readonly path: ContractAuthorityPath; readonly customerId: CustomerId; readonly quoteVersionId: QuoteVersionId; readonly contractVersionId: ContractVersionId; readonly acceptanceId: AcceptanceId }
  | { readonly ready: false; readonly reason: 'acceptance_missing' | 'quote_or_contract_expired' | 'authority_missing' | 'scope_mismatch' };

export class ContractQuoteService {
  constructor(private readonly deps: StageBDependencies) {}

  async createContract(actor: CommercialActor, input: StageBCommand & { customerId: CustomerId; authorityPath: ContractAuthorityPath }): Promise<ContractRecord> {
    validateCommand(input);
    return this.deps.idempotency.execute(`stageB.contract.create:${input.customerId}`, input.idempotencyKey, async () => {
      const auth = await this.authorize(actor, 'commercial.contract.create', 'contract', input.customerId);
      const evidenceRef = await this.verifyEvidence(actor, 'commercial.contract.create', input.evidence, input.customerId);
      const record = freezeRecord<ContractRecord>({
        id: this.deps.ids.next('contract') as ContractId, customerId: input.customerId,
        authorityPath: input.authorityPath, createdAt: this.deps.clock.now(), createdBy: actor.id,
      });
      await this.deps.repository.insertContract(record);
      await this.audit(actor, 'commercial.contract.create', 'contract', record.id, input.customerId, input, null,
        { id: record.id, customerId: record.customerId, authorityPath: record.authorityPath }, evidenceRef, auth.decisionReference);
      return record;
    });
  }

  async createContractVersion(actor: CommercialActor, input: StageBCommand & {
    contractId: ContractId; effectiveFrom: string; effectiveTo?: string | null;
    terms: Readonly<Record<string, string | number | boolean | null>>;
    predecessorId?: ContractVersionId | null; quoteVersionId?: QuoteVersionId | null;
    acceptanceId?: AcceptanceId | null;
  }): Promise<ContractVersionRecord> {
    validateCommand(input);
    validateInterval(input.effectiveFrom, input.effectiveTo ?? null, 'contract version');
    return this.deps.idempotency.execute(`stageB.contract.version:${input.contractId}`, input.idempotencyKey, async () => {
      const contract = await this.deps.repository.getContract(input.contractId);
      if (!contract) throw new StageBError('NOT_FOUND', 'Contract was not found.');
      const auth = await this.authorize(actor, 'commercial.contract.version.create', 'contract_version', contract.customerId);
      const evidenceRef = await this.verifyEvidence(actor, 'commercial.contract.version.create', input.evidence, contract.customerId);
      const prior = await this.deps.repository.listContractVersions(contract.id);
      const predecessorId = input.predecessorId ?? null;
      if ((prior.length === 0 && predecessorId !== null) || (prior.length > 0 && (!predecessorId || !prior.some(v => v.id === predecessorId)))) {
        throw new StageBError('VERSION_CONFLICT', 'A new contract version must reference the current version as its predecessor.');
      }
      if (prior.some(version => intervalsOverlap(input.effectiveFrom, input.effectiveTo ?? null, version.effectiveFrom, version.effectiveTo))) {
        throw new StageBError('VERSION_CONFLICT', 'Contract version effective intervals may not overlap.');
      }
      let quoteVersionId: QuoteVersionId | null = input.quoteVersionId ?? null;
      let acceptanceId: AcceptanceId | null = input.acceptanceId ?? null;
      if (contract.authorityPath === 'contract_first') {
        if (quoteVersionId || acceptanceId) throw new StageBError('INVALID_TRANSITION', 'Contract-first authority versions are established before quote acceptance.');
      } else {
        if (!quoteVersionId || !acceptanceId) throw new StageBError('INVALID_TRANSITION', 'Quote-first contract authority requires the accepted quote version and acceptance.');
        const quoteVersion = await this.deps.repository.getQuoteVersion(quoteVersionId);
        const acceptance = await this.deps.repository.getAcceptance(acceptanceId);
        if (!quoteVersion || !acceptance || acceptance.quoteVersionId !== quoteVersionId || acceptance.id !== acceptanceId || acceptance.customerId !== contract.customerId || quoteVersion.customerId !== contract.customerId) {
          throw new StageBError('SCOPE_MISMATCH', 'Quote-first contract authority must reference the exact accepted quote version for this customer.');
        }
      }
      const record = freezeRecord<ContractVersionRecord>({
        id: this.deps.ids.next('contract_version') as ContractVersionId, contractId: contract.id,
        customerId: contract.customerId, sequence: prior.length + 1, predecessorId,
        status: 'executed', effectiveFrom: input.effectiveFrom, effectiveTo: input.effectiveTo ?? null,
        terms: { ...input.terms }, evidenceReference: evidenceRef, authorityPath: contract.authorityPath,
        quoteVersionId, acceptanceId, createdAt: this.deps.clock.now(), createdBy: actor.id,
      });
      await this.deps.repository.insertContractVersion(record);
      await this.audit(actor, 'commercial.contract.version.create', 'contract_version', record.id, contract.customerId, input, null,
        { id: record.id, contractId: record.contractId, sequence: record.sequence, effectiveFrom: record.effectiveFrom, effectiveTo: record.effectiveTo }, evidenceRef, auth.decisionReference);
      return record;
    });
  }

  async createQuote(actor: CommercialActor, input: StageBCommand & { customerId: CustomerId; contractId?: ContractId | null }): Promise<QuoteRecord> {
    validateCommand(input);
    return this.deps.idempotency.execute(`stageB.quote.create:${input.customerId}`, input.idempotencyKey, async () => {
      const auth = await this.authorize(actor, 'commercial.quote.create', 'quote', input.customerId);
      const evidenceRef = await this.verifyEvidence(actor, 'commercial.quote.create', input.evidence, input.customerId);
      const contractId = input.contractId ?? null;
      if (contractId) {
        const contract = await this.deps.repository.getContract(contractId);
        if (!contract || contract.customerId !== input.customerId || contract.authorityPath !== 'contract_first') throw new StageBError('SCOPE_MISMATCH', 'A contract-first quote must reference an existing contract for the same commercial customer.');
      }
      const record = freezeRecord<QuoteRecord>({ id: this.deps.ids.next('quote') as QuoteId, customerId: input.customerId, contractId, createdAt: this.deps.clock.now(), createdBy: actor.id });
      await this.deps.repository.insertQuote(record);
      await this.audit(actor, 'commercial.quote.create', 'quote', record.id, record.customerId, input, null,
        { id: record.id, customerId: record.customerId, contractId: record.contractId }, evidenceRef, auth.decisionReference);
      return record;
    });
  }

  async createQuoteVersion(actor: CommercialActor, input: StageBCommand & {
    quoteId: QuoteId; validFrom: string; validUntil?: string | null; contractVersionId?: ContractVersionId | null;
    snapshot: Readonly<Record<string, string | number | boolean | null>>; predecessorId?: QuoteVersionId | null;
  }): Promise<QuoteVersionRecord> {
    validateCommand(input);
    validateInterval(input.validFrom, input.validUntil ?? null, 'quote version');
    return this.deps.idempotency.execute(`stageB.quote.version:${input.quoteId}`, input.idempotencyKey, async () => {
      const quote = await this.deps.repository.getQuote(input.quoteId);
      if (!quote) throw new StageBError('NOT_FOUND', 'Quote was not found.');
      const auth = await this.authorize(actor, 'commercial.quote.version.create', 'quote_version', quote.customerId);
      const evidenceRef = await this.verifyEvidence(actor, 'commercial.quote.version.create', input.evidence, quote.customerId);
      const versions = await this.deps.repository.listQuoteVersions(quote.id);
      const predecessorId = input.predecessorId ?? null;
      if ((versions.length === 0 && predecessorId !== null) || (versions.length > 0 && (!predecessorId || !versions.some(v => v.id === predecessorId)))) throw new StageBError('VERSION_CONFLICT', 'A new quote version must reference the current version as its predecessor.');
      if (versions.some(version => intervalsOverlap(input.validFrom, input.validUntil ?? null, version.validFrom, version.validUntil))) throw new StageBError('VERSION_CONFLICT', 'Quote version validity intervals may not overlap.');
      let contractVersionId = input.contractVersionId ?? null;
      if (quote.contractId) {
        if (!contractVersionId) throw new StageBError('INVALID_TRANSITION', 'A contract-first quote version must identify its governing contract version.');
        const governing = await this.deps.repository.getContractVersion(contractVersionId);
        if (!governing || governing.contractId !== quote.contractId || governing.customerId !== quote.customerId || governing.authorityPath !== 'contract_first') throw new StageBError('SCOPE_MISMATCH', 'Quote must reference a contract version for the same customer and contract.');
      } else if (contractVersionId) {
        throw new StageBError('INVALID_TRANSITION', 'A quote-first version cannot reference a contract version before acceptance.');
      }
      const record = freezeRecord<QuoteVersionRecord>({
        id: this.deps.ids.next('quote_version') as QuoteVersionId, quoteId: quote.id, customerId: quote.customerId,
        sequence: versions.length + 1, predecessorId, status: 'issued', validFrom: input.validFrom,
        validUntil: input.validUntil ?? null, contractVersionId, snapshot: { ...input.snapshot },
        evidenceReference: evidenceRef, createdAt: this.deps.clock.now(), createdBy: actor.id,
      });
      await this.deps.repository.insertQuoteVersion(record);
      await this.audit(actor, 'commercial.quote.version.create', 'quote_version', record.id, quote.customerId, input, null,
        { id: record.id, quoteId: quote.id, sequence: record.sequence, status: record.status, validFrom: record.validFrom, validUntil: record.validUntil, contractVersionId }, evidenceRef, auth.decisionReference);
      return record;
    });
  }

  async acceptQuoteVersion(actor: CommercialActor, input: StageBCommand & {
    quoteVersionId: QuoteVersionId; acceptingActorId: string; method: string; acceptedAt: string;
  }): Promise<CustomerAcceptanceRecord> {
    validateCommand(input);
    assertInstant(input.acceptedAt, 'acceptedAt');
    assertText(input.acceptingActorId, 'acceptingActorId');
    assertText(input.method, 'method');
    return this.deps.idempotency.execute(`stageB.acceptance:${input.quoteVersionId}`, input.idempotencyKey, async () => {
      const version = await this.deps.repository.getQuoteVersion(input.quoteVersionId);
      if (!version) throw new StageBError('NOT_FOUND', 'Quote version was not found.');
      const quote = await this.deps.repository.getQuote(version.quoteId);
      if (!quote) throw new StageBError('NOT_FOUND', 'Quote was not found.');
      if (quote.customerId !== version.customerId) throw new StageBError('SCOPE_MISMATCH', 'Quote version commercial scope is inconsistent.');
      const at = Date.parse(input.acceptedAt);
      if (!contains(version.validFrom, version.validUntil, at)) throw new StageBError('INVALID_TRANSITION', 'An expired or not-yet-valid quote version cannot be accepted.');
      if (quote.contractId) {
        const governing = version.contractVersionId ? await this.deps.repository.getContractVersion(version.contractVersionId) : null;
        if (!governing || governing.contractId !== quote.contractId || !contains(governing.effectiveFrom, governing.effectiveTo, at)) {
          throw new StageBError('AUTHORITY_NOT_SATISFIED', 'The governing contract version must be effective when the quote version is accepted.');
        }
      }
      if (await this.deps.repository.findAcceptanceForQuoteVersion(version.id)) throw new StageBError('INVALID_TRANSITION', 'This exact quote version already has an acceptance.');
      const auth = await this.authorize(actor, 'commercial.acceptance.record', 'customer_acceptance', version.customerId);
      const evidenceRef = await this.verifyEvidence(actor, 'commercial.acceptance.record', input.evidence, version.customerId);
      const record = freezeRecord<CustomerAcceptanceRecord>({
        id: this.deps.ids.next('acceptance') as AcceptanceId, customerId: version.customerId, quoteId: quote.id,
        quoteVersionId: version.id, acceptingActorId: input.acceptingActorId,
        authorizationDecisionReference: auth.decisionReference, acceptedAt: input.acceptedAt,
        method: input.method, evidenceReference: evidenceRef, correlationId: input.correlationId.trim(), status: 'accepted',
      });
      await this.deps.repository.insertAcceptance(record);
      await this.audit(actor, 'commercial.acceptance.record', 'customer_acceptance', record.id, record.customerId, input, null,
        { id: record.id, quoteId: record.quoteId, quoteVersionId: record.quoteVersionId, acceptingActorId: record.acceptingActorId, acceptedAt: record.acceptedAt, method: record.method, status: record.status }, evidenceRef, auth.decisionReference);
      return record;
    });
  }

  /**
   * Read-only gate for a future caller. It never creates, mutates or links an
   * order. The actual production authority path remains unverified.
   */
  async evaluateOrderAuthority(actor: CommercialActor, input: { quoteVersionId: QuoteVersionId; at: string }): Promise<OrderAuthorityDecision> {
    assertInstant(input.at, 'at');
    const version = await this.deps.repository.getQuoteVersion(input.quoteVersionId);
    if (!version) throw new StageBError('NOT_FOUND', 'Quote version was not found.');
    const auth = await this.deps.authorization.authorize({ actor, operation: 'commercial.order.authority.evaluate', scope: { tenantId: actor.tenantId ?? undefined, customerId: version.customerId }, target: { type: 'quote_version', id: version.id } });
    if (!auth.allowed) throw new StageBError('AUTHORIZATION_DENIED', 'Order authority evaluation was not authorized.');
    const acceptance = await this.deps.repository.findAcceptanceForQuoteVersion(version.id);
    if (!acceptance) return { ready: false, reason: 'acceptance_missing' };
    const quote = await this.deps.repository.getQuote(version.quoteId);
    if (!quote || quote.customerId !== version.customerId || acceptance.customerId !== version.customerId) return { ready: false, reason: 'scope_mismatch' };
    const at = Date.parse(input.at);
    if (!contains(version.validFrom, version.validUntil, at) || Date.parse(acceptance.acceptedAt) > at) return { ready: false, reason: 'quote_or_contract_expired' };
    if (quote.contractId) {
      const contract = await this.deps.repository.getContract(quote.contractId);
      const contractVersion = version.contractVersionId ? await this.deps.repository.getContractVersion(version.contractVersionId) : null;
      if (!contract || !contractVersion) return { ready: false, reason: 'authority_missing' };
      if (contract.authorityPath !== 'contract_first' || contractVersion.authorityPath !== 'contract_first' || contractVersion.customerId !== version.customerId) return { ready: false, reason: 'scope_mismatch' };
      if (!contains(contractVersion.effectiveFrom, contractVersion.effectiveTo, at)) return { ready: false, reason: 'quote_or_contract_expired' };
      return { ready: true, path: 'contract_first', customerId: version.customerId, quoteVersionId: version.id, contractVersionId: contractVersion.id, acceptanceId: acceptance.id };
    }
    const contractVersions = (await Promise.all((await this.findQuoteFirstContracts(version.id)).map(id => this.deps.repository.getContractVersion(id)))).filter((item): item is ContractVersionRecord => Boolean(item));
    const governing = contractVersions.find(candidate => candidate.authorityPath === 'quote_first' && candidate.quoteVersionId === version.id && candidate.acceptanceId === acceptance.id && candidate.customerId === version.customerId && contains(candidate.effectiveFrom, candidate.effectiveTo, at));
    return governing
      ? { ready: true, path: 'quote_first', customerId: version.customerId, quoteVersionId: version.id, contractVersionId: governing.id, acceptanceId: acceptance.id }
      : { ready: false, reason: 'authority_missing' };
  }

  private async findQuoteFirstContracts(quoteVersionId: QuoteVersionId): Promise<readonly ContractVersionId[]> {
    // The repository deliberately exposes no production query shape. This
    // lookup is provided by an explicit domain index port added below.
    return this.deps.repository.listContractVersionsForAcceptedQuote
      ? this.deps.repository.listContractVersionsForAcceptedQuote(quoteVersionId)
      : [];
  }

  private async authorize(actor: CommercialActor, operation: StageBOperation, targetType: StageBTargetType, customerId: CustomerId) {
    const result = await this.deps.authorization.authorize({ actor, operation, scope: { tenantId: actor.tenantId ?? undefined, customerId }, target: { type: targetType } });
    if (!result.allowed) throw new StageBError('AUTHORIZATION_DENIED', `Operation ${operation} was not authorized.`);
    return result;
  }

  private async verifyEvidence(actor: CommercialActor, operation: StageBEvidenceOperation, evidence: EvidenceApproval, customerId: CustomerId): Promise<string> {
    if (!evidence?.evidenceReference?.trim() || !evidence.approvedBy?.trim()) throw new StageBError('EVIDENCE_REQUIRED', 'Authoritative Stage B actions require approved evidence.');
    const result = await this.deps.evidenceApprovals.verify({ actor, operation, approval: evidence, scope: { tenantId: actor.tenantId ?? undefined, customerId } });
    if (!result.verified || !result.verificationReference.trim()) throw new StageBError('EVIDENCE_REQUIRED', 'Evidence approval was not verified.');
    return result.verificationReference;
  }

  private async audit(actor: CommercialActor, operation: StageBOperation, targetType: StageBTargetType, targetId: string, customerId: CustomerId,
    input: StageBCommand, priorState: Readonly<Record<string, string | number | boolean | null>> | null,
    newState: Readonly<Record<string, string | number | boolean | null>> | null, evidenceReference: string, authorizationDecisionReference: string): Promise<void> {
    await this.deps.audit.append({
      id: `stageB-audit:${targetId}:${operation}`, actorId: actor.id, operation, targetType, targetId,
      tenantId: actor.tenantId, customerId, priorState, newState, reason: input.reason.trim(),
      correlationId: input.correlationId.trim(), occurredAt: this.deps.clock.now(), outcome: 'succeeded',
      evidenceReference: input.evidence.evidenceReference, evidenceVerificationReference: evidenceReference,
      authorizationDecisionReference,
    });
  }
}

function freezeRecord<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) if (child && typeof child === 'object') freezeRecord(child);
  }
  return value;
}
function validateCommand(input: StageBCommand): void {
  assertText(input.reason, 'reason'); assertText(input.idempotencyKey, 'idempotencyKey'); assertText(input.correlationId, 'correlationId');
  if (!input.evidence?.evidenceReference?.trim() || !input.evidence.approvedBy?.trim()) throw new StageBError('EVIDENCE_REQUIRED', 'Evidence reference and approver are required.');
}
function assertText(value: string, field: string): void { if (!value?.trim()) throw new StageBError('INVALID_INPUT', `${field} is required.`); }
function assertInstant(value: string, field: string): void { if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || Number.isNaN(Date.parse(value))) throw new StageBError('INVALID_INPUT', `${field} must be an ISO-8601 UTC instant.`); }
function validateInterval(from: string, to: string | null, label: string): void { assertInstant(from, `${label}.effectiveFrom`); if (to !== null) { assertInstant(to, `${label}.effectiveTo`); if (Date.parse(to) <= Date.parse(from)) throw new StageBError('INVALID_INPUT', `${label} end must be after its start.`); } }
function contains(from: string, to: string | null, instant: number): boolean { return Date.parse(from) <= instant && (to === null || instant < Date.parse(to)); }
function intervalsOverlap(aFrom: string, aTo: string | null, bFrom: string, bTo: string | null): boolean { const aEnd = aTo ? Date.parse(aTo) : Infinity; const bEnd = bTo ? Date.parse(bTo) : Infinity; return Date.parse(aFrom) < bEnd && Date.parse(bFrom) < aEnd; }
