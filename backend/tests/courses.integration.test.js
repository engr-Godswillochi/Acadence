import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('course ownership, enrolment integrity, student access and archival', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const pool = getDatabasePool();
  const users = [];
  const ids = [];
  const tokens = createTokenService({ secret: 'course-integration-tests-only-secret' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  try {
    for (const role of ['LECTURER', 'LECTURER', 'STUDENT', 'STUDENT', 'ADMIN']) {
      const id = randomUUID();
      await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [id, `Test ${role}`, `${id}@example.test`, 'unused-test-hash', role, role === 'STUDENT' ? id : null]);
      users.push({ userId: id, role, email: `${id}@example.test` });
    }
    const [owner, other, student, outsider, admin] = users;
    const call = (user, method, path) => request(app)[method](`/api/courses${path}`).set('Authorization', `Bearer ${tokens.create(user)}`);
    const input = { courseCode: `T${randomUUID().slice(0, 8)}`, courseTitle: 'Database Systems', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST' };
    assert.equal((await request(app).get('/api/courses')).status, 401);
    assert.equal((await call(student, 'post', '').send(input)).status, 403);
    assert.equal((await call(admin, 'get', '')).status, 403);
    assert.equal((await call(owner, 'post', '').send({ ...input, creditUnits: 0 })).status, 400);
    assert.equal((await call(owner, 'get', '/invalid-id')).status, 400);
    const created = await call(owner, 'post', '').send(input);
    assert.equal(created.status, 201);
    const id = created.body.data.course.courseId;
    ids.push(id);
    assert.equal((await call(owner, 'post', '').send(input)).status, 409);
    assert.equal((await call(other, 'get', `/${id}`)).status, 403);
    assert.equal((await call(other, 'patch', `/${id}`).send({ courseTitle: 'Hijacked' })).status, 403);
    assert.equal((await call(other, 'delete', `/${id}`)).status, 403);
    assert.equal((await call(student, 'get', `/${id}`)).status, 403);
    assert.equal((await call(student, 'get', '')).body.data.courses.length, 0);
    assert.equal((await call(owner, 'patch', `/${id}`).send({ courseTitle: 'Advanced Databases' })).body.data.course.courseTitle, 'Advanced Databases');
    assert.equal((await call(other, 'post', `/${id}/enrolments`).send({ studentId: student.userId })).status, 403);
    assert.equal((await call(owner, 'post', `/${id}/enrolments`).send({ studentId: owner.userId })).status, 404);
    const enrolmentResults = await Promise.all([
      call(owner, 'post', `/${id}/enrolments`).send({ studentId: student.userId }),
      call(owner, 'post', `/${id}/enrolments`).send({ studentEmail: student.email }),
    ]);
    assert.deepEqual(enrolmentResults.map((result) => result.status).sort(), [201, 409]);
    assert.equal((await call(student, 'get', '')).body.data.courses.length, 1);
    assert.equal((await call(student, 'get', `/${id}`)).status, 200);
    assert.equal((await call(outsider, 'get', `/${id}`)).status, 403);
    assert.equal((await call(student, 'get', `/${id}/students`)).status, 403);
    assert.equal((await call(owner, 'get', `/${id}/students`)).body.data.students.length, 1);
    assert.equal((await call(owner, 'delete', `/${id}/enrolments/${student.userId}`)).status, 200);
    assert.equal((await call(student, 'get', `/${id}`)).status, 403);
    assert.equal((await call(owner, 'post', `/${id}/enrolments`).send({ studentId: student.userId })).status, 201);
    assert.equal((await call(owner, 'delete', `/${id}`)).status, 200);
    assert.equal((await call(owner, 'get', '')).body.data.courses.length, 0);
    assert.equal((await call(student, 'get', '/archived')).status, 403);
    assert.equal((await call(other, 'get', '/archived')).body.data.courses.length, 0);
    const archived = await call(owner, 'get', '/archived');
    assert.equal(archived.status, 200);
    assert.equal(archived.body.data.courses[0].courseId, id);
    assert.equal((await call(student, 'get', `/${id}`)).status, 404);
    assert.equal((await call(owner, 'post', `/${id}/enrolments`).send({ studentId: outsider.userId })).status, 404);
    assert.equal((await pool.query('SELECT 1 FROM enrolments WHERE course_id=$1', [id])).rowCount, 1);
    assert.equal((await call(other, 'post', `/${id}/unarchive`)).status, 403);
    assert.equal((await call(student, 'post', `/${id}/unarchive`)).status, 403);
    const restored = await call(owner, 'post', `/${id}/unarchive`);
    assert.equal(restored.status, 200);
    assert.equal(restored.body.data.course.archivedAt, null);
    assert.equal((await call(owner, 'get', '')).body.data.courses.length, 1);
    assert.equal((await call(student, 'get', `/${id}`)).status, 200);
    assert.equal((await call(owner, 'post', `/${id}/unarchive`)).status, 404);
  } finally {
    await pool.query('DELETE FROM enrolments WHERE course_id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM courses WHERE course_id = ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM users WHERE user_id = ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await closeDatabasePool();
  }
});
