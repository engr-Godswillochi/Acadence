import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('assignment publication, access checks, completion integrity, edit and removal', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const pool = getDatabasePool();
  const users = [];
  const courseId = randomUUID();
  const tokens = createTokenService({ secret: 'assignment-integration-test-secret' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  const call = (user, method, path) => request(app)[method](`/api${path}`).set('Authorization', `Bearer ${tokens.create(user)}`);
  try {
    for (const role of ['LECTURER', 'LECTURER', 'STUDENT', 'STUDENT']) {
      const id = randomUUID();
      await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [id, `Test ${role}`, `${id}@example.test`, 'unused', role, role === 'STUDENT' ? id : null]);
      users.push({ userId: id, role });
    }
    const [owner, other, student, outsider] = users;
    await pool.query("INSERT INTO courses (course_id,course_code,course_title,credit_units,academic_session,semester,lecturer_id) VALUES ($1,$2,'Testing',3,'2026/2027','FIRST',$3)", [courseId, courseId.slice(0, 8), owner.userId]);
    await pool.query('INSERT INTO enrolments (course_id,student_id) VALUES ($1,$2)', [courseId, student.userId]);
    const input = { title: 'Database design', description: 'Design the schema', deadline: new Date(Date.now() + 86400000).toISOString(), difficultyRating: 4 };
    const path = `/courses/${courseId}/assignments`;
    assert.equal((await call(owner, 'post', path).send({ ...input, deadline: '2020-01-01T00:00:00Z' })).status, 400);
    assert.equal((await call(other, 'post', path).send(input)).status, 403);
    assert.equal((await call(student, 'post', path).send(input)).status, 403);
    const result = await call(owner, 'post', path).send(input);
    assert.equal(result.status, 201);
    const id = result.body.data.assignment.assignmentId;
    assert.equal((await call(outsider, 'get', `/assignments/${id}`)).status, 403);
    assert.equal((await call(student, 'get', '/assignments/my')).body.data.assignments[0].status, 'PENDING');
    assert.equal((await call(outsider, 'patch', `/assignments/${id}/status`).send({ status: 'COMPLETED' })).status, 403);
    const completed = await call(student, 'patch', `/assignments/${id}/status`).send({ status: 'COMPLETED' });
    assert.equal(completed.status, 200);
    const repeated = await call(student, 'patch', `/assignments/${id}/status`).send({ status: 'COMPLETED' });
    assert.equal(repeated.body.data.completedAt, completed.body.data.completedAt);
    assert.equal((await pool.query('SELECT 1 FROM student_assignment_status WHERE assignment_id=$1', [id])).rowCount, 1);
    const pending = await call(student, 'patch', `/assignments/${id}/status`).send({ status: 'PENDING' });
    assert.equal(pending.body.data.completedAt, null);
    assert.equal((await call(other, 'patch', `/assignments/${id}`).send({ title: 'Hijack' })).status, 403);
    const edited = await call(owner, 'patch', `/assignments/${id}`).send({ title: 'Revised task', deadline: '2020-01-01T00:00:00Z' });
    assert.equal(edited.body.data.assignment.description, input.description);
    assert.equal((await call(student, 'get', '/assignments/my')).body.data.assignments[0].isOverdue, true);
    assert.equal((await call(owner, 'delete', `/assignments/${id}`)).status, 200);
    assert.equal((await call(student, 'get', '/assignments/my')).body.data.assignments.length, 0);
    assert.equal((await call(student, 'patch', `/assignments/${id}/status`).send({ status: 'COMPLETED' })).status, 404);
  } finally {
    await pool.query('DELETE FROM student_assignment_status WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE course_id=$1)', [courseId]);
    await pool.query('DELETE FROM assignments WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM enrolments WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM courses WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await closeDatabasePool();
  }
});
