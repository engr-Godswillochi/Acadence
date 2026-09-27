import { getDatabasePool } from '../../config/database.js';

const columns = `a.announcement_id AS "announcementId", a.course_id AS "courseId", a.title, a.message, a.created_at AS "createdAt", a.updated_at AS "updatedAt", a.deleted_at AS "deletedAt"`;
export const announcementRepository = {
  async find(id, client = getDatabasePool()) { return (await client.query(`SELECT ${columns} FROM announcements a WHERE announcement_id=$1`, [id])).rows[0]; },
  async listCourse(courseId, studentId = null) { return (await getDatabasePool().query(`SELECT ${columns} FROM announcements a WHERE course_id=$1 AND deleted_at IS NULL AND ($2::uuid IS NULL OR NOT EXISTS (SELECT 1 FROM announcement_dismissals d WHERE d.announcement_id=a.announcement_id AND d.user_id=$2)) ORDER BY created_at DESC`, [courseId, studentId])).rows; },
  async my(studentId) { return (await getDatabasePool().query(`SELECT ${columns}, c.course_code AS "courseCode" FROM announcements a JOIN courses c ON c.course_id=a.course_id JOIN enrolments e ON e.course_id=c.course_id AND e.student_id=$1 WHERE a.deleted_at IS NULL AND c.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM announcement_dismissals d WHERE d.announcement_id=a.announcement_id AND d.user_id=$1) ORDER BY a.created_at DESC`, [studentId])).rows; },
  async hidden(studentId) { return (await getDatabasePool().query(`SELECT ${columns}, c.course_code AS "courseCode" FROM announcements a JOIN courses c ON c.course_id=a.course_id JOIN enrolments e ON e.course_id=c.course_id AND e.student_id=$1 JOIN announcement_dismissals d ON d.announcement_id=a.announcement_id AND d.user_id=$1 WHERE a.deleted_at IS NULL AND c.archived_at IS NULL ORDER BY d.dismissed_at DESC`, [studentId])).rows; },
  async create(client, courseId, lecturerId, data) { return (await client.query(`INSERT INTO announcements AS a (course_id,lecturer_id,title,message) VALUES ($1,$2,$3,$4) RETURNING ${columns}`, [courseId, lecturerId, data.title, data.message])).rows[0]; },
  async update(client, id, data) { return (await client.query(`UPDATE announcements AS a SET title=$2,message=$3,updated_at=CURRENT_TIMESTAMP WHERE announcement_id=$1 RETURNING ${columns}`, [id, data.title, data.message])).rows[0]; },
  async remove(client, id) { await client.query('UPDATE announcements SET deleted_at=CURRENT_TIMESTAMP WHERE announcement_id=$1', [id]); },
  async dismiss(id, userId) { await getDatabasePool().query('INSERT INTO announcement_dismissals (announcement_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, userId]); },
  async restore(id, userId) { await getDatabasePool().query('DELETE FROM announcement_dismissals WHERE announcement_id=$1 AND user_id=$2', [id, userId]); },
};
