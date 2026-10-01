import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizationContext } from '../security/authorizationContext.ts';
import { capabilitiesForActor, capabilityRegistry } from './capabilityRegistry.ts';

const organizations = [{ id: 'org-a', parentId: null }, { id: 'org-b', parentId: null }];

describe('capability registry', () => {
  it('keeps reviewed route identifiers unique and records route/auth/scope/status metadata', () => {
    const ids = capabilityRegistry.map(capability => capability.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const capability of capabilityRegistry) {
      assert.ok(capability.method);
      assert.ok(capability.route.startsWith('/'));
      assert.ok(capability.source);
      assert.ok(capability.status);
    }
  });

  it('reports session capabilities from the actor grants and never infers global Super Admin access', () => {
    const context = buildAuthorizationContext({
      userId: 'tenant-user',
      assignments: [{ assignmentId: 'a1', role: 'TENANT_ADMIN', organizationId: 'org-a', visibility: 'ORGANISATION', permissions: ['tenant.read'] }],
      organizations,
    });
    const capabilities = capabilitiesForActor({ roles: ['TENANT_ADMIN'], authorization: context });
    const customers = capabilities.find(capability => capability.id === 'customers.list');
    const createKey = capabilities.find(capability => capability.id === 'api-keys.create');
    const gateway = capabilities.find(capability => capability.id === 'gateway.chat-completions');
    assert.equal(customers?.availableToCurrentIdentity, true);
    assert.equal(createKey?.availableToCurrentIdentity, false);
    assert.equal(gateway?.availableToCurrentIdentity, null);
  });

  it('marks public endpoints available without a session and only recognizes explicit global Super Admin grants', () => {
    const publicCapability = capabilitiesForActor({ roles: [] }).find(capability => capability.id === 'auth.login');
    assert.equal(publicCapability?.availableToCurrentIdentity, true);

    const scopedAdmin = buildAuthorizationContext({
      userId: 'scoped-root',
      assignments: [{ assignmentId: 'a1', role: 'SUPER_ADMIN', organizationId: 'org-a', visibility: 'ORGANISATION', permissions: ['tenant.update', 'apikeys.create'] }],
      organizations,
    });
    assert.equal(capabilitiesForActor({ roles: ['SUPER_ADMIN'], authorization: scopedAdmin }).find(item => item.id === 'applications.create')?.availableToCurrentIdentity, false);
  });

  it('does not combine permissions from separate grants when describing a capability', () => {
    const split = buildAuthorizationContext({
      userId: 'split-admin',
      assignments: [
        { assignmentId: 'tenant-update', role: 'TENANT_ADMIN', organizationId: 'org-a', visibility: 'ORGANISATION', permissions: ['tenant.update'] },
        { assignmentId: 'key-create', role: 'TENANT_ADMIN', organizationId: 'org-a', visibility: 'ORGANISATION', permissions: ['apikeys.create'] },
      ],
      organizations,
    });
    assert.equal(capabilitiesForActor({ roles: ['TENANT_ADMIN'], authorization: split }).find(item => item.id === 'applications.create')?.availableToCurrentIdentity, false);
  });
});
