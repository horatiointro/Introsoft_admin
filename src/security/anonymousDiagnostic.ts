const ALLOWED_CODES = new Set(['CLIENT_RUNTIME_ERROR', 'UNHANDLED_REJECTION', 'UI_RENDER_ERROR']);
const COMPONENT_PATTERN = /^[A-Za-z][A-Za-z0-9_. -]{0,79}$/;

export interface AnonymousDiagnostic {
  readonly code: 'CLIENT_RUNTIME_ERROR' | 'UNHANDLED_REJECTION' | 'UI_RENDER_ERROR';
  readonly component?: string;
}

/** Accept a tiny, non-sensitive diagnostic vocabulary; never accept free-form messages or paths. */
export function parseAnonymousDiagnostic(input: unknown): AnonymousDiagnostic | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(key => key !== 'code' && key !== 'component')) return null;
  if (typeof body.code !== 'string' || !ALLOWED_CODES.has(body.code)) return null;
  if (body.component !== undefined && (typeof body.component !== 'string' || !COMPONENT_PATTERN.test(body.component))) return null;
  return Object.freeze({ code: body.code as AnonymousDiagnostic['code'], ...(body.component ? { component: body.component as string } : {}) });
}

/** Per-process anonymous endpoint limiter, bounded against attacker-controlled source-address cardinality. */
export function createAnonymousDiagnosticRateLimiter(options: { maxRequests?: number; windowMs?: number; maxClients?: number } = {}) {
  const maxRequests = options.maxRequests ?? 10;
  const windowMs = options.windowMs ?? 60_000;
  const maxClients = options.maxClients ?? 5_000;
  const requests = new Map<string, number[]>();
  return (clientKey: string, now = Date.now()): boolean => {
    for (const [key, times] of requests) {
      const recent = times.filter(time => now - time < windowMs);
      if (!recent.length) requests.delete(key);
      else requests.set(key, recent);
    }
    const key = clientKey.slice(0, 128) || 'unknown';
    const recent = requests.get(key) || [];
    if (recent.length >= maxRequests) return false;
    if (!requests.has(key) && requests.size >= maxClients) return false;
    recent.push(now);
    requests.set(key, recent);
    return true;
  };
}
