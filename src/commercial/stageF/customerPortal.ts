import type { CustomerId, TechnicalTenantId } from '../stageA/partyAccount';
export type PortalSection = 'overview' | 'ai' | 'people' | 'applications' | 'governance' | 'commercial' | 'operations';
export type PortalPermission = 'identity.read' | 'applications.read' | 'usage.read' | 'governance.read' | 'commercial.read' | 'financial.read' | 'operations.read';
/** Resolved by a future server-side authorization adapter; never trust these claims from a client payload. */
export interface PortalActorScope { readonly actorId: string; readonly authorizedTenantIds: readonly TechnicalTenantId[]; readonly authorizedCustomerIds: readonly CustomerId[]; readonly permissions: readonly PortalPermission[]; readonly correlationId: string; }
export interface PortalCommercialData { readonly customerId: CustomerId; readonly contracts: readonly string[]; readonly pendingQuotes: readonly string[]; readonly orders: readonly string[]; readonly subscriptions: readonly string[]; readonly entitlements: readonly string[]; readonly usageRefs: readonly string[]; readonly chargeRefs: readonly string[]; readonly invoiceRefs: readonly string[]; readonly paymentRefs: readonly string[]; readonly creditRefs: readonly string[]; readonly refundRefs: readonly string[]; readonly accountStatus: string; }
export type PortalSummaryResult = { readonly status: 'NOT_AUTHORIZED' | 'UNLINKED' | 'EVIDENCE_REQUIRED' } | { readonly status: 'AUTHORIZED'; readonly tenantId: TechnicalTenantId; readonly customerId: CustomerId; readonly sections: readonly PortalSection[]; readonly commercial: PortalCommercialData | null; readonly administrativeDataIncluded: false; readonly correlationId: string };
export function buildCustomerPortalSummary(input: { readonly actor: PortalActorScope; readonly tenantId: TechnicalTenantId; readonly mappedCustomerId: CustomerId | null; readonly mappingState: 'VERIFIED' | 'UNLINKED' | 'AMBIGUOUS' | 'UNKNOWN' | 'EVIDENCE_REQUIRED'; readonly data: PortalCommercialData | null }): PortalSummaryResult {
  const { actor, tenantId } = input;
  if (!actor.authorizedTenantIds.includes(tenantId)) return Object.freeze({ status: 'NOT_AUTHORIZED' });
  const canCommercial = actor.permissions.includes('commercial.read') && actor.permissions.includes('financial.read');
  if (!input.mappedCustomerId || input.mappingState === 'UNLINKED' || input.mappingState === 'UNKNOWN') return Object.freeze({ status: input.mappingState === 'EVIDENCE_REQUIRED' ? 'EVIDENCE_REQUIRED' : 'UNLINKED' });
  if (input.mappingState === 'AMBIGUOUS') return Object.freeze({ status: 'EVIDENCE_REQUIRED' });
  if (!actor.authorizedCustomerIds.includes(input.mappedCustomerId)) return Object.freeze({ status: 'NOT_AUTHORIZED' });
  if (input.data && input.data.customerId !== input.mappedCustomerId) return Object.freeze({ status: 'EVIDENCE_REQUIRED' });
  const sections: PortalSection[] = ['overview'];
  if (actor.permissions.includes('usage.read')) sections.push('ai');
  if (actor.permissions.includes('identity.read')) sections.push('people', 'applications');
  if (actor.permissions.includes('governance.read')) sections.push('governance');
  if (canCommercial) sections.push('commercial');
  if (actor.permissions.includes('operations.read')) sections.push('operations');
  const commercial = canCommercial && input.data?.customerId === input.mappedCustomerId ? Object.freeze({ ...input.data, contracts: Object.freeze([...input.data.contracts]), pendingQuotes: Object.freeze([...input.data.pendingQuotes]), orders: Object.freeze([...input.data.orders]), subscriptions: Object.freeze([...input.data.subscriptions]), entitlements: Object.freeze([...input.data.entitlements]), usageRefs: Object.freeze([...input.data.usageRefs]), chargeRefs: Object.freeze([...input.data.chargeRefs]), invoiceRefs: Object.freeze([...input.data.invoiceRefs]), paymentRefs: Object.freeze([...input.data.paymentRefs]), creditRefs: Object.freeze([...input.data.creditRefs]), refundRefs: Object.freeze([...input.data.refundRefs]) }) : null;
  return Object.freeze({ status: 'AUTHORIZED', tenantId, customerId: input.mappedCustomerId, sections: Object.freeze(sections), commercial, administrativeDataIncluded: false, correlationId: actor.correlationId });
}
export interface StageFApplicationOperation { readonly actorId: string; readonly operation: string; readonly targetType: string; readonly targetId: string; readonly customerId: CustomerId | null; readonly tenantId: TechnicalTenantId | null; readonly requiredPermission: PortalPermission | 'finance.read' | 'trust.read' | 'finops.read'; readonly evidenceRequired: boolean; readonly correlationId: string; }
export interface StageFReadAuditEvent extends StageFApplicationOperation { readonly outcome: 'ALLOWED' | 'DENIED' | 'UNKNOWN'; readonly occurredAt: string; }
export interface StageFReadAuditPort { append(event: StageFReadAuditEvent): Promise<void> }
export function createStageFReadAuditEvent(input: StageFApplicationOperation & { readonly outcome: StageFReadAuditEvent['outcome']; readonly occurredAt: string }): StageFReadAuditEvent {
  if (!input.actorId.trim() || !input.operation.trim() || !input.targetType.trim() || !input.targetId.trim() || !input.requiredPermission.trim() || !input.correlationId.trim() || !Number.isFinite(new Date(input.occurredAt).getTime())) throw new Error('Stage F audit context requires actor, operation, target, permission, correlation, and timestamp.');
  return Object.freeze({ ...input, occurredAt: new Date(input.occurredAt).toISOString() });
}
