import { isIP } from 'node:net';
import { existsSync } from 'node:fs';

const DATABASE_ENV_NAMES = [
  'DATABASE_URL',
  'MARIADB_HOST',
  'MARIADB_PORT',
  'MARIADB_USER',
  'MARIADB_PASSWORD',
  'MARIADB_DATABASE',
  'MARIADB_SSL',
  'MARIADB_SSL_CA',
];

export const ENVIRONMENT_VARIABLES = Object.freeze({
  profile: ['ALTIL_ENVIRONMENT', 'NODE_ENV'],
  database: DATABASE_ENV_NAMES,
  application: ['PORT', 'HOST', 'APP_URL', 'ALTIL_PUBLIC_URL', 'BASE_URL', 'ALTIL_BASE_URL', 'ALTIL_SERVE_BUILT_ASSETS', 'ALTIL_TRUSTED_PROXY_CIDRS'],
  authentication: ['ALTIL_MFA_ENABLED', 'ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS', 'ALTIL_ENABLE_TEST_SUPER_ADMINS', 'ALTIL_TEST_MFA_CODE', 'ALTIL_ADMIN_EMAIL', 'ALTIL_ADMIN_PASSWORD', 'ALTIL_SUPER_ADMIN_BOOTSTRAP_PASSWORD', 'ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_EMAIL', 'ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_DATABASE', 'ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_HOST', 'ALTIL_ENABLE_MIGRATIONS'],
  encryption: ['ALTIL_KNOWLEDGE_ENCRYPTION_KEY', 'ALTIL_PROVIDER_VAULT_KEY', 'ALTIL_PROVIDER_VAULT_KEY_FILE', 'ALTIL_INTERNAL_AI_API_KEY', 'ALTIL_INTERNAL_AI_KEY_FILE'],
  ai: ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'OPENROUTER_BASE_URL', 'GROQ_API_KEY', 'DEEPSEEK_API_KEY', 'MISTRAL_API_KEY', 'TOGETHER_API_KEY', 'ALTIL_API_KEY', 'ALTIL_MODEL_FLEET_STATE'],
  payments: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'ALTIL_PAYMENT_WEBHOOK_SECRET', 'PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE', 'PAYFAST_SANDBOX', 'IKHOKHA_APP_ID', 'IKHOKHA_APP_SECRET', 'IKHOKHA_API_URL', 'IKHOKHA_MODE'],
  communication: ['ALTIL_KNOWLEDGE_ENCRYPTION_KEY'],
  localTest: ['ALTIL_LOCAL_E2E', 'ALTIL_LOCAL_E2E_DATABASE', 'ALTIL_LOCAL_E2E_PORT', 'ALTIL_LOCAL_TEST_HARNESS', 'ALTIL_EVENT_ENVIRONMENT', 'ALTIL_TEST_MFA_CODE', 'ALTIL_TEST_MODEL', 'ALTIL_TEST_RUN_ID', 'ALTIL_LOCAL_LOG_FILE', 'ALTIL_TENANT_KNOWLEDGE_STATE', 'ALTIL_MODEL_FLEET_STATE', 'ALTIL_PROVIDER_ACCOUNTS_FILE', 'DISABLE_HMR'],
  background: ['ALTIL_ENABLE_BACKGROUND_JOBS', 'ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS'],
  parity: ['ALTIL_PARITY_FINGERPRINT_KEY'],
});

const present = (value) => typeof value === 'string' && value.trim() !== '';
const placeholder = (value) => {
  const text = String(value || '').trim();
  if (/^(your_[a-z0-9_]+_here|change_me|replace_me|example|placeholder|my_app_url)$/i.test(text)) return true;
  try { const hostname = new URL(text).hostname.toLowerCase(); return hostname.endsWith('.invalid') || hostname.endsWith('.example') || hostname === 'example.com'; } catch { return false; }
};

export function resolvePublicBaseUrl(env = process.env) {
  const primary = present(env.ALTIL_PUBLIC_URL) ? env.ALTIL_PUBLIC_URL.trim() : '';
  const legacy = present(env.APP_URL) ? env.APP_URL.trim() : '';
  if (primary && legacy && primary.replace(/\/$/, '') !== legacy.replace(/\/$/, '')) {
    throw new Error('ALTIL_PUBLIC_URL and APP_URL identify different public URLs; configure one consistent value.');
  }
  const value = primary || legacy;
  if (!value) return null;
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('Public application URL is invalid; set ALTIL_PUBLIC_URL to an absolute HTTP(S) URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error('Public application URL must be an absolute HTTP(S) URL without embedded credentials.');
  }
  return value.replace(/\/$/, '');
}

function parseDatabaseUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('DATABASE_URL is invalid; use a mysql:// or mariadb:// URL.'); }
  if (!['mysql:', 'mariadb:'].includes(url.protocol) || !url.hostname || !url.port || !url.username || !url.password || !url.pathname || url.pathname === '/' || url.search || url.hash) {
    throw new Error('DATABASE_URL must include scheme, host, port, username, password, and database name.');
  }
  return {
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
  };
}

export function resolveTrustedProxyCidrs(env = process.env) {
  const configured = String(env.ALTIL_TRUSTED_PROXY_CIDRS || '').trim();
  if (!configured) return [];
  const cidrs = configured.split(',').map(value => value.trim()).filter(Boolean);
  for (const cidr of cidrs) {
    const [address, prefix, ...extra] = cidr.split('/');
    const family = isIP(address);
    const prefixLength = prefix === undefined ? (family === 4 ? 32 : 128) : Number(prefix);
    if (!family || extra.length || !Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > (family === 4 ? 32 : 128)) {
      throw new Error('ALTIL_TRUSTED_PROXY_CIDRS must contain valid IP addresses or CIDRs.');
    }
    if ((family === 4 && prefixLength === 0) || (family === 6 && prefixLength === 0)) {
      throw new Error('ALTIL_TRUSTED_PROXY_CIDRS must not trust every address.');
    }
  }
  return [...new Set(cidrs)];
}

/** Resolve the only supported database configuration contract; never fall back after an invalid URL. */
export function resolveDatabaseConfig(env = process.env) {
  const isLocalE2E = env.ALTIL_LOCAL_E2E === 'true';
  const hasUrl = present(env.DATABASE_URL);
  const discreteNames = ['MARIADB_HOST', 'MARIADB_PORT', 'MARIADB_USER', 'MARIADB_PASSWORD', 'MARIADB_DATABASE'];
  const hasAnyDiscrete = discreteNames.some(name => present(env[name]));

  if (isLocalE2E && hasUrl) throw new Error('LOCAL E2E refuses DATABASE_URL; use the explicit loopback altil_e2e_test settings.');

  let database;
  if (hasUrl) {
    database = parseDatabaseUrl(env.DATABASE_URL.trim());
    if (hasAnyDiscrete) {
      if (!discreteNames.every(name => present(env[name]))) throw new Error('When DATABASE_URL and discrete MariaDB settings are both present, all discrete settings must be complete and identify the same target.');
      const discrete = {
        host: env.MARIADB_HOST.trim(), port: Number(env.MARIADB_PORT), user: env.MARIADB_USER,
        password: env.MARIADB_PASSWORD, database: env.MARIADB_DATABASE.trim(),
      };
      if (Object.keys(discrete).some(key => String(discrete[key]) !== String(database[key]))) {
        throw new Error('DATABASE_URL and discrete MariaDB settings identify different targets. Configure one target consistently.');
      }
    }
  } else {
    const missing = discreteNames.filter(name => !present(env[name]));
    if (missing.length) throw new Error(`Missing required database configuration: ${missing.join(', ')}.`);
    database = {
      host: env.MARIADB_HOST.trim(), port: Number(env.MARIADB_PORT), user: env.MARIADB_USER,
      password: env.MARIADB_PASSWORD, database: env.MARIADB_DATABASE.trim(),
    };
  }

  if (!Number.isInteger(database.port) || database.port < 1 || database.port > 65535) throw new Error('MariaDB port must be an integer from 1 through 65535.');
  if (!/^[A-Za-z0-9_$-]+$/.test(database.database)) throw new Error('MariaDB database name contains unsupported characters.');
  if (!present(env.MARIADB_SSL)) throw new Error('MARIADB_SSL must be explicitly set to true or false.');
  const sslValue = String(env.MARIADB_SSL).toLowerCase();
  if (!['true', 'false'].includes(sslValue)) throw new Error('MARIADB_SSL must be true or false.');
  if (sslValue === 'true' && present(env.MARIADB_SSL_CA) && !existsSync(env.MARIADB_SSL_CA)) throw new Error('MARIADB_SSL_CA does not point to a readable CA file.');
  if (/\s/.test(database.host)) throw new Error('MariaDB host must not contain whitespace.');

  if (isLocalE2E && (hasUrl || database.host !== '127.0.0.1' || database.database !== 'altil_e2e_test' || env.ALTIL_LOCAL_E2E_DATABASE !== 'altil_e2e_test')) {
    throw new Error('LOCAL E2E database target refused; only explicit loopback altil_e2e_test is allowed.');
  }
  return {
    ...database,
    ssl: sslValue === 'true',
    sslCaPath: sslValue === 'true' && present(env.MARIADB_SSL_CA) ? env.MARIADB_SSL_CA : undefined,
  };
}

/** Validate the explicit LOCAL E2E, development/test, and production profiles. */
export function validateRuntimeEnvironment(env = process.env) {
  const errors = [];
  const isLocalE2E = env.ALTIL_LOCAL_E2E === 'true';
  const nodeEnvironment = String(env.NODE_ENV || 'development').toLowerCase();
  const expectedProfile = isLocalE2E ? 'local-test' : nodeEnvironment === 'production' ? 'production' : 'development-test';
  if (env.ALTIL_ENVIRONMENT !== expectedProfile) errors.push(`ALTIL_ENVIRONMENT must be ${expectedProfile}.`);
  if (!['development', 'test', 'production'].includes(nodeEnvironment)) errors.push('NODE_ENV must be development, test, or production.');
  if (isLocalE2E && nodeEnvironment === 'production') errors.push('LOCAL E2E cannot run with NODE_ENV=production.');
  if (env.ALTIL_ENABLE_BACKGROUND_JOBS !== undefined && !['true', 'false'].includes(String(env.ALTIL_ENABLE_BACKGROUND_JOBS).toLowerCase())) errors.push('ALTIL_ENABLE_BACKGROUND_JOBS must be true or false.');
  if (env.ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS !== undefined && !['true', 'false'].includes(String(env.ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS).toLowerCase())) errors.push('ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS must be true or false.');
  if (env.ALTIL_SERVE_BUILT_ASSETS !== undefined && !['true', 'false'].includes(String(env.ALTIL_SERVE_BUILT_ASSETS).toLowerCase())) errors.push('ALTIL_SERVE_BUILT_ASSETS must be true or false.');
  if (env.ALTIL_MFA_ENABLED !== undefined && !['true', 'false'].includes(String(env.ALTIL_MFA_ENABLED).toLowerCase())) errors.push('ALTIL_MFA_ENABLED must be true or false.');
  if (env.ALTIL_ENABLE_TEST_SUPER_ADMINS !== undefined && !['true', 'false'].includes(String(env.ALTIL_ENABLE_TEST_SUPER_ADMINS).toLowerCase())) errors.push('ALTIL_ENABLE_TEST_SUPER_ADMINS must be true or false.');
  if (present(env.ALTIL_TEST_MFA_CODE) && !/^\d{6}$/.test(env.ALTIL_TEST_MFA_CODE)) errors.push('ALTIL_TEST_MFA_CODE must be a six-digit test code.');
  if (env.ALTIL_ENABLE_TEST_SUPER_ADMINS === 'true' && (expectedProfile !== 'development-test' || nodeEnvironment === 'production')) errors.push('Test Super Admin fixtures are available only in the development-test profile.');
  if (env.ALTIL_ENABLE_TEST_SUPER_ADMINS === 'true' && !/^\d{6}$/.test(env.ALTIL_TEST_MFA_CODE || '')) errors.push('Test Super Admin fixtures require an explicit six-digit ALTIL_TEST_MFA_CODE.');
  if (env.ALTIL_ENABLE_TEST_SUPER_ADMINS === 'true' && env.ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS === 'true') errors.push('Test Super Admin accounts use normal authentication; quick access must remain disabled.');
  if (expectedProfile === 'production' && (present(env.ALTIL_TEST_MFA_CODE) || present(env.ALTIL_ENABLE_TEST_SUPER_ADMINS))) errors.push('Test Super Admin fixture settings must not be configured in production.');
  if (env.PAYFAST_SANDBOX !== undefined && !['true', 'false'].includes(String(env.PAYFAST_SANDBOX).toLowerCase())) errors.push('PAYFAST_SANDBOX must be true or false.');
  if (present(env.PORT) && (!Number.isInteger(Number(env.PORT)) || Number(env.PORT) < 1 || Number(env.PORT) > 65535)) errors.push('PORT must be an integer from 1 through 65535.');
  if (present(env.OPENROUTER_BASE_URL)) {
    try {
      const url = new URL(env.OPENROUTER_BASE_URL);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.hostname.includes('.') || isIP(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local')) throw new Error();
    } catch { errors.push('OPENROUTER_BASE_URL must be a public HTTPS URL without credentials, query, or fragment.'); }
  }
  if (present(env.IKHOKHA_API_URL)) {
    try { if (new URL(env.IKHOKHA_API_URL).protocol !== 'https:') throw new Error(); }
    catch { errors.push('IKHOKHA_API_URL must be a valid HTTPS URL.'); }
  }
  if (!isLocalE2E && expectedProfile === 'development-test') {
    if (present(env.STRIPE_SECRET_KEY) && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) errors.push('Development/test Stripe configuration must use an sk_test_ key.');
    if (env.PAYFAST_SANDBOX !== 'true') errors.push('Development/test requires PAYFAST_SANDBOX=true, including when payment credentials are database-backed.');
    if (!['test', 'sandbox'].includes(String(env.IKHOKHA_MODE || '').toLowerCase())) errors.push('Development/test requires IKHOKHA_MODE=test or sandbox, including when credentials are database-backed.');
  }
  try { resolveDatabaseConfig(env); } catch (error) { errors.push(error instanceof Error ? error.message : 'Database configuration is invalid.'); }
  try { resolveTrustedProxyCidrs(env); } catch (error) { errors.push(error instanceof Error ? error.message : 'Trusted proxy configuration is invalid.'); }
  try { resolvePublicBaseUrl(env); } catch (error) { errors.push(error instanceof Error ? error.message : 'Public application URL is invalid.'); }
  if (isLocalE2E) {
    if (env.ALTIL_EVENT_ENVIRONMENT !== 'local-test') errors.push('ALTIL_EVENT_ENVIRONMENT must be local-test for LOCAL E2E.');
    for (const name of ['ALTIL_TEST_RUN_ID', 'ALTIL_LOCAL_LOG_FILE']) if (!present(env[name])) errors.push(`${name} is required for LOCAL E2E.`);
  }
  return { valid: errors.length === 0, errors };
}

export function configurationStatuses(env = process.env) {
  const statuses = {};
  for (const [category, names] of Object.entries(ENVIRONMENT_VARIABLES)) {
    statuses[category] = Object.fromEntries(names.map(name => {
      const value = env[name];
      const configured = present(value) && !placeholder(value);
      return [name, configured ? 'CONFIGURED' : 'NOT CONFIGURED'];
    }));
  }
  return statuses;
}

export function runtimeSideEffectPolicy(env = process.env) {
  const developmentTest = env.ALTIL_ENVIRONMENT === 'development-test';
  const localTest = env.ALTIL_ENVIRONMENT === 'local-test' || env.ALTIL_LOCAL_E2E === 'true';
  return {
    billingCollections: !localTest && (!developmentTest || env.ALTIL_ENABLE_BACKGROUND_JOBS === 'true'),
    cleanupJobs: !localTest && (!developmentTest || env.ALTIL_ENABLE_BACKGROUND_JOBS === 'true'),
    providerStartupChecks: !localTest && (!developmentTest || env.ALTIL_ENABLE_PROVIDER_STARTUP_CHECKS === 'true'),
  };
}

/** Compare the repository migration inventory with a database's applied versions. */
export function compareMigrationVersions(expectedVersions, appliedVersions) {
  const normalize = value => String(value).padStart(3, '0');
  const expected = [...new Set(expectedVersions.map(normalize))].sort();
  const applied = [...new Set(appliedVersions.map(normalize))].sort();
  const expectedSet = new Set(expected);
  const appliedSet = new Set(applied);
  const missing = expected.filter(version => !appliedSet.has(version));
  const unexpected = applied.filter(version => !expectedSet.has(version));
  return { current: missing.length === 0 && unexpected.length === 0, missing, unexpected };
}
