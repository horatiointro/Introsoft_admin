import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const inventoryPath = path.resolve('docs/ALTIL_AUTHORIZATION_ROUTE_INVENTORY.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const write = process.argv.includes('--write');
const check = process.argv.includes('--check') || !write;
const sourceFiles = ['server.ts', ...fs.readdirSync('src/routes', { recursive: true }).filter(file => String(file).endsWith('.ts')).map(file => path.join('src/routes', String(file)))];
const declarations = [];

for (const relativeFile of sourceFiles) {
  if (!fs.existsSync(relativeFile)) continue;
  const source = fs.readFileSync(relativeFile, 'utf8');
  const sourceFile = ts.createSourceFile(relativeFile, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text.toUpperCase();
      if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'ALL'].includes(method) && node.arguments.length) {
        const first = node.arguments[0];
        const paths = ts.isArrayLiteralExpression(first)
          ? first.elements.filter(ts.isStringLiteralLike).map(item => item.text)
          : ts.isStringLiteralLike(first) ? [first.text] : [];
        for (const route of paths) declarations.push({ method, route, file: relativeFile.replaceAll('\\', '/'), line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, middlewareText: node.arguments.slice(1).map(argument => argument.getText(sourceFile)).join(' ') });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function accessClassification(required, middleware = []) {
  const value = String(required || '').toUpperCase();
  if (value.includes('HANDLER ALWAYS RETURNS 405')) return 'INTENTIONALLY REJECTED';
  if (value.includes('CREDENTIAL') || value.includes('CHALLENGE')) return 'CREDENTIAL/CHALLENGE';
  if (value === 'YES' || middleware.some(item => /requireAuthentication|authenticate/i.test(item))) return 'AUTHENTICATED';
  if (value === 'NO') return 'PUBLIC';
  if (value.startsWith('NOT APPLICABLE')) return 'N/A';
  return null;
}
const norm = value => String(value).replace(/\/$/, '') || '/';
function pathMatches(publicPath, localPath, file) {
  const full = norm(publicPath); const local = norm(localPath);
  return full === local || (file !== 'server.ts' && full.endsWith(local));
}

let refreshed = 0;
const unresolved = [];
const stale = [];
for (const record of inventory.records) {
  let candidates = declarations.filter(item => item.method === String(record.method).toUpperCase() && pathMatches(record.route, item.route, item.file));
  const priorFile = String(record.source?.file || '').replaceAll('\\', '/');
  if (candidates.some(item => item.file === priorFile)) candidates = candidates.filter(item => item.file === priorFile);
  if (candidates.length > 1 && Array.isArray(record.authentication?.middleware) && record.authentication.middleware.length) {
    const matchingChain = candidates.filter(item => record.authentication.middleware.every(middleware => item.middlewareText.includes(String(middleware).split('(')[0])));
    if (matchingChain.length) candidates = matchingChain;
  }
  const unique = [...new Map(candidates.map(item => [`${item.file}:${item.line}`, item])).values()];
  if (unique.length === 1) {
    if (record.source.file !== unique[0].file || Number(record.source.line) !== unique[0].line) stale.push(`${record.method} ${record.route}: ${record.source.file}:${record.source.line} -> ${unique[0].file}:${unique[0].line}`);
    if (write) record.source = { ...record.source, file: unique[0].file, line: unique[0].line };
    const classification = accessClassification(record.authentication?.required, record.authentication?.middleware);
    if (classification && record.accessClassification !== classification) stale.push(`${record.method} ${record.route}: access classification requires ${classification}`);
    if (write && classification) record.accessClassification = classification;
    refreshed++;
  } else unresolved.push(`${record.method} ${record.route}: ${unique.length ? `ambiguous ${unique.map(item => `${item.file}:${item.line}`).join(', ')}` : 'no matching declaration'}`);
}

inventory.routeCount = inventory.records.length;
inventory.sourceFiles = [...new Set(inventory.records.map(record => record.source.file))].sort();
if (write) inventory.generatedAt = new Date().toISOString();
if (write) fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
console.log(`Route inventory records: ${inventory.records.length}; source declarations resolved uniquely: ${refreshed}; stale source/classification: ${stale.length}; unresolved/ambiguous: ${unresolved.length}; write: ${write ? 'yes' : 'no'}.`);
for (const item of stale.slice(0, 50)) console.log(`STALE ${item}`);
for (const item of unresolved.slice(0, 50)) console.log(`UNRESOLVED ${item}`);
if (unresolved.length || (check && stale.length)) process.exitCode = 1;
