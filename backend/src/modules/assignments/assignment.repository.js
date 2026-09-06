import { getDatabasePool } from '../../config/database.js';

const columns = `a.assignment_id AS "assignmentId", a.course_id AS "courseId", a.title, a.description,
  a.deadline, a.difficulty_rating AS "difficultyRating", a.deleted_at AS "deletedAt"`;

export const assignmentRepository = {
  async find(id, client = getDatabasePool()) {
    const result = await client.query(`SELECT ${columns} FROM assignments a WHERE a.assignment_id=$1`, [id]);
    return result.rows[0];
  },
  async listCourse(courseId) {
    const result = await getDatabasePool().query(`SELECT ${columns} FROM assignments a WHERE a.course_id=$1 AND a.deleted_at IS NULL ORDER BY a.deadline, a.assignment_id`, [courseId]);
    return result.rows;
  },
  async listStudent(studentId) {
    const result = await getDatabasePool().query(`SELECT ${columns}, c.course_code AS "courseCode", c.credit_units AS "creditUnits", COALESCE(s.status, 'PENDING') AS status, s.completed_at AS "completedAt" FROM assignments a JOIN courses c ON c.course_id=a.course_id JOIN enrolments e ON e.course_id=c.course_id AND e.student_id=$1 LEFT JOIN student_assignment_status s ON s.assignment_id=a.assignment_id AND s.student_id=$1 WHERE a.deleted_at IS NULL AND c.archived_at IS NULL`, [studentId]);
    return result.rows;
  },
  async create(courseId, data, client) {
    const result = await client.query(`INSERT INTO assignments AS a (course_id,title,description,deadline,difficulty_rating) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`, [courseId, data.title, data.description, data.deadline, data.difficultyRating]);
    return result.rows[0];
  },
  async update(id, data, client) {
    const result = await client.query(`UPDATE assignments AS a SET title=$2, description=$3, deadline=$4, difficulty_rating=$5, updated_at=CURRENT_TIMESTAMP WHERE assignment_id=$1 RETURNING ${columns}`, [id, data.title, data.description, data.deadline, data.difficultyRating]);
    return result.rows[0];
  },
  async remove(id, client) { await client.query('UPDATE assignments SET deleted_at=CURRENT_TIMESTAMP WHERE assignment_id=$1', [id]); },
  async setStatus(id, studentId, status, client) {
    const result = await client.query(`INSERT INTO student_assignment_status (assignment_id,student_id,status,completed_at) VALUES ($1,$2,$3::varchar,CASE WHEN $3::varchar='COMPLETED' THEN CURRENT_TIMESTAMP ELSE NULL END) ON CONFLICT (assignment_id,student_id) DO UPDATE SET status=EXCLUDED.status, completed_at=CASE WHEN student_assignment_status.status='COMPLETED' AND EXCLUDED.status='COMPLETED' THEN student_assignment_status.completed_at ELSE EXCLUDED.completed_at END RETURNING status, completed_at AS "completedAt"`, [id, studentId, status]);
    return result.rows[0];
  },
};
