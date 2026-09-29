/** Application read model for Stage A–E lineage. Missing inputs stay UNKNOWN. */
export const lifecycleStageIds = [
  'customer', 'organisation', 'legal_entity', 'billing_account', 'contract_quote', 'acceptance',
  'order', 'subscription', 'entitlement', 'provisioning', 'usage', 'rating', 'charge', 'invoice',
  'payment', 'allocation', 'reconciliation', 'settlement', 'accounting',
] as const;
export type LifecycleStageId = typeof lifecycleStageIds[number];
export type LifecycleStatus = 'NOT_STARTED' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'BLOCKED' | 'EXPIRED' | 'SUSPENDED' | 'UNLINKED' | 'AMBIGUOUS' | 'EVIDENCE_REQUIRED' | 'UNKNOWN' | 'NOT_CONFIGURED' | 'NOT_AUTHORIZED' | 'REQUIRES_REVIEW';
export interface LifecycleEvidence { readonly status: LifecycleStatus; readonly sourceIds: readonly string[]; readonly detail?: string; }
export interface LifecycleNode { readonly id: LifecycleStageId; readonly label: string; readonly status: LifecycleStatus; readonly sourceIds: readonly string[]; readonly detail: string; }
const labels: Record<LifecycleStageId, string> = {
  customer: 'Customer', organisation: 'Organisation', legal_entity: 'Legal Entity', billing_account: 'Billing Account',
  contract_quote: 'Contract / Quote', acceptance: 'Customer Acceptance', order: 'Order', subscription: 'Subscription',
  entitlement: 'Entitlement', provisioning: 'Provisioning', usage: 'Usage', rating: 'Rating', charge: 'Customer Charge',
  invoice: 'Invoice', payment: 'Payment', allocation: 'Payment Allocation', reconciliation: 'Reconciliation',
  settlement: 'Settlement', accounting: 'Accounting',
};
/** No lifecycle state is inferred from an upstream or adjacent record. */
export function buildCommercialLifecycle(evidence: Partial<Record<LifecycleStageId, LifecycleEvidence>>): readonly LifecycleNode[] {
  return Object.freeze(lifecycleStageIds.map(id => {
    const fact = evidence[id];
    return Object.freeze({ id, label: labels[id], status: fact?.status ?? 'UNKNOWN', sourceIds: Object.freeze([...(fact?.sourceIds ?? [])]), detail: fact?.detail ?? 'No verified relationship supplied to this view.' });
  }));
}
