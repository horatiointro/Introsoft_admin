import React, { useEffect, useMemo, useState } from 'react';
import { Copy, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import type { ApiKey, Application } from '../types';

type GatewayModel = { id: string; name?: string; owned_by?: string; context_length?: number; capabilities?: string[] };
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function publicApiBase(): string {
  const base = new URL(import.meta.env.BASE_URL, window.location.origin);
  return new URL('api/v1/', base).toString().replace(/\/$/, '');
}

function responseMessage(payload: any): string {
  return String(payload?.error?.message || payload?.error || payload?.message || 'Request failed.');
}

export const ApiPlayground: React.FC<{ applications: Application[]; apiKeys: ApiKey[] }> = ({ applications, apiKeys }) => {
  const [applicationId, setApplicationId] = useState(applications[0]?.id || '');
  const [keyId, setKeyId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<GatewayModel[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [model, setModel] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'user', content: 'Explain what ALTIL is.' }]);
  const [temperature, setTemperature] = useState(0.2);
  const [topP, setTopP] = useState(1);
  const [maxTokens, setMaxTokens] = useState(512);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [rawSse, setRawSse] = useState('');
  const [requestJson, setRequestJson] = useState('');
  const [requestId, setRequestId] = useState('');
  const [usage, setUsage] = useState<any>(null);
  const [usageEstimated, setUsageEstimated] = useState(false);
  const [provider, setProvider] = useState('');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [firstTokenMs, setFirstTokenMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const apiBase = useMemo(publicApiBase, []);
  const selectedKeys = apiKeys.filter(key => key.appId === applicationId && key.status === 'active');
  const selectedKey = apiKeys.find(key => key.id === keyId);

  useEffect(() => {
    setKeyId(selectedKeys[0]?.id || '');
  // Keep the metadata selection aligned when the application changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, apiKeys]);

  const loadModels = async () => {
    setError(''); setModels([]); setModelsLoaded(false);
    if (!apiKey.trim()) { setError('Enter the selected application’s ALTIL API key first.'); return; }
    try {
      const response = await fetch(`${apiBase}/models`, { headers: { Authorization: `Bearer ${apiKey.trim()}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(`HTTP ${response.status} · ${responseMessage(payload)}`);
      const list = Array.isArray(payload?.data) ? payload.data as GatewayModel[] : [];
      setModels(list); setModelsLoaded(true); setModel(current => list.some(item => item.id === current) ? current : list[0]?.id || '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the ALTIL model list.'); }
  };

  const setMessage = (index: number, value: Partial<ChatMessage>) => setMessages(current => current.map((item, i) => i === index ? { ...item, ...value } : item));

  const send = async () => {
    if (!apiKey.trim() || !model || !messages.some(message => message.content.trim())) return;
    const request = { model, messages, temperature, top_p: topP, max_tokens: maxTokens, stream: streaming, app_id: applicationId };
    setRequestJson(JSON.stringify(request, null, 2)); setBusy(true); setStatus(null); setError(''); setAnswer(''); setRawResponse(''); setRawSse(''); setUsage(null); setUsageEstimated(false); setProvider(''); setRequestId(''); setFirstTokenMs(null);
    const started = performance.now();
    try {
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST', headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(request),
      });
      setStatus(response.status);
      const correlationId = response.headers.get('x-request-id') || response.headers.get('x-altil-request-id') || '';
      setRequestId(correlationId);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})); setRawResponse(JSON.stringify(payload, null, 2));
        throw new Error(`HTTP ${response.status} · ${responseMessage(payload)}`);
      }
      if (streaming) {
        if (!response.body) throw new Error('HTTP 502 · Streaming response body was unavailable.');
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = ''; let accumulated = ''; let raw = ''; let firstTokenRecorded = false;
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          const chunk = decoder.decode(value, { stream: true }); raw += chunk; setRawSse(raw); pending += chunk;
          const lines = pending.split(/\r?\n/); pending = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim(); if (!data || data === '[DONE]') continue;
            try {
              const event = JSON.parse(data); const delta = event?.choices?.[0]?.delta?.content;
              if (typeof delta === 'string' && delta) { if (!firstTokenRecorded) { firstTokenRecorded = true; setFirstTokenMs(Math.round(performance.now() - started)); } accumulated += delta; setAnswer(accumulated); }
              if (event?.usage) { setUsage(event.usage); setUsageEstimated(false); }
              if (event?.id && !correlationId) setRequestId(event.id);
            } catch { /* Non-JSON SSE events are retained in Raw SSE for diagnosis. */ }
          }
        }
        const tail = pending.trim();
        if (tail.startsWith('data:') && tail.slice(5).trim() !== '[DONE]') {
          try { const event = JSON.parse(tail.slice(5).trim()); const delta = event?.choices?.[0]?.delta?.content; if (typeof delta === 'string') { if (!firstTokenRecorded) { firstTokenRecorded = true; setFirstTokenMs(Math.round(performance.now() - started)); } accumulated += delta; setAnswer(accumulated); } if (event?.usage) { setUsage(event.usage); setUsageEstimated(false); } } catch { /* Keep raw data visible. */ }
        }
        setRawResponse('Streaming response · see Raw SSE for exact events.');
      } else {
        const payload = await response.json(); setRawResponse(JSON.stringify(payload, null, 2));
        setAnswer(String(payload?.choices?.[0]?.message?.content || ''));
        setRequestId(String(payload?.altil?.request_id || correlationId)); setUsage(payload?.usage || null); setUsageEstimated(payload?.altil?.usage_estimated === true); setProvider(String(payload?.altil?.provider || ''));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The ALTIL request failed.'); }
    finally { setLatencyMs(Math.round(performance.now() - started)); setBusy(false); }
  };

  const baseRequest = { model: model || 'MODEL_ID', messages, temperature, top_p: topP, max_tokens: maxTokens };
  const codeRequest = JSON.stringify(baseRequest, null, 2);
  const curlExample = `curl '${apiBase}/chat/completions' \\
  -H 'Authorization: Bearer $ALTIL_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(baseRequest).replaceAll("'", "'\\''")}'`;
  const jsExample = `import OpenAI from "openai";\n\nconst client = new OpenAI({ apiKey: process.env.ALTIL_API_KEY, baseURL: "${apiBase}" });\n\nconst response = await client.chat.completions.create(${codeRequest});\nconsole.log(response.choices[0].message.content);`;
  const streamJsExample = `const stream = await client.chat.completions.create(${JSON.stringify({ ...baseRequest, stream: true }, null, 2)});\n\nfor await (const chunk of stream) {\n  process.stdout.write(chunk.choices?.[0]?.delta?.content || "");\n}`;

  const copyCurl = async () => { await navigator.clipboard.writeText(curlExample); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };

  return <section className="space-y-5 text-sm">
    <header className="rounded-xl border border-[#262626] bg-[#141414] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Developer Platform · API Playground</p><h2 className="mt-2 text-xl font-bold text-white">Test the public ALTIL gateway</h2><p className="mt-1 text-xs text-slate-400">Requests use the same public API, key scope, tenant, policy and orchestration path as an external client.</p></div><div className="rounded border border-[#333] bg-[#090909] px-3 py-2 font-mono text-xs text-slate-200">ALTIL API · {apiBase}</div></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[
        ['Authentication', modelsLoaded ? 'API key accepted' : 'Not tested'],
        ['Tenant / application', modelsLoaded ? 'Scope resolved' : 'Pending key check'],
        ['Model', model ? 'Available in registry' : 'Select a model'],
        ['Provider', models.find(item => item.id === model)?.owned_by || 'Not selected'],
      ].map(([label, value]) => <div key={label} className="rounded border border-[#292929] bg-[#090909] px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-xs text-slate-200">{value}</div></div>)}</div>
    </header>

    <div className="grid gap-5 xl:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-[#262626] bg-[#141414] p-4">
        <div><h3 className="font-semibold text-white">Connection & authentication</h3><p className="mt-1 text-xs text-slate-400">The secret is held only in this page’s memory and sent only to this ALTIL origin.</p></div>
        <label className="block text-xs text-slate-300">Application<select value={applicationId} onChange={event => { setApplicationId(event.target.value); setKeyId(''); setApiKey(''); setModels([]); setModel(''); setModelsLoaded(false); }} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-3 py-2 text-white">{applications.map(app => <option key={app.id} value={app.id}>{app.name} · {app.status}</option>)}</select></label>
        <label className="block text-xs text-slate-300">Existing API key metadata<select value={keyId} onChange={event => { setKeyId(event.target.value); setApiKey(''); }} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-3 py-2 text-white"><option value="">Select key metadata</option>{selectedKeys.map(key => <option key={key.id} value={key.id}>{key.name} · {key.prefix}</option>)}</select></label>
        <label className="block text-xs text-slate-300">API key<input type="password" autoComplete="off" value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder={selectedKey ? `Enter secret for ${selectedKey.prefix}` : 'Paste an existing ALTIL API key'} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-3 py-2 font-mono text-white" /></label>
        <button onClick={loadModels} disabled={!apiKey.trim()} className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Load models from GET /api/v1/models</button>
        <label className="block text-xs text-slate-300">Available model<select value={model} onChange={event => setModel(event.target.value)} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-3 py-2 text-white"><option value="">Load and select a model</option>{models.map(item => <option key={item.id} value={item.id}>{item.id}{item.name ? ` · ${item.name}` : ''}{item.owned_by ? ` · ${item.owned_by}` : ''}{item.capabilities?.length ? ` · ${item.capabilities.join(', ')}` : ''}</option>)}</select></label>

        <div><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-white">Messages</h3><button onClick={() => setMessages(items => [...items, { role: 'user', content: '' }])} className="flex items-center gap-1 text-xs text-blue-300"><Plus size={14}/> Add message</button></div><div className="space-y-2">{messages.map((message, index) => <div key={index} className="flex gap-2"><select value={message.role} onChange={event => setMessage(index, { role: event.target.value as ChatMessage['role'] })} className="rounded border border-[#333] bg-[#090909] px-2 text-xs text-white"><option>system</option><option>user</option><option>assistant</option></select><textarea value={message.content} onChange={event => setMessage(index, { content: event.target.value })} rows={2} className="min-w-0 flex-1 rounded border border-[#333] bg-[#090909] p-2 text-xs text-white"/><button aria-label="Remove message" disabled={messages.length === 1} onClick={() => setMessages(items => items.filter((_, i) => i !== index))} className="text-slate-500 disabled:opacity-30"><Trash2 size={15}/></button></div>)}</div></div>

        <div className="grid grid-cols-3 gap-3"><label className="text-xs text-slate-400">Temperature<input type="number" min="0" max="2" step="0.1" value={temperature} onChange={event => setTemperature(Number(event.target.value))} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-2 py-2 text-white"/></label><label className="text-xs text-slate-400">Top P<input type="number" min="0" max="1" step="0.05" value={topP} onChange={event => setTopP(Number(event.target.value))} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-2 py-2 text-white"/></label><label className="text-xs text-slate-400">Max tokens<input type="number" min="1" max="131072" value={maxTokens} onChange={event => setMaxTokens(Number(event.target.value))} className="mt-1 w-full rounded border border-[#333] bg-[#090909] px-2 py-2 text-white"/></label></div>
        <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={streaming} onChange={event => setStreaming(event.target.checked)}/> Stream response (SSE)</label>
        <button onClick={send} disabled={busy || !apiKey.trim() || !model || !messages.some(item => item.content.trim())} className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{busy && <LoaderCircle size={15} className="animate-spin"/>}{busy ? 'Waiting for ALTIL…' : 'Send Request'}</button>
      </div>

      <div className="space-y-4 rounded-xl border border-[#262626] bg-[#141414] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-white">Response</h3><div className="flex gap-2 font-mono text-[11px] text-slate-300"><span>HTTP {status ?? '—'}</span><span>{latencyMs === null ? '—' : `${latencyMs} ms`}</span><span>{streaming ? 'SSE' : 'JSON'}</span></div></div>
        {error && <div className="rounded border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200">Request failed · {error}{requestId && <div className="mt-1 font-mono">Request ID: {requestId}</div>}</div>}
        <div className="min-h-40 whitespace-pre-wrap rounded border border-[#262626] bg-[#090909] p-3 text-sm text-white">{answer || (!error && !busy ? 'Your assistant response will appear here.' : '')}{busy && streaming && <span className="animate-pulse">▍</span>}</div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400"><div>Model <span className="text-white">{model || '—'}</span></div><div>Provider <span className="text-white">{provider || models.find(item => item.id === model)?.owned_by || '—'}</span></div><div>Request ID <span className="font-mono text-white">{requestId || '—'}</span></div><div>First token <span className="text-white">{firstTokenMs === null ? '—' : `${firstTokenMs} ms`}</span></div></div>
        {usage && <div className="rounded border border-[#262626] p-2 text-xs text-slate-300">Usage{usageEstimated ? ' · ALTIL estimate (provider usage unavailable)' : ''} · input {usage.prompt_tokens ?? usage.input_tokens ?? '—'} · output {usage.completion_tokens ?? usage.output_tokens ?? '—'} · total {usage.total_tokens ?? '—'}</div>}
        <details><summary className="cursor-pointer text-xs text-slate-300">Request JSON</summary><pre className="mt-2 max-h-52 overflow-auto rounded bg-[#090909] p-3 text-[11px] text-slate-300">{requestJson || JSON.stringify({ ...baseRequest, stream: streaming, app_id: applicationId }, null, 2)}</pre></details>
        <details><summary className="cursor-pointer text-xs text-slate-300">Response JSON</summary><pre className="mt-2 max-h-52 overflow-auto rounded bg-[#090909] p-3 text-[11px] text-slate-300">{rawResponse || 'No response yet.'}</pre></details>
        {streaming && <details><summary className="cursor-pointer text-xs text-slate-300">Raw SSE</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded bg-[#090909] p-3 text-[11px] text-slate-300">{rawSse || 'No SSE events yet.'}</pre></details>}
        <button onClick={copyCurl} className="flex items-center gap-2 rounded border border-[#333] px-3 py-2 text-xs text-slate-200"><Copy size={14}/>{copied ? 'Copied cURL' : 'Copy cURL'}</button>
      </div>
    </div>
    <details className="rounded-xl border border-[#262626] bg-[#141414] p-4"><summary className="cursor-pointer font-semibold text-white">Client examples</summary><div className="grid gap-4 pt-4 lg:grid-cols-2"><div><button onClick={async () => { await navigator.clipboard.writeText(jsExample); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }} className="mb-2 text-xs text-blue-300">{copied ? 'Copied' : 'Copy JavaScript example'}</button><pre className="overflow-auto rounded bg-[#090909] p-3 text-[11px] text-slate-300">{jsExample}</pre></div><div><button onClick={async () => { await navigator.clipboard.writeText(streamJsExample); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }} className="mb-2 text-xs text-blue-300">Copy streaming example</button><pre className="overflow-auto rounded bg-[#090909] p-3 text-[11px] text-slate-300">{streamJsExample}</pre></div></div></details>
  </section>;
};
