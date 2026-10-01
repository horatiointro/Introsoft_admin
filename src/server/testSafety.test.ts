import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { safeTestFiles } from '../../scripts/safe-test-files.mjs';
import { isServerEntrypoint } from './serverEntrypoint.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function findTypeScriptTests(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? findTypeScriptTests(child) : entry.isFile() && entry.name.endsWith('.test.ts') && !entry.name.endsWith('.e2e.test.ts') ? [path.relative(root, child).replaceAll('\\', '/')] : [];
  });
}

describe('safe test entrypoints', () => {
  it('uses only explicit in-source TypeScript test files and excludes generated server bundles', () => {
    assert.ok(safeTestFiles.length > 0);
    assert.equal(new Set(safeTestFiles).size, safeTestFiles.length);
    for (const file of safeTestFiles) {
      assert.match(file, /^src\/.+\.test\.tsx?$/);
      assert.equal(path.resolve(root, file).startsWith(path.join(root, 'src') + path.sep), true);
    }
    assert.equal(safeTestFiles.includes('altil-server-test.cjs'), false);
    assert.equal(safeTestFiles.includes('server.ts'), false);
    assert.equal(safeTestFiles.some(file => /(^|\/)(dist|build|generated)\//.test(file)), false);
    const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.equal(packageJson.scripts.test, 'node scripts/run-safe-tests.mjs');
    const discovered = findTypeScriptTests(path.join(root, 'src')).sort();
    assert.deepEqual([...safeTestFiles].sort(), discovered, 'new TypeScript tests must be explicitly added to the safe manifest');
  });

  it('recognizes only supported server entrypoints for startup', () => {
    assert.equal(isServerEntrypoint('C:\\Project\\ALTIL\\server.ts'), true);
    assert.equal(isServerEntrypoint('/srv/altil/dist/server.cjs'), true);
    assert.equal(isServerEntrypoint('/repo/src/server/applicationCredentialHttp.test.ts'), false);
    assert.equal(isServerEntrypoint('/repo/altil-server-test.cjs'), false);
    assert.equal(isServerEntrypoint(undefined), false);
  });

  it('imports server.ts without opening a listener, connecting MariaDB, or calling providers', () => {
    const script = [
      "import { isDatabaseConnected } from './src/db/mariadb.ts';",
      "import net from 'node:net';",
      "const calls = []; const originalFetch = globalThis.fetch; globalThis.fetch = (...args) => { calls.push(String(args[0])); throw new Error('network blocked by import safety test'); };",
      "net.Socket.prototype.connect = function (...args) { calls.push('socket-connect'); throw new Error('network blocked by import safety test'); };",
      "await import('./server.ts');",
      'await new Promise(resolve => setTimeout(resolve, 300));',
      "const listening = process._getActiveHandles().some(handle => handle?.constructor?.name === 'Server' && handle.listening === true);",
      'if (listening || isDatabaseConnected() || calls.length) process.exitCode = 31;',
      'globalThis.fetch = originalFetch;',
    ].join('\n');
    const emptyEnvPath = path.join(root, '.stage6-test-empty-env');
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], {
      cwd: root,
      encoding: 'utf8',
      timeout: 12_000,
      windowsHide: true,
      env: {
        PATH: process.env.PATH,
        SystemRoot: process.env.SystemRoot,
        TEMP: process.env.TEMP,
        TMP: process.env.TMP,
        NODE_ENV: 'test',
        DOTENV_CONFIG_PATH: emptyEnvPath,
        MARIADB_HOST: '127.0.0.1',
        MARIADB_PORT: '1',
        MARIADB_USER: 'stage6-test-user',
        MARIADB_PASSWORD: '',
        MARIADB_DATABASE: 'stage6_import_safety_test',
      },
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, 0, `server.ts import safety child failed with exit ${result.status}; stdout/stderr suppressed to avoid leaking environment data`);
  });

  it('keeps the inference scope guard before the gateway provider-dispatch block', () => {
    const source = readFileSync(path.join(root, 'server.ts'), 'utf8');
    const gateway = source.indexOf("if (req.method !== 'POST' || !['/v1/chat/completions'");
    const gate = source.indexOf('validateRuntimeApiKey({ key: keyRecord, requiredScope: ', gateway);
    const dispatch = source.indexOf('Primary Provider Inference Execution', gate);
    assert.ok(gateway >= 0 && gate > gateway && dispatch > gate);
    const device = source.indexOf("app.post('/api/v1/mobile/devices/register'");
    const deviceGate = source.indexOf('validateRuntimeApiKey({key,requiredScope:undefined})', device);
    const deviceWrite = source.indexOf('INSERT INTO mobile_devices', device);
    assert.ok(device >= 0 && deviceGate > device && deviceWrite > deviceGate, 'device enrollment must fail closed before its persistence branch');
    assert.match(source, /authenticateGatewayTenantForScope\('read:inference'\)/);
  });
});
