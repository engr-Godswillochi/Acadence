import { getDatabasePool } from '../../config/database.js';

const columns = `s.schedule_id AS "scheduleId", s.course_id AS "courseId", s.day_of_week AS "dayOfWeek", to_char(s.start_time,'HH24:MI') AS "startTime", to_char(s.end_time,'HH24:MI') AS "endTime", s.venue, s.created_at AS "createdAt", s.updated_at AS "updatedAt"`;
export const scheduleRepository = {
  async find(id, client = getDatabasePool()) { return (await client.query(`SELECT ${columns} FROM schedules s WHERE schedule_id=$1`, [id])).rows[0]; },
  async listCourse(id) { return (await getDatabasePool().query(`SELECT ${columns} FROM schedules s WHERE course_id=$1 ORDER BY start_time,schedule_id`, [id])).rows; },
  async my(studentId) { return (await getDatabasePool().query(`SELECT ${columns}, c.course_code AS "courseCode", c.course_title AS "courseTitle" FROM schedules s JOIN courses c ON c.course_id=s.course_id JOIN enrolments e ON e.course_id=c.course_id AND e.student_id=$1 WHERE c.archived_at IS NULL ORDER BY s.start_time,s.schedule_id`, [studentId])).rows; },
  async create(client, courseId, data) { return (await client.query(`INSERT INTO schedules AS s (course_id,day_of_week,start_time,end_time,venue) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`, [courseId, data.dayOfWeek, data.startTime, data.endTime, data.venue])).rows[0]; },
  async update(client, id, data) { return (await client.query(`UPDATE schedules AS s SET day_of_week=$2,start_time=$3,end_time=$4,venue=$5,updated_at=CURRENT_TIMESTAMP WHERE schedule_id=$1 RETURNING ${columns}`, [id, data.dayOfWeek, data.startTime, data.endTime, data.venue])).rows[0]; },
  async remove(client, id) { await client.query('DELETE FROM schedules WHERE schedule_id=$1', [id]); },
};
