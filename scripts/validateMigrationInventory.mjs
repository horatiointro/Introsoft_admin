import fs from 'node:fs';
import path from 'node:path';

const directory = path.resolve('migrations');
const files = fs.readdirSync(directory).filter(name => /^\d+.*\.sql$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
if (!files.length) throw new Error('No migration files were found.');
const versions = files.map(file => Number(file.match(/^(\d+)/)?.[1]));
if (versions.some(version => !Number.isInteger(version)) || new Set(versions).size !== versions.length) throw new Error('Migration files contain missing or duplicate numeric versions.');
for (let index = 0; index < versions.length; index++) if (versions[index] !== index + 1) throw new Error(`Migration sequence has a gap or out-of-order version at ${files[index]}.`);

for (const file of files) {
  const source = fs.readFileSync(path.join(directory, file), 'utf8');
  const statements = source.replace(/^[ \t]*--.*(?:\r?\n|$)/gm, '').split(/;\s*$/m).map(statement => statement.trim()).filter(Boolean);
  if (!statements.length) throw new Error(`${file} contains no executable SQL statements.`);
  if (statements.some(statement => /\b(?:CREATE|DROP)\s+PROCEDURE\b/i.test(statement))) throw new Error(`${file} contains procedural SQL incompatible with the existing migration runner.`);
}
console.log(`Static migration inventory valid: ${files.length} sequential files (${String(versions[0]).padStart(3, '0')}–${String(versions.at(-1)).padStart(3, '0')}); splitter produced executable statements; no database was contacted.`);
