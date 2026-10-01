import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAuthorizationContext, type AuthorizationAssignment } from './authorizationContext.ts';
import type { Application } from '../types.ts';
import { CREDENTIAL_SCOPE_REGISTRY, credentialScopeStatus, evaluateCredentialScopeGrant } from './credentialScopeAuthority.ts';

const organizations = [{ id: 'org-A', parentId: null }, { id: 'org-B', parentId: null }];
function context(assignment?: AuthorizationAssignment) {
  return buildAuthorizationContext({ userId: 'scope-test-user', assignments: assignment ? [assignment] : [], organizations });
}
const tenantManager = context({ assignmentId: 'grant-A', role: 'TENANT_ADMIN', organizationId: 'org-A', visibility: 'ORGANISATION', permissions: ['apikeys.create'] });
const globalManager = context({ assignmentId: 'grant-global', role: 'SUPER_ADMIN', organizationId: null, visibility: 'GLOBAL', permissions: ['apikeys.create'] });
const missingScopeContext = context();
const app: Application = {
  id: 'app-A', customerId: 'org-A', customerName: 'Synthetic A', appIdentifier: 'app-a', name: 'Synthetic A', description: '',
  status: 'active', environment: 'development', allowedCapabilities: ['chat'], rateLimitRpm: 60, quotaMonthlyRequests: 1000,
  quotaUsedRequests: 0, assignedPolicyIds: [], contactEmail: 'scope-test@example.invalid', createdAt: '', updatedAt: '',
};

describe('credential management-to-runtime authority contract', () => {
  it('limits the default grant ceiling to the only runtime-enforced scope', () => {
    assert.deepEqual(Object.values(CREDENTIAL_SCOPE_REGISTRY).map(item => [item.scope, item.status]), [
      ['read:inference', 'RUNTIME_ENFORCED'],
      ['write:inference', 'PERSISTED_NON_FUNCTIONAL'],
      ['read:models', 'PERSISTED_NON_FUNCTIONAL'],
      ['read:capabilities', 'PERSISTED_NON_FUNCTIONAL'],
      ['write:telemetry', 'PERSISTED_NON_FUNCTIONAL'],
    ]);
    assert.equal(credentialScopeStatus('admin:all'), 'REJECTED_UNSUPPORTED');
    const result = evaluateCredentialScopeGrant({ authorization: tenantManager, targetOrganizationId: 'org-A', application: app, requestedScopes: ['read:inference'] });
    assert.equal(result.allowed, true);
    if (result.allowed) {
      assert.deepEqual(result.maximumScopes, ['read:inference']);
      assert.deepEqual(result.grantedScopes, ['read:inference']);
    }
  });

  it('does not treat credential management permission alone as sufficient when the application has no capability boundary', () => {
    const result = evaluateCredentialScopeGrant({ authorization: tenantManager, targetOrganizationId: 'org-A', application: { ...app, allowedCapabilities: [] }, requestedScopes: ['read:inference'] });
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.equal(result.code, 'APPLICATION_NOT_GRANTABLE');
  });

  it('denies an unauthorized organization and does not infer global authority from missing scope', () => {
    const foreign = evaluateCredentialScopeGrant({ authorization: tenantManager, targetOrganizationId: 'org-B', application: { ...app, customerId: 'org-B' }, requestedScopes: ['read:inference'] });
    assert.equal(foreign.allowed, false);
    const absent = evaluateCredentialScopeGrant({ authorization: missingScopeContext, targetOrganizationId: 'org-A', application: app, requestedScopes: ['read:inference'] });
    assert.equal(absent.allowed, false);
    if (!absent.allowed) assert.equal(absent.code, 'NO_MANAGEMENT_AUTHORITY');
  });

  it('requires explicit global assignment and still binds the grant to the target application', () => {
    const allowed = evaluateCredentialScopeGrant({ authorization: globalManager, targetOrganizationId: 'org-A', application: app, requestedScopes: ['read:inference'] });
    assert.equal(allowed.allowed, true);
    const wrongOwner = evaluateCredentialScopeGrant({ authorization: globalManager, targetOrganizationId: 'org-A', application: { ...app, customerId: 'org-B' }, requestedScopes: ['read:inference'] });
    assert.equal(wrongOwner.allowed, false);
    if (!wrongOwner.allowed) assert.equal(wrongOwner.code, 'APPLICATION_SCOPE_MISMATCH');
  });

  it('rejects legacy persisted and unknown scopes for new grants', () => {
    for (const scope of ['write:inference', 'read:models', 'read:capabilities', 'write:telemetry', 'admin:all']) {
      const result = evaluateCredentialScopeGrant({ authorization: tenantManager, targetOrganizationId: 'org-A', application: app, requestedScopes: [scope] });
      assert.equal(result.allowed, false, `${scope} must not be grantable`);
      if (!result.allowed) assert.equal(result.code, 'UNSUPPORTED_SCOPE');
    }
  });
});
