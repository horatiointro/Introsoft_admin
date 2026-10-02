export type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  sslCaPath?: string;
};
export const ENVIRONMENT_VARIABLES: Readonly<Record<string, readonly string[]>>;
export function resolveDatabaseConfig(env?: NodeJS.ProcessEnv): DatabaseConfig;
export function resolveTrustedProxyCidrs(env?: NodeJS.ProcessEnv): string[];
export function resolvePublicBaseUrl(env?: NodeJS.ProcessEnv): string | null;
export function validateRuntimeEnvironment(env?: NodeJS.ProcessEnv): { valid: boolean; errors: string[] };
export function configurationStatuses(env?: NodeJS.ProcessEnv): Record<string, Record<string, 'CONFIGURED' | 'NOT CONFIGURED'>>;
export function runtimeSideEffectPolicy(env?: NodeJS.ProcessEnv): { billingCollections: boolean; cleanupJobs: boolean; providerStartupChecks: boolean };
export function compareMigrationVersions(expectedVersions: Array<string | number>, appliedVersions: Array<string | number>): { current: boolean; missing: string[]; unexpected: string[] };
