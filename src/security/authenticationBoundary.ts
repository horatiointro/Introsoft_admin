export type AuthenticationEnvironment = Readonly<Record<string, string | undefined>>;

export function isProductionAuthentication(env: AuthenticationEnvironment = process.env): boolean {
  return env.NODE_ENV?.trim().toLowerCase() === 'production';
}

/**
 * Demo IAM identities are permitted only in an explicit test runtime, or in
 * development when the operator opts in. Production can never enable them.
 */
export function allowsInMemoryIamFallback(env: AuthenticationEnvironment = process.env): boolean {
  if (isProductionAuthentication(env)) return false;
  if (env.NODE_ENV?.trim().toLowerCase() === 'test') return true;
  return env.NODE_ENV?.trim().toLowerCase() === 'development'
    && env.ALTIL_ENABLE_DEMO_IAM_FALLBACK === 'true';
}

export async function resolveAuthenticationRecord<T>(input: {
  env?: AuthenticationEnvironment;
  databaseAvailable: boolean;
  databaseLookup: () => Promise<T | null>;
  memoryLookup: () => T | null;
}): Promise<T | null> {
  const allowMemory = allowsInMemoryIamFallback(input.env);
  if (!input.databaseAvailable) return allowMemory ? input.memoryLookup() : null;

  try {
    // A successful database miss is authoritative; never shadow it with a demo identity.
    return await input.databaseLookup();
  } catch {
    return allowMemory ? input.memoryLookup() : null;
  }
}

export async function resolveAuthenticationSession<T>(input: {
  env?: AuthenticationEnvironment;
  databaseAvailable: boolean;
  databaseLookup: () => Promise<T | null>;
  memoryLookup: () => T | null;
}): Promise<T | null> {
  const allowMemory = allowsInMemoryIamFallback(input.env);
  if (!input.databaseAvailable) return allowMemory ? input.memoryLookup() : null;

  try {
    const session = await input.databaseLookup();
    if (session) return session;
  } catch {
    if (!allowMemory) return null;
  }

  return allowMemory ? input.memoryLookup() : null;
}

export async function persistAuthenticationSession<T>(input: {
  env?: AuthenticationEnvironment;
  databaseAvailable: boolean;
  persist: () => Promise<void>;
  memoryPersist: () => T;
}): Promise<T | null> {
  const allowMemory = allowsInMemoryIamFallback(input.env);
  if (!input.databaseAvailable) {
    if (!allowMemory) throw new Error('Authentication session storage is unavailable.');
    return input.memoryPersist();
  }

  try {
    await input.persist();
    return null;
  } catch (error) {
    if (!allowMemory) throw new Error('Authentication session storage is unavailable.', { cause: error });
    return input.memoryPersist();
  }
}
