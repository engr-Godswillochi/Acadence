import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('schedule CRUD, merged range validation, access and persistent change notifications', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const pool = getDatabasePool();
  const users = [];
  const courseId = randomUUID();
  const tokens = createTokenService({ secret: 'schedules-integration-tests-only-secret' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  try {
    for (const role of ['LECTURER', 'LECTURER', 'STUDENT', 'STUDENT']) {
      const id = randomUUID();
      await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [id, 'Schedule Test', `${id}@example.test`, 'unused', role, role === 'STUDENT' ? id : null]);
      users.push({ userId: id, role });
    }
    const [owner, other, student, outsider] = users;
    await pool.query("INSERT INTO courses (course_id,course_code,course_title,credit_units,lecturer_id,academic_session,semester) VALUES ($1,$2,'Schedules',3,$3,'2026/2027','FIRST')", [courseId, randomUUID().slice(0, 8), owner.userId]);
    await pool.query('INSERT INTO enrolments (course_id,student_id) VALUES ($1,$2)', [courseId, student.userId]);
    const call = (user, method, path) => request(app)[method](`/api${path}`).set('Authorization', `Bearer ${tokens.create(user)}`);
    const path = `/courses/${courseId}/schedules`;
    const input = { dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', venue: 'Room 12' };
    assert.equal((await request(app).get(`/api${path}`)).status, 401);
    assert.equal((await call(student, 'post', path).send(input)).status, 403);
    assert.equal((await call(other, 'post', path).send(input)).status, 403);
    assert.equal((await call(outsider, 'get', path)).status, 403);
    for (const invalid of [{ dayOfWeek: 'Funday' }, { startTime: '25:00' }, { venue: ' ' }, { endTime: '09:00' }]) {
      assert.equal((await call(owner, 'post', path).send({ ...input, ...invalid })).status, 400);
    }
    const created = await call(owner, 'post', path).send(input);
    assert.equal(created.status, 201);
    const id = created.body.data.schedule.scheduleId;
    assert.equal(created.body.data.schedule.startTime, '09:00');
    assert.equal((await call(student, 'get', '/schedules/my')).body.data.schedules.length, 1);
    assert.equal((await call(outsider, 'get', '/schedules/my')).body.data.schedules.length, 0);
    assert.equal((await call(other, 'patch', `/schedules/${id}`).send({ venue: 'Wrong' })).status, 403);
    assert.equal((await call(owner, 'patch', `/schedules/${id}`).send({ startTime: '11:00' })).status, 400);
    assert.equal((await call(owner, 'patch', `/schedules/${id}`).send({})).status, 400);
    const changed = await call(owner, 'patch', `/schedules/${id}`).send({ venue: 'Lab 2' });
    assert.equal(changed.body.data.schedule.startTime, '09:00');
    assert.equal(changed.body.data.schedule.venue, 'Lab 2');
    assert.equal((await pool.query("SELECT 1 FROM notifications WHERE recipient_id=$1 AND type='SCHEDULE_CHANGED'", [student.userId])).rowCount, 2);
    assert.equal((await call(other, 'delete', `/schedules/${id}`)).status, 403);
    assert.equal((await call(owner, 'delete', `/schedules/${id}`)).status, 200);
    assert.equal((await call(owner, 'delete', `/schedules/${id}`)).status, 404);
    assert.equal((await call(student, 'get', path)).body.data.schedules.length, 0);
    assert.equal((await pool.query("SELECT 1 FROM notifications WHERE recipient_id=$1 AND type='SCHEDULE_CHANGED'", [student.userId])).rowCount, 3);
    await call(owner, 'post', path).send(input);
    await pool.query('UPDATE courses SET archived_at=CURRENT_TIMESTAMP WHERE course_id=$1', [courseId]);
    assert.equal((await call(student, 'get', '/schedules/my')).body.data.schedules.length, 0);
    assert.equal((await call(owner, 'post', path).send(input)).status, 404);
  } finally {
    await pool.query('DELETE FROM schedules WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM enrolments WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM courses WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await closeDatabasePool();
  }
});
