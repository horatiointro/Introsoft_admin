import { isIP } from 'node:net';
import type { AIProviderAdapter, AIProviderCapability, NormalizedProviderModel, ProviderHealth } from './providerAdapter.ts';
import { ProviderRequestError } from './providerAdapter.ts';

export const OPENROUTER_DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

type FetchLike = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

function normalizedBaseUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('OPENROUTER_BASE_URL must be a valid HTTPS URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('OPENROUTER_BASE_URL must use HTTPS and must not contain credentials, a query, or a fragment.');
  }
  const host = url.hostname.toLowerCase();
  if (!host.includes('.') || isIP(host) || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('OPENROUTER_BASE_URL must use a public fully qualified hostname.');
  }
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeModel(value: unknown): NormalizedProviderModel | undefined {
  const model = asRecord(value);
  const id = typeof model.id === 'string' ? model.id.trim() : '';
  if (!id) return undefined;
  const architecture = asRecord(model.architecture);
  const inputModalities = stringArray(architecture.input_modalities);
  const outputModalities = stringArray(architecture.output_modalities);
  const supportedParameters = stringArray(model.supported_parameters);
  const capabilities = new Set<AIProviderCapability>(['models', 'chat']);
  if (supportedParameters.includes('tools') || supportedParameters.includes('tool_choice')) capabilities.add('tools');
  if (supportedParameters.includes('response_format')) capabilities.add('structured_outputs');
  if (supportedParameters.some(parameter => /reason/i.test(parameter))) capabilities.add('reasoning');
  if (inputModalities.includes('image')) capabilities.add('vision');
  if (outputModalities.includes('image')) capabilities.add('image_generation');

  const contextLength = Number(model.context_length);
  const pricing = Object.fromEntries(Object.entries(asRecord(model.pricing)).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  const providerInformation = Object.fromEntries(Object.entries(model).filter(([key]) => ['top_provider', 'per_request_limits', 'canonical_slug'].includes(key)));
  const limits = Object.fromEntries(Object.entries(model).filter(([key]) => ['context_length', 'max_completion_tokens', 'per_request_limits'].includes(key)));

  return Object.freeze({
    id,
    canonicalSlug: typeof model.canonical_slug === 'string' ? model.canonical_slug : id,
    name: typeof model.name === 'string' && model.name.trim() ? model.name : id,
    ...(typeof model.description === 'string' ? { description: model.description } : {}),
    ...(Number.isSafeInteger(contextLength) && contextLength > 0 ? { contextLength } : {}),
    inputModalities: Object.freeze(inputModalities),
    outputModalities: Object.freeze(outputModalities),
    ...(Object.keys(architecture).length ? { architecture: Object.freeze({ ...architecture }) } : {}),
    ...(typeof model.tokenizer === 'string' ? { tokenizer: model.tokenizer } : {}),
    ...(Object.keys(pricing).length ? { pricing: Object.freeze(pricing) } : {}),
    supportedParameters: Object.freeze(supportedParameters),
    ...(Object.keys(providerInformation).length ? { providerInformation: Object.freeze(providerInformation) } : {}),
    capabilities: Object.freeze([...capabilities]),
    ...(Object.keys(limits).length ? { limits: Object.freeze(limits) } : {}),
    upstreamMetadata: Object.freeze({ ...model }),
  });
}

/** OpenRouter is an upstream adapter. ALTIL API credentials are never forwarded upstream. */
export class OpenRouterProviderAdapter implements AIProviderAdapter {
  readonly providerId = 'openrouter';
  readonly capabilities: ReadonlySet<AIProviderCapability> = new Set([
    'models', 'chat', 'streaming', 'responses', 'embeddings', 'vision', 'tools', 'structured_outputs', 'reasoning',
  ]);
  private readonly baseUrl: URL;

  constructor(private readonly options: {
    apiKey?: string;
    baseUrl?: string;
    fetch?: FetchLike;
    siteUrl?: string;
    appName?: string;
  } = {}) {
    this.baseUrl = normalizedBaseUrl(options.baseUrl || process.env.OPENROUTER_BASE_URL || OPENROUTER_DEFAULT_BASE_URL);
  }

  private get fetcher(): FetchLike { return this.options.fetch || fetch; }
  private get apiKey(): string { return (this.options.apiKey ?? process.env.OPENROUTER_API_KEY ?? '').trim(); }

  private endpoint(path: string): URL {
    const url = new URL(this.baseUrl.toString());
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`;
    return url;
  }

  private headers(): Headers {
    if (!this.apiKey) throw new Error('OpenRouter is not configured. Set OPENROUTER_API_KEY in secure runtime configuration.');
    const headers = new Headers({ authorization: `Bearer ${this.apiKey}`, accept: 'application/json' });
    if (this.options.siteUrl) headers.set('HTTP-Referer', this.options.siteUrl);
    if (this.options.appName) headers.set('X-Title', this.options.appName);
    return headers;
  }

  async listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]> {
    const headers = this.headers();
    let response: Response;
    try { response = await this.fetcher(this.endpoint('models'), { method: 'GET', headers, signal }); }
    catch { throw new ProviderRequestError(this.providerId, 'model catalogue'); }
    if (!response.ok) throw new ProviderRequestError(this.providerId, 'model catalogue', response.status);
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new ProviderRequestError(this.providerId, 'model catalogue'); }
    const entries = asRecord(payload).data;
    if (!Array.isArray(entries)) throw new ProviderRequestError(this.providerId, 'model catalogue');
    return Object.freeze(entries.map(normalizeModel).filter((model): model is NormalizedProviderModel => Boolean(model)));
  }

  chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    return this.post('chat/completions', request, signal);
  }

  responses(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    return this.post('responses', request, signal);
  }

  embeddings(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    return this.post('embeddings', request, signal);
  }

  private async post(path: string, request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    const headers = this.headers();
    headers.set('content-type', 'application/json');
    try {
      return await this.fetcher(this.endpoint(path), { method: 'POST', headers, body: JSON.stringify(request), signal });
    } catch {
      throw new ProviderRequestError(this.providerId, path);
    }
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    try {
      const response = await this.fetcher(this.endpoint('key'), { method: 'GET', headers: this.headers(), signal });
      return Object.freeze({ providerId: this.providerId, healthy: response.ok, checkedAt, statusCode: response.status });
    } catch {
      return Object.freeze({ providerId: this.providerId, healthy: false, checkedAt });
    }
  }
}
