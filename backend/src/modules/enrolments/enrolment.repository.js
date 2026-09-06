import { getDatabasePool } from '../../config/database.js';

export const enrolmentRepository = {
  async exists(courseId, studentId) {
    const result = await getDatabasePool().query('SELECT 1 FROM enrolments WHERE course_id = $1 AND student_id = $2', [courseId, studentId]);
    return result.rowCount > 0;
  },
  async findStudent(input, client) {
    const result = await client.query('SELECT user_id AS "studentId", role FROM users WHERE user_id = $1 OR email = $2', [input.studentId ?? null, input.studentEmail ?? null]);
    return result.rows[0];
  },
  async list(courseId) {
    const result = await getDatabasePool().query(`SELECT u.user_id AS "studentId", u.full_name AS "fullName", u.email, u.matric_number AS "matricNumber", e.enrolled_at AS "enrolledAt" FROM enrolments e JOIN users u ON u.user_id=e.student_id WHERE e.course_id=$1 ORDER BY u.full_name`, [courseId]);
    return result.rows;
  },
  async add(courseId, studentId, client) {
    const result = await client.query('INSERT INTO enrolments (course_id, student_id) VALUES ($1, $2) RETURNING enrolment_id AS "enrolmentId", student_id AS "studentId"', [courseId, studentId]);
    return result.rows[0];
  },
  async remove(courseId, studentId, client) {
    const result = await client.query('DELETE FROM enrolments WHERE course_id=$1 AND student_id=$2', [courseId, studentId]);
    return result.rowCount;
  },
};
