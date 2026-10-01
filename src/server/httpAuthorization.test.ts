import assert from 'node:assert/strict';
import { after, before, describe, it, mock } from 'node:test';
import express from 'express';
import { createServer, type Server } from 'node:http';
import { IamRepository, type IamUserRecord, type IamSessionRecord } from '../db/iamRepository.ts';
import { dbRepository, isDatabaseConnected } from '../db/mariadb.ts';
import { ItilOperationsRepository } from '../db/itilRepository.ts';
import { itilRouter } from '../routes/itilRoutes.ts';
import type { AuthorizationAssignment } from '../security/authorizationContext.ts';
import type { OrganizationNode, OrganizationRelationship } from '../security/organizationScope.ts';

type ActorFixture = {
  token: string;
  user: IamUserRecord;
  assignments: AuthorizationAssignment[];
};

const nodes: OrganizationNode[] = [
  { id: 'org-A', parentId: null },
  { id: 'org-B', parentId: null },
  { id: 'org-parent', parentId: null },
  { id: 'org-child', parentId: 'org-parent' },
  { id: 'org-sibling', parentId: 'org-parent' },
  { id: 'org-unrelated', parentId: null },
];
const relationships: OrganizationRelationship[] = [
  { parentOrganizationId: 'org-parent', childOrganizationId: 'org-child', relationshipType: 'SUBSIDIARY', status: 'ACTIVE', effectiveTo: null },
  { parentOrganizationId: 'org-parent', childOrganizationId: 'org-sibling', relationshipType: 'SUBSIDIARY', status: 'ACTIVE', effectiveTo: null },
];

function user(id: string, tenantId: string | null): IamUserRecord {
  return {
    id, tenant_id: tenantId, email: `${id}@authorization-test.invalid`, password_hash: '',
    first_name: 'HTTP', last_name: 'Test', department: null, status: 'ACTIVE',
    failed_login_attempts: 0, lockout_until: null, mfa_enabled: true, mfa_enforced: true,
    last_login_at: null, last_login_ip: null, password_changed_at: new Date(0),
    created_by: 'SYNTHETIC_TEST', created_at: new Date(0), updated_at: new Date(0),
  };
}

function assignment(id: string, role: string, organizationId: string | null, visibility: AuthorizationAssignment['visibility'], permissions: string[]): AuthorizationAssignment {
  return { assignmentId: `stage4-${id}`, role, organizationId, visibility, permissions };
}

const readWrite = ['tenant.read', 'tenant.update'];
const fixtures: ActorFixture[] = [
  { token: 'stage4-global-super-admin', user: user('stage4-global-super-admin', null), assignments: [assignment('global', 'SUPER_ADMIN', null, 'GLOBAL', [...readWrite, 'provider.read', 'model.read'])] },
  { token: 'stage4-org-a-admin', user: user('stage4-org-a-admin', 'org-A'), assignments: [assignment('org-a', 'TENANT_ADMIN', 'org-A', 'ORGANISATION', readWrite)] },
  { token: 'stage4-org-b-admin', user: user('stage4-org-b-admin', 'org-B'), assignments: [assignment('org-b', 'TENANT_ADMIN', 'org-B', 'ORGANISATION', readWrite)] },
  { token: 'stage4-parent-admin', user: user('stage4-parent-admin', 'org-parent'), assignments: [assignment('parent', 'TENANT_ADMIN', 'org-parent', 'DESCENDANTS', readWrite)] },
  { token: 'stage4-parent-incident-commander', user: user('stage4-parent-incident-commander', 'org-parent'), assignments: [assignment('parent-commander', 'INCIDENT_COMMANDER', 'org-parent', 'DESCENDANTS', readWrite)] },
  { token: 'stage4-child-admin', user: user('stage4-child-admin', 'org-child'), assignments: [assignment('child', 'TENANT_ADMIN', 'org-child', 'ORGANISATION', readWrite)] },
  { token: 'stage4-sibling-admin', user: user('stage4-sibling-admin', 'org-sibling'), assignments: [assignment('sibling', 'TENANT_ADMIN', 'org-sibling', 'ORGANISATION', readWrite)] },
  { token: 'stage4-unrelated-user', user: user('stage4-unrelated-user', 'org-unrelated'), assignments: [assignment('unrelated', 'SUPPORT_AGENT', 'org-unrelated', 'ORGANISATION', ['tenant.read'])] },
  { token: 'stage4-read-only-user', user: user('stage4-read-only-user', 'org-A'), assignments: [assignment('read-only', 'TENANT_ADMIN', 'org-A', 'ORGANISATION', ['tenant.read'])] },
];
const fixtureByToken = new Map(fixtures.map(fixture => [fixture.token, fixture]));

let server: Server;
let baseUrl: string;

before(async () => {
  assert.equal(isDatabaseConnected(), false, 'HTTP authorization fixtures must run without MariaDB.');
  mock.method(IamRepository, 'getSession', async (token: string) => {
    const fixture = fixtureByToken.get(token);
    if (!fixture) return null;
    return {
      id: `session:${token}`, user_id: fixture.user.id, session_token: token,
      ip_address: null, user_agent: 'Stage 4 HTTP test', is_active: true,
      expires_at: new Date(Date.now() + 60_000), last_activity_at: new Date(), created_at: new Date(),
    } satisfies IamSessionRecord;
  });
  mock.method(IamRepository, 'getUserById', async (id: string) => fixtures.find(fixture => fixture.user.id === id)?.user ?? null);
  mock.method(IamRepository, 'getUserRolesAndPermissions', async (id: string) => {
    const fixture = fixtures.find(item => item.user.id === id);
    return { roles: fixture?.assignments.map(item => item.role) ?? [], permissions: fixture?.assignments.flatMap(item => item.permissions) ?? [], tenantId: fixture?.user.tenant_id ?? null };
  });
  mock.method(IamRepository, 'getAuthorizationAssignments', async (id: string) => fixtures.find(item => item.user.id === id)?.assignments ?? []);
  mock.method(dbRepository, 'getOrganizationGraph', async () => ({ nodes, relationships }));

  await ItilOperationsRepository.saveIncident({
    id: 'stage4-incident-org-a', tenantId: 'org-A', title: 'Synthetic org A incident', summary: 'HTTP test fixture',
    severity: 'P2_HIGH', status: 'investigating', affectedTenantIds: ['org-A'], affectedAppIds: [],
  });
  await ItilOperationsRepository.saveIncident({
    id: 'stage4-incident-org-b', tenantId: 'org-B', title: 'Synthetic org B incident', summary: 'HTTP test fixture',
    severity: 'P2_HIGH', status: 'investigating', affectedTenantIds: ['org-B'], affectedAppIds: [],
  });
  await ItilOperationsRepository.saveIncident({
    id: 'stage4-incident-org-child', tenantId: 'org-child', title: 'Synthetic child incident', summary: 'HTTP test fixture',
    severity: 'P2_HIGH', status: 'investigating', affectedTenantIds: ['org-child'], affectedAppIds: [],
  });

  const app = express();
  app.use(express.json({ limit: '8kb' }));
  app.use('/api/v1/itil', itilRouter);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('HTTP authorization test server did not bind.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  mock.restoreAll();
});

async function request(token: string | undefined, path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

describe('Stage 4 isolated HTTP authorization — existing ITIL routes', () => {
  it('requires a real authenticated session at the HTTP boundary', async () => {
    assert.equal((await request(undefined, '/api/v1/itil/incidents')).status, 401);
    assert.equal((await request('unknown-stage4-token', '/api/v1/itil/incidents')).status, 401);
    assert.equal((await request('stage4-org-a-admin', '/api/v1/itil/incidents/stage4-incident-org-a', { method: 'DELETE' })).status, 404, 'The existing router exposes no incident DELETE handler.');
  });

  it('allows an organization admin to read own incidents and denies a known other-tenant ID without disclosure', async () => {
    const own = await request('stage4-org-a-admin', '/api/v1/itil/incidents?tenantId=org-A');
    assert.equal(own.status, 200);
    assert.ok(own.body.some((incident: { id: string }) => incident.id === 'stage4-incident-org-a'));
    const otherScope = await request('stage4-org-a-admin', '/api/v1/itil/incidents?tenantId=org-B');
    assert.equal(otherScope.status, 403);
    assert.deepEqual(otherScope.body, { error: 'Incident scope is not authorized.' });
    const knownId = await request('stage4-org-a-admin', '/api/v1/itil/incidents/stage4-incident-org-b', { method: 'PUT', body: JSON.stringify({ tenantId: 'org-A', title: 'attempt' }) });
    assert.equal(knownId.status, 404);
    assert.deepEqual(knownId.body, { error: 'Incident not found.' });
    assert.equal(JSON.stringify(knownId.body).includes('org-B'), false);
  });

  it('allows parent-to-descendant reads while denying child-to-parent, sibling, and unrelated reads', async () => {
    assert.equal((await request('stage4-parent-admin', '/api/v1/itil/incidents?tenantId=org-child')).status, 200);
    for (const [token, tenantId] of [
      ['stage4-child-admin', 'org-parent'],
      ['stage4-child-admin', 'org-sibling'],
      ['stage4-sibling-admin', 'org-child'],
      ['stage4-unrelated-user', 'org-A'],
    ]) {
      const denied = await request(token, `/api/v1/itil/incidents?tenantId=${tenantId}`);
      assert.equal(denied.status, 403, `${token} -> ${tenantId}`);
      assert.equal(JSON.stringify(denied.body).includes('Synthetic'), false);
    }
  });

  it('allows global list only to an explicit GLOBAL Super Admin grant', async () => {
    const global = await request('stage4-global-super-admin', '/api/v1/itil/incidents?tenantId=all');
    assert.equal(global.status, 200);
    assert.ok(global.body.some((incident: { id: string }) => incident.id === 'stage4-incident-org-a'));
    assert.ok(global.body.some((incident: { id: string }) => incident.id === 'stage4-incident-org-b'));
    const tenant = await request('stage4-org-a-admin', '/api/v1/itil/incidents?tenantId=all');
    assert.equal(tenant.status, 403);
  });

  it('denies read-only mutation and cross-tenant create, while allowing an authorized in-memory create', async () => {
    const payload = { tenantId: 'org-A', title: 'Stage 4 HTTP created incident', summary: 'Synthetic only' };
    assert.equal((await request('stage4-read-only-user', '/api/v1/itil/incidents', { method: 'POST', body: JSON.stringify(payload) })).status, 403);
    const crossTenant = await request('stage4-org-a-admin', '/api/v1/itil/incidents', { method: 'POST', body: JSON.stringify({ ...payload, tenantId: 'org-B' }) });
    assert.equal(crossTenant.status, 403);
    const created = await request('stage4-org-a-admin', '/api/v1/itil/incidents', {
      method: 'POST', headers: { 'x-request-id': 'stage4-request-create-a' }, body: JSON.stringify(payload),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.incident.affectedTenantIds, ['org-A']);
    const childCreated = await request('stage4-parent-incident-commander', '/api/v1/itil/incidents', {
      method: 'POST', body: JSON.stringify({ tenantId: 'org-child', title: 'Parent-authorized child incident', summary: 'Synthetic only' }),
    });
    assert.equal(childCreated.status, 201);
    assert.deepEqual(childCreated.body.incident.affectedTenantIds, ['org-child']);
  });

  it('rejects app relationship checks when unavailable and keeps invalid references from being persisted', async () => {
    const response = await request('stage4-org-a-admin', '/api/v1/itil/incidents', {
      method: 'POST', body: JSON.stringify({ tenantId: 'org-A', title: 'Synthetic app link', affectedAppIds: ['app-org-b'] }),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(response.body, { error: 'Application relationship verification is unavailable.' });
  });

  it('updates status and queues an in-app alert through existing HTTP handlers; verifies process-local audit events', async () => {
    const status = await request('stage4-org-a-admin', '/api/v1/itil/incidents/stage4-incident-org-a/status', {
      method: 'PATCH', headers: { 'x-request-id': 'stage4-request-status-a' }, body: JSON.stringify({ status: 'mitigated' }),
    });
    assert.equal(status.status, 200);
    const childStatus = await request('stage4-parent-incident-commander', '/api/v1/itil/incidents/stage4-incident-org-child/status', {
      method: 'PATCH', body: JSON.stringify({ tenantId: 'org-child', status: 'mitigated' }),
    });
    assert.equal(childStatus.status, 200);
    const alert = await request('stage4-parent-incident-commander', '/api/v1/itil/alerts', {
      method: 'POST', headers: { 'x-request-id': 'stage4-request-alert-a' },
      body: JSON.stringify({ tenantId: 'org-child', incidentId: 'stage4-incident-org-child', message: 'Synthetic test notice', channels: ['in_app'] }),
    });
    assert.equal(alert.status, 202);
    assert.equal(alert.body.alert.tenantId, 'org-child');
    const events = ItilOperationsRepository.getIncidentAuditEvents();
    assert.ok(events.some(event => event.incidentId === 'stage4-incident-org-a' && event.actor === 'stage4-org-a-admin@authorization-test.invalid' && event.type === 'STATUS_CHANGE' && event.tenantId === 'org-A'));
    assert.ok(events.some(event => event.incidentId === 'stage4-incident-org-child' && event.actor === 'stage4-parent-incident-commander@authorization-test.invalid' && event.type === 'STATUS_CHANGE' && event.tenantId === 'org-child'));
    assert.ok(events.some(event => event.incidentId === 'stage4-incident-org-child' && event.actor === 'stage4-parent-incident-commander@authorization-test.invalid' && event.type === 'ALERT_QUEUED' && event.tenantId === 'org-child'));
  });
});
