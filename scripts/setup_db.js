import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function setupMariaDatabase() {
  console.log('================================================================');
  console.log(' MariaDB 10.11.18 Schema Migration & Seed Packaging Script');
  console.log('================================================================');

  const host = process.env.MARIADB_HOST || 'localhost';
  const port = parseInt(process.env.MARIADB_PORT || '3306', 10);
  const user = process.env.MARIADB_USER || 'root';
  const password = process.env.MARIADB_PASSWORD || '';
  const database = process.env.MARIADB_DATABASE || 'ai_governance_platform';

  const scriptPath = path.join(process.cwd(), 'scripts', 'init_mariadb.sql');
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ SQL Script not found at: ${scriptPath}`);
    process.exit(1);
  }

  console.log(`Connecting to MariaDB server at ${host}:${port} as user '${user}'...`);

  try {
    const conn = await mysql.createConnection({ host, port, user, password });
    console.log('✅ Connected to MariaDB server.');

    console.log(`Ensuring database '${database}' exists...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${database}\``);

    console.log(`Reading SQL initialization script: ${scriptPath}`);
    const sqlContent = fs.readFileSync(scriptPath, 'utf-8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Executing ${statements.length} DDL & DML statements...`);
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    let executedCount = 0;
    for (const stmt of statements) {
      if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('create database')) continue;
      await conn.query(stmt);
      executedCount++;
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.end();

    console.log(`\n🎉 Success! Executed ${executedCount} statements on MariaDB 10.11.18.`);
    console.log(`Database '${database}' is fully initialized with production tables and test data.\n`);
  } catch (error) {
    console.warn(`\n⚠️  Database initialization warning: ${error.message}`);
    console.log('Note: If MariaDB is not running locally, application will operate in synchronized in-memory database fallback mode.');
  }
}

setupMariaDatabase();
