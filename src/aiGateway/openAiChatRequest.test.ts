import assert from 'node:assert/strict';
import test from 'node:test';
import { openAiModelList, OpenAiRequestValidationError, toOpenRouterChatRequest, validateOpenAiChatRequest } from './openAiChatRequest.ts';
import { relaySseStream } from './streaming.ts';

test('chat validation preserves roles and required compatible fields while rejecting provider routing overrides', () => {
  const request = validateOpenAiChatRequest({ model: 'provider-model', messages: [{ role: 'system', content: 'Policy' }, { role: 'user', content: 'Hello' }], stream: true, temperature: 0.2, top_p: 0.8, max_tokens: 250, stop: ['END'], app_id: 'app-a' });
  assert.equal(request.model, 'provider-model');
  assert.deepEqual(request.messages.map(message => message.role), ['system', 'user']);
  assert.equal(request.max_tokens, 250);
  assert.throws(() => validateOpenAiChatRequest({ model: 'm', messages: [{ role: 'user', content: 'x' }], provider: { order: ['untrusted'] } }), (error: unknown) => error instanceof OpenAiRequestValidationError && error.param === 'provider');
  assert.throws(() => validateOpenAiChatRequest({ model: 'm', messages: [{ role: 'user', content: 'x' }], apiKey: 'must-not-be-accepted-in-body' }), (error: unknown) => error instanceof OpenAiRequestValidationError && error.param === 'apiKey');
  assert.throws(() => validateOpenAiChatRequest({ model: 'm', messages: [{ role: 'user', content: 'x' }], temperature: 5 }), /temperature must be between/);
  assert.throws(() => validateOpenAiChatRequest({ model: 'm', messages: [{ role: 'user', content: 'x' }], stream_options: { include_usage: 'yes' } }), /stream_options currently supports/);
  assert.throws(() => validateOpenAiChatRequest({ model: 'm', messages: [{ role: 'user', content: 'x' }], frequency_penalty: 3 }), /frequency_penalty must be between/);
});

test('chat validation accepts bounded image modalities and keeps them separate from text sanitization', () => {
  const request = validateOpenAiChatRequest({ model: 'vision-model', messages: [{ role: 'user', content: [{ type: 'text', text: 'Describe this.' }, { type: 'image_url', image_url: { url: 'https://example.invalid/image.png', detail: 'low' } }, { type: 'input_image', image_url: 'data:image/png;base64,AAAA' }] }] });
  assert.equal(Array.isArray(request.messages[0].content), true);
  assert.equal((request.messages[0].content as readonly any[])[1].type, 'image_url');
  assert.throws(() => validateOpenAiChatRequest({ model: 'm', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: '' } }] }] }), /image_url requires/);
});

test('upstream request keeps compatible parameters and message roles, sanitizes text, and clamps output to model limits', () => {
  const request = validateOpenAiChatRequest({ model: 'requested', messages: [{ role: 'system', content: 'system data' }, { role: 'user', content: [{ type: 'text', text: 'private text' }] }], stream: false, temperature: 0.4, top_p: 0.9, max_tokens: 900, stop: 'END', app_id: 'internal-app' });
  const upstream = toOpenRouterChatRequest({ request, modelId: 'selected-model', maxOutputTokens: 128, sanitizeText: text => text.replace('private', '[masked]') });
  assert.equal(upstream.model, 'selected-model');
  assert.deepEqual(upstream.messages, [{ role: 'system', content: 'system data' }, { role: 'user', content: [{ type: 'text', text: '[masked] text' }] }]);
  assert.equal(upstream.temperature, 0.4);
  assert.equal(upstream.top_p, 0.9);
  assert.equal(upstream.max_tokens, 128);
  assert.equal(upstream.stop, 'END');
  assert.equal('app_id' in upstream, false);
  assert.equal('metadata' in upstream, false, 'ALTIL metadata must not be forwarded upstream');
});

test('OpenAI model list is normalized from the supplied ALTIL registry rows', () => {
  const payload = openAiModelList([{ id: 'm1', modelIdentifier: 'openrouter/model-one', displayName: 'Model One', contextWindow: 4096, providerId: 'p1' }], new Map([['p1', 'OpenRouter']]), 100000);
  assert.deepEqual(payload.data[0], { id: 'openrouter/model-one', object: 'model', created: 100, owned_by: 'OpenRouter', name: 'Model One', context_length: 4096 });
});

test('SSE relay writes chunks incrementally and extracts upstream usage without buffering the stream', async () => {
  const encoder = new TextEncoder();
  let releaseSecond!: () => void;
  const second = new Promise<void>(resolve => { releaseSecond = resolve; });
  const source = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"first"}}]}\n\n')); },
    async pull(controller) { await second; controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":" second"}}],"usage":{"prompt_tokens":3,"completion_tokens":2,"total_tokens":5}}\n\ndata: [DONE]\n\n')); controller.close(); },
  });
  const chunks: string[] = [];
  let releaseWrite!: () => void;
  const firstWrite = new Promise<void>(resolve => { releaseWrite = resolve; });
  let writerStarted!: () => void;
  const started = new Promise<void>(resolve => { writerStarted = resolve; });
  let writes = 0;
  const relay = relaySseStream({ body: source, write: async chunk => {
    chunks.push(new TextDecoder().decode(chunk));
    if (++writes === 1) { writerStarted(); await firstWrite; }
  }, now: () => 123 });
  await started;
  assert.equal(chunks.length, 1, 'first chunk must reach the downstream writer before upstream completion');
  releaseWrite();
  releaseSecond();
  const result = await relay;
  assert.equal(result.inputTokens, 3);
  assert.equal(result.outputTokens, 2);
  assert.equal(result.totalTokens, 5);
  assert.equal(result.usageReported, true);
  assert.equal(result.outputPreview, 'first second');
  assert.equal(result.firstTokenAt, 123);
  assert.equal(result.completed, true);
});
