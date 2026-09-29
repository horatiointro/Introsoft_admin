import { financeSections, type FinanceSectionId } from './financeWorkspace';
/** Existing top-level destinations remain aliases to consolidated workspaces. */
export const stageFNavigation = Object.freeze({ financeTopLevelId: 'billing_admin', customer360Id: 'tenant_360', portalId: 'tenant_portal', financeSections });
export const legacyFinanceDestination: Readonly<Record<string, FinanceSectionId>> = Object.freeze({ billing_accounts: 'customers_accounts', billing_orders: 'orders_subscriptions', billing_products: 'catalogue_pricing', billing_invoices: 'invoices_payments_credits', billing_refunds: 'invoices_payments_credits', billing_settlement: 'reconciliation_accounting', accounting: 'reconciliation_accounting', finops: 'usage_charges' });
export function resolveFinanceSection(legacyId: string): FinanceSectionId | null { return legacyFinanceDestination[legacyId] ?? null; }
