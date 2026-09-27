import assert from 'node:assert/strict';
import test from 'node:test';

test('DATABASE_SSL=true verifies the configured database certificate authority', async () => {
  process.env.DATABASE_URL = 'postgresql://example.invalid/acadence';
  process.env.DATABASE_SSL = 'true';
  process.env.DATABASE_SSL_CA = '-----BEGIN CERTIFICATE-----\\ntest-ca\\n-----END CERTIFICATE-----';

  const { createDatabasePool } = await import('../src/config/database.js');
  const pool = createDatabasePool();

  try {
    assert.deepEqual(pool.options.ssl, {
      ca: '-----BEGIN CERTIFICATE-----\ntest-ca\n-----END CERTIFICATE-----',
      rejectUnauthorized: true,
    });
  } finally {
    await pool.end();
  }
});
