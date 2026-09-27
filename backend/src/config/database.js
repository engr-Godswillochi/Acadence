import pg from 'pg';

import { env } from './env.js';

const { Pool } = pg;

export function createDatabasePool({ connectionString = env.databaseUrl, max = env.databasePoolMax } = {}) {
  if (!connectionString) {
    throw new Error('Cannot create the PostgreSQL pool without DATABASE_URL.');
  }

  return new Pool({
    connectionString,
    ssl: env.databaseSsl,
    max,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
}

let pool;

export function getDatabasePool() {
  pool ??= createDatabasePool();
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
