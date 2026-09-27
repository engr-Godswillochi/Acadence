import { getDatabasePool } from '../../config/database.js';

const columns = `c.course_id AS "courseId", c.course_code AS "courseCode", c.course_title AS "courseTitle",
  c.credit_units AS "creditUnits", c.lecturer_id AS "lecturerId", c.academic_session AS "academicSession",
  c.semester, c.archived_at AS "archivedAt"`;

export const courseRepository = {
  async list(user) {
    const condition = user.role === 'LECTURER' ? 'c.lecturer_id = $1' : 'EXISTS (SELECT 1 FROM enrolments e WHERE e.course_id = c.course_id AND e.student_id = $1)';
    const result = await getDatabasePool().query(`SELECT ${columns} FROM courses c WHERE c.archived_at IS NULL AND ${condition} ORDER BY c.course_code, c.academic_session DESC`, [user.userId]);
    return result.rows;
  },
  async listArchived(lecturerId) {
    const result = await getDatabasePool().query(`SELECT ${columns} FROM courses c WHERE c.archived_at IS NOT NULL AND c.lecturer_id = $1 ORDER BY c.archived_at DESC, c.course_code`, [lecturerId]);
    return result.rows;
  },
  async find(id, client = getDatabasePool(), lock = false) {
    const result = await client.query(`SELECT ${columns} FROM courses c WHERE c.course_id = $1 ${lock ? 'FOR UPDATE' : ''}`, [id]);
    return result.rows[0];
  },
  async create(userId, data) {
    const result = await getDatabasePool().query(`INSERT INTO courses AS c (course_code, course_title, credit_units, academic_session, semester, lecturer_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${columns}`, [data.courseCode, data.courseTitle, data.creditUnits, data.academicSession, data.semester, userId]);
    return result.rows[0];
  },
  async update(id, data, client) {
    const result = await client.query(`UPDATE courses AS c SET course_code=$2, course_title=$3, credit_units=$4, academic_session=$5, semester=$6 WHERE course_id=$1 RETURNING ${columns}`, [id, data.courseCode, data.courseTitle, data.creditUnits, data.academicSession, data.semester]);
    return result.rows[0];
  },
  async archive(id, client) {
    await client.query('UPDATE courses SET archived_at = CURRENT_TIMESTAMP WHERE course_id = $1', [id]);
  },
  async unarchive(id, client) {
    const result = await client.query(`UPDATE courses AS c SET archived_at = NULL WHERE course_id = $1 RETURNING ${columns}`, [id]);
    return result.rows[0];
  },
};
