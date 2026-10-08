import { createHash } from 'node:crypto';
import type { OpenAiChatMessage, OpenAiContentPart } from './openAiChatRequest';

export type AltilContentPart = {
  type: 'text' | 'image';
  text?: string;
  mediaType?: string;
  reference?: string;
  contentHash?: string;
};

function stableContentHash(value: unknown): string {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value) || '';
  return createHash('sha256').update(serialized).digest('hex');
}

/** Normalizes validated OpenAI-compatible content into a modality-neutral ALTIL envelope. */
export function toAltilContentEnvelope(messages: readonly OpenAiChatMessage[]): Array<{ role: OpenAiChatMessage['role']; parts: AltilContentPart[] }> {
  return messages.map(message => ({
    role: message.role,
    parts: typeof message.content === 'string'
      ? [{ type: 'text', text: message.content }]
      : message.content.map((part: OpenAiContentPart) => {
        if (part.type === 'text' || part.type === 'input_text') return { type: 'text' as const, text: part.text };
        const reference = part.type === 'image_url' ? part.image_url.url : (part as Extract<OpenAiContentPart, { type: 'input_image' }>).image_url;
        const mediaType = reference.match(/^data:([^;,]+)/i)?.[1] || 'image/*';
        return { type: 'image' as const, mediaType, reference, contentHash: createHash('sha256').update(reference).digest('hex') };
      }),
  }));
}

/**
 * Render an internal envelope for the text-oriented policy/DCR pipeline.
 * Original image references and unknown structured values never cross this
 * boundary; providers receive only an opaque content hash and safe metadata.
 */
export function renderAltilContentEnvelope(envelope: ReadonlyArray<{ role: string; parts: readonly AltilContentPart[] }>): string {
  return envelope.map(message => {
    const content = message.parts.map(part => {
      if (part.type === 'text') return part.text || '';
      return `[ALTIL_IMAGE media_type=${part.mediaType || 'image/*'} sha256=${part.contentHash || stableContentHash(part.reference || '')}]`;
    }).join('\n');
    return `${message.role.toUpperCase()}: ${content}`;
  }).join('\n\n');
}

/**
 * Normalise a Responses-style input without forwarding raw multimodal data.
 * This deliberately keeps only user text and opaque hashes for other parts.
 */
export function renderProtectedInput(input: unknown): string {
  if (typeof input === 'string') return input;
  if (!Array.isArray(input)) return `[ALTIL_STRUCTURED_CONTENT sha256=${stableContentHash(input)}]`;
  return input.map(item => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return `[ALTIL_CONTENT sha256=${stableContentHash(item)}]`;
    const value = item as Record<string, unknown>;
    const role = typeof value.role === 'string' ? value.role.toUpperCase() : 'USER';
    const content = value.content;
    if (typeof content === 'string') return `${role}: ${content}`;
    if (Array.isArray(content)) {
      const parts = content.map(part => {
        if (!part || typeof part !== 'object') return `[ALTIL_CONTENT sha256=${stableContentHash(part)}]`;
        const partValue = part as Record<string, unknown>;
        if (partValue.type === 'input_text' || partValue.type === 'text') return String(partValue.text || '');
        const reference = partValue.image_url;
        return `[ALTIL_IMAGE sha256=${stableContentHash(reference)}]`;
      }).join('\n');
      return `${role}: ${parts}`;
    }
    return `[ALTIL_STRUCTURED_CONTENT sha256=${stableContentHash(content)}]`;
  }).join('\n\n');
}
