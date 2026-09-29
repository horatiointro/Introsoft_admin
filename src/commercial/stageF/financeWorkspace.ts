import type { Customer360Summary } from './customer360';
import type { LifecycleNode } from './commercialLifecycle';
export const financeSections = [
  { id: 'overview', label: 'Overview' }, { id: 'customers_accounts', label: 'Customers & Accounts' }, { id: 'catalogue_pricing', label: 'Catalogue & Pricing' },
  { id: 'quotes_contracts', label: 'Quotes & Contracts' }, { id: 'orders_subscriptions', label: 'Orders & Subscriptions' }, { id: 'usage_charges', label: 'Usage & Charges' },
  { id: 'invoices_payments_credits', label: 'Invoices / Payments / Credits' }, { id: 'reconciliation_accounting', label: 'Reconciliation / Accounting' }, { id: 'reports', label: 'Reports' },
] as const;
export type FinanceSectionId = typeof financeSections[number]['id'];
export interface FinanceWorkspaceSummary { readonly customerCount: number; readonly openQuoteCount: number; readonly activeSubscriptionCount: number; readonly chargeCount: number; readonly invoiceCount: number; readonly paymentCount: number; readonly reconciliationExceptionCount: number; readonly accountingPendingCount: number; readonly totalsByCurrency: readonly { readonly currency: string; readonly invoiced: number; readonly captured: number; readonly allocated: number }[]; readonly evidenceState: 'SYNTHETIC' | 'PARTIAL' | 'UNKNOWN'; readonly lifecycle: readonly LifecycleNode[]; }
export function buildFinanceWorkspaceSummary(input: Omit<FinanceWorkspaceSummary, 'totalsByCurrency' | 'evidenceState'> & { readonly totalsByCurrency: readonly FinanceWorkspaceSummary['totalsByCurrency'][number][]; readonly evidenceState?: FinanceWorkspaceSummary['evidenceState'] }): FinanceWorkspaceSummary {
  return Object.freeze({ ...input, totalsByCurrency: Object.freeze(input.totalsByCurrency.map(x => Object.freeze({ ...x }))), lifecycle: Object.freeze(input.lifecycle.map(x => Object.freeze({ ...x }))), evidenceState: input.evidenceState ?? 'UNKNOWN' });
}
export function customerFinanceSummary(customer: Customer360Summary & { readonly reconciliationStatuses?: readonly string[] }): Pick<FinanceWorkspaceSummary, 'invoiceCount'|'paymentCount'|'chargeCount'|'reconciliationExceptionCount'|'accountingPendingCount'> {
  return Object.freeze({ invoiceCount: customer.counts.invoices, paymentCount: customer.counts.payments, chargeCount: customer.counts.charges, reconciliationExceptionCount: customer.reconciliationStatuses?.filter(status => !['matched', 'settled'].includes(status)).length ?? 0, accountingPendingCount: customer.counts.accountingRequests });
}
