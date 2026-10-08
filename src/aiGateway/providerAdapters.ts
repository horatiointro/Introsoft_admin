import type { AIProvider, ProviderType } from '../types.ts';
import type { AIProviderAdapter, AIProviderCapability, NormalizedProviderModel, ProviderHealth } from './providerAdapter.ts';
import { ProviderRequestError } from './providerAdapter.ts';

type FetchLike = (input: URL | RequestInfo, init?: RequestInit) => Promise<Response>;

export type NormalizedProviderResponse = {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  id?: string;
  finishReason?: string;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function textFromContent(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!Array.isArray(value)) return '';
  return value.map(part => typeof part === 'string' ? part : typeof record(part).text === 'string' ? String(record(part).text) : '').join('').trim();
}

/** Converts native provider response envelopes into the gateway's common text/usage shape. */
export function normalizeProviderResponse(providerType: ProviderType, payload: unknown): NormalizedProviderResponse {
  const body = record(payload);
  if (providerType === 'anthropic') {
    const content = textFromContent(body.content);
    const usage = record(body.usage);
    return {
      text: content,
      inputTokens: Number(usage.input_tokens) || undefined,
      outputTokens: Number(usage.output_tokens) || undefined,
      totalTokens: (Number(usage.input_tokens) || 0) + (Number(usage.output_tokens) || 0) || undefined,
      id: typeof body.id === 'string' ? body.id : undefined,
      finishReason: typeof body.stop_reason === 'string' ? body.stop_reason : undefined,
    };
  }
  if (providerType === 'gemini') {
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const candidate = record(candidates[0]);
    const content = record(candidate.content);
    const parts = Array.isArray(content.parts) ? content.parts : [];
    const text = parts.map(part => typeof record(part).text === 'string' ? String(record(part).text) : '').join('').trim();
    const usage = record(body.usageMetadata);
    return { text, inputTokens: Number(usage.promptTokenCount) || undefined, outputTokens: Number(usage.candidatesTokenCount) || undefined, totalTokens: Number(usage.totalTokenCount) || undefined, finishReason: typeof candidate.finishReason === 'string' ? candidate.finishReason : undefined };
  }
  if (providerType === 'ollama') {
    const message = record(body.message);
    const text = textFromContent(message.content) || (typeof body.response === 'string' ? body.response.trim() : '');
    const inputTokens = Number(body.prompt_eval_count) || undefined;
    const outputTokens = Number(body.eval_count) || undefined;
    return { text, inputTokens, outputTokens, totalTokens: inputTokens || outputTokens ? (inputTokens || 0) + (outputTokens || 0) : undefined, finishReason: body.done_reason === 'stop' ? 'stop' : undefined };
  }
  const choices = Array.isArray(body.choices) ? body.choices : [];
  const choice = record(choices[0]);
  const message = record(choice.message);
  const text = textFromContent(message.content) || textFromContent(choice.text) || (typeof body.output_text === 'string' ? body.output_text.trim() : '') || (typeof body.response === 'string' ? body.response.trim() : '');
  const usage = record(body.usage);
  const inputTokens = Number(usage.prompt_tokens ?? usage.input_tokens) || undefined;
  const outputTokens = Number(usage.completion_tokens ?? usage.output_tokens) || undefined;
  return { text, inputTokens, outputTokens, totalTokens: Number(usage.total_tokens) || (inputTokens || outputTokens ? (inputTokens || 0) + (outputTokens || 0) : undefined), id: typeof body.id === 'string' ? body.id : undefined, finishReason: typeof choice.finish_reason === 'string' ? choice.finish_reason : undefined };
}

function normalizeBase(endpoint: string): URL {
  const url = new URL(endpoint);
  url.pathname = url.pathname.replace(/\/(chat\/completions|messages|models|generate|api\/tags|api\/chat)\/?$/, '').replace(/\/$/, '');
  return url;
}

function url(base: URL, suffix: string): URL {
  const result = new URL(base.toString());
  result.pathname = `${result.pathname.replace(/\/$/, '')}/${suffix.replace(/^\//, '')}`;
  return result;
}

function providerCapabilities(type: ProviderType): ReadonlySet<AIProviderCapability> {
  if (type === 'anthropic') return new Set(['models', 'chat', 'streaming', 'vision', 'tools', 'structured_outputs', 'reasoning']);
  if (type === 'gemini') return new Set(['models', 'chat', 'streaming', 'vision', 'tools', 'structured_outputs', 'reasoning']);
  if (type === 'ollama') return new Set(['models', 'chat', 'streaming', 'vision', 'tools', 'structured_outputs', 'embeddings']);
  return new Set(['models', 'chat', 'streaming', 'responses', 'embeddings', 'vision', 'tools', 'structured_outputs', 'reasoning']);
}

abstract class BaseAdapter implements AIProviderAdapter {
  abstract readonly providerId: string;
  readonly capabilities: ReadonlySet<AIProviderCapability>;
  protected readonly base: URL;
  protected readonly fetcher: FetchLike;

  constructor(protected readonly provider: Pick<AIProvider, 'id' | 'type' | 'endpoint' | 'customHeaders'>, protected readonly apiKey: string, fetcher?: FetchLike) {
    this.base = normalizeBase(provider.endpoint);
    this.fetcher = fetcher || fetch;
    this.capabilities = providerCapabilities(provider.type);
  }

  protected headers(extra: Record<string, string> = {}): Headers {
    const headers = new Headers({ accept: 'application/json', ...this.provider.customHeaders, ...extra });
    return headers;
  }

  protected async json(response: Response, operation: string): Promise<Record<string, unknown>> {
    if (!response.ok) throw new ProviderRequestError(this.provider.id, operation, response.status);
    try { return record(await response.json()); } catch { throw new ProviderRequestError(this.provider.id, operation); }
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    try { const response = await this.fetcher(url(this.base, this.provider.type === 'ollama' ? 'api/tags' : 'models'), { headers: this.headers(this.authHeaders()), signal }); return { providerId: this.provider.id, healthy: response.ok, checkedAt, statusCode: response.status }; }
    catch { return { providerId: this.provider.id, healthy: false, checkedAt }; }
  }

  protected authHeaders(): Record<string, string> { return this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}; }
  abstract listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]>;
  abstract chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response>;
}

class OpenAiCompatibleAdapter extends BaseAdapter {
  readonly providerId = this.provider.id;
  async listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]> {
    const response = await this.fetcher(url(this.base, 'models'), { headers: this.headers(this.authHeaders()), signal });
    const payload = await this.json(response, 'model catalogue');
    const entries = Array.isArray(payload.data) ? payload.data : [];
    return entries.map(item => normalizeModel(item, this.provider)).filter((item): item is NormalizedProviderModel => Boolean(item));
  }
  chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    return this.fetcher(url(this.base, 'chat/completions'), { method: 'POST', headers: this.headers({ ...this.authHeaders(), 'content-type': 'application/json' }), body: JSON.stringify(request), signal });
  }
}

class AnthropicAdapter extends BaseAdapter {
  readonly providerId = this.provider.id;
  protected authHeaders(): Record<string, string> { return this.apiKey ? { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' } : { 'anthropic-version': '2023-06-01' }; }
  async listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]> {
    const response = await this.fetcher(url(this.base, 'models'), { headers: this.headers(this.authHeaders()), signal });
    const payload = await this.json(response, 'model catalogue');
    return (Array.isArray(payload.data) ? payload.data : []).map(item => normalizeModel(item, this.provider)).filter((item): item is NormalizedProviderModel => Boolean(item));
  }
  chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    const messages = Array.isArray(request.messages) ? request.messages : [];
    const system = messages.filter(item => record(item).role === 'system').map(item => record(item).content).join('\n');
    const body = {
      model: request.model,
      max_tokens: Number(request.max_tokens ?? request.max_completion_tokens ?? 1024),
      messages: messages.filter(item => record(item).role !== 'system').map(item => ({ role: record(item).role, content: record(item).content })),
      ...(system ? { system } : {}),
      ...(request.stream !== undefined ? { stream: request.stream } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    };
    return this.fetcher(url(this.base, 'messages'), { method: 'POST', headers: this.headers({ ...this.authHeaders(), 'content-type': 'application/json' }), body: JSON.stringify(body), signal });
  }
}

class GeminiAdapter extends BaseAdapter {
  readonly providerId = this.provider.id;
  private readonly apiBase: URL;
  constructor(provider: Pick<AIProvider, 'id' | 'type' | 'endpoint' | 'customHeaders'>, apiKey: string, fetcher?: FetchLike) { super(provider, apiKey, fetcher); this.apiBase = new URL(this.base.toString()); this.apiBase.pathname = this.apiBase.pathname.replace(/\/v1beta\/?$/, ''); }
  protected authHeaders(): Record<string, string> { return this.apiKey ? { 'x-goog-api-key': this.apiKey } : {}; }
  async listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]> {
    const response = await this.fetcher(url(this.apiBase, 'v1beta/models'), { headers: this.headers(this.authHeaders()), signal });
    const payload = await this.json(response, 'model catalogue');
    return (Array.isArray(payload.models) ? payload.models : []).filter(item => strings(record(item).supportedGenerationMethods).includes('generateContent')).map(item => normalizeModel({ ...record(item), id: String(record(item).name || '').replace(/^models\//, ''), name: record(item).displayName || record(item).name }, this.provider)).filter((item): item is NormalizedProviderModel => Boolean(item));
  }
  chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    const messages = Array.isArray(request.messages) ? request.messages : [];
    const contents = messages.filter(item => record(item).role !== 'system').map(item => ({ role: record(item).role === 'assistant' ? 'model' : 'user', parts: [{ text: textFromContent(record(item).content) }] }));
    const system = messages.find(item => record(item).role === 'system');
    const body = { contents, ...(system ? { systemInstruction: { parts: [{ text: textFromContent(record(system).content) }] } } : {}), generationConfig: { ...(request.temperature !== undefined ? { temperature: request.temperature } : {}), ...(request.max_tokens !== undefined ? { maxOutputTokens: request.max_tokens } : {}) } };
    const target = url(this.apiBase, `v1beta/models/${encodeURIComponent(String(request.model || ''))}:generateContent`);
    return this.fetcher(target, { method: 'POST', headers: this.headers({ 'content-type': 'application/json', ...this.authHeaders() }), body: JSON.stringify(body), signal });
  }
}

class OllamaAdapter extends BaseAdapter {
  readonly providerId = this.provider.id;
  async listModels(signal?: AbortSignal): Promise<readonly NormalizedProviderModel[]> {
    const response = await this.fetcher(url(this.base, 'api/tags'), { headers: this.headers(), signal });
    const payload = await this.json(response, 'model catalogue');
    return (Array.isArray(payload.models) ? payload.models : []).map(item => normalizeModel({ ...record(item), id: record(item).name }, this.provider)).filter((item): item is NormalizedProviderModel => Boolean(item));
  }
  chatCompletions(request: Readonly<Record<string, unknown>>, signal?: AbortSignal): Promise<Response> {
    const messages = Array.isArray(request.messages) ? request.messages : [];
    return this.fetcher(url(this.base, 'api/chat'), { method: 'POST', headers: this.headers({ 'content-type': 'application/json' }), body: JSON.stringify({ model: request.model, messages, stream: request.stream === true }), signal });
  }
}

function normalizeModel(value: unknown, provider: Pick<AIProvider, 'id' | 'type'>): NormalizedProviderModel | undefined {
  const item = record(value); const id = typeof item.id === 'string' ? item.id.trim() : ''; if (!id) return undefined;
  const architecture = record(item.architecture); const inputModalities = strings(architecture.input_modalities).length ? strings(architecture.input_modalities) : ['text'];
  const outputModalities = strings(architecture.output_modalities).length ? strings(architecture.output_modalities) : ['text'];
  const supportedParameters = strings(item.supported_parameters);
  const capabilities = new Set<AIProviderCapability>(['models', 'chat']); if (supportedParameters.includes('tools')) capabilities.add('tools'); if (inputModalities.includes('image')) capabilities.add('vision'); if (supportedParameters.some(p => /reason/i.test(p))) capabilities.add('reasoning');
  const contextLength = Number(item.context_length || item.contextWindow || item.inputTokenLimit);
  return { id, canonicalSlug: typeof item.canonical_slug === 'string' ? item.canonical_slug : id, name: typeof item.name === 'string' ? item.name : typeof item.displayName === 'string' ? item.displayName : id, ...(typeof item.description === 'string' ? { description: item.description } : {}), ...(Number.isSafeInteger(contextLength) && contextLength > 0 ? { contextLength } : {}), inputModalities, outputModalities, architecture, supportedParameters, capabilities: [...capabilities], upstreamMetadata: { ...item, providerId: provider.id, providerType: provider.type } };
}

export function createProviderAdapter(provider: Pick<AIProvider, 'id' | 'type' | 'endpoint' | 'customHeaders'>, apiKey = '', fetcher?: FetchLike): AIProviderAdapter {
  if (provider.type === 'anthropic') return new AnthropicAdapter(provider, apiKey, fetcher);
  if (provider.type === 'gemini') return new GeminiAdapter(provider, apiKey, fetcher);
  if (provider.type === 'ollama') return new OllamaAdapter(provider, apiKey, fetcher);
  return new OpenAiCompatibleAdapter(provider, apiKey, fetcher);
}
