export type OpenAiChatMessage = Readonly<{
  role: 'system' | 'user' | 'assistant';
  content: string | readonly Readonly<{ type: 'text' | 'input_text'; text: string }>[];
}>;

export type OpenAiChatRequest = Readonly<Record<string, unknown>> & Readonly<{
  model: string;
  messages: readonly OpenAiChatMessage[];
  stream?: boolean;
}>;

export class OpenAiRequestValidationError extends Error {
  constructor(readonly param: string, message: string, readonly code = 'invalid_request_error') {
    super(message);
    this.name = 'OpenAiRequestValidationError';
  }
}

const supportedParameters = new Set([
  'temperature', 'top_p', 'max_tokens', 'max_completion_tokens', 'stop', 'frequency_penalty', 'presence_penalty',
  'seed', 'reasoning_effort', 'response_format', 'stream_options', 'service_tier', 'user',
]);

const internalParameters = new Set(['app_id', 'capability', 'knowledge', 'metadata', 'store']);

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function validateMessage(value: unknown, index: number): OpenAiChatMessage {
  const message = asObject(value);
  const param = `messages[${index}]`;
  if (!message || !['system', 'user', 'assistant'].includes(String(message.role))) {
    throw new OpenAiRequestValidationError(`${param}.role`, 'Each message must have a system, user, or assistant role.');
  }
  const role = message.role as OpenAiChatMessage['role'];
  if (typeof message.content === 'string') return Object.freeze({ role, content: message.content });
  if (!Array.isArray(message.content)) throw new OpenAiRequestValidationError(`${param}.content`, 'Message content must be text.');
  const content = message.content.map((part, partIndex) => {
    const item = asObject(part);
    if (!item || !['text', 'input_text'].includes(String(item.type)) || typeof item.text !== 'string') {
      throw new OpenAiRequestValidationError(`${param}.content[${partIndex}]`, 'Only text content parts are currently supported.');
    }
    return Object.freeze({ type: item.type as 'text' | 'input_text', text: item.text });
  });
  return Object.freeze({ role, content: Object.freeze(content) });
}

export function validateOpenAiChatRequest(value: unknown): OpenAiChatRequest {
  const body = asObject(value);
  if (!body) throw new OpenAiRequestValidationError('body', 'Request body must be a JSON object.');
  if (typeof body.model !== 'string' || !body.model.trim() || body.model.length > 200) {
    throw new OpenAiRequestValidationError('model', 'Provide a valid model ID.');
  }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 100) {
    throw new OpenAiRequestValidationError('messages', 'Provide between 1 and 100 chat messages.');
  }
  if (body.stream !== undefined && typeof body.stream !== 'boolean') throw new OpenAiRequestValidationError('stream', 'stream must be a boolean.');

  for (const [name, minimum, maximum] of [['temperature', 0, 2], ['top_p', 0, 1]] as const) {
    if (body[name] !== undefined && (typeof body[name] !== 'number' || !Number.isFinite(body[name]) || Number(body[name]) < minimum || Number(body[name]) > maximum)) {
      throw new OpenAiRequestValidationError(name, `${name} must be between ${minimum} and ${maximum}.`);
    }
  }
  for (const name of ['max_tokens', 'max_completion_tokens'] as const) {
    if (body[name] !== undefined && (!Number.isSafeInteger(body[name]) || Number(body[name]) < 1 || Number(body[name]) > 131072)) {
      throw new OpenAiRequestValidationError(name, `${name} must be a positive integer no greater than 131072.`);
    }
  }
  if (body.stop !== undefined && typeof body.stop !== 'string' && !(Array.isArray(body.stop) && body.stop.length <= 4 && body.stop.every(item => typeof item === 'string'))) {
    throw new OpenAiRequestValidationError('stop', 'stop must be a string or an array of up to four strings.');
  }
  for (const name of ['frequency_penalty', 'presence_penalty'] as const) {
    if (body[name] !== undefined && (typeof body[name] !== 'number' || !Number.isFinite(body[name]) || Number(body[name]) < -2 || Number(body[name]) > 2)) {
      throw new OpenAiRequestValidationError(name, `${name} must be between -2 and 2.`);
    }
  }
  if (body.seed !== undefined && !Number.isSafeInteger(body.seed)) throw new OpenAiRequestValidationError('seed', 'seed must be a safe integer.');
  if (body.stream_options !== undefined) {
    const options = asObject(body.stream_options);
    if (!options || Object.keys(options).some(key => key !== 'include_usage') || (options.include_usage !== undefined && typeof options.include_usage !== 'boolean')) {
      throw new OpenAiRequestValidationError('stream_options', 'stream_options currently supports only the boolean include_usage field.');
    }
  }

  for (const key of Object.keys(body)) {
    if (['model', 'messages', 'stream', ...internalParameters].includes(key)) continue;
    if (!supportedParameters.has(key)) throw new OpenAiRequestValidationError(key, `The parameter "${key}" is not supported by this ALTIL gateway route.`, 'unsupported_parameter');
  }

  return Object.freeze({ ...body, model: body.model.trim(), messages: Object.freeze(body.messages.map(validateMessage)) }) as OpenAiChatRequest;
}

/** Creates a provider request only from validated public fields and sanitized message text. */
export function toOpenRouterChatRequest(input: {
  request: OpenAiChatRequest;
  modelId: string;
  sanitizeText: (text: string) => string;
  maxOutputTokens: number;
}): Record<string, unknown> {
  const messages = input.request.messages.map(message => ({
    role: message.role,
    content: typeof message.content === 'string'
      ? input.sanitizeText(message.content)
      : message.content.map(part => ({ ...part, text: input.sanitizeText(part.text) })),
  }));
  const forwarded: Record<string, unknown> = { model: input.modelId, messages };
  for (const [key, value] of Object.entries(input.request)) {
    if (key === 'model' || key === 'messages' || internalParameters.has(key)) continue;
    if (supportedParameters.has(key)) forwarded[key] = value;
  }
  const requestedOutput = Number(forwarded.max_tokens ?? forwarded.max_completion_tokens);
  if (Number.isFinite(requestedOutput) && requestedOutput > input.maxOutputTokens) {
    if (forwarded.max_tokens !== undefined) forwarded.max_tokens = input.maxOutputTokens;
    if (forwarded.max_completion_tokens !== undefined) forwarded.max_completion_tokens = input.maxOutputTokens;
  }
  return forwarded;
}

export function openAiModelList(models: readonly { id: string; modelIdentifier: string; displayName: string; lastCatalogUpdateAt?: string; contextWindow: number; providerName?: string; providerId: string; capabilities?: readonly string[] }[], providerNames: ReadonlyMap<string, string>, createdAt = Date.now()) {
  return {
    object: 'list' as const,
    data: models.map(model => {
      const catalogDate = model.lastCatalogUpdateAt ? Date.parse(model.lastCatalogUpdateAt) : NaN;
      return {
        id: model.modelIdentifier,
        object: 'model' as const,
        created: Number.isFinite(catalogDate) ? Math.floor(catalogDate / 1000) : Math.floor(createdAt / 1000),
        owned_by: model.providerName || providerNames.get(model.providerId) || 'altil',
        name: model.displayName,
        context_length: model.contextWindow,
        ...(model.capabilities?.length ? { capabilities: [...model.capabilities] } : {}),
      };
    }),
  };
}
