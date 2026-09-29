import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LegacyLicenseProjection, LegacyLicensingReadPort, legacyLicensingOverlap, readLegacyLicensingProjection } from './licensingCompatibility';

test('legacy license adapter is a read-only projection and creates no subscription or entitlement', async () => {
  const rows: LegacyLicenseProjection[] = [{
    licenseId: 'synthetic-license-id', technicalTenantId: 'technical-tenant-synthetic', applicationId: 'application-synthetic', planId: 'legacy-plan-synthetic',
    contractStartDate: '2026-01-01', contractEndDate: '2026-12-31', nextBillingDate: '2026-02-01', paymentStatus: 'paid', licenseStatus: 'active',
    currency: 'ZAR', basePrice: 85, maxTransactionQuota: 100, currentTransactionCount: 5, assignedKeyIds: ['synthetic-key-reference'],
  }];
  const port: LegacyLicensingReadPort = { async listForTechnicalTenant(tenantId) { assert.equal(tenantId, 'technical-tenant-synthetic'); return rows; } };
  const projection = await readLegacyLicensingProjection(port, 'technical-tenant-synthetic');
  assert.equal(projection[0].licenseId, rows[0].licenseId);
  assert.equal(projection[0].planId, rows[0].planId);
  assert.equal(projection[0].technicalTenantId, rows[0].technicalTenantId);
  assert.equal(Object.isFrozen(projection[0]), true);
  assert.equal(legacyLicensingOverlap.inferenceForbidden.includes('subscription'), true);
  assert.equal('subscriptionId' in projection[0], false);
  assert.equal('customerId' in projection[0], false);
  assert.equal('entitlementId' in projection[0], false);
});
