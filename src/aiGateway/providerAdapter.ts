/** Provider-neutral shapes for ALTIL's public inference gateway. */
export type AIProviderCapability =
  | 'models'
  | 'chat'
  | 'streaming'
  | 'responses'
  | 'embeddings'
  | 'vision'
  | 'tools'
  | 'structured_outputs'
  | 'reasoning'
  | 'audio'
  | 'image_generation'
  | 'video_generation';

export interface NormalizedProviderModel {
  readonly id: string;
  readonly canonicalSlug: string;
  readonly name: string;
  readonly description?: string;
  readonly contextLength?: number;
  readonly inputModalities: readonly string[];
  readonly outputModalities: readonly string[];
  readonly architecture?: Readonly<Record<string, unknown>>;
  readonly tokenizer?: string;
  readonly pricing?: Readonly<Record<string, string>>;
  readonly supportedParameters: readonly string[];
  readonly providerInformation?: Readonly<Record<string, unknown>>;
  readonly capabilities: readonly AIProviderCapability[];
  readonly supportsStreaming?: boolean;
  readonly supportsTools?: boolean;
  readonly supportsVision?: boolean;
  readonly supportsEmbeddings?: boolean;
  readonly supportsReasoning?: boolean;
  readonly limits?: Readonly<Record<string, unknown>>;
  readonly upstreamMetadata: Readonly<Record<string, unknown>>;
}

export interface ProviderHealth {
  readonly providerId: string;
  readonly healthy: boolean;
  readonly checkedAt: string;
  readonly statusCode?: number;
}

export interface AIProviderAdapter {
  readonly providerId: string;
  readonly capabilities: ReadonlySet<AIProviderCapability>;
  listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]>;
  /** Returns the upstream response without buffering its body; callers own normalization and streaming. */
  chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response>;
  /** Optional because providers do not all implement these operations. */
  responses?(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response>;
  embeddings?(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response>;
  healthCheck(signal?: AbortSignal): Promise<ProviderHealth>;
}

export class ProviderRequestError extends Error {
  constructor(
    readonly providerId: string,
    readonly operation: string,
    readonly statusCode?: number,
  ) {
    super(`${providerId} ${operation} request failed${statusCode ? ` (HTTP ${statusCode})` : ''}.`);
    this.name = 'ProviderRequestError';
  }
}

export type ProviderErrorCategory =
  | 'AUTHENTICATION_FAILED'
  | 'AUTHORIZATION_FAILED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'CONTEXT_LENGTH_EXCEEDED'
  | 'PROVIDER_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CONTENT_POLICY'
  | 'UNKNOWN_PROVIDER_ERROR'
  | 'UNSUPPORTED_CAPABILITY';

export function classifyProviderError(statusCode?: number, message = ''): ProviderErrorCategory {
  const text = message.toLowerCase();
  if (statusCode === 401 || /invalid.*key|authentication|credential/.test(text)) return 'AUTHENTICATION_FAILED';
  if (statusCode === 403 || /forbidden|not authorized|permission/.test(text)) return 'AUTHORIZATION_FAILED';
  if (statusCode === 408 || /timeout|timed out/.test(text)) return 'TIMEOUT';
  if (statusCode === 409 || /context.{0,12}length|too many tokens/.test(text)) return 'CONTEXT_LENGTH_EXCEEDED';
  if (statusCode === 404 || /model.{0,12}(not found|unknown)/.test(text)) return 'MODEL_NOT_FOUND';
  if (statusCode === 413 || /invalid request|unprocessable/.test(text)) return 'INVALID_REQUEST';
  if (statusCode === 429 || /rate limit|quota|capacity/.test(text)) return /quota/.test(text) ? 'QUOTA_EXCEEDED' : 'RATE_LIMITED';
  if (statusCode !== undefined && statusCode >= 500) return 'PROVIDER_UNAVAILABLE';
  if (/network|fetch failed|socket|dns/.test(text)) return 'NETWORK_ERROR';
  if (/content policy|safety|moderation/.test(text)) return 'CONTENT_POLICY';
  return 'UNKNOWN_PROVIDER_ERROR';
}
