import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createLocalTestHarness, validateLocalHarnessEnvironment } from './localTestHarness.ts';

const safeEnv = { ALTIL_LOCAL_TEST_HARNESS: 'true' };
let server: Server;
let baseUrl: string;
let token: string;
let supertestToken: string;

before(async () => {
  server = createServer(createLocalTestHarness(safeEnv));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind to TCP.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
after(async () => { if (server?.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

describe('LOCAL TEST harness safety contract', () => {
  it('1. refuses startup without explicit harness flag', () => assert.throws(() => validateLocalHarnessEnvironment({}), /ALTIL_LOCAL_TEST_HARNESS/));
  it('2. refuses production NODE_ENV', () => assert.throws(() => validateLocalHarnessEnvironment({ ...safeEnv, NODE_ENV: 'production' }), /NODE_ENV/));
  it('3. refuses altil_db without revealing configuration', () => assert.throws(() => validateLocalHarnessEnvironment({ ...safeEnv, MARIADB_DATABASE: 'altil_db' }), /production database name/));
  it('4. refuses non-loopback DB host and URL', () => {
    assert.throws(() => validateLocalHarnessEnvironment({ ...safeEnv, DB_HOST: 'database.example.invalid' }), /non-loopback database host/);
    assert.throws(() => validateLocalHarnessEnvironment({ ...safeEnv, DATABASE_URL: 'mysql://example.invalid/safe' }), /non-loopback database host/);
  });
  it('5. refuses configured external provider credentials without exposing their values', () => assert.throws(() => validateLocalHarnessEnvironment({ ...safeEnv, OPENAI_API_KEY: 'synthetic-test-value' }), error => !String(error).includes('synthetic-test-value')));
  it('6. entrypoint has no production server, DB, or migration imports', async () => {
    const source = await readFile(new URL('./localTestHarness.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /from\s+['"].*(?:server\.ts|db\/|migrat|billingCollection|providerService)/i);
  });
  it('7. exposes no billing collection worker', async () => {
    const source = await readFile(new URL('./localTestHarness.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /runBillingCollections|scheduleBilling|setInterval\s*\(/);
  });
  it('8. exposes no cleanup/purge scheduler', async () => {
    const source = await readFile(new URL('./localTestHarness.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /purgeExpired|cleanupJob|setInterval\s*\(/i);
  });
  it('9. local auth is deterministic and quick access stays unavailable', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'local-test@altil.invalid', password: 'local-test-password', mfaCode: '000000', selectedTenant: 'local-test-tenant' }) });
    assert.equal(response.status, 200);
    const body = await response.json() as { token: string; user: { label: string; tenantId: string } };
    assert.equal(body.user.label, 'LOCAL TEST ONLY');
    assert.equal(body.user.tenantId, 'local-test-tenant');
    token = body.token;
    assert.deepEqual(await (await fetch(`${baseUrl}/api/v1/auth/super-admin-access/availability`)).json(), { available: false });
  });
  it('15. authenticates the synthetic supertest identity through the standard login route', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'supertest@introsoft.co.za', password: 'supertest', mfaCode: '000000', selectedTenant: 'local-test-tenant' }) });
    assert.equal(response.status, 200);
    const body = await response.json() as { token: string; user: Record<string, string> };
    assert.match(body.token, /^local-test-/);
    assert.equal(body.user.name, 'LOCAL TEST SUPERTEST');
    assert.equal(body.user.role, 'super_admin');
    assert.deepEqual(body.user.roles, ['SUPER_ADMIN']);
    assert.ok(Array.isArray(body.user.permissions) && body.user.permissions.length > 0);
    assert.match(String(body.user.sessionId), /^local-test-session-/);
    assert.equal(body.user.tenantId, 'local-test-tenant');
    assert.equal(body.user.email, 'supertest@introsoft.co.za');
    assert.equal(body.user.environment, 'LOCAL_TEST');
    assert.equal(body.user.label, 'LOCAL TEST ONLY');
    supertestToken = body.token;
  });
  it('reproduces and prevents the LOCAL TEST sign-in form MFA default mismatch', async () => {
    const loginSource = await readFile(new URL('../components/LoginScreen.tsx', import.meta.url), 'utf8');
    assert.match(loginSource, /import\.meta\.env\.BASE_URL\s*===\s*'\/admin-test\/'\s*\?\s*'000000'\s*:\s*'849201'/);
    const wrongFormDefault = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'supertest@introsoft.co.za', password: 'supertest', mfaCode: '849201', selectedTenant: 'all' }) });
    assert.equal(wrongFormDefault.status, 401);
    const alignedFormDefault = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'supertest@introsoft.co.za', password: 'supertest', mfaCode: '000000', selectedTenant: 'all' }) });
    assert.equal(alignedFormDefault.status, 200);
  });
  it('16. rejects the synthetic identity with an incorrect password', async () => {
    assert.equal((await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'supertest@introsoft.co.za', password: 'incorrect', mfaCode: '000000' }) })).status, 401);
  });
  it('does not accept a username alias in place of the required email identifier', async () => {
    assert.equal((await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'supertest', password: 'supertest', mfaCode: '000000' }) })).status, 401);
  });
  it('rejects unknown users', async () => {
    assert.equal((await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'unknown@local-test.invalid', password: 'supertest', mfaCode: '000000' }) })).status, 401);
  });
  it('17. associates the accepted bearer token with the expected authenticated identity', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${supertestToken}` } });
    assert.equal(response.status, 200);
    const body = await response.json() as { user: { id: string; name: string; firstName: string; lastName: string; email: string; role: string; roles: string[]; permissions: string[]; sessionId: string; tenant: string; tenantId: string; status: string; environment: string; label: string } };
    assert.deepEqual(body.user, {
      id: 'local-test-supertest-user', name: 'LOCAL TEST SUPERTEST', firstName: 'LOCAL TEST', lastName: 'SUPERTEST',
      email: 'supertest@introsoft.co.za', role: 'super_admin', roles: ['SUPER_ADMIN'], permissions: body.user.permissions,
      sessionId: body.user.sessionId, tenant: 'local-test-tenant', tenantId: 'local-test-tenant', status: 'ACTIVE',
      environment: 'LOCAL_TEST', label: 'LOCAL TEST ONLY',
    });
    assert.ok(body.user.permissions.length > 0);
    assert.match(body.user.sessionId, /^local-test-session-/);
  });
  it('18. keeps the account unavailable when the harness flag is disabled', async () => {
    assert.throws(() => validateLocalHarnessEnvironment({ ALTIL_LOCAL_TEST_HARNESS: 'false' }), /ALTIL_LOCAL_TEST_HARNESS/);
  });
  it('supplies the existing authorization middleware with a production-shaped Super Admin identity', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${supertestToken}` } });
    assert.equal(response.status, 200);
    const user = (await response.json() as { user: Record<string, unknown> }).user;
    assert.deepEqual(user.roles, ['SUPER_ADMIN']);
    assert.equal(user.tenantId, 'local-test-tenant');
    assert.equal(user.status, 'ACTIVE');
    assert.match(String(user.sessionId), /^local-test-session-/);

    const { requirePermission, requireRole } = await import('../middleware/authMiddleware.ts');
    let roleAllowed = false;
    requireRole(['SECURITY_ADMIN'])({ user } as never, {} as never, (() => { roleAllowed = true; }) as never);
    assert.equal(roleAllowed, true);
    let permissionAllowed = false;
    requirePermission('system.configure')({ user } as never, {} as never, (() => { permissionAllowed = true; }) as never);
    assert.equal(permissionAllowed, true);
  });
  it('19. refuses production mode before exposing any harness account', async () => {
    assert.throws(() => createLocalTestHarness({ ...safeEnv, NODE_ENV: 'production' }), /NODE_ENV/);
  });
  it('20. uses only in-memory session state and creates no persistent auth records', async () => {
    const source = await readFile(new URL('./localTestHarness.ts', import.meta.url), 'utf8');
    assert.match(source, /new Map<string,/);
    assert.doesNotMatch(source, /(?:writeFile|createConnection|createPool|INSERT\s+INTO|localStorage)/i);
    assert.deepEqual(await (await fetch(`${baseUrl}/health`)).json(), { status: 'ok', label: 'LOCAL TEST ONLY', database: false, providers: false, persistence: false });
  });
  it('10. state is in-memory and health declares no persistence', async () => {
    assert.deepEqual(await (await fetch(`${baseUrl}/health`)).json(), { status: 'ok', label: 'LOCAL TEST ONLY', database: false, providers: false, persistence: false });
  });
  it('11. rejects unauthenticated reads and writes', async () => {
    assert.equal((await fetch(`${baseUrl}/api/v1/customers`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/v1/customers`, { method: 'POST' })).status, 401);
  });
  it('12. tenant portal is scoped and customer mismatch fails closed', async () => {
    const headers = { Authorization: `Bearer ${token}` };
    assert.equal((await fetch(`${baseUrl}/api/v1/tenant-portal/other-tenant`, { headers })).status, 404);
    const own = await fetch(`${baseUrl}/api/v1/tenant-portal/local-test-tenant`, { headers });
    assert.equal(own.status, 200);
    assert.equal((await own.json() as { commercialAccess: string }).commercialAccess, 'UNLINKED');
  });
  it('13. portal writes are denied', async () => assert.equal((await fetch(`${baseUrl}/api/v1/billing/schedules`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })).status, 405));
  it('keeps existing LOCAL TEST reads available and denies every write verb without invoking production handlers', async () => {
    const headers = { Authorization: `Bearer ${supertestToken}` };
    for (const path of ['/api/v1/customers', '/api/v1/billing/orders']) {
      assert.equal((await fetch(`${baseUrl}${path}`, { headers })).status, 200, `GET ${path}`);
    }
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const response = await fetch(`${baseUrl}/api/v1/billing/orders/local-test-order`, { method, headers: { ...headers, 'content-type': 'application/json' }, body: method === 'DELETE' ? undefined : '{}' });
      assert.equal(response.status, 405, `${method} /api/v1/billing/orders/local-test-order`);
    }
  });
  it('14. keeps normal deterministic local-test login behavior intact', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'local-test@altil.invalid', password: 'local-test-password', mfaCode: '000000', selectedTenant: 'local-test-tenant' }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { user: { role: string; tenantId: string } }).user.role, 'TENANT_ADMIN');
  });
  it('21. apiFetch authenticates all seven tenant portal reads with the normal bearer token', async () => {
    const { apiFetch } = await import('../utils/apiFetch.ts');
    const originalFetch = globalThis.fetch;
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => key === 'altil_auth_token' ? supertestToken : null } });
    try {
      globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => originalFetch(input, init)) as typeof fetch;
      const paths = [
        '/api/v1/tenant-portal/local-test-tenant',
        '/api/v1/billing/invoices',
        '/api/v1/billing/payment-methods',
        '/api/v1/billing/schedules',
        '/api/v1/billing/payments',
        '/api/v1/billing/refunds',
        '/api/v1/currency/config',
      ];
      const responses = await Promise.all(paths.map(path => apiFetch(`${baseUrl}${path}`)));
      assert.deepEqual(responses.map(response => response.status), Array(7).fill(200));
      const portal = await responses[0].json() as { tenant: { id: string }; commercialAccess: string };
      assert.equal(portal.tenant.id, 'local-test-tenant');
      assert.equal(portal.commercialAccess, 'UNLINKED');
    } finally {
      globalThis.fetch = originalFetch;
      if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
  it('14. Stage F fixtures are deterministic and synthetic', async () => {
    const { stageFSyntheticScenarios } = await import('../commercial/stageF/syntheticData.ts');
    assert.equal(stageFSyntheticScenarios.length, 6);
    assert.ok(stageFSyntheticScenarios.every(row => row.customerName.startsWith('Synthetic Customer')));
    assert.ok(stageFSyntheticScenarios.some(row => row.mappingState === 'ambiguous'));
    assert.ok(stageFSyntheticScenarios.some(row => row.finops.measures[0]?.providerCost !== row.finops.measures[0]?.customerCharge));
  });
});
