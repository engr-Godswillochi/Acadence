import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('attendance accepts only mapped scans for active session roster and freezes official summaries', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { hashDeviceKey } = await import('../src/modules/devices/device.auth.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const pool = getDatabasePool(); const users = []; const courseId = randomUUID(); const devices = [randomUUID(), randomUUID()];
  const keys = ['a'.repeat(64), 'b'.repeat(64)]; const tokens = createTokenService({ secret: 'attendance-integration-tests-only-secret' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  try {
    for (const role of ['LECTURER', 'LECTURER', 'STUDENT', 'STUDENT']) {
      const id = randomUUID(); await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [id, `${role} attendance`, `${id}@example.test`, 'unused', role, role === 'STUDENT' ? id : null]); users.push({ userId: id, role });
    }
    const [owner, other, student, outsider] = users;
    await pool.query("INSERT INTO courses (course_id,course_code,course_title,credit_units,lecturer_id,academic_session,semester) VALUES ($1,$2,'Attendance',3,$3,'2026/2027','FIRST')", [courseId, randomUUID().slice(0, 8), owner.userId]);
    await pool.query('INSERT INTO enrolments (course_id,student_id) VALUES ($1,$2)', [courseId, student.userId]);
    for (let index = 0; index < devices.length; index += 1) await pool.query('INSERT INTO biometric_devices (device_id,device_name,api_key_hash) VALUES ($1,$2,$3)', [devices[index], `Device ${index + 1}`, hashDeviceKey(keys[index])]);
    await pool.query('INSERT INTO biometric_profiles (student_id,device_id,sensor_slot_id) VALUES ($1,$2,10),($3,$2,11)', [student.userId, devices[0], outsider.userId]);
    const user = (account, method, path) => request(app)[method](`/api${path}`).set('Authorization', `Bearer ${tokens.create(account)}`);
    const device = (index, method, path) => request(app)[method](`/api${path}`).set('X-Device-Key', keys[index]);
    for (let index = 0; index < devices.length; index += 1) {
      assert.equal((await device(index, 'post', '/device/heartbeat').send({ mode: 'IDLE', firmwareVersion: 'test', sensorReady: true, sensorCapacity: 162 })).status, 200);
    }
    const path = `/courses/${courseId}/attendance-sessions`;
    assert.equal((await user(student, 'post', path).send({ deviceId: devices[0] })).status, 403);
    assert.equal((await user(other, 'post', path).send({ deviceId: devices[0] })).status, 403);
    assert.equal((await user(owner, 'post', path).send({ deviceId: randomUUID() })).status, 400);
    const opened = await user(owner, 'post', path).send({ deviceId: devices[0] }); assert.equal(opened.status, 201);
    const sessionId = opened.body.data.session.sessionId;
    assert.equal((await user(owner, 'post', path).send({ deviceId: devices[1] })).status, 409);
    assert.equal((await request(app).get('/api/device/session/active')).status, 401);
    assert.equal((await device(0, 'get', '/device/session/active')).body.data.session.sessionId, sessionId);
    assert.equal((await device(1, 'post', '/device/attendance').send({ sessionId, sensorSlotId: 10 })).status, 403);
    assert.equal((await device(0, 'post', '/device/attendance').send({ sessionId, sensorSlotId: 99 })).status, 404);
    assert.equal((await device(0, 'post', '/device/attendance').send({ sessionId, sensorSlotId: 11 })).status, 403);
    const scans = await Promise.all([device(0, 'post', '/device/attendance').send({ sessionId, sensorSlotId: 10 }), device(0, 'post', '/device/attendance').send({ sessionId, sensorSlotId: 10 })]);
    assert.deepEqual(scans.map((item) => item.status).sort(), [201, 409]);
    const register = await user(owner, 'get', `/attendance-sessions/${sessionId}/records`); assert.equal(register.body.data.records.length, 1); assert.ok(register.body.data.records[0].recordedAt);
    assert.equal((await user(other, 'patch', `/attendance-sessions/${sessionId}/close`)).status, 403);
    assert.equal((await user(owner, 'patch', `/attendance-sessions/${sessionId}/close`)).status, 200);
    assert.equal((await device(0, 'get', '/device/session/active')).body.data.session, null);
    assert.equal((await device(0, 'post', '/device/attendance').send({ sessionId, sensorSlotId: 10 })).body.error.code, 'NO_ACTIVE_SESSION');
    assert.equal((await user(owner, 'patch', `/attendance-sessions/${sessionId}/close`)).status, 409);
    const summary = await user(student, 'get', '/attendance/my/summary'); assert.deepEqual(summary.body.data.summaries[0], { courseId, courseCode: summary.body.data.summaries[0].courseCode, eligibleSessions: 1, attendedSessions: 1, percentage: 100 });
    assert.equal((await user(student, 'get', '/attendance/my')).body.data.attendance[0].recordedAt !== null, true);
    assert.equal((await user(outsider, 'get', '/attendance/my/summary')).body.data.summaries.length, 0);
    assert.equal((await device(0, 'post', '/device/heartbeat').send({ mode: 'IDLE', firmwareVersion: 'test', sensorReady: true, sensorCapacity: 162 })).status, 200);
    assert.equal((await pool.query('SELECT last_seen_at FROM biometric_devices WHERE device_id=$1', [devices[0]])).rows[0].last_seen_at !== null, true);
  } finally {
    await pool.query('DELETE FROM attendance_records WHERE session_id IN (SELECT session_id FROM attendance_sessions WHERE course_id=$1)', [courseId]);
    await pool.query('DELETE FROM attendance_session_students WHERE session_id IN (SELECT session_id FROM attendance_sessions WHERE course_id=$1)', [courseId]);
    await pool.query('DELETE FROM attendance_sessions WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM biometric_enrollment_jobs WHERE device_id=ANY($1::uuid[])', [devices]);
    await pool.query('DELETE FROM biometric_profiles WHERE device_id=ANY($1::uuid[])', [devices]);
    await pool.query('DELETE FROM biometric_devices WHERE device_id=ANY($1::uuid[])', [devices]);
    await pool.query('DELETE FROM enrolments WHERE course_id=$1', [courseId]); await pool.query('DELETE FROM courses WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])', [users.map((account) => account.userId)]); await closeDatabasePool();
  }
});
