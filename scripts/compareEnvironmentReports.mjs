import fs from 'node:fs';

const paths = process.argv.slice(2).filter(value => !value.startsWith('--'));
if (paths.length !== 2) {
  console.error('Usage: npm run env:compare -- <pc-report.json> <server-report.json>');
  process.exit(2);
}

function readReport(file) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (value.reportVersion !== 1) throw new Error('unsupported report version');
    return value;
  } catch (error) {
    console.error(`Could not read environment report: ${pathLabel(file)} (${error instanceof Error ? error.message : 'invalid JSON'})`);
    process.exit(2);
  }
}
function pathLabel(file) { return file.replace(/[\\/].*[\\/]/, ''); }

const [pc, server] = paths.map(readReport);
const checks = [];
const check = (label, left, right) => checks.push({ label, result: left === right ? 'MATCH' : 'MISMATCH' });
check('ALTIL environment profile', pc.environment, server.environment);
check('Git commit', pc.application?.gitCommit, server.application?.gitCommit);
check('Application package version', pc.application?.packageVersion, server.application?.packageVersion);
check('package-lock.json SHA-256', pc.dependencies?.packageLockSha256, server.dependencies?.packageLockSha256);
check('Node runtime version', pc.runtime?.node, server.runtime?.node);
check('npm version', pc.runtime?.packageManager, server.runtime?.packageManager);
check('Operating system / architecture', `${pc.runtime?.platform}/${pc.runtime?.architecture}`, `${server.runtime?.platform}/${server.runtime?.architecture}`);
check('Selected installed dependency versions', JSON.stringify(pc.dependencies?.installedTopLevel), JSON.stringify(server.dependencies?.installedTopLevel));
check('MariaDB server version', pc.database?.serverVersion, server.database?.serverVersion);
check('Database schema fingerprint', pc.database?.schemaFingerprint, server.database?.schemaFingerprint);
check('Applied migration versions', JSON.stringify(pc.database?.applied), JSON.stringify(server.database?.applied));
check('Pending migration versions', JSON.stringify(pc.database?.pending), JSON.stringify(server.database?.pending));
check('Configuration contract valid', String(pc.configuration?.valid), String(server.configuration?.valid));
check('PC working tree clean', pc.application?.workingTree, 'CLEAN');
check('Server working tree clean', server.application?.workingTree, 'CLEAN');
check('Database reachable on PC', pc.database?.status, 'CONNECTED');
check('Database reachable on server', server.database?.status, 'CONNECTED');
check('Database schema current on PC', pc.database?.migrationStatus, 'CURRENT');
check('Database schema current on server', server.database?.migrationStatus, 'CURRENT');

const leftKey = pc.sharedSecretFingerprints?.parityKeyCheck;
const rightKey = server.sharedSecretFingerprints?.parityKeyCheck;
let secretCheck = 'UNVERIFIED (shared fingerprint key unavailable or different)';
if (leftKey && leftKey === rightKey) {
  const leftFingerprints = pc.sharedSecretFingerprints.fingerprints || {};
  const rightFingerprints = server.sharedSecretFingerprints.fingerprints || {};
  const databaseTargetMatches = Boolean(leftFingerprints.databaseTarget && leftFingerprints.databaseTarget === rightFingerprints.databaseTarget);
  const names = [...new Set([...Object.keys(leftFingerprints), ...Object.keys(rightFingerprints)])]
    .filter(name => name !== 'databaseTarget'
      && (name !== 'databaseCredential' || databaseTargetMatches)
      && (databaseTargetMatches || !['ALTIL_KNOWLEDGE_ENCRYPTION_KEY', 'ALTIL_PROVIDER_VAULT_KEY'].includes(name)));
  const namesToCompare = names.filter(name => leftFingerprints[name] !== null || rightFingerprints[name] !== null);
  const mismatches = namesToCompare.filter(name => leftFingerprints[name] !== rightFingerprints[name]);
  const databaseNote = databaseTargetMatches ? 'same database target' : 'database endpoint differs or cannot be compared';
  secretCheck = mismatches.length ? `MISMATCH (${mismatches.join(', ')}; ${databaseNote})` : `${namesToCompare.length ? 'MATCH' : 'NO SHARED SECRETS CONFIGURED'} (${databaseNote})`;
}

console.log('ALTIL PC ↔ DEV-TEST SERVER PARITY');
console.log('==================================');
for (const item of checks) console.log(`${item.result.padEnd(8)} ${item.label}`);
console.log(`${secretCheck.startsWith('MATCH') ? 'MATCH' : secretCheck.startsWith('MISMATCH') ? 'MISMATCH' : 'UNKNOWN '}  Selected shared-secret fingerprints: ${secretCheck}`);
const secretsReady = secretCheck.startsWith('MATCH') || secretCheck.startsWith('NO SHARED SECRETS CONFIGURED');
console.log(`Deployment parity: ${checks.every(item => item.result === 'MATCH') && secretsReady ? 'PASS' : 'NOT DEMONSTRATED'}`);
console.log('Secret values were not read from report files or printed.');

if (checks.some(item => item.result !== 'MATCH') || !secretsReady || secretCheck.startsWith('MISMATCH')) process.exitCode = 1;
