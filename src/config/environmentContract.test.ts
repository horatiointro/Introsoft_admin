import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMigrationVersions, configurationStatuses, resolveDatabaseConfig, resolvePublicBaseUrl, resolveTrustedProxyCidrs, runtimeSideEffectPolicy, validateRuntimeEnvironment } from './environmentContract.mjs';

function validEnvironment(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    ALTIL_ENVIRONMENT: 'development-test', NODE_ENV: 'development',
    MARIADB_HOST: '127.0.0.1', MARIADB_PORT: '3306', MARIADB_USER: 'altil_user',
    MARIADB_PASSWORD: 'synthetic-test-password', MARIADB_DATABASE: 'altil_dev_test', MARIADB_SSL: 'false',
    PAYFAST_SANDBOX: 'true', IKHOKHA_MODE: 'test',
    ...overrides,
  };
}

test('validates an explicit development-test profile and complete discrete database target', () => {
  const env = validEnvironment();
  assert.deepEqual(validateRuntimeEnvironment(env), { valid: true, errors: [] });
  assert.deepEqual(resolveDatabaseConfig(env), {
    host: '127.0.0.1', port: 3306, user: 'altil_user', password: 'synthetic-test-password',
    database: 'altil_dev_test', ssl: false, sslCaPath: undefined,
  });
});

test('rejects missing profile and missing required database settings without printing values', () => {
  const result = validateRuntimeEnvironment({ NODE_ENV: 'development' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('ALTIL_ENVIRONMENT')));
  assert.ok(result.errors.some(error => error.includes('MARIADB_PASSWORD')));
  assert.equal(JSON.stringify(result).includes('synthetic-test-password'), false);
});

test('rejects an invalid DATABASE_URL instead of silently falling back to discrete settings', () => {
  assert.throws(() => resolveDatabaseConfig(validEnvironment({ DATABASE_URL: 'not-a-url' })), /DATABASE_URL is invalid/);
});

test('rejects differing DATABASE_URL and discrete database credentials/target', () => {
  assert.throws(
    () => resolveDatabaseConfig(validEnvironment({ DATABASE_URL: 'mysql://altil_user:synthetic-test-password@127.0.0.1:3306/other_database' })),
    /identify different targets/,
  );
});

test('accepts one complete DATABASE_URL when discrete database settings are absent', () => {
  const env = { DATABASE_URL: 'mysql://test_user:test_password@db.example.invalid:3307/altil_dev_test', MARIADB_SSL: 'false' };
  assert.deepEqual(resolveDatabaseConfig(env), {
    host: 'db.example.invalid', port: 3307, user: 'test_user', password: 'test_password',
    database: 'altil_dev_test', ssl: false, sslCaPath: undefined,
  });
});

test('LOCAL E2E refuses any target outside its exact disposable loopback allowlist', () => {
  const env = validEnvironment({
    ALTIL_ENVIRONMENT: 'local-test', ALTIL_LOCAL_E2E: 'true', ALTIL_LOCAL_E2E_DATABASE: 'altil_e2e_test',
    MARIADB_DATABASE: 'altil_e2e_test', ALTIL_EVENT_ENVIRONMENT: 'local-test', ALTIL_TEST_RUN_ID: 'synthetic-run',
    ALTIL_LOCAL_LOG_FILE: '.altil-data/logs/test.ndjson',
  });
  assert.equal(validateRuntimeEnvironment(env).valid, true);
  assert.throws(() => resolveDatabaseConfig({ ...env, MARIADB_HOST: 'db.example.invalid' }), /only explicit loopback altil_e2e_test is allowed/);
  assert.throws(() => resolveDatabaseConfig({ ...env, DATABASE_URL: 'mysql://test:test@127.0.0.1:3306/altil_e2e_test' }), /LOCAL E2E refuses DATABASE_URL/);
});

test('reports only configured status and recognizes obvious placeholders', () => {
  const status = configurationStatuses({ OPENROUTER_API_KEY: 'your_openrouter_api_key_here', MARIADB_PASSWORD: 'synthetic-test-password' });
  assert.equal(status.ai.OPENROUTER_API_KEY, 'NOT CONFIGURED');
  assert.equal(status.database.MARIADB_PASSWORD, 'CONFIGURED');
  assert.equal(JSON.stringify(status).includes('synthetic-test-password'), false);
});

test('rejects conflicting public URLs and never embeds credentials in URL configuration', () => {
  assert.throws(() => resolvePublicBaseUrl({ APP_URL: 'https://pc.example.invalid', ALTIL_PUBLIC_URL: 'https://server.example.invalid' }), /identify different public URLs/);
  assert.throws(() => resolvePublicBaseUrl({ ALTIL_PUBLIC_URL: 'https://user:password@example.invalid' }), /without embedded credentials/);
  assert.equal(resolvePublicBaseUrl({ ALTIL_PUBLIC_URL: 'https://dev-test.example.invalid' }), 'https://dev-test.example.invalid');
});

test('requires sandbox-mode payment configuration in the development-test profile', () => {
  const env = validEnvironment({ PAYFAST_SANDBOX: 'true', IKHOKHA_MODE: 'test', STRIPE_SECRET_KEY: 'sk_live_synthetic-test-only' });
  assert.ok(validateRuntimeEnvironment(env).errors.some(error => error.includes('sk_test_')));
  const payFastEnv = validEnvironment({ PAYFAST_MERCHANT_ID: 'synthetic-id', PAYFAST_SANDBOX: 'false' });
  assert.ok(validateRuntimeEnvironment(payFastEnv).errors.some(error => error.includes('PAYFAST_SANDBOX=true')));
  const testStripe = validEnvironment({ STRIPE_SECRET_KEY: 'sk_test_synthetic-only', PAYFAST_SANDBOX: 'true', IKHOKHA_MODE: 'test' });
  assert.equal(validateRuntimeEnvironment(testStripe).valid, true);
});

test('accepts a deliberate production profile and does not apply development payment sandbox requirements', () => {
  const production = validEnvironment({ ALTIL_ENVIRONMENT: 'production', NODE_ENV: 'production' });
  delete production.PAYFAST_SANDBOX;
  delete production.IKHOKHA_MODE;
  assert.deepEqual(validateRuntimeEnvironment(production), { valid: true, errors: [] });
  assert.ok(validateRuntimeEnvironment(validEnvironment({ NODE_ENV: 'production' })).errors.some(error => error.includes('ALTIL_ENVIRONMENT must be production')));
  assert.ok(validateRuntimeEnvironment(validEnvironment({ ALTIL_ENVIRONMENT: 'production' })).errors.some(error => error.includes('ALTIL_ENVIRONMENT must be development-test')));
  assert.ok(validateRuntimeEnvironment(validEnvironment({ ALTIL_ENVIRONMENT: 'local-test', ALTIL_LOCAL_E2E: 'true', NODE_ENV: 'production' })).errors.some(error => error.includes('LOCAL E2E cannot run')));
});

test('test Super Admin MFA is restricted to the development-test profile and cannot coexist with quick access', () => {
  const testAdmin = validEnvironment({ ALTIL_ENABLE_TEST_SUPER_ADMINS: 'true', ALTIL_TEST_MFA_CODE: '000000' });
  assert.equal(validateRuntimeEnvironment(testAdmin).valid, true);
  assert.ok(validateRuntimeEnvironment(validEnvironment({ NODE_ENV: 'production', ALTIL_ENVIRONMENT: 'production', ALTIL_ENABLE_TEST_SUPER_ADMINS: 'true', ALTIL_TEST_MFA_CODE: '000000' })).errors.some(error => error.includes('Test Super Admin')));
  assert.ok(validateRuntimeEnvironment(validEnvironment({ ALTIL_ENABLE_TEST_SUPER_ADMINS: 'true' })).errors.some(error => error.includes('six-digit ALTIL_TEST_MFA_CODE')));
  assert.ok(validateRuntimeEnvironment(validEnvironment({ ALTIL_ENABLE_TEST_SUPER_ADMINS: 'true', ALTIL_TEST_MFA_CODE: '000000', ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS: 'true' })).errors.some(error => error.includes('quick access must remain disabled')));
});

test('trusted proxy configuration accepts explicit IPs/CIDRs and rejects invalid or trust-all entries', () => {
  assert.deepEqual(resolveTrustedProxyCidrs({ ALTIL_TRUSTED_PROXY_CIDRS: '127.0.0.1, 10.20.0.0/16,::1' }), ['127.0.0.1', '10.20.0.0/16', '::1']);
  assert.deepEqual(resolveTrustedProxyCidrs({}), []);
  assert.throws(() => resolveTrustedProxyCidrs({ ALTIL_TRUSTED_PROXY_CIDRS: 'not-an-ip' }), /valid IP addresses or CIDRs/);
  assert.throws(() => resolveTrustedProxyCidrs({ ALTIL_TRUSTED_PROXY_CIDRS: '0.0.0.0/0' }), /must not trust every address/);
});

test('validates environment URL, port, MFA and provider endpoint formats without echoing values', () => {
  const result = validateRuntimeEnvironment(validEnvironment({
    OPENROUTER_BASE_URL: 'http://localhost:4000', IKHOKHA_API_URL: 'http://payment.example.invalid',
    PORT: '70000', ALTIL_MFA_ENABLED: 'sometimes', ALTIL_SERVE_BUILT_ASSETS: 'sometimes',
  }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('OPENROUTER_BASE_URL')));
  assert.ok(result.errors.some(error => error.includes('IKHOKHA_API_URL')));
  assert.ok(result.errors.some(error => error.includes('PORT')));
  assert.ok(result.errors.some(error => error.includes('ALTIL_MFA_ENABLED')));
  assert.ok(result.errors.some(error => error.includes('ALTIL_SERVE_BUILT_ASSETS')));
  assert.equal(JSON.stringify(result).includes('localhost'), false);
});

test('development-test background billing, cleanup and provider checks are opt-in; local-test always disables them', () => {
  assert.deepEqual(runtimeSideEffectPolicy(validEnvironment()), { billingCollections: false, cleanupJobs: false, providerStartupChecks: false });
  assert.deepEqual(runtimeSideEffectPolicy(validEnvironment({ ALTIL_ENABLE_BACKGROUND_JOBS: 'true', ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS: 'true' })), { billingCollections: true, cleanupJobs: true, providerStartupChecks: true });
  assert.deepEqual(runtimeSideEffectPolicy({ ALTIL_ENVIRONMENT: 'local-test', ALTIL_ENABLE_BACKGROUND_JOBS: 'true', ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS: 'true' }), { billingCollections: false, cleanupJobs: false, providerStartupChecks: false });
});

test('migration comparison detects missing and unexpected versions and normalizes numeric versions', () => {
  assert.deepEqual(compareMigrationVersions(['1', '002', '003'], ['001', '2']), {
    current: false, missing: ['003'], unexpected: [],
  });
  assert.deepEqual(compareMigrationVersions(['001', '002'], ['001', '003']), {
    current: false, missing: ['002'], unexpected: ['003'],
  });
  assert.deepEqual(compareMigrationVersions(['1', '002'], ['001', '2']), {
    current: true, missing: [], unexpected: [],
  });
});
