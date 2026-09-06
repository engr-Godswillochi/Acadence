import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { closeDatabasePool, getDatabasePool } from '../config/database.js';
import { validateDatabaseEnvironment } from '../config/env.js';

const migrationsDirectory = fileURLToPath(new URL('./migrations', import.meta.url));
const migrationLockName = 'acadence_schema_migrations';

async function runMigrations() {
  validateDatabaseEnvironment();

  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();
  const client = await getDatabasePool().connect();

  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [migrationLockName]);
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

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [fileName]);
        await client.query('COMMIT');
        console.info(`Applied migration ${fileName}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [migrationLockName]);
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .catch((error) => {
    console.error('Database migration failed.', error);
    process.exitCode = 1;
  })
  .finally(closeDatabasePool);
