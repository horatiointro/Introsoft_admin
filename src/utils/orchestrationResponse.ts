import type { AuditLogStatus, OrchestrationResponse } from '../types.ts';

export interface NormalizedOrchestrationResult {
  readonly response: OrchestrationResponse;
  readonly completed: boolean;
}

function messageFrom(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
  return undefined;
}

/** Normalizes only response evidence. Missing runtime measurements stay unavailable. */
export function normalizeOrchestrationResponse(input: {
  readonly payload: unknown;
  readonly httpOk: boolean;
  readonly attemptedAt?: string;
}): NormalizedOrchestrationResult {
  const data = input.payload && typeof input.payload === 'object' ? input.payload as Record<string, unknown> : {};
  const isErrorStatus = data.status === 'ERROR' || data.status === 'POLICY_BLOCKED' || data.status === 'RATE_LIMITED';
  const completed = input.httpOk && data.success !== false && !data.error && !isErrorStatus;
  const totalTokens = data.totalTokens && typeof data.totalTokens === 'object' ? data.totalTokens as Record<string, unknown> : null;
  const tokens = typeof data.tokensConsumed === 'number'
    ? data.tokensConsumed
    : totalTokens && typeof totalTokens.input === 'number' && typeof totalTokens.output === 'number'
      ? totalTokens.input + totalTokens.output
      : null;
  const duration = typeof data.durationSeconds === 'number' ? data.durationSeconds : null;
  const metricsAvailable = completed && duration !== null && Number.isFinite(duration) && tokens !== null && Number.isFinite(tokens);
  const rawStatus = data.status;
  const allowedStatuses: readonly AuditLogStatus[] = ['SUCCESS', 'FALLBACK_SUCCESS', 'POLICY_BLOCKED', 'ERROR', 'RATE_LIMITED'];
  const status: AuditLogStatus = completed
    ? typeof rawStatus === 'string' && allowedStatuses.includes(rawStatus as AuditLogStatus) ? rawStatus as AuditLogStatus : 'SUCCESS'
    : 'ERROR';
  const executionError = messageFrom(data.error) || messageFrom(data.message) || (input.httpOk ? 'The orchestration request did not complete.' : 'The orchestration request failed.');
  const requestId = typeof data.requestId === 'string' ? data.requestId : typeof data.id === 'string' ? data.id : 'UNAVAILABLE';

  return {
    completed,
    response: {
      id: requestId,
      status,
      capability: typeof data.capability === 'string' ? data.capability : 'UNAVAILABLE',
      executedModel: completed ? (typeof data.executedModel === 'string' ? data.executedModel : typeof data.selectedModel === 'string' ? data.selectedModel : 'UNAVAILABLE') : 'UNAVAILABLE',
      executedProvider: completed ? (typeof data.executedProvider === 'string' ? data.executedProvider : typeof data.selectedProvider === 'string' ? data.selectedProvider : 'UNAVAILABLE') : 'UNAVAILABLE',
      durationSeconds: metricsAvailable ? duration! : 0,
      tokensConsumed: metricsAvailable ? tokens! : 0,
      metricsAvailable,
      output: completed
        ? (typeof data.output === 'string' ? data.output : typeof data.response === 'string' ? data.response : 'The request completed without an output payload.')
        : executionError,
      timestamp: typeof data.timestamp === 'string' ? data.timestamp : input.attemptedAt || new Date().toISOString(),
      fallbackTriggered: completed && data.fallbackTriggered === true,
      policyPassed: completed && typeof data.policyPassed === 'boolean' ? data.policyPassed : undefined,
      piiScrubbed: completed && data.piiScrubbed === true,
    },
  };
}
