import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderAdapter } from './providerAdapters';
import type { AIProvider, ProviderType } from '../types';

/**
 * These are opt-in live checks. They never substitute fixtures or mock fetch:
 * without an explicit flag and a configured credential the test is skipped.
 */
const providers: Array<{ type: ProviderType; env: string; endpoint: string }> = [
  { type: 'openai', env: 'OPENAI_API_KEY', endpoint: 'https://api.openai.com/v1' },
  { type: 'openrouter', env: 'OPENROUTER_API_KEY', endpoint: 'https://openrouter.ai/api/v1' },
  { type: 'groq', env: 'GROQ_API_KEY', endpoint: 'https://api.groq.com/openai/v1' },
  { type: 'deepseek', env: 'DEEPSEEK_API_KEY', endpoint: 'https://api.deepseek.com/v1' },
  { type: 'mistral', env: 'MISTRAL_API_KEY', endpoint: 'https://api.mistral.ai/v1' },
  { type: 'together', env: 'TOGETHER_API_KEY', endpoint: 'https://api.together.xyz/v1' },
  { type: 'gemini', env: 'GEMINI_API_KEY', endpoint: 'https://generativelanguage.googleapis.com' },
];

for (const configuration of providers) {
  test(`live ${configuration.type} catalogue and inference`, async (t) => {
    if (process.env.ALTIL_LIVE_PROVIDER_TESTS !== 'true') return t.skip('Set ALTIL_LIVE_PROVIDER_TESTS=true to permit a real provider call.');
    const apiKey = process.env[configuration.env]?.trim();
    if (!apiKey || /placeholder|example|your_/i.test(apiKey)) return t.skip('No live credential configured for this provider.');
    const provider: Pick<AIProvider, 'id' | 'type' | 'endpoint'> = { id: `live-test-${configuration.type}`, type: configuration.type, endpoint: configuration.endpoint };
    const adapter = createProviderAdapter(provider, apiKey);
    const catalogue = await adapter.listModels(AbortSignal.timeout(30000));
    assert.ok(catalogue.length > 0, 'provider returned no live models');
    const candidate = catalogue.find(model => model.capabilities.includes('chat')) || catalogue[0];
    const response = await adapter.chatCompletions({ model: candidate.id, messages: [{ role: 'user', content: 'Reply with OK.' }], max_tokens: 8, temperature: 0, stream: false }, AbortSignal.timeout(30000));
    assert.equal(response.ok, true);
  });
}
