// Manual integration test. This calls only the configured ALTIL API; it never contacts OpenRouter directly.
const output = value => process.stdout.write(`${value}\n`);

if (!process.env.OPENROUTER_API_KEY) {
  output('SKIPPED — OPENROUTER_API_KEY not configured');
  process.exit(0);
}

const baseValue = process.env.ALTIL_BASE_URL;
const apiKey = process.env.ALTIL_API_KEY;
if (!baseValue || !apiKey) {
  output('SKIPPED — configure ALTIL_BASE_URL and ALTIL_API_KEY for the external gateway client.');
  process.exit(0);
}

const base = new URL(baseValue);
if (/openrouter\.ai$/i.test(base.hostname)) throw new Error('ALTIL_BASE_URL must point to ALTIL, never directly to OpenRouter.');
const apiBase = base.toString().replace(/\/$/, '');
const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
const timeout = AbortSignal.timeout(90000);

const getUsage = async () => {
  const response = await fetch(`${apiBase}/gateway/usage`, { headers, signal: timeout });
  if (!response.ok) throw new Error(`ALTIL usage read failed with HTTP ${response.status}.`);
  return response.json();
};

const usageBefore = await getUsage();

const modelsResponse = await fetch(`${apiBase}/models`, { headers, signal: timeout });
if (!modelsResponse.ok) throw new Error(`ALTIL model listing failed with HTTP ${modelsResponse.status}.`);
const modelList = await modelsResponse.json();
const model = process.env.ALTIL_TEST_MODEL || modelList?.data?.[0]?.id;
if (!model || !modelList?.data?.some(item => item.id === model)) throw new Error('ALTIL_TEST_MODEL must match a model returned by ALTIL GET /models.');
output(`Model listing: PASS (${modelList.data.length} routeable model(s))`);

const normalResponse = await fetch(`${apiBase}/chat/completions`, {
  method: 'POST', headers, signal: timeout,
  body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with the words: ALTIL gateway works.' }], max_tokens: 48 }),
});
if (!normalResponse.ok) throw new Error(`ALTIL non-streaming chat failed with HTTP ${normalResponse.status}.`);
const normalPayload = await normalResponse.json();
const normalText = normalPayload?.choices?.[0]?.message?.content;
if (typeof normalText !== 'string' || !normalText.trim()) throw new Error('ALTIL returned no non-streaming assistant response.');
output(`Non-streaming chat: PASS · request ${normalPayload?.altil?.request_id || normalResponse.headers.get('x-request-id') || 'unreported'}`);
output(`Usage: ${normalPayload?.altil?.usage_reported ? 'provider-reported' : 'ALTIL estimated/unavailable upstream'}`);

const streamStarted = performance.now();
const streamResponse = await fetch(`${apiBase}/chat/completions`, {
  method: 'POST', headers, signal: timeout,
  body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Explain ALTIL briefly.' }], max_tokens: 100, stream: true }),
});
if (!streamResponse.ok || !streamResponse.body) throw new Error(`ALTIL streaming chat failed with HTTP ${streamResponse.status}.`);
const reader = streamResponse.body.getReader();
const decoder = new TextDecoder();
let pending = '';
let firstContentMs;
let gotDone = false;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  pending += decoder.decode(value, { stream: true });
  const lines = pending.split(/\r?\n/); pending = lines.pop() || '';
  for (const line of lines) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (data === '[DONE]') { gotDone = true; continue; }
    try {
      const event = JSON.parse(data);
      if (typeof event?.choices?.[0]?.delta?.content === 'string' && firstContentMs === undefined) firstContentMs = Math.round(performance.now() - streamStarted);
    } catch { /* Other SSE event data is not interpreted by this client check. */ }
  }
}
if (firstContentMs === undefined) throw new Error('ALTIL streaming response contained no assistant text chunks.');
if (!gotDone && pending.trim() !== 'data: [DONE]') throw new Error('ALTIL stream ended without the OpenAI-compatible [DONE] event.');
output(`Streaming chat: PASS · first content arrived at ${firstContentMs} ms · [DONE] received`);

const usageAfter = await getUsage();
if (Number(usageAfter?.requests || 0) < Number(usageBefore?.requests || 0) + 2) throw new Error('ALTIL usage counters did not reflect both successful chat requests.');
output(`ALTIL usage record: PASS · request count advanced by ${Number(usageAfter.requests) - Number(usageBefore.requests)}`);
output('Audit: verify the two request IDs in the existing ALTIL audit/log view; this script does not claim access to privileged audit details.');
