import assert from 'node:assert/strict';
import test from 'node:test';
import { OpenRouterProviderAdapter } from './openRouterProvider.ts';
import { ProviderRequestError } from './providerAdapter.ts';

const testKey = 'synthetic-not-a-secret';

test('OpenRouter adapter normalizes model metadata without losing upstream metadata', async () => {
  let requestedUrl = '';
  const adapter = new OpenRouterProviderAdapter({ apiKey: testKey, fetch: async input => {
    requestedUrl = String(input);
    return Response.json({ data: [{ id: 'openai/example-model', canonical_slug: 'openai/example-model-v2', name: 'Example', context_length: 8192, tokenizer: 'cl100k_base', architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] }, pricing: { prompt: '0.1', completion: '0.2' }, supported_parameters: ['tools', 'response_format'], top_provider: { context_length: 8192 } }] });
  } });

  const [model] = await adapter.listModels();
  assert.match(requestedUrl, /^https:\/\/openrouter\.ai\/api\/v1\/models$/);
  assert.equal(model.id, 'openai/example-model');
  assert.equal(model.canonicalSlug, 'openai/example-model-v2');
  assert.equal(model.contextLength, 8192);
  assert.deepEqual(model.inputModalities, ['text', 'image']);
  assert.ok(model.capabilities.includes('vision'));
  assert.ok(model.capabilities.includes('tools'));
  assert.equal(model.upstreamMetadata.id, 'openai/example-model');
});

test('OpenRouter chat adapter forwards the OpenAI request and returns the streaming response untouched', async () => {
  let requestBody = '';
  let authorization = '';
  const source = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode('data: first\n\n')); controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); controller.close(); } });
  const adapter = new OpenRouterProviderAdapter({ apiKey: testKey, fetch: async (input, init) => {
    assert.match(String(input), /\/chat\/completions$/);
    authorization = new Headers(init?.headers).get('authorization') || '';
    requestBody = String(init?.body || '');
    return new Response(source, { status: 200, headers: { 'content-type': 'text/event-stream' } });
  } });
  const request = { model: 'openai/example-model', messages: [{ role: 'user', content: 'hello' }], stream: true, temperature: 0.4, tools: [{ type: 'function' }] };
  const response = await adapter.chatCompletions(request);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  assert.ok(response.body, 'adapter must preserve the upstream stream body');
  assert.equal(authorization, `Bearer ${testKey}`);
  assert.deepEqual(JSON.parse(requestBody), request);
  const reader = response.body!.getReader();
  assert.equal(new TextDecoder().decode((await reader.read()).value), 'data: first\n\n');
  assert.equal(new TextDecoder().decode((await reader.read()).value), 'data: [DONE]\n\n');
  assert.equal((await reader.read()).done, true);
});

test('OpenRouter adapter refuses missing credentials before any network request', async () => {
  let called = false;
  const adapter = new OpenRouterProviderAdapter({ apiKey: '', fetch: async () => { called = true; return Response.json({}); } });
  await assert.rejects(() => adapter.listModels(), /Set OPENROUTER_API_KEY in secure runtime configuration/);
  assert.equal(called, false);
});

test('OpenRouter adapter rejects unsafe configured base URLs', () => {
  assert.throws(() => new OpenRouterProviderAdapter({ apiKey: testKey, baseUrl: 'http://example.com/api/v1' }), /must use HTTPS/);
  assert.throws(() => new OpenRouterProviderAdapter({ apiKey: testKey, baseUrl: 'https://user:password@example.com/api/v1' }), /must use HTTPS/);
  assert.throws(() => new OpenRouterProviderAdapter({ apiKey: testKey, baseUrl: 'https://localhost/api/v1' }), /public fully qualified hostname/);
  assert.throws(() => new OpenRouterProviderAdapter({ apiKey: testKey, baseUrl: 'https://127.0.0.1/api/v1' }), /public fully qualified hostname/);
});

test('OpenRouter catalogue errors never include upstream response bodies', async () => {
  const adapter = new OpenRouterProviderAdapter({ apiKey: testKey, fetch: async () => new Response('sensitive upstream detail', { status: 401 }) });
  await assert.rejects(() => adapter.listModels(), (error: unknown) => {
    assert.ok(error instanceof ProviderRequestError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message.includes('sensitive upstream detail'), false);
    return true;
  });
});
