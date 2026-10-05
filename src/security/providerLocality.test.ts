import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveProviderLocality, residencyCodes, residencySatisfied } from './providerLocality';

test('a private-network endpoint is on-premises regardless of provider type', () => {
  const facts = resolveProviderLocality({ providerId: 'p-a', providerType: 'openai', endpoint: 'http://192.168.1.50:11434' });
  assert.equal(facts.locality, 'ON_PREM');
  assert.equal(facts.isLocalExecution, true);
  assert.equal(facts.isExternalCloud, false);
  assert.equal(facts.jurisdictionAdequate, true);
});

test('a public endpoint with no declared jurisdiction is not adequate for transfer', () => {
  const facts = resolveProviderLocality({ providerId: 'p-b', providerType: 'gemini', endpoint: 'https://generativelanguage.googleapis.com' });
  assert.equal(facts.locality, 'PUBLIC_CLOUD');
  assert.equal(facts.jurisdictionAdequate, false);
  assert.deepEqual(facts.declaredRegions, []);
});

test('a public endpoint that declares only non-adequate jurisdictions is not adequate', () => {
  const facts = resolveProviderLocality({ providerId: 'p-c', providerType: 'openai', endpoint: 'https://api.vendor.example', processingJurisdictions: ['United States'] });
  assert.equal(facts.locality, 'PUBLIC_CLOUD');
  assert.equal(facts.jurisdictionAdequate, false);
});

test('operator attestation resolves locality when the endpoint is public', () => {
  const facts = resolveProviderLocality({ providerId: 'p-d', providerType: 'openai', endpoint: 'https://gw.corp.example', onPremAttested: true });
  assert.equal(facts.locality, 'ON_PREM');
  assert.equal(facts.isLocalExecution, true);
});

test('residency labels normalise to jurisdiction codes', () => {
  assert.deepEqual(residencyCodes('South Africa Only'), ['ZA']);
  assert.deepEqual(residencyCodes('EU Sovereign Nodes'), ['EU']);
  assert.deepEqual(residencyCodes('US Sovereign Edge'), ['US']);
  assert.deepEqual(residencyCodes(''), []);
});

test('residency satisfaction requires an overlap or an EU/EEA match', () => {
  assert.equal(residencySatisfied(['EU Sovereign Nodes'], ['United States']), false);
  assert.equal(residencySatisfied(['EU Sovereign Nodes'], ['DE']), true);
  assert.equal(residencySatisfied(['South Africa Only'], ['ZA']), true);
  assert.equal(residencySatisfied(['South Africa Only'], []), false);
});