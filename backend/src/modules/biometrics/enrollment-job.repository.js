import { getDatabasePool } from '../../config/database.js';

const columns = `j.job_id AS "jobId",j.student_id AS "studentId",j.device_id AS "deviceId",
  j.sensor_slot_id AS "sensorSlotId",j.requested_by AS "requestedBy",
  j.biometric_profile_id AS "biometricProfileId",j.status,j.failure_code AS "failureCode",
  j.created_at AS "createdAt",j.claimed_at AS "claimedAt",
  j.completed_at AS "completedAt",j.expires_at AS "expiresAt"`;

export const enrollmentJobRepository = {
  async expire(client = getDatabasePool(), deviceId = null) {
    await client.query(
      `UPDATE biometric_enrollment_jobs
       SET status='EXPIRED',completed_at=CURRENT_TIMESTAMP
       WHERE status IN ('PENDING','CLAIMED') AND expires_at<=CURRENT_TIMESTAMP
         AND ($1::uuid IS NULL OR device_id=$1)`,
      [deviceId],
    );
  },

  async create(client, data) {
    return (await client.query(
      `INSERT INTO biometric_enrollment_jobs AS j
        (student_id,device_id,sensor_slot_id,requested_by)
       VALUES ($1,$2,$3,$4) RETURNING ${columns}`,
      [data.studentId, data.deviceId, data.sensorSlotId, data.requestedBy],
    )).rows[0];
  },

  async find(id, client = getDatabasePool(), lock = false) {
    return (await client.query(
      `SELECT ${columns},u.full_name AS "studentName",u.matric_number AS "matricNumber",
        d.device_name AS "deviceName"
       FROM biometric_enrollment_jobs j
       JOIN users u ON u.user_id=j.student_id
       JOIN biometric_devices d ON d.device_id=j.device_id
       WHERE j.job_id=$1 ${lock ? 'FOR UPDATE OF j' : ''}`,
      [id],
    )).rows[0];
  },

  async activeForDevice(client, deviceId, lock = false) {
    return (await client.query(
      `SELECT ${columns},u.full_name AS "studentName",u.matric_number AS "matricNumber",
        d.device_name AS "deviceName"
       FROM biometric_enrollment_jobs j
       JOIN users u ON u.user_id=j.student_id
       JOIN biometric_devices d ON d.device_id=j.device_id
       WHERE j.device_id=$1 AND j.status IN ('PENDING','CLAIMED')
         AND j.expires_at>CURRENT_TIMESTAMP
       ORDER BY j.created_at LIMIT 1 ${lock ? 'FOR UPDATE OF j' : ''}`,
      [deviceId],
    )).rows[0];
  },

  async claim(client, id) {
    return (await client.query(
      `UPDATE biometric_enrollment_jobs AS j
       SET status='CLAIMED',claimed_at=COALESCE(claimed_at,CURRENT_TIMESTAMP)
       WHERE job_id=$1 AND status IN ('PENDING','CLAIMED') RETURNING ${columns}`,
      [id],
    )).rows[0];
  },

  async complete(client, id, profileId) {
    return (await client.query(
      `UPDATE biometric_enrollment_jobs AS j
       SET status='COMPLETED',biometric_profile_id=$2,completed_at=CURRENT_TIMESTAMP
       WHERE job_id=$1 RETURNING ${columns}`,
      [id, profileId],
    )).rows[0];
  },

  async fail(client, id, failureCode) {
    return (await client.query(
      `UPDATE biometric_enrollment_jobs AS j
       SET status='FAILED',failure_code=$2,completed_at=CURRENT_TIMESTAMP
       WHERE job_id=$1 AND status IN ('PENDING','CLAIMED') RETURNING ${columns}`,
      [id, failureCode],
    )).rows[0];
  },

  async cancel(client, id) {
    return (await client.query(
      `UPDATE biometric_enrollment_jobs AS j
       SET status='CANCELLED',completed_at=CURRENT_TIMESTAMP
       WHERE job_id=$1 AND status IN ('PENDING','CLAIMED') RETURNING ${columns}`,
      [id],
    )).rows[0];
  },
};
