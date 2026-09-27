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

function readBoolean(value, fallback = false, name = 'value') {
  if (value === undefined) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be either "true" or "false".`);
}

function readPositiveInteger(value, fallback, name) {
  if (value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return number;
}

function readFrontendOrigins() {
  const configured = (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const local = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  return [...new Set(configured.length ? configured : local)];
}

function readCertificate(value) {
  return value?.replace(/\\n/g, '\n').trim();
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (!supportedEnvironments.has(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

export const env = Object.freeze({
  nodeEnv,
  port: readPort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL?.trim(),
  databaseSsl: readBoolean(process.env.DATABASE_SSL, false, 'DATABASE_SSL'),
  databaseSslCa: readCertificate(process.env.DATABASE_SSL_CA),
  databasePoolMax: readPositiveInteger(process.env.DATABASE_POOL_MAX, nodeEnv === 'production' ? 1 : 10, 'DATABASE_POOL_MAX'),
  frontendOrigins: readFrontendOrigins(),
  jwtSecret: process.env.JWT_SECRET?.trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || '24h',
  adminRegistrationSecret: process.env.ADMIN_REGISTRATION_SECRET?.trim(),
});

export function validateDatabaseEnvironment() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.');
  }

  if (env.nodeEnv === 'production' && env.databaseSsl && !env.databaseSslCa) {
    throw new Error('DATABASE_SSL_CA is required in production when DATABASE_SSL=true.');
  }
}

export function validateServerEnvironment() {
  validateDatabaseEnvironment();

  if (!env.jwtSecret || env.jwtSecret.length < 32 || env.jwtSecret.startsWith('replace-with-')) {
    throw new Error('JWT_SECRET is required and must contain at least 32 characters.');
  }

  if (!env.adminRegistrationSecret || env.adminRegistrationSecret.length < 32 || env.adminRegistrationSecret.startsWith('replace-with-')) {
    throw new Error('ADMIN_REGISTRATION_SECRET is required and must contain at least 32 characters.');
  }
}
