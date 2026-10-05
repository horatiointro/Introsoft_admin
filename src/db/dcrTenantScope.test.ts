import test from 'node:test';
import assert from 'node:assert/strict';
import { DcrEngine } from '../utils/dcrEngine';

test('DCR reconstruction refuses to widen scope when no tenant is supplied', async () => {
  const result = await DcrEngine.reconstructResponse('Value ALTIL_PERSON_ABCDEF12 is ready.');
  assert.equal(result.reconstructedItems.length, 0);
  assert.equal(result.reconstructedText, 'Value ALTIL_PERSON_ABCDEF12 is ready.');
  assert.equal(result.unreconstructedItems.length, 1);
  assert.match(result.unreconstructedItems[0].reason, /tenant scope is required/i);
});

test('DCR reconstruction never decrypts another tenant\'s surrogate', async () => {
  const cloaked = await DcrEngine.cloakPayload('Contact jane@example.com.', { tenantId: 'tenant-a', requestId: 'request-iso', forcedStrategy: 'ENCRYPT' });
  const surrogate = cloaked.records[0]?.surrogateValue;
  assert.ok(surrogate);

  const otherTenant = await DcrEngine.reconstructResponse(`The value is ${surrogate}.`, {
    tenantId: 'tenant-b',
    activeRecords: cloaked.records,
  });
  assert.equal(otherTenant.reconstructedItems.length, 0);
  assert.equal(otherTenant.reconstructedText.includes('jane@example.com'), false);

  const owner = await DcrEngine.reconstructResponse(`The value is ${surrogate}.`, {
    tenantId: 'tenant-a',
    activeRecords: cloaked.records,
  });
  assert.equal(owner.reconstructedItems.length, 1);
  assert.equal(owner.reconstructedText.includes('jane@example.com'), true);
});

test('the DCR pipeline requires an explicit tenant scope', async () => {
  await assert.rejects(() => DcrEngine.runFullPipeline('Contact jane@example.com.'), /explicit tenant scope/i);
});