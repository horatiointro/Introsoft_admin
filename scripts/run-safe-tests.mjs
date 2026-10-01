import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeTestFiles } from './safe-test-files.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seen = new Set();
for (const file of safeTestFiles) {
  const absolute = path.resolve(root, file);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !file.startsWith('src/')) throw new Error(`Test manifest entry is outside src: ${file}`);
  if (!/\.test\.tsx?$/.test(file) || !fs.existsSync(absolute)) throw new Error(`Test manifest entry is missing or not an explicit TypeScript test: ${file}`);
  if (seen.has(file)) throw new Error(`Duplicate test manifest entry: ${file}`);
  seen.add(file);
}

const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', ...safeTestFiles], {
  cwd: root,
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' },
  stdio: 'inherit',
  windowsHide: true,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
