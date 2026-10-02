import { timingSafeEqual } from 'node:crypto';

export const TEST_SUPER_ADMIN_IDENTITIES = Object.freeze([
  Object.freeze({ id: 'test-super-admin-001', email: 'supertest001@introsoft.co.za' }),
  Object.freeze({ id: 'test-super-admin-002', email: 'supertest002@introsoft.co.za' }),
]);

/**
 * A deterministic second-factor fixture for the two named test admins only.
 * It is deliberately unavailable outside the explicit development-test profile.
 */
export function verifyTestSuperAdminMfa(userId, code, env = process.env) {
  if (env.NODE_ENV === 'production' || env.ALTIL_ENVIRONMENT !== 'development-test') return false;
  if (env.ALTIL_ENABLE_TEST_SUPER_ADMINS !== 'true') return false;
  if (!TEST_SUPER_ADMIN_IDENTITIES.some(identity => identity.id === userId)) return false;
  const expected = env.ALTIL_TEST_MFA_CODE;
  if (typeof code !== 'string' || typeof expected !== 'string' || !/^\d{6}$/.test(expected) || !/^\d{6}$/.test(code)) return false;
  return timingSafeEqual(Buffer.from(code, 'ascii'), Buffer.from(expected, 'ascii'));
}

export function isTestSuperAdminMfaConfigured(env = process.env) {
  if (env.NODE_ENV === 'production' || env.ALTIL_ENVIRONMENT !== 'development-test') return false;
  return env.ALTIL_ENABLE_TEST_SUPER_ADMINS === 'true' && /^\d{6}$/.test(env.ALTIL_TEST_MFA_CODE || '');
}
