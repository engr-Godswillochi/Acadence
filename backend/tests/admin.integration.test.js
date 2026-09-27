import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('administrators manage devices, credentials, student lookup and biometric mappings', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const pool = getDatabasePool();
  const tokens = createTokenService({ secret: 'admin-integration-tests-only-secret' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  const users = [
    { userId: randomUUID(), role: 'ADMIN', fullName: 'Device Administrator', email: `${randomUUID()}@example.test` },
    { userId: randomUUID(), role: 'LECTURER', fullName: 'Test Lecturer', email: `${randomUUID()}@example.test` },
    { userId: randomUUID(), role: 'STUDENT', fullName: 'Ada Student', email: `${randomUUID()}@example.test`, matricNumber: `CSC/${Date.now()}` },
  ];
  let deviceId;
  const call = (user, method, path) => request(app)[method](`/api/admin${path}`).set('Authorization', `Bearer ${tokens.create(user)}`);

  try {
    for (const user of users) {
      await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [user.userId, user.fullName, user.email, 'unused-test-hash', user.role, user.matricNumber ?? null]);
    }
    const [admin, lecturer, student] = users;
    assert.equal((await call(lecturer, 'get', '/devices')).status, 403);

    const created = await call(admin, 'post', '/devices').send({ deviceName: 'Lab entrance', location: 'Engineering block' });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.apiKey.length, 64);
    deviceId = created.body.data.device.deviceId;
    assert.equal((await call(admin, 'get', '/devices')).body.data.devices.length, 1);

    const updated = await call(admin, 'patch', `/devices/${deviceId}`).send({ isActive: false, location: 'Digital systems lab' });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.device.isActive, false);
    assert.equal((await call(admin, 'post', '/biometrics/enrol').send({ studentId: student.userId, deviceId, sensorSlotId: 12 })).status, 400);

    await call(admin, 'patch', `/devices/${deviceId}`).send({ isActive: true });
    const rotated = await call(admin, 'post', `/devices/${deviceId}/rotate-key`);
    assert.equal(rotated.status, 200);
    assert.equal(rotated.body.data.apiKey.length, 64);
    assert.notEqual(rotated.body.data.apiKey, created.body.data.apiKey);

    const students = await call(admin, 'get', `/students?q=${encodeURIComponent(student.matricNumber)}`);
    assert.equal(students.status, 200);
    assert.equal(students.body.data.students[0].userId, student.userId);

    const hardware = (method, path) => request(app)[method](`/api${path}`).set('X-Device-Key', rotated.body.data.apiKey);
    assert.equal((await hardware('post', '/device/heartbeat').send({ mode: 'IDLE', firmwareVersion: 'test', sensorReady: true, sensorCapacity: 162 })).status, 200);
    const enrollment = await call(admin, 'post', '/biometric-enrolments').send({ studentId: student.userId, deviceId });
    assert.equal(enrollment.status, 202);
    const jobId = enrollment.body.data.job.jobId;
    const work = await hardware('get', '/device/work');
    assert.equal(work.body.data.work.mode, 'ENROLLMENT');
    assert.equal(work.body.data.work.enrollment.jobId, jobId);
    const enrolled = await hardware('post', `/device/biometric-enrolments/${jobId}/complete`).send({});
    assert.equal(enrolled.status, 200);
    const profileId = enrolled.body.data.profile.biometricProfileId;
    const profiles = await call(admin, 'get', '/biometrics');
    assert.equal(profiles.body.data.profiles[0].studentName, student.fullName);
    assert.equal((await call(admin, 'delete', `/biometrics/${profileId}`)).status, 200);
    assert.equal((await call(admin, 'get', '/biometrics')).body.data.profiles.length, 0);
  } finally {
    if (deviceId) {
      await pool.query('DELETE FROM biometric_enrollment_jobs WHERE device_id=$1', [deviceId]);
      await pool.query('DELETE FROM biometric_profiles WHERE device_id=$1', [deviceId]);
      await pool.query('DELETE FROM biometric_devices WHERE device_id=$1', [deviceId]);
    }
    await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await closeDatabasePool();
  }
});
