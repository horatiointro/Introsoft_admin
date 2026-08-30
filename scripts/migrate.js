import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    try {
      const parsedUrl = new URL(process.env.DATABASE_URL);
      return {
        host: parsedUrl.hostname || '127.0.0.1',
        port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
        user: decodeURIComponent(parsedUrl.username || 'altil_user'),
        password: decodeURIComponent(parsedUrl.password || ''),
        database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') : 'altil_db',
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 4000
      };
    } catch (e) {
      console.warn('[Migrate CLI] Failed parsing DATABASE_URL, using discrete variables.');
    }
  }

  return {
    host: process.env.MARIADB_HOST || '127.0.0.1',
    port: parseInt(process.env.MARIADB_PORT || '3306', 10),
    user: process.env.MARIADB_USER || 'altil_user',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'altil_db',
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 4000
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

    // Ensure schema_migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Fetch applied
    const [appliedRows] = await pool.query('SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version ASC');
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
              .split(/;\s*$/m)
              .map(s => s.trim())
              .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const stmt of statements) {
              if (stmt.length > 0) {
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
    console.warn(`\n⚠️  Database notice: ${error.message}`);
    console.log('Note: If MariaDB is unreachable in current environment, in-memory repository fallback is active.');
  }
}

runMigrationsCLI();
