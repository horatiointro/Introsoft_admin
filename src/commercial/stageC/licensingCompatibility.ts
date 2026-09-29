/**
 * Read-only compatibility shape for the existing tenant licensing subsystem.
 *
 * Source inspection (server.ts, src/types.ts, src/db/mariadb.ts and migration
 * 001) shows stable license IDs with tenantId + applicationId + planId, dates,
 * payment/license statuses, quota counters, enforcement and payment state.
 * Plans have their own IDs, application binding (including `all`), pricing,
 * currency, billing cycle, quota and feature limits. Licensing is consumed by
 * `/api/v1/licensing/*`, the gateway quota/enforcement path, billing cycle and
 * payment callbacks, Tenant Portal and LicensingMonetizationView.
 *
 * This projection intentionally does not convert a license into a commercial
 * subscription or entitlement and has no write operation. Existing license,
 * plan, tenant, application and assigned-key IDs retain their original meaning.
 */
export interface LegacyLicenseProjection {
  readonly licenseId: string;
  readonly technicalTenantId: string;
  readonly applicationId: string;
  readonly planId: string;
  readonly contractStartDate: string;
  readonly contractEndDate: string;
  readonly nextBillingDate: string;
  readonly paymentStatus: 'paid' | 'pending' | 'failed' | 'overdue';
  readonly licenseStatus: 'active' | 'grace_period' | 'past_due_restricted' | 'auto_suspended' | 'cancelled';
  readonly currency: 'USD' | 'ZAR' | 'EUR';
  readonly basePrice: number;
  readonly maxTransactionQuota: number;
  readonly currentTransactionCount: number;
  readonly assignedKeyIds: readonly string[];
}

export interface LegacyLicensingReadPort {
  listForTechnicalTenant(tenantId: string): Promise<readonly LegacyLicenseProjection[]>;
}

export async function readLegacyLicensingProjection(port: LegacyLicensingReadPort, technicalTenantId: string): Promise<readonly LegacyLicenseProjection[]> {
  const values = await port.listForTechnicalTenant(technicalTenantId);
  return Object.freeze(values.map(value => Object.freeze({ ...value, assignedKeyIds: Object.freeze([...value.assignedKeyIds]) })));
}

/** Describes possible overlap without asserting commercial equivalence. */
export const legacyLicensingOverlap = Object.freeze({
  overlapsWithSubscription: ['plan', 'price', 'currency', 'billing cycle', 'start/end dates', 'payment status'] as const,
  overlapsWithEntitlement: ['application scope', 'request quota', 'feature limits', 'assigned key restrictions', 'enforcement status'] as const,
  migrationRule: 'compatibility projection only until production parity and explicit cutover approval',
  inferenceForbidden: ['customer identity', 'accepted order', 'contract authority', 'subscription', 'entitlement', 'commercial tenant mapping'] as const,
});
