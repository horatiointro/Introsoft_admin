export interface TenantUsageActivity {
  readonly totalRequests: number;
  readonly totalInputTokens: number;
  readonly totalOutputTokens: number;
  readonly capabilities: Readonly<Record<string, number>>;
  readonly applications: Readonly<Record<string, number>>;
  readonly models: Readonly<Record<string, number>>;
  readonly topics?: Readonly<Record<string, number>>;
  readonly lastSeenAt?: string;
}

export interface ScopedUsageSummary {
  readonly tenantCount: number;
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly byCapability: Readonly<Record<string, number>>;
  readonly byApplication: Readonly<Record<string, number>>;
  readonly byModel: Readonly<Record<string, number>>;
  readonly lastRequestAt?: string;
}

function addCounts(target: Record<string, number>, source: Readonly<Record<string, number>>): void {
  for (const [key, count] of Object.entries(source)) {
    if (!Number.isFinite(count) || count < 0) continue;
    target[key] = (target[key] || 0) + count;
  }
}

/** Aggregate only activities whose tenant is already in the caller's resolved scope. */
export function summarizeScopedUsage(
  activities: readonly (readonly [string, TenantUsageActivity])[],
  visibleOrganizationIds: ReadonlySet<string>,
): ScopedUsageSummary | null {
  const scoped = activities.filter(([tenantId]) => visibleOrganizationIds.has(tenantId));
  if (!scoped.length) return null;

  const byCapability: Record<string, number> = {};
  const byApplication: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  let requests = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let lastRequestAt: string | undefined;

  for (const [, activity] of scoped) {
    requests += Number.isFinite(activity.totalRequests) ? Math.max(0, activity.totalRequests) : 0;
    inputTokens += Number.isFinite(activity.totalInputTokens) ? Math.max(0, activity.totalInputTokens) : 0;
    outputTokens += Number.isFinite(activity.totalOutputTokens) ? Math.max(0, activity.totalOutputTokens) : 0;
    addCounts(byCapability, activity.capabilities || {});
    addCounts(byApplication, activity.applications || {});
    addCounts(byModel, activity.models || {});
    if (activity.lastSeenAt && (!lastRequestAt || Date.parse(activity.lastSeenAt) > Date.parse(lastRequestAt))) {
      lastRequestAt = activity.lastSeenAt;
    }
  }

  return Object.freeze({
    tenantCount: scoped.length,
    requests,
    inputTokens,
    outputTokens,
    byCapability: Object.freeze(byCapability),
    byApplication: Object.freeze(byApplication),
    byModel: Object.freeze(byModel),
    ...(lastRequestAt ? { lastRequestAt } : {}),
  });
}
