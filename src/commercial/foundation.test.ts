import test from 'node:test';
import assert from 'node:assert/strict';
import { hasExplicitOrganizationEdge, hasOverlappingTenantScope, isEffectiveAt, normalizeCommercialContact, resolveCommercialOrganizationScope, validateCommercialContactInput, validateCommercialCustomer, validateCommercialOrganizationType } from './foundation.ts';
import { authorizeInContext, buildAuthorizationContext } from '../security/authorizationContext.ts';

test('commercial organization creation cannot create a second Introsoft root type', () => {
  assert.equal(validateCommercialOrganizationType('INTROSOFT'), false);
  assert.equal(validateCommercialOrganizationType('PARTNER'), true);
});

test('individual customers do not require company fields and reject company fields', () => {
  assert.deepEqual(validateCommercialCustomer({ customerType: 'INDIVIDUAL', displayName: 'A. Person', individualGivenName: 'A', individualFamilyName: 'Person' }), []);
  assert.ok(validateCommercialCustomer({ customerType: 'INDIVIDUAL', displayName: 'A. Person', individualGivenName: 'A', individualFamilyName: 'Person', companyName: 'Example Ltd' }).length > 0);
});

test('company customers require company name', () => {
  assert.ok(validateCommercialCustomer({ customerType: 'COMPANY', displayName: 'Example' }).includes('Company name is required for a company customer.'));
  assert.deepEqual(validateCommercialCustomer({ customerType: 'COMPANY', displayName: 'Example Ltd', companyName: 'Example Ltd' }), []);
});

test('effective dating uses an inclusive start and exclusive end', () => {
  assert.equal(isEffectiveAt('2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z', new Date('2026-01-01T00:00:00Z')), true);
  assert.equal(isEffectiveAt('2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z', new Date('2026-02-01T00:00:00Z')), false);
});

test('one organization can link multiple tenants while one tenant cannot have overlapping organization owners', () => {
  const existing = [
    { organizationId: 'org-a', tenantId: 'tenant-a', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: '2026-06-01T00:00:00Z' },
    { organizationId: 'org-a', tenantId: 'tenant-b', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: null },
  ];
  assert.equal(hasOverlappingTenantScope({ tenantId: 'tenant-c', effectiveFrom: '2026-02-01T00:00:00Z', effectiveTo: null, existing }), false);
  assert.equal(hasOverlappingTenantScope({ tenantId: 'tenant-a', effectiveFrom: '2026-05-01T00:00:00Z', effectiveTo: null, existing }), true);
  assert.equal(hasOverlappingTenantScope({ tenantId: 'tenant-a', effectiveFrom: '2026-06-01T00:00:00Z', effectiveTo: null, existing }), false);
});

test('commercial links never grant IAM access to a tenant outside the existing grant', () => {
  const context = buildAuthorizationContext({
    userId: 'user-a',
    assignments: [{ assignmentId: 'grant-a', role: 'TENANT_ADMIN', organizationId: 'tenant-a', visibility: 'SELF', permissions: ['tenant.read'] }],
    organizations: [{ id: 'tenant-a', parentId: null }, { id: 'tenant-b', parentId: null }],
  });
  assert.equal(authorizeInContext(context, 'tenant-a', 'tenant.read'), true);
  assert.equal(authorizeInContext(context, 'tenant-b', 'tenant.read'), false);
});

test('commercial hierarchy exists only when an explicit persisted edge is supplied', () => {
  assert.equal(hasExplicitOrganizationEdge([], 'org-root', 'org-child'), false);
  assert.equal(hasExplicitOrganizationEdge([{ parentId: 'org-root', childId: 'org-child' }], 'org-root', 'org-child'), true);
});

test('commercial scope requires both an explicit technical link and the existing permission grant', () => {
  const scope = resolveCommercialOrganizationScope({
    grants: [{ role: 'TENANT_ADMIN', visibility: 'ORGANISATION', permissions: ['tenant.read'], visibleOrganizationIds: new Set(['tenant-a']) }],
    permission: 'tenant.read', organizationIds: ['org-a', 'org-b'],
    tenantScopes: [
      { organizationId: 'org-a', tenantId: 'tenant-a', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: null },
      { organizationId: 'org-b', tenantId: 'tenant-b', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: null },
    ], asOf: new Date('2026-09-30T00:00:00Z'),
  });
  assert.deepEqual([...scope], ['org-a']);
});

test('expired and not-yet-effective technical links fail closed for commercial visibility', () => {
  const scope = resolveCommercialOrganizationScope({
    grants: [{ role: 'TENANT_ADMIN', visibility: 'ORGANISATION', permissions: ['tenant.read'], visibleOrganizationIds: new Set(['tenant-a', 'tenant-b']) }],
    permission: 'tenant.read', organizationIds: ['org-expired', 'org-future'],
    tenantScopes: [
      { organizationId: 'org-expired', tenantId: 'tenant-a', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: '2026-09-29T00:00:00Z' },
      { organizationId: 'org-future', tenantId: 'tenant-b', effectiveFrom: '2026-10-01T00:00:00Z', effectiveTo: null },
    ], asOf: new Date('2026-09-30T00:00:00Z'),
  });
  assert.equal(scope.size, 0);
});

test('commercial scope does not combine permission and technical visibility across grants', () => {
  const scope = resolveCommercialOrganizationScope({
    grants: [
      { role: 'TENANT_ADMIN', visibility: 'ORGANISATION', permissions: ['tenant.read'], visibleOrganizationIds: new Set(['tenant-x']) },
      { role: 'TENANT_ADMIN', visibility: 'ORGANISATION', permissions: [], visibleOrganizationIds: new Set(['tenant-a']) },
    ], permission: 'tenant.read', organizationIds: ['org-a'],
    tenantScopes: [{ organizationId: 'org-a', tenantId: 'tenant-a', effectiveFrom: '2026-01-01T00:00:00Z', effectiveTo: null }],
    asOf: new Date('2026-09-30T00:00:00Z'),
  });
  assert.equal(scope.size, 0);
});

test('only an explicit global Super Admin grant expands commercial visibility', () => {
  const scope = resolveCommercialOrganizationScope({
    grants: [{ role: 'SUPER_ADMIN', visibility: 'GLOBAL', permissions: ['tenant.read'], visibleOrganizationIds: new Set() }],
    permission: 'tenant.read', organizationIds: ['org-a', 'org-b'], tenantScopes: [], asOf: new Date(),
  });
  assert.deepEqual([...scope], ['org-a', 'org-b']);
});

test('contact data is allowlisted and unknown credential-like fields are discarded', () => {
  const contact = JSON.parse(normalizeCommercialContact({ email: 'person@example.test', password: 'do-not-store', token: 'secret', address: { city: 'Cape Town', accessToken: 'secret' } })!);
  assert.deepEqual(contact, { email: 'person@example.test', address: { city: 'Cape Town' } });
});

test('profile contact allowlist supports addresses and notification preferences without accepting protected fields', () => {
  const input = { email: 'person@example.test', billingAddress: { city: 'Cape Town', country: 'ZA' }, notificationPreferences: { invoiceEmails: true, paymentReminders: false } };
  assert.equal(validateCommercialContactInput(input), null);
  assert.deepEqual(JSON.parse(normalizeCommercialContact(input)!), input);
  assert.match(validateCommercialContactInput({ ...input, apiKey: 'not-accepted' }) || '', /unsupported fields/i);
  assert.match(validateCommercialContactInput({ notificationPreferences: { all: true } }) || '', /unsupported fields/i);
});
