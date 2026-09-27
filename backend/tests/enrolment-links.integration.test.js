import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('shareable enrolment links issue, preview, redeem, expire and revoke', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const pool = getDatabasePool();
  const users = [];
  const courseIds = [];
  const tokens = createTokenService({ secret: 'enrolment-link-integration-secret' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  const bearer = (user) => ({ Authorization: `Bearer ${tokens.create(user)}` });
  // course(owner, 'get', `/${id}/enrolment-link`)
  const course = (user, method, path = '') => request(app)[method](`/api/courses${path}`).set(bearer(user));
  const link = (token) => request(app).get(`/api/enrolment-links/${token}`);
  const redeem = (token, user) => request(app).post(`/api/enrolment-links/${token}/redeem`).set(bearer(user));
  try {
    for (const role of ['LECTURER', 'LECTURER', 'STUDENT', 'STUDENT']) {
      const id = randomUUID();
      await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [id, `Link ${role}`, `${id}@example.test`, 'unused-test-hash', role, role === 'STUDENT' ? id : null]);
      users.push({ userId: id, role, fullName: `Link ${role}`, email: `${id}@example.test` });
    }
    const [owner, other, student, outsider] = users;

    const created = await request(app).post('/api/courses').set(bearer(owner)).send({ courseCode: `L${randomUUID().slice(0, 8)}`, courseTitle: 'Interface Systems', creditUnits: 3, academicSession: '2026/2027', semester: 'FIRST' });
    assert.equal(created.status, 201);
    const id = created.body.data.course.courseId;
    courseIds.push(id);
    const courseCode = created.body.data.course.courseCode;

    // Only the owning lecturer may touch the link, and never a student.
    assert.equal((await request(app).get(`/api/courses/${id}/enrolment-link`)).status, 401);
    assert.equal((await course(other, 'get', `/${id}/enrolment-link`)).status, 403);
    assert.equal((await course(student, 'get', `/${id}/enrolment-link`)).status, 403);
    assert.equal((await course(other, 'post', `/${id}/enrolment-link`)).status, 403);
    assert.equal((await course(other, 'delete', `/${id}/enrolment-link`)).status, 403);

    // No link exists until one is issued.
    const empty = await course(owner, 'get', `/${id}/enrolment-link`);
    assert.equal(empty.status, 200);
    assert.equal(empty.body.data.link, null);
    assert.equal(empty.body.data.lifetimeDays, 14);

    const issued = await course(owner, 'post', `/${id}/enrolment-link`);
    assert.equal(issued.status, 201);
    const token = issued.body.data.link.token;
    assert.equal(typeof token, 'string');
    assert.ok(token.length >= 40, 'link tokens carry enough entropy to be unguessable');
    assert.ok(new Date(issued.body.data.link.expiresAt) > new Date(Date.now() + 13 * 86400000));

    // A visitor can read the course behind the link without signing in, and the
    // roster state is never disclosed for anyone but the caller.
    const anonymous = await link(token);
    assert.equal(anonymous.status, 200);
    assert.equal(anonymous.body.data.course.courseCode, courseCode);
    assert.equal(anonymous.body.data.course.lecturerName, owner.fullName);
    assert.equal(anonymous.body.data.alreadyEnrolled, false);
    assert.equal(anonymous.body.data.viewerRole, null);
    assert.equal((await link('not-a-real-token')).status, 404);

    // Redeeming needs a signed-in student account.
    assert.equal((await request(app).post(`/api/enrolment-links/${token}/redeem`)).status, 401);
    assert.equal((await redeem(token, owner)).status, 403);

    const redeemed = await redeem(token, student);
    assert.equal(redeemed.status, 201);
    assert.equal(redeemed.body.data.courseId, id);

    // The student is genuinely on the roster, is told so on a return visit, and cannot double-enrol.
    assert.equal((await request(app).get('/api/courses').set(bearer(student))).body.data.courses.length, 1);
    const returning = await link(token).set(bearer(student));
    assert.equal(returning.body.data.alreadyEnrolled, true);
    assert.equal(returning.body.data.viewerRole, 'STUDENT');
    assert.equal((await redeem(token, outsider)).status, 201);
    assert.equal((await redeem(token, student)).status, 409);

    // A self-enrolled student gets the same notification as one added by email.
    const notified = await pool.query(`SELECT 1 FROM notifications WHERE recipient_id=$1 AND type='COURSE_ENROLMENT' AND related_entity_id=$2`, [student.userId, id]);
    assert.equal(notified.rowCount, 1);

    // Revoking kills the link immediately, with the same refusal a stranger gets.
    assert.equal((await course(owner, 'delete', `/${id}/enrolment-link`)).status, 200);
    const revoked = await link(token);
    assert.equal(revoked.status, 404);
    const revokedMessage = revoked.body.error.message;
    assert.equal((await redeem(token, outsider)).status, 404);

    // Re-issuing retires the previous token rather than leaving two live links.
    const fresh = (await course(owner, 'post', `/${id}/enrolment-link`)).body.data.link.token;
    assert.notEqual(fresh, token);
    assert.equal((await link(token)).status, 404);
    assert.equal((await link(fresh)).status, 200);
    const live = await pool.query('SELECT count(*)::int AS total FROM course_enrolment_links WHERE course_id=$1 AND revoked_at IS NULL', [id]);
    assert.equal(live.rows[0].total, 1);

    // An expired token is refused exactly like a revoked one.
    await course(owner, 'delete', `/${id}/enrolment-link`);
    const expired = randomUUID();
    await pool.query("INSERT INTO course_enrolment_links (course_id,token,expires_at) VALUES ($1,$2,CURRENT_TIMESTAMP - INTERVAL '1 day')", [id, expired]);
    const stale = await link(expired);
    assert.equal(stale.status, 404);
    assert.equal(stale.body.error.code, 'ENROLMENT_LINK_INVALID');
    assert.equal(stale.body.error.message, revokedMessage);

    // Archiving the course retires the link even though its token is untouched and unexpired.
    // The expired row above still holds the one-live-link slot, so clear it first.
    await pool.query('UPDATE course_enrolment_links SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1', [expired]);
    const archived = randomUUID();
    await pool.query("INSERT INTO course_enrolment_links (course_id,token,expires_at) VALUES ($1,$2,CURRENT_TIMESTAMP + INTERVAL '14 days')", [id, archived]);
    assert.equal((await link(archived)).status, 200);
    assert.equal((await course(owner, 'delete', `/${id}`)).status, 200);
    assert.equal((await link(archived)).status, 404);
  } finally {
    await pool.query('DELETE FROM course_enrolment_links WHERE course_id = ANY($1::uuid[])', [courseIds]);
    await pool.query('DELETE FROM notifications WHERE recipient_id = ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await pool.query('DELETE FROM enrolments WHERE course_id = ANY($1::uuid[])', [courseIds]);
    await pool.query('DELETE FROM courses WHERE course_id = ANY($1::uuid[])', [courseIds]);
    await pool.query('DELETE FROM users WHERE user_id = ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await closeDatabasePool();
  }
});
