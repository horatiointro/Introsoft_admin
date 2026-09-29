import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCommercialLifecycle } from './commercialLifecycle';
import { buildCustomer360Summary, type Customer360DomainSources } from './customer360';
import { buildFinanceWorkspaceSummary, financeSections } from './financeWorkspace';
import { resolveFinanceSection } from './navigation';
import { buildTrustPosture } from './trustPosture';
import { buildAiFinOpsSummary } from './aiFinOps';
import { buildCustomerPortalSummary, createStageFReadAuditEvent } from './customerPortal';
import { stageFFinanceDemoSummary, stageFSyntheticScenarios } from './syntheticData';
import type { CustomerId, TechnicalTenantId } from '../stageA/partyAccount';
import type { FinancialInvoice, FinancialPayment, PaymentAllocation } from '../stageE/financialLifecycle';
import { allocatePayment, createAccountingRequest, createPayment, createSettlement, issueInvoice, prepareInvoice, reconcileBatch, recordCapture } from '../stageE/financialLifecycle';
import type { CustomerCharge } from '../stageD/usageRating';

const customerA = 'commercial-a' as CustomerId; const customerB = 'commercial-b' as CustomerId; const tenantA = 'tech-a' as TechnicalTenantId;
const baseCustomer = { id: customerA, displayName: 'Synthetic A', status: 'active', evidence: { evidenceReference: 'synthetic', approvedBy: 'actor' }, createdBy: 'actor', createdAt: '2026-01-01' };
function sourceBase(): Customer360DomainSources { return { customer: baseCustomer as any, organisations: [], legalEntities: [], billingAccounts: [], technicalRelationships: [], contracts: [], contractVersions: [], quotes: [], quoteVersions: [], acceptances: [], orders: [], orderVersions: [], subscriptions: [], subscriptionVersions: [], entitlements: [], usage: [], ratings: [], charges: [], invoices: [], payments: [], allocations: [], credits: [], refunds: [], reconciliation: [], settlements: [], accountingRequests: [], operations: { users: [], applications: [], apiConsumers: [], agents: [], credentials: [], policies: [], provisioningStates: [] }, lifecycleEvidence: {}, trust: {}, finops: { dimensions: { customerId: customerA, organisationId: null, department: null, costCentre: null, userId: null, applicationId: null, agentId: null, apiConsumerId: null, providerId: null, modelId: null }, usageQuantity: null, usageUnit: null, measures: [], evidenceState: 'UNKNOWN' } }; }

test('lifecycle has explicit states and missing stages remain UNKNOWN', () => {
  const nodes = buildCommercialLifecycle({ customer: { status: 'COMPLETED', sourceIds: ['cust'] }, contract_quote: { status: 'PENDING', sourceIds: ['quote'] } });
  assert.equal(nodes.find(node => node.id === 'customer')?.status, 'COMPLETED'); assert.equal(nodes.find(node => node.id === 'contract_quote')?.status, 'PENDING'); assert.equal(nodes.find(node => node.id === 'invoice')?.status, 'UNKNOWN'); assert.equal(nodes.length, 19);
});

test('Customer 360 filters commercial and financial rows by customer scope and does not infer tenant identity', () => {
  const base = sourceBase(); const invoiceA = { id: 'inv-a', customerId: customerA } as FinancialInvoice; const invoiceB = { id: 'inv-b', customerId: customerB } as FinancialInvoice; const paymentA = { id: 'pay-a', customerId: customerA } as FinancialPayment; const paymentB = { id: 'pay-b', customerId: customerB } as FinancialPayment;
  const source = { ...base, invoices: [invoiceA, invoiceB], payments: [paymentA, paymentB], technicalRelationships: [{ tenantId: tenantA, mappingState: 'matched' as const, mapping: { id: 'map-b', tenantId: tenantA, customerId: customerB } as any, note: 'source mapping' }] };
  const summary = buildCustomer360Summary(source);
  assert.equal(summary.customerId, customerA); assert.equal(summary.counts.invoices, 1); assert.equal(summary.counts.payments, 1); assert.equal(summary.identityWarning, 'COMMERCIAL_IDENTITY_SEPARATE_FROM_TECHNICAL_TENANT');
  assert.equal(summary.technicalRelationships[0].mappingState, 'ambiguous'); assert.doesNotMatch(summary.technicalRelationships[0].note, /commercial-b/);
});

test('Customer 360 suppresses FinOps dimensions scoped to another customer', () => {
  const base = sourceBase(); const source = { ...base, finops: { ...base.finops, dimensions: { ...base.finops.dimensions, customerId: customerB }, measures: [{ currency: 'ZAR', providerCost: 999, customerCharge: 1200, budget: 2000, threshold: 1800, budgetState: 'WARNING' as const }], evidenceState: 'VERIFIED' as const } };
  const summary = buildCustomer360Summary(source); assert.equal(summary.finops.evidenceState, 'UNKNOWN'); assert.deepEqual(summary.finops.measures, []); assert.equal(summary.finops.dimensions.customerId, customerA);
});

test('Customer 360 fails closed for operational identity data without matching customer scope', () => {
  const base = sourceBase(); const operations = { users: ['user-a'], applications: ['app-a'], apiConsumers: ['consumer-a'], agents: ['agent-a'], credentials: ['credential-a'], policies: ['policy-a'], provisioningStates: ['active'] };
  assert.deepEqual(buildCustomer360Summary({ ...base, operations, operationsScopeCustomerId: customerB }).operations, { users: [], applications: [], apiConsumers: [], agents: [], credentials: [], policies: [], provisioningStates: [] });
  assert.deepEqual(buildCustomer360Summary({ ...base, operations, operationsScopeCustomerId: customerA }).operations, operations);
});

test('Finance summary preserves currency groups and incomplete lifecycle', () => {
  const lifecycle = buildCommercialLifecycle({ invoice: { status: 'COMPLETED', sourceIds: ['inv'] }, payment: { status: 'PENDING', sourceIds: [] } });
  const summary = buildFinanceWorkspaceSummary({ customerCount: 1, openQuoteCount: 1, activeSubscriptionCount: 0, chargeCount: 0, invoiceCount: 1, paymentCount: 1, reconciliationExceptionCount: 1, accountingPendingCount: 1, totalsByCurrency: [{ currency: 'ZAR', invoiced: 100, captured: 10, allocated: 10 }, { currency: 'USD', invoiced: 30, captured: 0, allocated: 0 }], lifecycle });
  assert.equal(summary.totalsByCurrency.length, 2); assert.equal(summary.totalsByCurrency[0].currency, 'ZAR'); assert.equal(summary.lifecycle.find(x => x.id === 'acceptance')?.status, 'UNKNOWN'); assert.equal(summary.evidenceState, 'UNKNOWN');
});

test('Customer Portal requires tenant and customer authorization and filters commercial scope', () => {
  const actor = { actorId: 'portal-user', authorizedTenantIds: [tenantA], authorizedCustomerIds: [customerA], permissions: ['commercial.read', 'financial.read', 'usage.read'] as const, correlationId: 'corr-portal' };
  const data = { customerId: customerA, contracts: ['contract-a'], pendingQuotes: ['quote-a'], orders: [], subscriptions: [], entitlements: [], usageRefs: [], chargeRefs: [], invoiceRefs: ['invoice-a'], paymentRefs: [], creditRefs: [], refundRefs: [], accountStatus: 'active' };
  const visible = buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: customerA, mappingState: 'VERIFIED', data });
  assert.equal(visible.status, 'AUTHORIZED'); if (visible.status === 'AUTHORIZED') { assert.ok(visible.sections.includes('commercial')); assert.equal(visible.administrativeDataIncluded, false); assert.deepEqual(visible.commercial?.invoiceRefs, ['invoice-a']); }
  assert.equal(buildCustomerPortalSummary({ actor, tenantId: 'tech-other' as TechnicalTenantId, mappedCustomerId: customerA, mappingState: 'VERIFIED', data }).status, 'NOT_AUTHORIZED');
  assert.equal(buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: customerB, mappingState: 'VERIFIED', data: { ...data, customerId: customerB } }).status, 'NOT_AUTHORIZED');
  assert.equal(buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: null, mappingState: 'UNKNOWN', data: null }).status, 'UNLINKED');
  assert.equal(buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: customerA, mappingState: 'AMBIGUOUS', data }).status, 'EVIDENCE_REQUIRED');
  assert.equal(buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: customerA, mappingState: 'VERIFIED', data: { ...data, customerId: customerB } }).status, 'EVIDENCE_REQUIRED');
});

test('Customer Portal hides commercial data without explicit permission', () => {
  const actor = { actorId: 'portal-user', authorizedTenantIds: [tenantA], authorizedCustomerIds: [customerA], permissions: ['usage.read'] as const, correlationId: 'corr' };
  const result = buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: customerA, mappingState: 'VERIFIED', data: { customerId: customerA, contracts: ['secret-admin-contract'], pendingQuotes: [], orders: [], subscriptions: [], entitlements: [], usageRefs: [], chargeRefs: [], invoiceRefs: [], paymentRefs: [], creditRefs: [], refundRefs: [], accountStatus: 'active' } });
  assert.equal(result.status, 'AUTHORIZED'); if (result.status === 'AUTHORIZED') { assert.equal(result.commercial, null); assert.ok(!result.sections.includes('commercial')); assert.ok(!result.sections.includes('operations')); }
});

test('ambiguous, unlinked and denied portal relations never expose a customer record', () => {
  const actor = { actorId: 'u', authorizedTenantIds: [tenantA], authorizedCustomerIds: [customerA], permissions: ['commercial.read', 'financial.read'] as const, correlationId: 'c' };
  const result = buildCustomerPortalSummary({ actor, tenantId: tenantA, mappedCustomerId: null, mappingState: 'EVIDENCE_REQUIRED', data: null }); assert.deepEqual(result, { status: 'EVIDENCE_REQUIRED' });
});

test('Trust posture defaults to UNKNOWN and FinOps keeps provider cost separate from customer charge', () => {
  const controls = buildTrustPosture({ contract: { state: 'VERIFIED', sourceReference: 'evidence' } }); assert.equal(controls.find(x => x.id === 'contract')?.state, 'VERIFIED'); assert.equal(controls.find(x => x.id === 'policy')?.state, 'UNKNOWN');
  const finops = buildAiFinOpsSummary({ dimensions: { customerId: customerA, organisationId: null, department: null, costCentre: null, userId: null, applicationId: null, agentId: null, apiConsumerId: null, providerId: 'p', modelId: 'm' }, usageQuantity: 10, usageUnit: 'request', measures: [{ currency: 'ZAR', providerCost: 5, customerCharge: 8, budget: 20, threshold: 16, budgetState: 'WITHIN_BUDGET' }], evidenceState: 'VERIFIED' });
  assert.equal(finops.measures[0].providerCost, 5); assert.equal(finops.measures[0].customerCharge, 8); assert.notEqual(finops.measures[0].providerCost, finops.measures[0].customerCharge);
});

test('deterministic synthetic suite covers six specified exception and lifecycle cases', () => {
  assert.equal(stageFSyntheticScenarios.length, 6); assert.equal(stageFFinanceDemoSummary.evidenceState, 'SYNTHETIC');
  const cases = stageFSyntheticScenarios.map(x => x.demoCase); assert.deepEqual(cases, ['Complete lifecycle', 'Authority pending', 'Ambiguous tenant mapping', 'Constrained entitlement', 'Financial exception', 'AI budget warning']);
  const c = stageFSyntheticScenarios[2]; assert.equal(c.mappingState, 'ambiguous'); assert.equal(c.customerId, 'demo-customer-c'); assert.notEqual(c.technicalTenantId, c.customerId);
  assert.equal(stageFSyntheticScenarios[5].finops.measures[0].budgetState, 'WARNING');
});

test('Finance navigation is consolidated and legacy billing destinations resolve contextually', () => {
  assert.equal(financeSections.length, 9); assert.equal(resolveFinanceSection('billing_invoices'), 'invoices_payments_credits'); assert.equal(resolveFinanceSection('accounting'), 'reconciliation_accounting'); assert.equal(resolveFinanceSection('tenant_portal'), null);
});

test('Customer 360 and portal contracts retain explicit provenance and scope', () => {
  const summary = buildCustomer360Summary(sourceBase()); assert.equal(summary.provenance, 'DOMAIN_SOURCE_PROJECTION'); assert.deepEqual(summary.operations.users, []);
  assert.equal('globalAdminData' in summary, false); assert.equal(summary.technicalRelationships.length, 0);
});

test('application read audit records actor, operation, target, scopes, permission and correlation', () => {
  const event = createStageFReadAuditEvent({ actorId: 'actor', operation: 'customer360.view', targetType: 'customer', targetId: customerA, customerId: customerA, tenantId: tenantA, requiredPermission: 'trust.read', evidenceRequired: false, correlationId: 'corr-read', outcome: 'ALLOWED', occurredAt: '2026-01-01' });
  assert.equal(event.outcome, 'ALLOWED'); assert.equal(event.correlationId, 'corr-read'); assert.ok(Object.isFrozen(event));
  assert.throws(() => createStageFReadAuditEvent({ ...event, actorId: '' }), /requires actor/);
});

test('Stage F read model projects linked A–E concepts without promoting tenant or legacy evidence', () => {
  const base = sourceBase();
  const source = { ...base,
    contracts: [{ id: 'contract-a', customerId: customerA } as any], contractVersions: [], quotes: [{ id: 'quote-a', customerId: customerA } as any], quoteVersions: [], acceptances: [{ id: 'accept-a', customerId: customerA, quoteId: 'quote-a' } as any],
    orders: [{ id: 'order-a', customerId: customerA } as any], orderVersions: [], subscriptions: [{ id: 'sub-a', customerId: customerA, orderId: 'order-a' } as any], entitlements: [{ id: 'ent-a', customerId: customerA, subscriptionId: 'sub-a' } as any],
    usage: [{ id: 'usage-a', customerId: customerA } as any], ratings: [{ id: 'rating-a', usageEventId: 'usage-a' } as any], charges: [{ id: 'charge-a', customerId: customerA, ratingId: 'rating-a' } as any],
    invoices: [{ id: 'invoice-a', customerId: customerA } as FinancialInvoice], payments: [{ id: 'payment-a', customerId: customerA } as FinancialPayment],
    allocations: [{ id: 'allocation-a', customerId: customerA, paymentId: 'payment-a', invoiceId: 'invoice-a' } as PaymentAllocation],
  };
  const view = buildCustomer360Summary(source);
  assert.deepEqual([view.counts.contracts, view.counts.quotes, view.counts.acceptances, view.counts.orders, view.counts.subscriptions, view.counts.entitlements, view.counts.usageEvents, view.counts.ratings, view.counts.charges, view.counts.invoices, view.counts.payments, view.counts.allocations], Array(12).fill(1));
  assert.equal(view.technicalRelationships.length, 0); assert.equal(view.identityWarning, 'COMMERCIAL_IDENTITY_SEPARATE_FROM_TECHNICAL_TENANT');
});

test('Finance totals never silently net currencies', () => {
  const demo = stageFFinanceDemoSummary; assert.deepEqual(demo.totalsByCurrency.map(x => x.currency), ['ZAR', 'USD']); assert.equal(demo.totalsByCurrency.length, 2);
});

test('synthetic A–F lifecycle keeps one linked commitment-to-accounting chain', async () => {
  const at = '2026-02-01T00:00:00.000Z'; const correlationId = 'synthetic-e2e-correlation';
  const org = { id: 'org-a', customerId: customerA, displayName: 'Synthetic Org' } as any;
  const legal = { id: 'legal-a', customerId: customerA, organisationId: org.id, displayName: 'Synthetic Legal Entity' } as any;
  const account = { id: 'account-a', customerId: customerA, legalEntityId: legal.id, displayName: 'Synthetic Billing Account' } as any;
  const contract = { id: 'contract-a', customerId: customerA, billingAccountId: account.id } as any;
  const contractVersion = { id: 'contract-v1', contractId: contract.id, customerId: customerA, status: 'active' } as any;
  const quote = { id: 'quote-a', customerId: customerA, contractId: contract.id } as any;
  const quoteVersion = { id: 'quote-v1', quoteId: quote.id, customerId: customerA, contractVersionId: contractVersion.id } as any;
  const acceptance = { id: 'acceptance-a', quoteId: quote.id, quoteVersionId: quoteVersion.id, customerId: customerA, status: 'accepted' } as any;
  const order = { id: 'order-a', customerId: customerA, acceptanceId: acceptance.id, status: 'active' } as any;
  const orderVersion = { id: 'order-v1', orderId: order.id, customerId: customerA } as any;
  const subscription = { id: 'subscription-a', customerId: customerA, orderId: order.id } as any;
  const subscriptionVersion = { id: 'subscription-v1', subscriptionId: subscription.id, customerId: customerA, orderVersionId: orderVersion.id } as any;
  const entitlement = { id: 'entitlement-a', customerId: customerA, subscriptionId: subscription.id, subscriptionVersionId: subscriptionVersion.id, orderId: order.id, orderVersionId: orderVersion.id, effectiveFrom: at, target: { type: 'technical_tenant', id: tenantA } } as any;
  const usage = { id: 'usage-a', customerId: customerA, entitlementId: entitlement.id, subscriptionId: subscription.id, technicalTenantId: tenantA, status: 'accepted', correlationId } as any;
  const rating = { id: 'rating-a', usageEventId: usage.id, customerId: customerA, status: 'rated', ruleVersion: 'rule-v1' } as any;
  const charge = { id: 'charge-a', sourceIdentity: 'synthetic-source:usage-a:rule-v1', usageEventId: usage.id, ratingId: rating.id, customerId: customerA, entitlementId: entitlement.id, subscriptionId: subscription.id, productId: 'synthetic-product', providerCostAmount: 8, providerCostCurrency: 'USD', customerMarkupAmount: 4, amount: 12, currency: 'USD', status: 'ready_for_financial_processing', effectiveAt: at, correlationId, createdAt: at, supersedesChargeId: null } as CustomerCharge;

  const draft = prepareInvoice({ id: 'invoice-a' as any, invoiceNumber: 'SYN-INV-1', customerId: customerA, tenantScope: tenantA, currency: 'USD', charges: [charge], chargeKinds: { [charge.id]: 'usage' }, descriptions: { [charge.id]: 'Synthetic rated usage' }, ratingVersions: { [charge.id]: 'rule-v1' }, orderVersionIds: { [charge.id]: orderVersion.id }, dueAt: '2026-03-01T00:00:00.000Z', preparedAt: at, correlationId, idempotencyKey: 'invoice-e2e' });
  const invoice = issueInvoice(draft, at);
  const payment = createPayment({ id: 'payment-a' as any, customerId: customerA, tenantScope: tenantA, provider: 'synthetic-provider', currency: 'USD', amount: 12, externalReference: 'synthetic-payment-ref', providerReference: null, createdAt: at, correlationId, idempotencyKey: 'payment-e2e' });
  const capture = recordCapture(payment, { id: 'capture-a', paymentId: payment.id, amount: 12, fees: 1, currency: 'USD' as any, providerReference: 'synthetic-provider-ref', capturedAt: at, idempotencyKey: 'capture-e2e', correlationId }, []);
  const allocationInput = { id: 'allocation-a' as any, paymentId: payment.id, invoiceId: invoice.id, customerId: customerA, amount: 12, currency: 'USD' as any, createdAt: at, actorId: 'synthetic-actor', correlationId, idempotencyKey: 'allocation-e2e' };
  const allocation = await allocatePayment({ invoices: [invoice], payments: [payment], captures: [capture], allocations: [], reversals: [] }, { async withAllocationGuards(_p, _i, work) { return work({ invoices: [invoice], payments: [payment], captures: [capture], allocations: [], reversals: [] }); } }, allocationInput);
  const batch = reconcileBatch({ id: 'recon-a' as any, provider: 'synthetic-provider', statementReference: 'synthetic-statement', currency: 'USD' as any, createdAt: at, correlationId, idempotencyKey: 'recon-e2e', items: [{ id: 'item-a' as any, externalReference: 'synthetic-provider-ref', paymentId: payment.id, expectedAmount: 12, actualGross: 12, fees: 1, net: 11, currency: 'USD' as any, status: 'unmatched', reason: null }] }, new Set());
  const settlement = createSettlement(batch, batch.items[0], { id: 'settlement-a' as any, reconciliationBatchId: batch.id, paymentId: payment.id, provider: 'synthetic-provider', gross: 12, fees: 1, net: 11, currency: 'USD' as any, settledAt: at, status: 'reconciled', correlationId, idempotencyKey: 'settlement-e2e' });
  const accounting = createAccountingRequest({ id: 'accounting-a' as any, sourceType: 'settlement', sourceId: settlement.id, customerId: customerA, tenantScope: tenantA, currency: 'USD' as any, description: 'Synthetic settlement posting request', lines: [{ accountCode: 'cash', accountName: 'Cash clearing', debit: 11, credit: 0, memo: 'Net settlement' }, { accountCode: 'fees', accountName: 'Provider fees', debit: 1, credit: 0, memo: 'Provider fee' }, { accountCode: 'receivable', accountName: 'Receivable clearing', debit: 0, credit: 12, memo: 'Gross capture' }], correlationId, idempotencyKey: 'accounting-e2e', createdAt: at, status: 'ready_for_accounting' });
  const technicalRelationship = { tenantId: tenantA, mappingState: 'matched' as const, mapping: { id: 'mapping-a', tenantId: tenantA, customerId: customerA } as any, note: 'Synthetic evidence-backed mapping' };
  const base = sourceBase();
  const customerView = buildCustomer360Summary({ ...base, organisations: [org], legalEntities: [legal], billingAccounts: [account], technicalRelationships: [technicalRelationship], contracts: [contract], contractVersions: [contractVersion], quotes: [quote], quoteVersions: [quoteVersion], acceptances: [acceptance], orders: [order], orderVersions: [orderVersion], subscriptions: [subscription], subscriptionVersions: [subscriptionVersion], entitlements: [entitlement], usage: [usage], ratings: [rating], charges: [charge], invoices: [invoice], payments: [payment], allocations: [allocation], reconciliation: [batch], settlements: [settlement], accountingRequests: [accounting], finops: { ...base.finops, dimensions: { ...base.finops.dimensions, providerId: 'synthetic-provider', modelId: 'synthetic-model' }, usageQuantity: 1, usageUnit: 'request', measures: [{ currency: 'USD', providerCost: 8, customerCharge: 12, budget: 20, threshold: 18, budgetState: 'WITHIN_BUDGET' }], evidenceState: 'SYNTHETIC' } });
  const finance = buildFinanceWorkspaceSummary({ customerCount: 1, openQuoteCount: 0, activeSubscriptionCount: 1, chargeCount: customerView.counts.charges, invoiceCount: customerView.counts.invoices, paymentCount: customerView.counts.payments, reconciliationExceptionCount: 0, accountingPendingCount: customerView.counts.accountingRequests, totalsByCurrency: [{ currency: invoice.currency, invoiced: invoice.total, captured: capture.amount, allocated: allocation.amount }], evidenceState: 'SYNTHETIC', lifecycle: customerView.lifecycle });
  const portal = buildCustomerPortalSummary({ actor: { actorId: 'synthetic-portal-actor', authorizedTenantIds: [tenantA], authorizedCustomerIds: [customerA], permissions: ['commercial.read', 'financial.read'], correlationId }, tenantId: tenantA, mappedCustomerId: customerA, mappingState: 'VERIFIED', data: { customerId: customerA, contracts: [contract.id], pendingQuotes: [], orders: [order.id], subscriptions: [subscription.id], entitlements: [entitlement.id], usageRefs: [usage.id], chargeRefs: [charge.id], invoiceRefs: [invoice.id], paymentRefs: [payment.id], creditRefs: [], refundRefs: [], accountStatus: 'active' } });

  assert.equal(allocation.invoiceId, invoice.id); assert.equal(batch.items[0].status, 'matched'); assert.equal(settlement.status, 'ready_for_accounting');
  assert.equal(accounting.lines.reduce((s, line) => s + line.debit, 0), accounting.lines.reduce((s, line) => s + line.credit, 0));
  assert.equal(customerView.counts.contracts, 1); assert.equal(customerView.counts.entitlements, 1); assert.equal(customerView.counts.usageEvents, 1); assert.equal(customerView.counts.charges, 1); assert.equal(customerView.counts.invoices, 1); assert.equal(customerView.counts.allocations, 1); assert.equal(customerView.counts.settlements, 1); assert.equal(customerView.counts.accountingRequests, 1);
  assert.equal(finance.evidenceState, 'SYNTHETIC'); assert.deepEqual(finance.totalsByCurrency, [{ currency: 'USD', invoiced: 12, captured: 12, allocated: 12 }]);
  assert.equal(portal.status, 'AUTHORIZED'); if (portal.status === 'AUTHORIZED') assert.equal(portal.commercial?.invoiceRefs[0], invoice.id);
});
