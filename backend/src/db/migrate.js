import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { createDatabasePool } from '../config/database.js';
import { env, validateDatabaseEnvironment } from '../config/env.js';

const migrationsDirectory = fileURLToPath(new URL('./migrations', import.meta.url));
const migrationLockName = 'acadence_schema_migrations';

async function runMigrations() {
  validateDatabaseEnvironment();

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();
  const migrationPool = createDatabasePool({
    connectionString: process.env.MIGRATION_DATABASE_URL?.trim() || env.databaseUrl,
    max: 1,
  });
  const client = await migrationPool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [migrationLockName]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const fileName of migrationFiles) {
      const existingMigration = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [fileName],
      );

      if (existingMigration.rowCount > 0) {
        continue;
      }

      const sql = await readFile(new URL(`./migrations/${fileName}`, import.meta.url), 'utf8');

      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [fileName]);
      console.info(`Applied migration ${fileName}.`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await migrationPool.end();
  }
}

const isVercelPreview = process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'production';

if (isVercelPreview) {
  console.info('Skipping database migrations for a non-production Vercel deployment.');
} else {
  runMigrations().catch((error) => {
    console.error('Database migration failed.', error);
    process.exitCode = 1;
  });
}
