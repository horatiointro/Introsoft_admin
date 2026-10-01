import test from 'node:test';
import assert from 'node:assert/strict';
import { approvedRegistrationTrial, expiredTrialLicense, providerPaymentTransition } from './trialLifecycle';

test('owner-approved registration is a trial entitlement, not a paid subscription', () => {
  assert.deepEqual(approvedRegistrationTrial('2026-10-15'), {
    registrationStatus: 'trial_active', tenantCommercialStatus: 'trial', licenseStatus: 'active',
    paymentStatus: 'pending', entitlementStatus: 'trial', subscriptionStatus: 'not_created', trialEndsAt: '2026-10-15',
  });
});

test('successful payment moves payment and entitlement to active independently of trial status', () => {
  assert.deepEqual(providerPaymentTransition('success'), { licenseStatus: 'active', paymentStatus: 'paid', entitlementStatus: 'active' });
});

test('failed payment remains unpaid and uses the existing grace period state', () => {
  assert.deepEqual(providerPaymentTransition('failure'), { licenseStatus: 'grace_period', paymentStatus: 'failed', entitlementStatus: 'grace_period' });
});

test('trial expiry blocks entitlement and suspends license without changing pending payment status', () => {
  assert.deepEqual(expiredTrialLicense({ tenantStatus: 'trial', trialEndsAt: '2026-09-30', asOfDate: '2026-10-01', licenseStatus: 'active', paymentStatus: 'pending' }), {
    tenantStatus: 'suspended', licenseStatus: 'auto_suspended', paymentStatus: 'pending', entitlementStatus: 'blocked', enforcement: 'hard_block_402',
  });
  assert.equal(expiredTrialLicense({ tenantStatus: 'trial', trialEndsAt: '2026-10-01', asOfDate: '2026-10-01', licenseStatus: 'active', paymentStatus: 'pending' }), null);
  assert.equal(expiredTrialLicense({ tenantStatus: 'trial', trialEndsAt: '2026-09-30', asOfDate: '2026-10-01', licenseStatus: 'active', paymentStatus: 'paid' }), null);
});
