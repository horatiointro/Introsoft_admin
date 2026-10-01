import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it, mock } from 'node:test';
import express from 'express';
import { createServer, type Server } from 'node:http';
import { IamRepository, type IamUserRecord, type IamSessionRecord } from '../db/iamRepository.ts';
import { dbRepository, isDatabaseConnected } from '../db/mariadb.ts';
import { createApplicationCredentialRouter } from '../routes/applicationCredentialRoutes.ts';
import type { AuthorizationAssignment } from '../security/authorizationContext.ts';
import type { OrganizationNode, OrganizationRelationship } from '../security/organizationScope.ts';
import { findApiKeyBySecret, hashApiKeySecret, storeIssuedApiKey, validateRuntimeApiKey, type StoredApiKey } from '../security/apiKeyCredential.ts';
import type { AIPolicy, ApiKey, Application, AuditLog, Customer } from '../types.ts';

type Actor = { token: string; user: IamUserRecord; assignments: AuthorizationAssignment[] };
const graph: OrganizationNode[] = [
  { id: 'org-A', parentId: null }, { id: 'org-B', parentId: null }, { id: 'org-parent', parentId: null },
  { id: 'org-child', parentId: 'org-parent' }, { id: 'org-sibling', parentId: 'org-parent' },
];
const relationships: OrganizationRelationship[] = [
  { parentOrganizationId: 'org-parent', childOrganizationId: 'org-child', relationshipType: 'SUBSIDIARY', status: 'ACTIVE', effectiveTo: null },
  { parentOrganizationId: 'org-parent', childOrganizationId: 'org-sibling', relationshipType: 'SUBSIDIARY', status: 'ACTIVE', effectiveTo: null },
];
const allManagementPermissions = ['tenant.read', 'tenant.update', 'apikeys.create', 'apikeys.revoke', 'tenant.delete', 'policy.read'];
function user(id: string, tenantId: string | null): IamUserRecord {
  return { id, tenant_id: tenantId, email: `${id}@application-test.invalid`, password_hash: '', first_name: 'HTTP', last_name: 'Test', department: null, status: 'ACTIVE', failed_login_attempts: 0, lockout_until: null, mfa_enabled: true, mfa_enforced: true, last_login_at: null, last_login_ip: null, password_changed_at: new Date(0), created_by: 'SYNTHETIC_TEST', created_at: new Date(0), updated_at: new Date(0) };
}
function grant(id: string, role: string, organizationId: string | null, visibility: AuthorizationAssignment['visibility'], permissions: string[]): AuthorizationAssignment {
  return { assignmentId: `app-test-${id}`, role, organizationId, visibility, permissions };
}
const actors: Actor[] = [
  { token: 'app-test-org-a', user: user('app-test-org-a', 'org-A'), assignments: [grant('a', 'TENANT_ADMIN', 'org-A', 'ORGANISATION', allManagementPermissions)] },
  { token: 'app-test-org-b', user: user('app-test-org-b', 'org-B'), assignments: [grant('b', 'TENANT_ADMIN', 'org-B', 'ORGANISATION', allManagementPermissions)] },
  { token: 'app-test-parent', user: user('app-test-parent', 'org-parent'), assignments: [grant('parent', 'TENANT_ADMIN', 'org-parent', 'DESCENDANTS', allManagementPermissions)] },
  { token: 'app-test-child', user: user('app-test-child', 'org-child'), assignments: [grant('child', 'TENANT_ADMIN', 'org-child', 'ORGANISATION', allManagementPermissions)] },
  { token: 'app-test-read-only', user: user('app-test-read-only', 'org-A'), assignments: [grant('read-only', 'TENANT_ADMIN', 'org-A', 'ORGANISATION', ['tenant.read'])] },
  { token: 'app-test-update-only', user: user('app-test-update-only', 'org-A'), assignments: [grant('update-only', 'TENANT_ADMIN', 'org-A', 'ORGANISATION', ['tenant.update'])] },
  { token: 'app-test-global', user: user('app-test-global', null), assignments: [grant('global', 'SUPER_ADMIN', null, 'GLOBAL', allManagementPermissions)] },
  { token: 'app-test-null-scope', user: user('app-test-null-scope', null), assignments: [] },
];
const actorsByToken = new Map(actors.map(actor => [actor.token, actor]));

function application(id: string, customerId: string, parentApplicationId: string | null = null): Application {
  return { id, customerId, customerName: `Synthetic ${customerId}`, parentApplicationId, applicationType: parentApplicationId ? 'sub_application' : 'application', appIdentifier: id, name: `Synthetic ${id}`, description: 'HTTP test fixture', status: 'active', environment: 'development', allowedCapabilities: ['chat'], rateLimitRpm: 20, quotaMonthlyRequests: 1000, quotaUsedRequests: 0, assignedPolicyIds: [], contactEmail: 'fixture@example.invalid', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
}
function customer(id: string): Customer {
  return { id, type: 'company', name: `Synthetic ${id}`, industry: 'test', country: 'ZA', status: 'active', tier: 'starter', monthlyBudgetUsd: 0, currentSpendUsd: 0, rateLimitRpm: 60, primaryContact: { name: 'Synthetic', email: 'fixture@example.invalid' }, statutoryOfficers: {}, users: [], connectedAppIds: [], assignedPolicyIds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } as Customer;
}
function storedKey(id: string, customerId: string, appId: string, secret: string, scopes = ['read:inference'], overrides: Partial<ApiKey> = {}): StoredApiKey {
  const record: ApiKey = { id, customerId, customerName: `Synthetic ${customerId}`, appId, appName: `Synthetic ${appId}`, name: `Synthetic ${id}`, key: secret, prefix: `${secret.slice(0, 12)}...`, status: 'active', createdAt: '2026-01-01T00:00:00.000Z', expiresAt: null, rateLimitRpm: 60, ipWhitelist: [], scopes, ...overrides };
  return storeIssuedApiKey([], record)[0];
}

let apps: Application[];
let keys: ApiKey[];
let customers: Customer[];
let policies: AIPolicy[];
let auditEvents: AuditLog[];
let baseUrl: string;
let server: Server;
let generatedSecret = 0;

before(async () => {
  assert.equal(isDatabaseConnected(), false, 'HTTP fixtures must not run with a database connection.');
  mock.method(IamRepository, 'getSession', async (token: string) => {
    const actor = actorsByToken.get(token);
    if (!actor) return null;
    return { id: `session:${token}`, user_id: actor.user.id, session_token: token, ip_address: null, user_agent: 'Application credential HTTP test', is_active: true, expires_at: new Date(Date.now() + 60_000), last_activity_at: new Date(), created_at: new Date() } satisfies IamSessionRecord;
  });
  mock.method(IamRepository, 'getUserById', async (id: string) => actors.find(actor => actor.user.id === id)?.user ?? null);
  mock.method(IamRepository, 'getUserRolesAndPermissions', async (id: string) => {
    const actor = actors.find(item => item.user.id === id);
    return { roles: actor?.assignments.map(item => item.role) ?? [], permissions: actor?.assignments.flatMap(item => item.permissions) ?? [], tenantId: actor?.user.tenant_id ?? null };
  });
  mock.method(IamRepository, 'getAuthorizationAssignments', async (id: string) => actors.find(item => item.user.id === id)?.assignments ?? []);
  mock.method(dbRepository, 'getOrganizationGraph', async () => ({ nodes: graph, relationships }));

  const deps = {
    getApplications: () => apps,
    setApplications: (next: Application[]) => { apps = next; },
    getApiKeys: () => keys,
    setApiKeys: (next: ApiKey[]) => { keys = next; },
    getCustomers: () => customers,
    getPolicies: () => policies,
    appendAuditLog: (event: AuditLog) => { auditEvents.unshift(event); },
    loadTenantApplications: async (_ids: readonly string[]) => undefined,
    loadPersistedApiKeys: async (_ids: readonly string[]) => undefined,
    saveTenantApplication: async (_record: Application) => undefined,
    saveApiKeyRecord: async (_record: ApiKey) => undefined,
    updatePersistedApiKey: async (_record: ApiKey) => undefined,
    isDatabaseConnected: () => false,
    executeQuery: async (_sql: string, _params: unknown[] = []) => { throw new Error('Unexpected database access in test.'); },
    generateTenantApplicationId: (value: string) => `generated-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    generateApiKeySecret: (_prefix = 'ALTIL') => `synthetic-generated-secret-${++generatedSecret}`,
    storeIssuedApiKey: (record: ApiKey) => { keys = storeIssuedApiKey(keys as StoredApiKey[], record) as ApiKey[]; },
    resolveApiKey: async (secret: string) => findApiKeyBySecret(secret, keys as StoredApiKey[]),
    recordControlPlaneAuditBestEffort: async (event: Omit<AuditLog, 'timestamp' | 'appId' | 'appName' | 'capability' | 'providerName' | 'modelIdentifier' | 'durationSeconds' | 'status'> & { actorEmail: string; tenantId: string; action: string; resourceId: string; requestId?: string; priorState?: unknown; newState?: unknown; outcome?: 'SUCCESS' | 'DENIED' | 'FAILURE' }) => {
      auditEvents.unshift({ id: `audit-${auditEvents.length + 1}`, timestamp: new Date().toISOString(), appId: event.resourceId, appName: 'Synthetic test', capability: event.action, providerName: 'Synthetic test', modelIdentifier: event.action, durationSeconds: 0, status: 'SUCCESS', sanitizedPromptPreview: JSON.stringify({ actor: event.actorEmail, tenantId: event.tenantId, requestId: event.requestId, priorState: event.priorState, newState: event.newState, outcome: event.outcome || 'SUCCESS' }) });
    },
  };
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/v1', createApplicationCredentialRouter(deps));
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('HTTP route fixture server did not bind.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
  apps = [application('application-A', 'org-A'), application('application-B', 'org-B'), application('application-child', 'org-child')];
  keys = [
    storedKey('key-A', 'org-A', 'application-A', 'synthetic-secret-for-key-A'),
    storedKey('key-B', 'org-B', 'application-B', 'synthetic-secret-for-key-B'),
  ] as ApiKey[];
  customers = ['org-A', 'org-B', 'org-parent', 'org-child', 'org-sibling'].map(customer);
  policies = [
    { id: 'policy-A', name: 'Synthetic A policy', description: '', appliesToAppIds: [], tenantId: 'org-A', rules: {} as AIPolicy['rules'], status: 'active', createdAt: '', updatedAt: '' },
    { id: 'policy-B', name: 'Synthetic B policy', description: '', appliesToAppIds: [], tenantId: 'org-B', rules: {} as AIPolicy['rules'], status: 'active', createdAt: '', updatedAt: '' },
  ];
  auditEvents = [];
  generatedSecret = 0;
});

after(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  mock.restoreAll();
});

async function request(token: string | undefined, path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  return { status: response.status, body: await response.json().catch(() => null) };
}

describe('Stage 5 actual application and API-key routes over isolated HTTP', () => {
  it('rejects unauthenticated application and key-management requests at the real middleware boundary', async () => {
    assert.equal((await request(undefined, '/api/v1/applications')).status, 401);
    assert.equal((await request(undefined, '/api/v1/api-keys')).status, 401);
  });

  it('lists only organizations visible to the authenticated read grant, including explicit descendants', async () => {
    const own = await request('app-test-org-a', '/api/v1/applications');
    assert.equal(own.status, 200);
    assert.deepEqual(own.body.map((item: Application) => item.id), ['application-A']);
    const parent = await request('app-test-parent', '/api/v1/applications');
    assert.ok(parent.body.some((item: Application) => item.id === 'application-child'));
    const child = await request('app-test-child', '/api/v1/applications');
    assert.ok(child.body.every((item: Application) => item.customerId === 'org-child'));
    assert.equal((await request('app-test-child', '/api/v1/applications', { method: 'POST', body: JSON.stringify({ customerId: 'org-parent', name: 'Synthetic upward access' }) })).status, 403);
    assert.equal((await request('app-test-child', '/api/v1/applications', { method: 'POST', body: JSON.stringify({ customerId: 'org-sibling', name: 'Synthetic sibling access' }) })).status, 403);
    assert.equal((await request('app-test-read-only', '/api/v1/applications/application-A')).status, 404, 'No application detail GET is registered.');
  });

  it('creates an application only for the authorized owner and binds its one-time key to that application', async () => {
    const denied = await request('app-test-org-a', '/api/v1/applications', { method: 'POST', body: JSON.stringify({ customerId: 'org-B', name: 'Synthetic denied app' }) });
    assert.equal(denied.status, 403);
    const created = await request('app-test-org-a', '/api/v1/applications', { method: 'POST', headers: { 'x-request-id': 'synthetic-app-create-request' }, body: JSON.stringify({ customerId: 'org-A', name: 'Synthetic created app', appIdentifier: 'synthetic-app' }) });
    assert.equal(created.status, 201);
    assert.equal(created.body.application.customerId, 'org-A');
    assert.equal(created.body.apiKey.appId, created.body.application.id);
    assert.ok(typeof created.body.apiKey.key === 'string' && created.body.apiKey.key.startsWith('synthetic-generated-secret-'), 'creation reveals a synthetic key once without printing it');
    const stored = keys.find(item => item.id === created.body.apiKey.id) as StoredApiKey | undefined;
    assert.equal(stored?.key, '');
    assert.equal(stored?.keyHash, hashApiKeySecret(created.body.apiKey.key));
    assert.equal(JSON.stringify(auditEvents).includes(created.body.apiKey.key), false);
    assert.equal(JSON.stringify(auditEvents).includes('app-test-org-a@application-test.invalid'), true);
    assert.equal(JSON.stringify(auditEvents).includes('synthetic-app-create-request'), true);
  });

  it('allows parent-to-child application creation only with one grant carrying both permissions and same-org parent binding', async () => {
    const allowed = await request('app-test-parent', '/api/v1/applications', { method: 'POST', body: JSON.stringify({ customerId: 'org-child', name: 'Synthetic child app', parentApplicationId: 'application-child' }) });
    assert.equal(allowed.status, 201);
    assert.equal(allowed.body.application.customerId, 'org-child');
    const foreignParent = await request('app-test-org-a', '/api/v1/applications', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', name: 'Synthetic wrong parent', parentApplicationId: 'application-B' }) });
    assert.equal(foreignParent.status, 400);
  });

  it('updates own profile/status, denies known foreign IDs, identity reassignment, and write from a read-only actor', async () => {
    const update = await request('app-test-update-only', '/api/v1/applications/application-A', { method: 'PUT', body: JSON.stringify({ name: 'Renamed synthetic app', status: 'suspended' }) });
    assert.equal(update.status, 200);
    assert.equal(update.body.status, 'suspended');
    const foreign = await request('app-test-org-a', '/api/v1/applications/application-B', { method: 'PUT', body: JSON.stringify({ name: 'attempt' }) });
    const missing = await request('app-test-org-a', '/api/v1/applications/application-missing', { method: 'PUT', body: JSON.stringify({ name: 'attempt' }) });
    assert.equal(foreign.status, 404);
    assert.deepEqual(foreign.body, missing.body, 'known foreign and nonexistent application IDs have indistinguishable responses');
    assert.equal((await request('app-test-org-a', '/api/v1/applications/application-A', { method: 'PUT', body: JSON.stringify({ customerId: 'org-B' }) })).status, 400);
    assert.equal((await request('app-test-read-only', '/api/v1/applications/application-A', { method: 'PUT', body: JSON.stringify({ name: 'attempt' }) })).status, 403);
  });

  it('scopes policy references and does not accept a foreign policy assignment', async () => {
    const denied = await request('app-test-org-a', '/api/v1/applications', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', name: 'Synthetic policy app', assignedPolicyIds: ['policy-B'] }) });
    assert.equal(denied.status, 403);
  });

  it('deletes only visible applications with the existing combined permissions and removes attached keys', async () => {
    const foreign = await request('app-test-org-a', '/api/v1/applications/application-B', { method: 'DELETE' });
    const missing = await request('app-test-org-a', '/api/v1/applications/application-missing', { method: 'DELETE' });
    assert.equal(foreign.status, 404);
    assert.deepEqual(foreign.body, missing.body);
    const readOnly = await request('app-test-read-only', '/api/v1/applications/application-A', { method: 'DELETE' });
    assert.equal(readOnly.status, 403);
    const deleted = await request('app-test-org-a', '/api/v1/applications/application-A', { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.equal(apps.some(item => item.id === 'application-A'), false);
    assert.equal(keys.some(item => item.appId === 'application-A'), false);
  });

  it('creates API keys only for an authorized tenant and an active application owned by that tenant', async () => {
    const crossTenant = await request('app-test-org-a', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-B', appId: 'application-B', scopes: ['read:inference'] }) });
    assert.equal(crossTenant.status, 403);
    const wrongApp = await request('app-test-org-a', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-B', scopes: ['read:inference'] }) });
    assert.equal(wrongApp.status, 400);
    const created = await request('app-test-org-a', '/api/v1/api-keys', { method: 'POST', headers: { 'x-request-id': 'synthetic-key-create-request' }, body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: ['read:inference'] }) });
    assert.equal(created.status, 201);
    assert.equal(created.body.customerId, 'org-A');
    assert.equal(created.body.appId, 'application-A');
    assert.ok(typeof created.body.key === 'string' && created.body.key.startsWith('synthetic-generated-secret-'), 'creation reveals a synthetic key once without printing it');
    assert.equal((keys.find(item => item.id === created.body.id) as StoredApiKey).key, '');
    assert.equal(validateRuntimeApiKey({ key: findApiKeyBySecret(created.body.key, keys as StoredApiKey[]), requiredScope: 'read:inference' }).allowed, true);
    const audit = JSON.stringify(auditEvents);
    assert.match(audit, /synthetic-key-create-request/);
    assert.match(audit, /read:inference/);
    assert.match(audit, /ALLOW/);
    assert.equal(audit.includes(created.body.key), false);
  });

  it('applies the same scoped grant decision to customer-key creation', async () => {
    const allowed = await request('app-test-org-a', '/api/v1/customers/org-A/keys', { method: 'POST', body: JSON.stringify({ appId: 'application-A', scopes: ['read:inference'] }) });
    assert.equal(allowed.status, 201);
    assert.equal(allowed.body.customerId, 'org-A');
    assert.equal(allowed.body.appId, 'application-A');
    const unsupported = await request('app-test-org-a', '/api/v1/customers/org-A/keys', { method: 'POST', body: JSON.stringify({ appId: 'application-A', scopes: ['read:models'] }) });
    assert.equal(unsupported.status, 403);
  });

  it('rejects a newly requested write:inference grant and does not treat a persisted one as read:inference authority', async () => {
    const created = await request('app-test-org-a', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: ['write:inference'] }) });
    assert.equal(created.status, 403);
    const stored = findApiKeyBySecret('synthetic-secret-for-key-A', keys as StoredApiKey[]);
    assert.ok(stored);
    stored.scopes = ['write:inference'];
    assert.equal(validateRuntimeApiKey({ key: stored, requiredScope: 'read:inference' }).allowed, false);
  });

  it('denies a manager without target-application capability authority and rejects persisted non-functional scopes', async () => {
    apps[0] = { ...apps[0], allowedCapabilities: [] };
    const noApplicationAuthority = await request('app-test-org-a', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: ['read:inference'] }) });
    assert.equal(noApplicationAuthority.status, 403);
    assert.equal(keys.some(key => key.id !== 'key-A' && key.id !== 'key-B'), false);
    assert.match(JSON.stringify(auditEvents), /API_KEY_CREATE_DENIED/);
    assert.match(JSON.stringify(auditEvents), /DENIED/);
    apps[0] = application('application-A', 'org-A');
    for (const scope of ['write:inference', 'read:models', 'read:capabilities', 'write:telemetry']) {
      const unsupported = await request('app-test-org-a', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: [scope] }) });
      assert.equal(unsupported.status, 403, `${scope} must not be newly granted`);
    }
    assert.equal(keys.length, 2);
  });

  it('requires explicit global assignment and never infers global credential authority from a null tenant', async () => {
    const implicit = await request('app-test-null-scope', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: ['read:inference'] }) });
    assert.equal(implicit.status, 403);
    const explicit = await request('app-test-global', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: ['read:inference'] }) });
    assert.equal(explicit.status, 201);
    assert.deepEqual(explicit.body.scopes, ['read:inference']);
  });

  it('keeps read-only tenant callers from creating credentials', async () => {
    const result = await request('app-test-read-only', '/api/v1/api-keys', { method: 'POST', body: JSON.stringify({ customerId: 'org-A', appId: 'application-A', scopes: ['read:inference'] }) });
    assert.equal(result.status, 403);
  });

  it('lists only authorized key metadata and omits plaintext/hash material', async () => {
    const own = await request('app-test-org-a', '/api/v1/api-keys');
    assert.equal(own.status, 200);
    assert.deepEqual(own.body.map((item: ApiKey) => item.id), ['key-A']);
    assert.equal(Object.hasOwn(own.body[0], 'keyHash'), false);
    assert.equal(own.body[0].key, undefined);
    assert.equal((await request('app-test-org-a', '/api/v1/api-keys/key-B')).status, 404);
  });

  it('revokes own keys, masks foreign keys as not found, and never returns the credential', async () => {
    const foreign = await request('app-test-org-a', '/api/v1/api-keys/key-B/revoke', { method: 'PUT' });
    const missing = await request('app-test-org-a', '/api/v1/api-keys/key-missing/revoke', { method: 'PUT' });
    assert.equal(foreign.status, 404);
    assert.deepEqual(foreign.body, missing.body, 'known foreign and nonexistent key IDs have indistinguishable responses');
    const revoked = await request('app-test-org-a', '/api/v1/api-keys/key-A/revoke', { method: 'PUT' });
    assert.equal(revoked.status, 200);
    assert.equal(revoked.body.status, 'revoked');
    assert.equal(Object.hasOwn(revoked.body, 'keyHash'), false);
    assert.equal(revoked.body.key, undefined);
    assert.equal(JSON.stringify(revoked.body).includes('synthetic-secret-for-key-A'), false);
  });

  it('restricts key deletion to explicit global Super Admin and returns no credential', async () => {
    assert.equal((await request('app-test-org-a', '/api/v1/api-keys/key-A', { method: 'DELETE' })).status, 403);
    const deleted = await request('app-test-global', '/api/v1/api-keys/key-A', { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.deepEqual(deleted.body, { success: true });
    assert.equal(JSON.stringify(deleted.body).includes('synthetic-secret-for-key-A'), false);
  });

  it('accepts only the exact key on the existing validation route and does not reveal secrets', async () => {
    const prefix = await request(undefined, '/api/v1/customers/validate-key', { method: 'POST', body: JSON.stringify({ key: 'synthetic-secret' }) });
    assert.equal(prefix.status, 401);
    const valid = await request(undefined, '/api/v1/customers/validate-key', { method: 'POST', body: JSON.stringify({ key: 'synthetic-secret-for-key-A' }) });
    assert.equal(valid.status, 200);
    assert.equal(valid.body.valid, true);
    assert.equal(valid.body.customer.id, 'org-A');
    assert.equal(JSON.stringify(valid.body).includes('synthetic-secret-for-key-A'), false);
    assert.equal((await request(undefined, '/api/v1/customers/validate-key', { method: 'POST', body: JSON.stringify({ key: 'invalid' }) })).status, 401);
  });

  it('denies obsolete per-key reveal, rotate, metadata, restriction, and scope-update paths rather than fabricating handlers', async () => {
    for (const [method, path] of [
      ['GET', '/api/v1/api-keys/key-A/reveal'], ['POST', '/api/v1/api-keys/key-A/rotate'],
      ['PATCH', '/api/v1/api-keys/key-A'], ['PUT', '/api/v1/api-keys/key-A/scopes'],
    ] as const) assert.equal((await request('app-test-org-a', path, { method })).status, 404);
  });
});
