import 'dotenv/config';
import mysql from 'mysql2/promise';
import { bootstrapPlatformSuperAdmin, PLATFORM_SUPER_ADMIN_EMAIL, type BootstrapConnection } from '../src/security/superAdminBootstrap';

function getTarget(): { host: string; port: number; database: string; user: string; password: string } {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    let parsed: URL;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error('The configured database URL is invalid.');
    }
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      user: decodeURIComponent(parsed.username || 'altil_user'),
      password: decodeURIComponent(parsed.password || ''),
    };
  }
  return {
    host: process.env.MARIADB_HOST || '127.0.0.1',
    port: Number(process.env.MARIADB_PORT || 3306),
    database: process.env.MARIADB_DATABASE || 'altil_db',
    user: process.env.MARIADB_USER || 'altil_user',
    password: process.env.MARIADB_PASSWORD || '',
  };
}

async function main(): Promise<void> {
  if (!process.argv.includes('--apply')) {
    throw new Error('No action taken. Re-run with --apply and the exact target confirmations.');
  }
  if (process.env.ALTIL_LOCAL_TEST_HARNESS === 'true') {
    throw new Error('This persistent IAM bootstrap is unavailable while the isolated LOCAL_TEST harness is enabled.');
  }

  const bootstrapPassword = process.env.ALTIL_SUPER_ADMIN_BOOTSTRAP_PASSWORD;
  const target = getTarget();
  if (!bootstrapPassword) throw new Error('The protected bootstrap-password environment variable is required.');
  if (process.env.ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_EMAIL !== PLATFORM_SUPER_ADMIN_EMAIL) {
    throw new Error('The exact administrator email confirmation is required.');
  }
  if (!target.host || process.env.ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_HOST !== target.host) {
    throw new Error('The exact database host confirmation is required.');
  }
  if (!target.database || process.env.ALTIL_SUPER_ADMIN_BOOTSTRAP_CONFIRM_DATABASE !== target.database) {
    throw new Error('The exact database name confirmation is required.');
  }

  const pool = mysql.createPool({
    host: target.host,
    port: target.port,
    database: target.database,
    user: target.user,
    password: target.password,
    waitForConnections: true,
    connectionLimit: 1,
    connectTimeout: 4000,
  });

  let connection: mysql.PoolConnection | undefined;
  try {
    connection = await pool.getConnection();
    const result = await bootstrapPlatformSuperAdmin(connection as unknown as BootstrapConnection, bootstrapPassword);
    // Intentionally report no database target, password, credential hash, or token.
    console.log(JSON.stringify({ status: 'success', created: result.created, role: result.role, scope: result.scope }));
  } finally {
    connection?.release();
    await pool.end();
  }
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Bootstrap failed.';
  console.error(`[Super Admin bootstrap] ${message}`);
  process.exitCode = 1;
});
