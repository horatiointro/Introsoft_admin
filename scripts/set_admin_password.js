import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';

function getDatabaseConfig() {
  const ssl = process.env.MARIADB_SSL?.toLowerCase() === 'true'
    ? {
        rejectUnauthorized: true,
        ...(process.env.MARIADB_SSL_CA
          ? { ca: fs.readFileSync(process.env.MARIADB_SSL_CA, 'utf8') }
          : {})
      }
    : undefined;
  const common = {
    waitForConnections: true,
    connectTimeout: 5000,
    ...(ssl ? { ssl } : {})
  };

  if (process.env.DATABASE_URL?.trim()) {
    const parsed = new URL(process.env.DATABASE_URL);
    return {
      ...common,
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '')
    };
  }

  return {
    ...common,
    host: process.env.MARIADB_HOST || '127.0.0.1',
    port: Number(process.env.MARIADB_PORT || 3306),
    user: process.env.MARIADB_USER || 'altil_user',
    password: process.env.MARIADB_PASSWORD || '',
    database: process.env.MARIADB_DATABASE || 'altil_db'
  };
}

async function setAdminPassword() {
  const email = (process.env.ALTIL_ADMIN_EMAIL || 'horatio.huxham@gmail.com').trim().toLowerCase();
  const password = process.env.ALTIL_ADMIN_PASSWORD;
  if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{}|;':",\./<>?]/.test(password)) {
    throw new Error('Set ALTIL_ADMIN_PASSWORD to a password of at least 8 characters, including an uppercase letter and a special character.');
  }

  const pool = mysql.createPool({ ...getDatabaseConfig(), connectionLimit: 2 });
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM iam_users WHERE LOWER(email) = ? LIMIT 1',
      [email]
    );
    if (!rows.length) {
      throw new Error(`No IAM user found for ${email}. Run 'npm run db:migrate' first.`);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
      `UPDATE iam_users
       SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP,
           failed_login_attempts = 0, lockout_until = NULL,
           force_password_change = FALSE, password_history = JSON_ARRAY()
       WHERE id = ?`,
      [passwordHash, rows[0].id]
    );
    console.log(`Updated the database password for ${email}. Remove ALTIL_ADMIN_PASSWORD from the environment after this one-time command.`);
  } finally {
    await pool.end();
  }
}

setAdminPassword().catch(error => {
  console.error(`Admin password update failed: ${error.message}`);
  process.exitCode = 1;
});
