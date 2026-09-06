import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const supportedEnvironments = new Set(['development', 'test', 'production']);

function readPort(value) {
  const port = Number(value ?? '3000');

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function readBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error('DATABASE_SSL must be either "true" or "false".');
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (!supportedEnvironments.has(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

export const env = Object.freeze({
  nodeEnv,
  port: readPort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL?.trim(),
  databaseSsl: readBoolean(process.env.DATABASE_SSL),
  frontendUrl: process.env.FRONTEND_URL?.trim() || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET?.trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '24h',
});

export function validateDatabaseEnvironment() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
  }
}

export function validateServerEnvironment() {
  validateDatabaseEnvironment();

  if (!env.jwtSecret || env.jwtSecret.length < 32 || env.jwtSecret.startsWith('replace-with-')) {
    throw new Error('JWT_SECRET is required and must contain at least 32 characters.');
  }
}
