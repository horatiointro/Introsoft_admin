export type MfaCodeVerifier = (userId: string, code: string) => boolean | Promise<boolean>;

export interface MfaAuthenticationState {
  userId: string;
  mfaEnabled?: boolean;
  mfaEnforced?: boolean;
  roles?: readonly string[];
}

export type MfaConfigurationSource = 'EXPLICIT' | 'SECURE_DEFAULT' | 'INVALID_SECURE_DEFAULT';

export interface MfaConfigurationStatus {
  enabled: boolean;
  source: MfaConfigurationSource;
}

/**
 * MFA is enabled by default. Each environment must explicitly configure its
 * posture; production deployments must set ALTIL_MFA_ENABLED=true.
 */
export function getMfaConfigurationStatus(
  env: Readonly<Record<string, string | undefined>> = process.env,
): MfaConfigurationStatus {
  const setting = env.ALTIL_MFA_ENABLED?.trim().toLowerCase();
  if (setting === 'true') return { enabled: true, source: 'EXPLICIT' };
  if (setting === 'false') return { enabled: false, source: 'EXPLICIT' };
  if (setting === undefined || setting === '') return { enabled: true, source: 'SECURE_DEFAULT' };
  return { enabled: true, source: 'INVALID_SECURE_DEFAULT' };
}

export function isMfaRequired(user: MfaAuthenticationState): boolean {
  return Boolean(user.mfaEnabled || user.mfaEnforced)
    || Boolean(user.roles?.some(role => role.toUpperCase() === 'SUPER_ADMIN'));
}

/**
 * IAM has an encrypted MFA credential table, but no implemented decrypt/TOTP
 * verification adapter. A verifier must be explicitly configured by secure
 * application bootstrap; otherwise MFA-required authentication fails closed.
 */
let configuredVerifier: MfaCodeVerifier | undefined;

export function configureMfaCodeVerifier(verifier: MfaCodeVerifier | undefined): void {
  configuredVerifier = verifier;
}

/** Result for explicit step-up verification, where MFA is always required. */
export async function verifyMfaCode(
  userId: string,
  code: string | undefined,
  verifier: MfaCodeVerifier | undefined = configuredVerifier,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<'VERIFIED' | 'INVALID' | 'UNAVAILABLE' | 'DISABLED'> {
  if (!getMfaConfigurationStatus(env).enabled) return 'DISABLED';
  if (!verifier) return 'UNAVAILABLE';
  if (!code || !/^\d{6}$/.test(code)) return 'INVALID';
  try {
    return await verifier(userId, code) ? 'VERIFIED' : 'INVALID';
  } catch {
    return 'INVALID';
  }
}

export async function verifyMfaRequirement(
  user: MfaAuthenticationState,
  code: string | undefined,
  verifier: MfaCodeVerifier | undefined = configuredVerifier,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<boolean> {
  if (!getMfaConfigurationStatus(env).enabled) return true;
  if (!isMfaRequired(user)) return true;
  return (await verifyMfaCode(user.userId, code, verifier, env)) === 'VERIFIED';
}
