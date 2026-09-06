import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('PostgreSQL registration, duplicate integrity, login and authenticated profile', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const app = createApp({ authService: createAuthService({ tokens: createTokenService({ secret: 'test-only-secret-for-integration-testing' }) }) });
  const suffix = randomUUID();
  const student = { fullName: 'Integration Student', email: `${suffix}@example.test`, password: 'test-password-123', role: 'STUDENT', matricNumber: suffix };
  const createdIds = [];
  try {
    const registered = await request(app).post('/api/auth/register').send(student);
    assert.equal(registered.status, 201);
    createdIds.push(registered.body.data.user.userId);
    assert.equal(registered.body.data.user.passwordHash, undefined);
    const stored = await getDatabasePool().query('SELECT password_hash FROM users WHERE user_id = $1', createdIds);
    assert.match(stored.rows[0].password_hash, /^\$2[ab]\$12\$/);
    assert.notEqual(stored.rows[0].password_hash, student.password);
    const duplicate = await request(app).post('/api/auth/register').send(student);
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'ACCOUNT_ALREADY_EXISTS');
    const duplicateMatric = await request(app).post('/api/auth/register').send({ ...student, email: `other-${suffix}@example.test` });
    assert.equal(duplicateMatric.status, 409);
    const login = await request(app).post('/api/auth/login').send({ email: student.email.toUpperCase(), password: student.password });
    assert.equal(login.status, 200);
    const profile = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.data.accessToken}`);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.user.userId, createdIds[0]);
    assert.equal(profile.body.data.user.passwordHash, undefined);
    for (const email of [student.email, 'missing@example.test']) {
      const invalid = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
      assert.equal(invalid.status, 401);
      assert.equal(invalid.body.error.code, 'INVALID_CREDENTIALS');
    }
    const lecturer = await request(app).post('/api/auth/register').send({ fullName: 'Test Lecturer', email: `lecturer-${suffix}@example.test`, password: student.password, role: 'LECTURER' });
    assert.equal(lecturer.status, 201);
    createdIds.push(lecturer.body.data.user.userId);
  } finally {
    await getDatabasePool().query('DELETE FROM users WHERE user_id = ANY($1::uuid[])', [createdIds]);
    await closeDatabasePool();
  }
});
