import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { createTokenService } from '../src/modules/auth/auth.token.js';
import { adminRegistrationSchema, registrationSchema } from '../src/modules/auth/auth.validation.js';
import { createAuthenticateUser } from '../src/middleware/auth.middleware.js';
import { requireRole } from '../src/middleware/role.middleware.js';
import { errorHandler } from '../src/middleware/error.middleware.js';

const secret = 'test-only-secret-that-is-long-enough-for-tests';
const tokens = createTokenService({ secret });
const user = { userId: randomUUID(), role: 'STUDENT', email: 'student@example.test' };

test('JWT verification rejects invalid signatures, expiry, missing expiry, and malformed identity', () => {
  assert.deepEqual(tokens.verify(tokens.create(user)), { userId: user.userId, role: user.role });
  assert.throws(() => tokens.verify(createTokenService({ secret: 'wrong-key' }).create(user)));
  assert.throws(() => tokens.verify(createTokenService({ secret, expiresIn: -1 }).create(user)));
  assert.throws(() => tokens.verify(jwt.sign({ sub: user.userId, role: user.role }, secret)));
  assert.throws(() => tokens.verify(jwt.sign({ sub: 'invalid', role: user.role }, secret, { expiresIn: '1h' })));
});

test('registration validates student identifiers, role and bcrypt byte length', () => {
  const input = { fullName: 'Ada Student', email: ' ADA@example.test ', password: 'password123', role: 'STUDENT', matricNumber: ' csc/001 ' };
  assert.equal(registrationSchema.parse(input).email, 'ada@example.test');
  assert.equal(registrationSchema.parse(input).matricNumber, 'CSC/001');
  assert.equal(registrationSchema.safeParse({ ...input, matricNumber: undefined }).success, false);
  assert.equal(registrationSchema.safeParse({ ...input, role: 'ADMIN' }).success, false);
  assert.equal(registrationSchema.safeParse({ ...input, password: 'é'.repeat(37) }).success, false);
});

test('administrator registration accepts only email, password and a secret code', () => {
  const input = { email: ' ADMIN@example.test ', password: 'password123', secretCode: 'private-code' };
  assert.deepEqual(adminRegistrationSchema.parse(input), {
    email: 'admin@example.test',
    password: 'password123',
    secretCode: 'private-code',
  });
  assert.equal(adminRegistrationSchema.safeParse({ ...input, role: 'ADMIN' }).success, false);
});

test('administrator registration rejects a wrong secret and creates an ADMIN without exposing it', async () => {
  const createdUsers = [];
  const service = createAuthService({
    adminRegistrationSecret: 'correct-secret-code',
    repository: {
      async createUser(input) {
        createdUsers.push(input);
        return { ...input, userId: randomUUID() };
      },
    },
    passwords: { hash: async (password) => `hashed:${password}` },
    tokens: { create: () => 'admin-token' },
  });

  await assert.rejects(
    service.registerAdmin({ email: 'admin@example.test', password: 'password123', secretCode: 'wrong-code' }),
    (error) => error.statusCode === 403 && error.code === 'INVALID_ADMIN_SECRET',
  );
  assert.equal(createdUsers.length, 0);

  const result = await service.registerAdmin({
    email: 'admin@example.test',
    password: 'password123',
    secretCode: 'correct-secret-code',
  });
  assert.equal(createdUsers[0].role, 'ADMIN');
  assert.equal(createdUsers[0].fullName, 'System Administrator');
  assert.equal(createdUsers[0].secretCode, undefined);
  assert.equal(result.user.passwordHash, undefined);
  assert.equal(result.user.secretCode, undefined);
  assert.equal(result.accessToken, 'admin-token');
});

test('administrator registration endpoint validates input and returns the created session', async () => {
  const calls = [];
  const session = { accessToken: 'admin-token', user: { email: 'admin@example.test', role: 'ADMIN' } };
  const app = createApp({ authService: { registerAdmin: async (input) => { calls.push(input); return session; } } });
  const invalid = await request(app).post('/api/auth/admin/register').send({ email: 'not-an-email' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
  assert.equal(calls.length, 0);

  const input = { email: 'admin@example.test', password: 'password123', secretCode: 'private-code' };
  const created = await request(app).post('/api/auth/admin/register').send(input);
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.data, session);
  assert.deepEqual(calls, [input]);
});

test('authentication rejects missing/device tokens and authorization uses current database role', async () => {
  const service = createAuthService({ tokens, repository: { findUserById: async () => ({ ...user, role: 'LECTURER' }) } });
  const app = express();
  app.get('/lecturer', createAuthenticateUser(service), requireRole('LECTURER'), (req, res) => res.json({ role: req.user.role }));
  app.get('/admin', createAuthenticateUser(service), requireRole('ADMIN'), (req, res) => res.sendStatus(200));
  app.use(errorHandler);
  assert.equal((await request(app).get('/lecturer')).status, 401);
  assert.equal((await request(app).get('/lecturer').set('X-Device-Key', 'device-key')).status, 401);
  const header = `Bearer ${tokens.create(user)}`;
  assert.equal((await request(app).get('/lecturer').set('Authorization', header)).body.role, 'LECTURER');
  assert.equal((await request(app).get('/admin').set('Authorization', header)).status, 403);
});

test('invalid input is rejected before service calls and attempts are limited', async () => {
  const app = createApp({ authService: { register: () => { throw new Error('Service should not run'); } } });
  for (let attempt = 0; attempt < 20; attempt++) {
    assert.equal((await request(app).post('/api/auth/register').send({ role: 'ADMIN' })).status, 400);
  }
  const response = await request(app).post('/api/auth/register').send({});
  assert.equal(response.status, 429);
  assert.equal(response.body.error.code, 'TOO_MANY_REQUESTS');
});
