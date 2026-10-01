import type { LicenseStatus } from '../types';

export type TrialPaymentStatus = 'paid' | 'pending' | 'failed' | 'overdue';

export function approvedRegistrationTrial(trialEndsAt: string) {
  return {
    registrationStatus: 'trial_active' as const,
    tenantCommercialStatus: 'trial' as const,
    licenseStatus: 'active' as const,
    paymentStatus: 'pending' as const,
    entitlementStatus: 'trial' as const,
    subscriptionStatus: 'not_created' as const,
    trialEndsAt,
  };
}

export function expiredTrialLicense(input: {
  tenantStatus: string; trialEndsAt?: string | null; asOfDate: string;
  licenseStatus: LicenseStatus; paymentStatus: TrialPaymentStatus;
}) {
  const isExpiredTrial = input.tenantStatus === 'trial'
    && Boolean(input.trialEndsAt)
    && String(input.trialEndsAt).slice(0, 10) < input.asOfDate
    && input.paymentStatus !== 'paid';
  if (!isExpiredTrial) return null;
  return {
    tenantStatus: 'suspended' as const,
    licenseStatus: 'auto_suspended' as const,
    paymentStatus: input.paymentStatus,
    entitlementStatus: 'blocked' as const,
    enforcement: 'hard_block_402' as const,
  };
}

export function providerPaymentTransition(outcome: 'success' | 'failure') {
  return outcome === 'success'
    ? { licenseStatus: 'active' as const, paymentStatus: 'paid' as const, entitlementStatus: 'active' as const }
    : { licenseStatus: 'grace_period' as const, paymentStatus: 'failed' as const, entitlementStatus: 'grace_period' as const };
}
