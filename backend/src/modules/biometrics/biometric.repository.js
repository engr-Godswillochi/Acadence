import { getDatabasePool } from '../../config/database.js';

const columns = `p.biometric_profile_id AS "biometricProfileId",p.student_id AS "studentId",
  p.device_id AS "deviceId",p.sensor_slot_id AS "sensorSlotId",
  p.enrolled_at AS "enrolledAt",p.is_active AS "isActive"`;

export const biometricRepository = {
  async student(id, client = getDatabasePool()) {
    return (await client.query(
      `SELECT user_id AS "userId",full_name AS "fullName",matric_number AS "matricNumber"
       FROM users WHERE user_id=$1 AND role='STUDENT'`,
      [id],
    )).rows[0];
  },

  async create(client, data) {
    return (await client.query(
      `INSERT INTO biometric_profiles AS p (student_id,device_id,sensor_slot_id)
       VALUES ($1,$2,$3) RETURNING ${columns}`,
      [data.studentId, data.deviceId, data.sensorSlotId],
    )).rows[0];
  },

  async find(id, client = getDatabasePool()) {
    return (await client.query(`SELECT ${columns} FROM biometric_profiles p WHERE p.biometric_profile_id=$1`, [id])).rows[0];
  },

  async existsForStudent(deviceId, studentId, client = getDatabasePool()) {
    return (await client.query(
      'SELECT 1 FROM biometric_profiles WHERE device_id=$1 AND student_id=$2 AND is_active=true',
      [deviceId, studentId],
    )).rowCount > 0;
  },

  async nextAvailableSlot(deviceId, capacity, client = getDatabasePool()) {
    return (await client.query(
      `SELECT slot::int AS "sensorSlotId"
       FROM generate_series(1,$2::int) slot
       WHERE NOT EXISTS (
         SELECT 1 FROM biometric_profiles p WHERE p.device_id=$1 AND p.sensor_slot_id=slot
       )
       AND NOT EXISTS (
         SELECT 1 FROM biometric_enrollment_jobs j
         WHERE j.device_id=$1 AND j.sensor_slot_id=slot AND j.status IN ('PENDING','CLAIMED')
       )
       ORDER BY slot LIMIT 1`,
      [deviceId, capacity],
    )).rows[0]?.sensorSlotId ?? null;
  },

  async list() {
    return (await getDatabasePool().query(
      `SELECT ${columns},u.full_name AS "studentName",u.email AS "studentEmail",
        u.matric_number AS "matricNumber",d.device_name AS "deviceName",
        d.is_active AS "deviceActive",d.last_seen_at AS "deviceLastSeenAt"
       FROM biometric_profiles p
       JOIN users u ON u.user_id=p.student_id
       JOIN biometric_devices d ON d.device_id=p.device_id
       ORDER BY d.device_name,u.full_name`,
    )).rows;
  },

  async remove(client, id) {
    return (await client.query('DELETE FROM biometric_profiles WHERE biometric_profile_id=$1 RETURNING biometric_profile_id', [id])).rowCount;
  },

  async students(query = '') {
    return (await getDatabasePool().query(
      `SELECT u.user_id AS "userId",u.full_name AS "fullName",u.email,
        u.matric_number AS "matricNumber",COUNT(p.biometric_profile_id)::int AS "profileCount"
       FROM users u
       LEFT JOIN biometric_profiles p ON p.student_id=u.user_id AND p.is_active=true
       WHERE u.role='STUDENT'
         AND (u.full_name ILIKE $1 OR u.matric_number ILIKE $1 OR u.email ILIKE $1)
       GROUP BY u.user_id ORDER BY u.full_name LIMIT 50`,
      [`%${query}%`],
    )).rows;
  },
};
