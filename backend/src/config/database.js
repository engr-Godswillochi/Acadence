import pg from 'pg';

import { env } from './env.js';

const { Pool } = pg;

function createPool() {
  if (!env.databaseUrl) {
    throw new Error('Cannot create the PostgreSQL pool without DATABASE_URL.');
  }

  return new Pool({
    connectionString: env.databaseUrl,
    ssl: env.databaseSsl,
    connectionTimeoutMillis: 5000,
  });
}

let pool;

export function getDatabasePool() {
  pool ??= createPool();
  return pool;
}

export async function verifyDatabaseConnection() {
  await getDatabasePool().query('SELECT 1');
}

export async function closeDatabasePool() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
}
