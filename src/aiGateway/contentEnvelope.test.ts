import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAltilContentEnvelope, renderProtectedInput, toAltilContentEnvelope } from './contentEnvelope';
import { validateOpenAiChatRequest } from './openAiChatRequest';

test('content envelope hashes image references and retains text as a separate part', () => {
  const request = validateOpenAiChatRequest({ model: 'vision', messages: [{ role: 'user', content: [{ type: 'text', text: 'Describe it' }, { type: 'image_url', image_url: { url: 'https://example.invalid/a.png' } }] }] });
  const envelope = toAltilContentEnvelope(request.messages);
  assert.deepEqual(envelope[0].parts[0], { type: 'text', text: 'Describe it' });
  assert.equal(envelope[0].parts[1].type, 'image');
  assert.match(envelope[0].parts[1].contentHash || '', /^[a-f0-9]{64}$/);
  assert.equal(envelope[0].parts[1].reference, 'https://example.invalid/a.png');
});

test('content envelope renders opaque multimodal references for policy and providers', () => {
  const request = validateOpenAiChatRequest({ model: 'vision', messages: [{ role: 'user', content: [{ type: 'text', text: 'Describe it' }, { type: 'image_url', image_url: { url: 'https://example.invalid/private.png' } }] }] });
  const rendered = renderAltilContentEnvelope(toAltilContentEnvelope(request.messages));
  assert.match(rendered, /Describe it/);
  assert.match(rendered, /ALTIL_IMAGE/);
  assert.doesNotMatch(rendered, /private\.png/);
});

test('responses input keeps text and hashes images or structured content', () => {
  const rendered = renderProtectedInput([{ role: 'user', content: [{ type: 'input_text', text: 'Summarise' }, { type: 'input_image', image_url: 'data:image/png;base64,private' }] }]);
  assert.match(rendered, /Summarise/);
  assert.match(rendered, /ALTIL_IMAGE sha256=[a-f0-9]{64}/);
  assert.doesNotMatch(rendered, /private/);
});
