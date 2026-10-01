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
