import { randomBytes } from 'node:crypto';

import { getDatabasePool } from '../../config/database.js';

const columns = `l.link_id AS "linkId", l.course_id AS "courseId", l.token, l.expires_at AS "expiresAt", l.created_at AS "createdAt", l.revoked_at AS "revokedAt"`;

// 256 bits of entropy, so a leaked link cannot be guessed and the token never needs
// to be short enough to remember.
export function generateEnrolmentToken() {
  return randomBytes(32).toString('base64url');
}

export const enrolmentLinkRepository = {
  async findActiveByCourse(courseId, client = getDatabasePool()) {
    return (await client.query(
      `SELECT ${columns} FROM course_enrolment_links l WHERE l.course_id=$1 AND l.revoked_at IS NULL ORDER BY l.created_at DESC LIMIT 1`,
      [courseId],
    )).rows[0];
  },
  async revokeActiveByCourse(client, courseId) {
    await client.query('UPDATE course_enrolment_links SET revoked_at=CURRENT_TIMESTAMP WHERE course_id=$1 AND revoked_at IS NULL', [courseId]);
  },
  async create(client, courseId, token, expiresAt) {
    return (await client.query(
      `INSERT INTO course_enrolment_links AS l (course_id, token, expires_at) VALUES ($1,$2,$3) RETURNING ${columns}`,
      [courseId, token, expiresAt],
    )).rows[0];
  },
  // The public preview and the redeem path both need the course behind the token,
  // so they share one lookup and one definition of "still usable".
  async findUsableByToken(token, client = getDatabasePool()) {
    return (await client.query(
      `SELECT ${columns},
              c.course_code AS "courseCode", c.course_title AS "courseTitle", c.credit_units AS "creditUnits",
              c.academic_session AS "academicSession", c.semester, c.lecturer_id AS "lecturerId",
              u.full_name AS "lecturerName"
         FROM course_enrolment_links l
         JOIN courses c ON c.course_id = l.course_id
         JOIN users u ON u.user_id = c.lecturer_id
        WHERE l.token = $1
          AND l.revoked_at IS NULL
          AND l.expires_at > CURRENT_TIMESTAMP
          AND c.archived_at IS NULL`,
      [token],
    )).rows[0];
  },
  async findAnyByToken(token, client = getDatabasePool()) {
    return (await client.query(`SELECT ${columns} FROM course_enrolment_links l WHERE l.token = $1`, [token])).rows[0];
  },
};
