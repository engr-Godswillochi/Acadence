import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import request from 'supertest';

test('announcement notification persistence, stream delivery, ownership and rollback', { skip: !process.env.TEST_DATABASE_URL, timeout: 30000 }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const { createApp } = await import('../src/app.js');
  const { createAuthService } = await import('../src/modules/auth/auth.service.js');
  const { createTokenService } = await import('../src/modules/auth/auth.token.js');
  const { getDatabasePool, closeDatabasePool } = await import('../src/config/database.js');
  const { withNotifications } = await import('../src/modules/notifications/notification.service.js');
  const { notificationRepository } = await import('../src/modules/notifications/notification.repository.js');
  const pool = getDatabasePool();
  const users = [];
  const courseId = randomUUID();
  const tokens = createTokenService({ secret: 'notification-test-secret-only' });
  const app = createApp({ authService: createAuthService({ tokens }) });
  const call = (user, method, path) => request(app)[method](`/api${path}`).set('Authorization', `Bearer ${tokens.create(user)}`);
  let server;
  const abort = new AbortController();
  try {
    for (const role of ['LECTURER', 'STUDENT', 'STUDENT']) {
      const id = randomUUID();
      await pool.query('INSERT INTO users (user_id,full_name,email,password_hash,role,matric_number) VALUES ($1,$2,$3,$4,$5,$6)', [id, `Test ${role}`, `${id}@example.test`, 'unused', role, role === 'STUDENT' ? id : null]);
      users.push({ userId: id, role });
    }
    const [owner, student, outsider] = users;
    await pool.query("INSERT INTO courses (course_id,course_code,course_title,credit_units,academic_session,semester,lecturer_id) VALUES ($1,$2,'Testing',3,'2026/2027','FIRST',$3)", [courseId, courseId.slice(0, 8), owner.userId]);
    await pool.query('INSERT INTO enrolments (course_id,student_id) VALUES ($1,$2)', [courseId, student.userId]);
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const stream = await fetch(`http://127.0.0.1:${server.address().port}/api/notifications/stream`, { headers: { Authorization: `Bearer ${tokens.create(student)}` }, signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]) });
    assert.equal(stream.headers.get('content-type').split(';')[0], 'text/event-stream');
    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    assert.match(decoder.decode((await reader.read()).value), /event: ready/);
    const created = await call(owner, 'post', `/courses/${courseId}/announcements`).send({ title: 'Class update', message: 'Meet in room 4.' });
    assert.equal(created.status, 201);
    let received = '';
    while (!received.includes('Class update')) received += decoder.decode((await reader.read()).value);
    assert.match(received, /event: ANNOUNCEMENT/);
    abort.abort();
    const inbox = await call(student, 'get', '/notifications');
    assert.equal(inbox.body.data.unreadCount, 1);
    const notificationId = inbox.body.data.notifications[0].notificationId;
    assert.equal((await call(outsider, 'get', '/notifications')).body.data.notifications.length, 0);
    assert.equal((await call(outsider, 'patch', `/notifications/${notificationId}/read`)).status, 404);
    assert.equal((await call(student, 'patch', `/notifications/${notificationId}/read`)).status, 200);
    assert.equal((await call(student, 'get', '/notifications')).body.data.unreadCount, 0);
    assert.equal((await call(student, 'get', '/announcements/my')).body.data.announcements.length, 1);
    assert.equal((await call(outsider, 'get', `/courses/${courseId}/announcements`)).status, 403);
    const announcementId = created.body.data.announcement.announcementId;
    assert.equal((await call(owner, 'post', `/announcements/${announcementId}/dismiss`)).status, 403);
    assert.equal((await call(outsider, 'post', `/announcements/${announcementId}/dismiss`)).status, 403);
    assert.equal((await call(student, 'post', `/announcements/${announcementId}/dismiss`)).status, 200);
    assert.equal((await call(student, 'get', '/announcements/my')).body.data.announcements.length, 0);
    assert.equal((await call(student, 'get', `/courses/${courseId}/announcements`)).body.data.announcements.length, 0);
    assert.equal((await call(student, 'get', '/announcements/my/hidden')).body.data.announcements.length, 1);
    assert.equal((await call(owner, 'get', '/announcements/my/hidden')).status, 403);
    assert.equal((await call(student, 'delete', `/announcements/${announcementId}/dismiss`)).status, 200);
    assert.equal((await call(student, 'get', '/announcements/my')).body.data.announcements.length, 1);
    assert.equal((await call(student, 'get', '/announcements/my/hidden')).body.data.announcements.length, 0);
    assert.equal((await call(student, 'patch', `/announcements/${announcementId}`).send({ title: 'Hijack' })).status, 403);
    assert.equal((await call(owner, 'patch', `/announcements/${announcementId}`).send({ message: 'Meet in room 5.' })).status, 200);
    assert.equal((await call(student, 'get', '/notifications')).body.data.unreadCount, 1);
    await call(student, 'patch', '/notifications/read-all');
    assert.equal((await call(student, 'get', '/notifications')).body.data.unreadCount, 0);
    await assert.rejects(withNotifications(async (client, emit) => {
      emit(await notificationRepository.createForUser(client, student.userId, { type: 'ANNOUNCEMENT', title: 'Rollback', message: 'Not committed', relatedEntityId: announcementId }));
      throw new Error('Deliberate rollback');
    }), /Deliberate rollback/);
    assert.equal((await call(student, 'get', '/notifications')).body.data.notifications.length, 2);
    await call(owner, 'delete', `/announcements/${announcementId}`);
    assert.equal((await call(student, 'get', '/announcements/my')).body.data.announcements.length, 0);
  } finally {
    abort.abort();
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    await pool.query('DELETE FROM announcements WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM enrolments WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM courses WHERE course_id=$1', [courseId]);
    await pool.query('DELETE FROM users WHERE user_id=ANY($1::uuid[])', [users.map((user) => user.userId)]);
    await closeDatabasePool();
  }
});
