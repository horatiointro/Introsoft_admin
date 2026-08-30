import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { getMariaDbPool, testAndInitMariaDb } from './mariadb';

export interface MigrationRecord {
  id: number;
  version: string;
  name: string;
  checksum: string;
  applied_at: Date;
}

/**
 * Ensures the `schema_migrations` tracking table exists.
 */
export async function ensureMigrationTable(pool: mysql.Pool): Promise<void> {
  const ddl = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  await pool.query(ddl);
}

/**
 * Calculates SHA256 checksum of SQL file content.
 */
function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Retrieves all applied migrations from the database.
 */
export async function getAppliedMigrations(pool: mysql.Pool): Promise<MigrationRecord[]> {
  await ensureMigrationTable(pool);
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT id, version, name, checksum, applied_at FROM schema_migrations ORDER BY version ASC'
  );
  return rows as MigrationRecord[];
}

/**
 * Runs all pending migrations in the migrations directory in ascending numerical order.
 */
export async function runPendingMigrations(migrationsDir?: string): Promise<{ applied: string[]; skipped: string[]; total: number }> {
  const pool = getMariaDbPool();
  const isHealthy = await testAndInitMariaDb();
  if (!isHealthy) {
    console.warn('[Migrator] MariaDB is currently unreachable. Skipping live migration runner.');
    return { applied: [], skipped: [], total: 0 };
  }

  await ensureMigrationTable(pool);
  const appliedMigrations = await getAppliedMigrations(pool);
  const appliedMap = new Map<string, MigrationRecord>(
    appliedMigrations.map(m => [m.version, m])
  );

  const targetDir = migrationsDir || path.join(process.cwd(), 'migrations');
  if (!fs.existsSync(targetDir)) {
    console.warn(`[Migrator] Migrations directory does not exist at: ${targetDir}`);
    return { applied: [], skipped: [], total: 0 };
  }

  const files = fs.readdirSync(targetDir)
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const filePath = path.join(targetDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const checksum = calculateChecksum(sqlContent);

    // Extract version prefix (e.g. "001" from "001_initial_schema.sql")
    const versionMatch = file.match(/^(\d+)/);
    const version = versionMatch ? versionMatch[1] : file;

    const existing = appliedMap.get(version);
    if (existing) {
      if (existing.checksum !== checksum) {
        console.warn(`[Migrator] WARNING: Checksum mismatch for already applied migration ${file}. Expected ${existing.checksum}, found ${checksum}`);
      }
      skipped.push(file);
      continue;
    }

    console.log(`[Migrator] Executing migration: ${file}...`);
    const connection = await pool.getConnection();
    try {
      // Split statements on ';' while handling semicolons inside blocks gracefully
      const rawStatements = sqlContent
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
      for (const statement of rawStatements) {
        if (statement.length > 0) {
          await connection.query(statement);
        }
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

      // Record successful migration
      await connection.query(
        'INSERT INTO schema_migrations (version, name, checksum) VALUES (?, ?, ?)',
        [version, file, checksum]
      );

      console.log(`[Migrator] ✅ Successfully applied: ${file}`);
      applied.push(file);
    } catch (error) {
      console.error(`[Migrator] ❌ Failed executing migration ${file}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }

  return { applied, skipped, total: files.length };
}
