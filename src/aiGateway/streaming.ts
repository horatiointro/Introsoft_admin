export interface StreamRelayResult {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
  readonly usageReported: boolean;
  readonly outputCharacters: number;
  readonly outputPreview: string;
  readonly firstTokenAt?: number;
  readonly completed: boolean;
}

function positiveUsage(value: unknown): number | undefined {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : undefined;
}

/** Relays each upstream chunk immediately while parsing only bounded SSE event metadata. */
export async function relaySseStream(input: {
  body: ReadableStream<Uint8Array>;
  write: (chunk: Uint8Array) => Promise<void> | void;
  signal?: AbortSignal;
  now?: () => number;
  previewLimit?: number;
  maxPendingEventBytes?: number;
}): Promise<StreamRelayResult> {
  const reader = input.body.getReader();
  const decoder = new TextDecoder();
  const now = input.now || Date.now;
  const previewLimit = input.previewLimit ?? 160;
  const maxPendingEventBytes = input.maxPendingEventBytes ?? 64 * 1024;
  let pending = '';
  let outputCharacters = 0;
  let outputPreview = '';
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let totalTokens: number | undefined;
  let firstTokenAt: number | undefined;
  let completed = false;

  const parseLine = (line: string) => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') { if (data === '[DONE]') completed = true; return; }
    let payload: Record<string, any>;
    try { payload = JSON.parse(data); } catch { return; }
    const usage = payload.usage;
    if (usage && typeof usage === 'object') {
      inputTokens = positiveUsage(usage.prompt_tokens ?? usage.input_tokens) ?? inputTokens;
      outputTokens = positiveUsage(usage.completion_tokens ?? usage.output_tokens) ?? outputTokens;
      totalTokens = positiveUsage(usage.total_tokens) ?? (inputTokens !== undefined && outputTokens !== undefined ? inputTokens + outputTokens : totalTokens);
    }
    const delta = payload.choices?.[0]?.delta?.content;
    if (typeof delta === 'string' && delta.length) {
      firstTokenAt ??= now();
      outputCharacters += delta.length;
      if (outputPreview.length < previewLimit) outputPreview += delta.slice(0, previewLimit - outputPreview.length);
    }
  };

  try {
    while (true) {
      if (input.signal?.aborted) throw input.signal.reason || new Error('Stream cancelled.');
      const { done, value } = await reader.read();
      if (done) break;
      await input.write(value);
      pending += decoder.decode(value, { stream: true });
      if (pending.length > maxPendingEventBytes && !pending.includes('\n')) throw new Error('Upstream SSE event exceeded the configured parsing limit.');
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      for (const line of lines) parseLine(line);
    }
    pending += decoder.decode();
    if (pending) parseLine(pending.replace(/\r$/, ''));
  } finally {
    if (input.signal?.aborted) await reader.cancel(input.signal.reason).catch(() => undefined);
    reader.releaseLock();
  }
  return Object.freeze({ inputTokens, outputTokens, totalTokens, usageReported: inputTokens !== undefined || outputTokens !== undefined, outputCharacters, outputPreview, firstTokenAt, completed });
}
