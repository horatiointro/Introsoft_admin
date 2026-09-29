import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

export type HarnessEnvironment = Readonly<Record<string, string | undefined>>;
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const PROVIDER_CREDENTIAL_NAMES = [
  'GEMINI_API_KEY','GOOGLE_API_KEY','OPENROUTER_API_KEY','OPENAI_API_KEY','GROQ_API_KEY',
  'DEEPSEEK_API_KEY','MISTRAL_API_KEY','TOGETHER_API_KEY','ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','PAYFAST_MERCHANT_ID','PAYFAST_MERCHANT_KEY',
  'PAYFAST_PASSPHRASE','IKHOKHA_API_KEY','IKHOKHA_APP_ID','IKHOKHA_APP_SECRET',
  'ALTIL_API_KEY','ALTIL_INTERNAL_AI_API_KEY','ALTIL_PAYMENT_WEBHOOK_SECRET',
  'ALTIL_PROVIDER_VAULT_KEY','ALTIL_PROVIDER_VAULT_KEY_FILE','ALTIL_KNOWLEDGE_ENCRYPTION_KEY',
  'PAYMENT_PROVIDER_SECRET',
];

/** Validates configuration without ever including a value in an error message. */
export function validateLocalHarnessEnvironment(env: HarnessEnvironment): void {
  if (env.ALTIL_LOCAL_TEST_HARNESS !== 'true') throw new Error('Set ALTIL_LOCAL_TEST_HARNESS=true to enable the isolated local harness.');
  if (env.NODE_ENV?.toLowerCase() === 'production') throw new Error('The local harness refuses NODE_ENV=production.');
  if (env.ALTIL_ENABLE_MIGRATIONS?.toLowerCase() === 'true') throw new Error('The local harness refuses migration-enabled configuration.');

  const databaseName = env.MARIADB_DATABASE ?? env.DB_NAME;
  if (databaseName?.toLowerCase() === 'altil_db') throw new Error('The local harness refuses the production database name.');
  const databaseUrl = env.DATABASE_URL;
  if (databaseUrl) {
    let parsed: URL;
    try { parsed = new URL(databaseUrl); } catch { throw new Error('The local harness refuses an unparseable database URL.'); }
    if (!LOOPBACK.has(parsed.hostname.toLowerCase())) throw new Error('The local harness refuses a non-loopback database host.');
    if (decodeURIComponent(parsed.pathname.replace(/^\//, '')).toLowerCase() === 'altil_db') throw new Error('The local harness refuses the production database name.');
  }
  const dbHost = env.MARIADB_HOST ?? env.DB_HOST ?? env.MYSQL_HOST;
  if (dbHost && !LOOPBACK.has(dbHost.toLowerCase())) throw new Error('The local harness refuses a non-loopback database host.');
  for (const name of PROVIDER_CREDENTIAL_NAMES) {
    if (env[name]?.trim()) throw new Error(`The local harness refuses configured external provider credentials (${name}).`);
  }
  for (const name of ['APP_URL','ALTIL_PUBLIC_URL','PUBLIC_URL','DEPLOYMENT_HOST','VERCEL_URL']) {
    const value = env[name]?.trim();
    if (!value) continue;
    try {
      const host = new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase();
      if (!LOOPBACK.has(host)) throw new Error(`The local harness refuses configured non-loopback deployment setting (${name}).`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('refuses configured')) throw error;
      throw new Error(`The local harness refuses an invalid deployment setting (${name}).`);
    }
  }
  if (env.ALTIL_LOCAL_TEST_HOST && env.ALTIL_LOCAL_TEST_HOST !== '127.0.0.1') throw new Error('The harness may bind only to 127.0.0.1.');
  if (env.ALTIL_LOCAL_TEST_PORT && env.ALTIL_LOCAL_TEST_PORT !== '3105') throw new Error('The local harness port is fixed at 3105.');
}

const TEST_USER = Object.freeze({ id: 'local-test-user', username: 'local-test', name: 'LOCAL TEST Operator', firstName: 'LOCAL TEST', lastName: 'Operator', email: 'local-test@altil.invalid', role: 'TENANT_ADMIN', tenant: 'local-test-tenant', tenantId: 'local-test-tenant', status: 'active', environment: 'LOCAL_TEST', label: 'LOCAL TEST ONLY' });
const TEST_CREDENTIALS = Object.freeze({ email: 'local-test@altil.invalid', password: 'local-test-password', mfaCode: '000000', selectedTenant: 'local-test-tenant' });
const SUPER_ADMIN_PERMISSIONS = Object.freeze([
  'tenant.read', 'tenant.create', 'tenant.update', 'tenant.delete',
  'user.read', 'user.create', 'user.update', 'user.disable',
  'role.read', 'role.assign', 'role.modify',
  'provider.read', 'provider.configure', 'provider.disable',
  'model.read', 'model.configure',
  'routing.read', 'routing.modify',
  'policy.read', 'policy.create', 'policy.modify', 'policy.disable',
  'incident.read', 'incident.create', 'incident.update', 'incident.close',
  'dsar.read', 'dsar.create', 'dsar.update', 'dsar.erase',
  'billing.read', 'billing.modify',
  'audit.read', 'audit.export',
  'system.migrate', 'system.configure',
  'secret.read', 'secret.rotate',
]);
type HarnessAuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  name: string;
  role: string;
  tenant: string;
  environment: 'LOCAL_TEST';
  label: 'LOCAL TEST ONLY';
};
type HarnessAuthenticatedRequest = Request & { user?: HarnessAuthenticatedUser };
const syntheticTenant = Object.freeze({ id: 'local-test-tenant', name: 'LOCAL TEST Tenant', legalName: 'LOCAL TEST Tenant', type: 'company', orgRole: 'independent', industry: 'synthetic', country: 'ZA', status: 'active', tier: 'starter', environment: 'local-test', currency: 'ZAR', monthlyBudgetUsd: 100, currentSpendUsd: 42, rateLimitRpm: 60, primaryContact: { name: 'LOCAL TEST Contact', email: 'local-test@altil.invalid' }, updatedAt: '2026-01-01T00:00:00.000Z', billingConfig: { currency: 'ZAR', displayCurrency: 'ZAR', displayLocale: 'en-ZA' }, users: [], applications: [], apiKeys: [] });
const responseData: Record<string, unknown> = {
  '/licensing/plans': [], '/licensing/tenant-licenses': [], '/providers': [], '/models': [],
  '/customers': [syntheticTenant], '/applications': [], '/api-keys': [], '/routes': [], '/policies': [], '/logs': [],
  '/compliance/config': { popia: true }, '/compliance/dsar': [], '/iam/users': [],
  '/billing/invoices': [], '/billing/payment-methods': [], '/billing/schedules': [], '/billing/payments': [],
  '/billing/refunds': [], '/billing/ledger': [], '/billing/products': [], '/billing/orders': [],
  '/billing/accounting/summary': { monthly: [], accounts: [], bookBasis: 'LOCAL TEST synthetic read-only view.' },
  '/billing/accounting/journals': [], '/billing/reconciliation': { batches: [], items: [] },
  '/currency/config': { defaultDisplayCurrency: 'ZAR', defaultLocale: 'en-ZA', supportedCurrencies: ['ZAR','USD'] },
};

function requireHarnessSession(sessions: Map<string, HarnessAuthenticatedUser>) {
  return (req: HarnessAuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const user = token ? sessions.get(token) : undefined;
    if (!user) return res.status(401).json({ error: 'LOCAL TEST session required.' });
    req.user = user;
    res.locals.user = user;
    next();
  };
}

export function createLocalTestHarness(env: HarnessEnvironment = process.env): Express {
  validateLocalHarnessEnvironment(env);
  const TEST_SUPERUSER = Object.freeze({
    id: 'local-test-supertest-user',
    name: 'LOCAL TEST SUPERTEST',
    firstName: 'LOCAL TEST',
    lastName: 'SUPERTEST',
    email: 'supertest@introsoft.co.za',
    role: 'super_admin',
    tenant: 'local-test-tenant',
    tenantId: 'local-test-tenant',
    status: 'active',
    environment: 'LOCAL_TEST',
    label: 'LOCAL TEST ONLY',
  });
  const testSuperuserMfaCode = '000000';
  const testSuperuserPasswordHash = bcrypt.hashSync('supertest', 10);
  const sessions = new Map<string, HarnessAuthenticatedUser>();
  const createSessionUser = (user: typeof TEST_USER | typeof TEST_SUPERUSER): HarnessAuthenticatedUser => ({
    ...user,
    status: 'ACTIVE',
    roles: [user.role === 'super_admin' ? 'SUPER_ADMIN' : user.role],
    permissions: user.role === 'super_admin' ? [...SUPER_ADMIN_PERMISSIONS] : [],
    sessionId: `local-test-session-${randomUUID()}`,
  });
  const requireSession = requireHarnessSession(sessions);
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', label: 'LOCAL TEST ONLY', database: false, providers: false, persistence: false }));
  app.get('/api/v1/auth/super-admin-access/availability', (_req, res) => res.json({ available: false }));
  app.post('/api/v1/auth/super-admin-access', (_req, res) => res.status(404).json({ error: 'Not available in the local test harness.' }));
  app.post('/api/v1/auth/login', (req, res) => {
    const body = req.body ?? {};
    if (body.email === TEST_SUPERUSER.email) {
      if (!bcrypt.compareSync(String(body.password ?? ''), testSuperuserPasswordHash) || body.mfaCode !== testSuperuserMfaCode || !['all', 'local-test-tenant'].includes(body.selectedTenant ?? 'all')) {
        return res.status(401).json({ message: 'LOCAL TEST credentials or scope did not match.' });
      }
      const token = `local-test-${randomUUID()}`;
      const user = createSessionUser(TEST_SUPERUSER);
      sessions.set(token, user);
      return res.json({ token, user });
    }
    if (body.email !== TEST_CREDENTIALS.email || body.password !== TEST_CREDENTIALS.password || body.mfaCode !== TEST_CREDENTIALS.mfaCode || !['all', TEST_CREDENTIALS.selectedTenant].includes(body.selectedTenant)) {
      return res.status(401).json({ message: 'LOCAL TEST credentials or scope did not match.' });
    }
    const token = `local-test-${randomUUID()}`;
    const user = createSessionUser(TEST_USER);
    sessions.set(token, user);
    return res.json({ token, user });
  });
  app.post('/api/v1/auth/logout', requireSession, (req, res) => {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
    sessions.delete(token);
    return res.json({ success: true });
  });
  app.use('/api/v1', requireSession);
  app.get('/api/v1/auth/me', (req: HarnessAuthenticatedRequest, res) => res.json({ user: req.user }));
  app.get('/api/v1/tenant-portal/:tenantId', (req, res) => {
    if (req.params.tenantId !== syntheticTenant.id) return res.status(404).json({ error: 'Synthetic tenant not available in this scope.' });
    return res.json({ tenant: syntheticTenant, license: null, applications: [], keys: [], activity: [], usage: { requests: 0, inputTokens: 0, outputTokens: 0, meteredSpendUsd: 0, daily: [] }, paymentHistory: [], lastUpdatedAt: '2026-01-01T00:00:00.000Z', commercialAccess: 'UNLINKED' });
  });
  app.get('/api/v1/customers/:tenantId/invoice-preview', (req, res) => req.params.tenantId === syntheticTenant.id ? res.json({ lines: [], total: 0, currency: 'ZAR', label: 'LOCAL TEST ONLY' }) : res.status(404).json({ error: 'Synthetic tenant not available in this scope.' }));
  app.all('/api/v1/*', (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'Writes are disabled in the LOCAL TEST harness.' });
    const path = req.path;
    if (path.startsWith('/api/v1/tenant-portal/')) return res.status(404).json({ error: 'Synthetic tenant not available in this scope.' });
    const data = responseData[path.replace('/api/v1', '')];
    return data === undefined ? res.status(404).json({ error: 'Route is not exposed by the LOCAL TEST harness.' }) : res.json(data);
  });
  return app;
}

if (process.argv[1] && /server\.local-test\.(ts|js)$/.test(process.argv[1])) {
  const app = createLocalTestHarness();
  app.listen(3105, '127.0.0.1', () => console.log('ALTIL LOCAL TEST HARNESS — NO DATABASE / NO PROVIDERS / NO PERSISTENCE — http://127.0.0.1:3105'));
}
