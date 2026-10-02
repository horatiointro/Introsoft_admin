import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolveDatabaseConfig } from '../src/config/environmentContract.mjs';

function getDatabaseConfig() {
  const resolved = resolveDatabaseConfig(process.env);
  const ssl = resolved.ssl
    ? { rejectUnauthorized: true, ...(resolved.sslCaPath ? { ca: fs.readFileSync(resolved.sslCaPath, 'utf8') } : {}) }
    : undefined;
  return {
    host: resolved.host,
    port: resolved.port,
    user: resolved.user,
    password: resolved.password,
    database: resolved.database,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 4000,
    ...(ssl ? { ssl } : {})
  };
}

async function runMigrationsCLI() {
  const isStatusOnly = process.argv.includes('--status');
  console.log('================================================================');
  console.log(` ALTIL Secure AI — Database Migration Runner [Mode: ${isStatusOnly ? 'STATUS' : 'APPLY'}]`);
  console.log('================================================================');

  const config = getDatabaseConfig();
  console.log(`Target: ${config.user}@${config.host}:${config.port}/${config.database}`);

  let pool;
  try {
    pool = mysql.createPool(config);
    const [ver] = await pool.query('SELECT VERSION() as v');
    console.log(`Connected to MariaDB: ${ver[0]?.v}`);

    const [trackingTables] = await pool.query("SHOW TABLES LIKE 'schema_migrations'");
    const trackingTableExists = trackingTables.length > 0;
    if (!isStatusOnly && !trackingTableExists) {
      await pool.query(`
        CREATE TABLE schema_migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          version VARCHAR(64) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }

    // Status mode must remain read-only even when the migration table is absent.
    const [appliedRows] = trackingTableExists
      ? await pool.query('SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version ASC')
      : [[]];
    const appliedMap = new Map(appliedRows.map(r => [r.version, r]));

    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error(`❌ Migrations directory not found at ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    console.log(`\nFound ${files.length} migration files in /migrations:\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sqlContent, 'utf8').digest('hex');
      const versionMatch = file.match(/^(\d+)/);
      const version = versionMatch ? versionMatch[1] : file;

      const existing = appliedMap.get(version);
      if (existing) {
        console.log(`  [APPLIED]  v${version.padEnd(4)} - ${file} (${new Date(existing.applied_at).toISOString()})`);
      } else {
        if (isStatusOnly) {
          console.log(`  [PENDING]  v${version.padEnd(4)} - ${file}`);
        } else {
          console.log(`  [MIGRATING] v${version.padEnd(4)} - ${file}...`);
          const conn = await pool.getConnection();
          try {
            await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
            const statements = sqlContent
              // Discard standalone SQL comment lines, not the SQL statement that follows them.
              .replace(/^[ \t]*--.*(?:\r?\n|$)/gm, '')
              .split(/;\s*$/m)
              .map(s => s.trim())
              .filter(s => s.length > 0);

            for (const stmt of statements) {
              if (stmt.length > 0) {
                // Make additive column migrations safe to retry after a partial apply,
                // and keep the syntax compatible with both MySQL and MariaDB.
                const addColumn = stmt.match(/^ALTER\s+TABLE\s+`?(\w+)`?\s+ADD\s+COLUMN\s+`?(\w+)`?/i);
                if (addColumn) {
                  const [existingColumns] = await conn.query(
                    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1',
                    [addColumn[1], addColumn[2]]
                  );
                  if (existingColumns.length > 0) continue;
                }
                await conn.query(stmt);
              }
            }
            await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
            await conn.query(
              'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
              [version, file, checksum]
            );
            console.log(`  ✅ [SUCCESS] Applied: ${file}`);
          } catch (err) {
            console.error(`  ❌ [FAILED] Migration ${file}:`, err.message);
            conn.release();
            process.exit(1);
          } finally {
            conn.release();
          }
        }
      }
    }

    console.log('\nMigration run completed successfully.\n');
    await pool.end();
  } catch (error) {
    console.error(`\nDatabase migration failed: ${error.message}`);
    process.exitCode = 1;
    if (pool) await pool.end().catch(() => {});
  }
}

runMigrationsCLI();
