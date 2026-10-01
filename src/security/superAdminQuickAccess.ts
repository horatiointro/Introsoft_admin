/**
 * Super Admin quick access is a deliberately explicit deployment capability.
 * Keep ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS unset in production.
 */
export function isSuperAdminQuickAccessEnabled(
  env: { ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS?: string; NODE_ENV?: string } = process.env
): boolean {
  if (env.NODE_ENV?.trim().toLowerCase() === 'production') return false;
  return env.ALTIL_ENABLE_SUPER_ADMIN_QUICK_ACCESS === 'true';
}
