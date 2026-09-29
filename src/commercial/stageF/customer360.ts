import type { CustomerId, CustomerRecord, OrganisationRecord, LegalEntityRecord, BillingAccountRecord, TenantCommercialMapping, MappingResolutionStatus, TechnicalTenantId } from '../stageA/partyAccount';
import type { ContractRecord, ContractVersionRecord, QuoteRecord, QuoteVersionRecord, CustomerAcceptanceRecord } from '../stageB/contractsQuotes';
import type { OrderRecord, OrderVersionRecord, SubscriptionRecord, SubscriptionVersionRecord, EntitlementRecord } from '../stageC/ordersSubscriptions';
import type { UsageEvent, RatingDecision, CustomerCharge } from '../stageD/usageRating';
import type { FinancialInvoice, FinancialPayment, PaymentAllocation, CreditNote, FinancialRefund, ReconciliationBatch, FinancialSettlement, AccountingPostingRequest } from '../stageE/financialLifecycle';
import type { LifecycleEvidence, LifecycleNode, LifecycleStageId } from './commercialLifecycle';
import { buildCommercialLifecycle } from './commercialLifecycle';
import type { TrustControl, TrustPostureInput } from './trustPosture';
import { buildTrustPosture } from './trustPosture';
import type { AiFinOpsSummary } from './aiFinOps';
export type { CustomerId };
export type MappingState = MappingResolutionStatus | 'pending' | 'evidence_required' | 'unknown';
export interface TechnicalRelationship { readonly tenantId: TechnicalTenantId; readonly mappingState: MappingState; readonly mapping?: TenantCommercialMapping | null; readonly note: string; }
export interface Customer360DomainSources {
  readonly customer: CustomerRecord; readonly organisations: readonly OrganisationRecord[]; readonly legalEntities: readonly LegalEntityRecord[]; readonly billingAccounts: readonly BillingAccountRecord[];
  readonly technicalRelationships: readonly TechnicalRelationship[];
  readonly contracts: readonly ContractRecord[]; readonly contractVersions: readonly ContractVersionRecord[]; readonly quotes: readonly QuoteRecord[]; readonly quoteVersions: readonly QuoteVersionRecord[]; readonly acceptances: readonly CustomerAcceptanceRecord[];
  readonly orders: readonly OrderRecord[]; readonly orderVersions: readonly OrderVersionRecord[]; readonly subscriptions: readonly SubscriptionRecord[]; readonly subscriptionVersions: readonly SubscriptionVersionRecord[]; readonly entitlements: readonly EntitlementRecord[];
  readonly usage: readonly UsageEvent[]; readonly ratings: readonly RatingDecision[]; readonly charges: readonly CustomerCharge[];
  readonly invoices: readonly FinancialInvoice[]; readonly payments: readonly FinancialPayment[]; readonly allocations: readonly PaymentAllocation[]; readonly credits: readonly CreditNote[]; readonly refunds: readonly FinancialRefund[]; readonly reconciliation: readonly ReconciliationBatch[]; readonly settlements: readonly FinancialSettlement[]; readonly accountingRequests: readonly AccountingPostingRequest[];
  /** Operational identity rows are shown only when their source has been authorized and scoped to this commercial customer. */
  readonly operationsScopeCustomerId?: CustomerId | null;
  readonly operations: { readonly users: readonly string[]; readonly applications: readonly string[]; readonly apiConsumers: readonly string[]; readonly agents: readonly string[]; readonly credentials: readonly string[]; readonly policies: readonly string[]; readonly provisioningStates: readonly string[] };
  readonly lifecycleEvidence: Partial<Record<LifecycleStageId, LifecycleEvidence>>;
  readonly trust: TrustPostureInput; readonly finops: AiFinOpsSummary;
}
export interface Customer360Summary {
  readonly customerId: CustomerId; readonly customerName: string; readonly organisationNames: readonly string[]; readonly legalEntityNames: readonly string[]; readonly billingAccountNames: readonly string[];
  readonly technicalRelationships: readonly { readonly tenantId: TechnicalTenantId; readonly mappingState: MappingState; readonly note: string }[];
  readonly identityWarning: 'COMMERCIAL_IDENTITY_SEPARATE_FROM_TECHNICAL_TENANT';
  readonly counts: Readonly<Record<'contracts'|'contractVersions'|'quotes'|'quoteVersions'|'acceptances'|'orders'|'orderVersions'|'subscriptions'|'subscriptionVersions'|'entitlements'|'usageEvents'|'ratings'|'charges'|'invoices'|'payments'|'allocations'|'credits'|'refunds'|'reconciliationBatches'|'settlements'|'accountingRequests', number>>;
  readonly operations: Customer360DomainSources['operations'];
  readonly lifecycle: readonly LifecycleNode[]; readonly trust: readonly TrustControl[]; readonly finops: AiFinOpsSummary;
  readonly provenance: 'DOMAIN_SOURCE_PROJECTION';
}
export function buildCustomer360Summary(source: Customer360DomainSources): Customer360Summary {
  const id = source.customer.id;
  const contracts = source.contracts.filter(x => x.customerId === id); const contractIds = new Set(contracts.map(x => x.id));
  const contractVersions = source.contractVersions.filter(x => x.customerId === id && contractIds.has(x.contractId));
  const quotes = source.quotes.filter(x => x.customerId === id); const quoteIds = new Set(quotes.map(x => x.id));
  const quoteVersions = source.quoteVersions.filter(x => x.customerId === id && quoteIds.has(x.quoteId));
  const acceptances = source.acceptances.filter(x => x.customerId === id && quoteIds.has(x.quoteId));
  const orders = source.orders.filter(x => x.customerId === id); const orderIds = new Set(orders.map(x => x.id));
  const orderVersions = source.orderVersions.filter(x => orderIds.has(x.orderId));
  const subscriptions = source.subscriptions.filter(x => x.customerId === id && orderIds.has(x.orderId)); const subscriptionIds = new Set(subscriptions.map(x => x.id));
  const subscriptionVersions = source.subscriptionVersions.filter(x => x.customerId === id && subscriptionIds.has(x.subscriptionId));
  const entitlements = source.entitlements.filter(x => x.customerId === id && subscriptionIds.has(x.subscriptionId));
  const usage = source.usage.filter(x => x.customerId === id); const usageIds = new Set(usage.map(x => x.id));
  const ratings = source.ratings.filter(x => usageIds.has(x.usageEventId)); const ratingIds = new Set(ratings.map(x => x.id));
  const charges = source.charges.filter(x => x.customerId === id && ratingIds.has(x.ratingId));
  const invoices = source.invoices.filter(x => x.customerId === id); const invoiceIds = new Set(invoices.map(x => x.id));
  const payments = source.payments.filter(x => x.customerId === id); const paymentIds = new Set(payments.map(x => x.id));
  const allocations = source.allocations.filter(x => x.customerId === id && paymentIds.has(x.paymentId) && invoiceIds.has(x.invoiceId));
  const credits = source.credits.filter(x => x.customerId === id && invoiceIds.has(x.invoiceId));
  const refunds = source.refunds.filter(x => x.customerId === id && paymentIds.has(x.paymentId));
  const reconciliation = source.reconciliation.filter(batch => batch.items.some(item => item.paymentId && paymentIds.has(item.paymentId)));
  const settlements = source.settlements.filter(x => paymentIds.has(x.paymentId));
  const accountingRequests = source.accountingRequests.filter(x => x.customerId === id);
  const rows = { contracts, contractVersions, quotes, quoteVersions, acceptances, orders, orderVersions, subscriptions, subscriptionVersions, entitlements, usageEvents: usage, ratings, charges, invoices, payments, allocations, credits, refunds, reconciliationBatches: reconciliation, settlements, accountingRequests };
  const technicalRelationships = source.technicalRelationships.map(r => {
    if (r.mapping && r.mapping.customerId !== id) return Object.freeze({ tenantId: r.tenantId, mappingState: 'ambiguous' as const, note: 'Mapping requires owner review; other commercial identities are withheld.' });
    return Object.freeze({ tenantId: r.tenantId, mappingState: r.mappingState, note: r.note });
  });
  const finops = source.finops.dimensions.customerId === id ? source.finops : Object.freeze({ dimensions: Object.freeze({ customerId: id, organisationId: null, department: null, costCentre: null, userId: null, applicationId: null, agentId: null, apiConsumerId: null, providerId: null, modelId: null }), usageQuantity: null, usageUnit: null, measures: Object.freeze([]), evidenceState: 'UNKNOWN' as const });
  const operations = source.operationsScopeCustomerId === id ? source.operations : { users: [], applications: [], apiConsumers: [], agents: [], credentials: [], policies: [], provisioningStates: [] };
  return Object.freeze({ customerId: id, customerName: source.customer.displayName, organisationNames: Object.freeze(source.organisations.filter(x => x.customerId === id).map(x => x.displayName)), legalEntityNames: Object.freeze(source.legalEntities.filter(x => x.customerId === id).map(x => x.displayName)), billingAccountNames: Object.freeze(source.billingAccounts.filter(x => x.customerId === id).map(x => x.displayName)), technicalRelationships: Object.freeze(technicalRelationships), identityWarning: 'COMMERCIAL_IDENTITY_SEPARATE_FROM_TECHNICAL_TENANT', counts: Object.freeze(Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.length])) as Customer360Summary['counts']), operations: Object.freeze({ users: Object.freeze([...operations.users]), applications: Object.freeze([...operations.applications]), apiConsumers: Object.freeze([...operations.apiConsumers]), agents: Object.freeze([...operations.agents]), credentials: Object.freeze([...operations.credentials]), policies: Object.freeze([...operations.policies]), provisioningStates: Object.freeze([...operations.provisioningStates]) }), lifecycle: buildCommercialLifecycle(source.lifecycleEvidence), trust: buildTrustPosture(source.trust), finops, provenance: 'DOMAIN_SOURCE_PROJECTION' });
}
