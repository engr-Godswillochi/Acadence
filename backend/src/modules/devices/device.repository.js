import { getDatabasePool } from '../../config/database.js';

const columns = `device_id AS "deviceId", device_name AS "deviceName", location,
  is_active AS "isActive", last_seen_at AS "lastSeenAt", reported_mode AS "reportedMode",
  firmware_version AS "firmwareVersion", sensor_ready AS "sensorReady",
  sensor_capacity AS "sensorCapacity", status_updated_at AS "statusUpdatedAt",
  created_at AS "createdAt"`;

export const deviceRepository = {
  async byHash(hash, client = getDatabasePool()) {
    return (await client.query(`SELECT ${columns} FROM biometric_devices WHERE api_key_hash=$1`, [hash])).rows[0];
  },

  async find(id, client = getDatabasePool(), lock = 'share') {
    const lockClause = lock === 'update' ? 'FOR UPDATE' : lock === 'share' ? 'FOR SHARE' : '';
    return (await client.query(`SELECT ${columns} FROM biometric_devices WHERE device_id=$1 ${lockClause}`, [id])).rows[0];
  },

  async available() {
    return (await getDatabasePool().query(
      `SELECT ${columns}
       FROM biometric_devices d
       WHERE d.is_active=true
         AND d.last_seen_at > CURRENT_TIMESTAMP - INTERVAL '2 minutes'
         AND d.sensor_ready=true
         AND d.reported_mode='IDLE'
         AND NOT EXISTS (
           SELECT 1 FROM biometric_enrollment_jobs j
           WHERE j.device_id=d.device_id AND j.status IN ('PENDING','CLAIMED')
         )
         AND NOT EXISTS (
           SELECT 1 FROM attendance_sessions s
           WHERE s.device_id=d.device_id AND s.status='ACTIVE'
         )
       ORDER BY d.device_name`,
    )).rows;
  },

  async isAvailable(id, client = getDatabasePool()) {
    return (await client.query(
      `SELECT 1 FROM biometric_devices d
       WHERE d.device_id=$1 AND d.is_active=true
         AND d.last_seen_at > CURRENT_TIMESTAMP - INTERVAL '2 minutes'
         AND d.sensor_ready=true AND d.reported_mode='IDLE'
         AND NOT EXISTS (
           SELECT 1 FROM biometric_enrollment_jobs j
           WHERE j.device_id=d.device_id AND j.status IN ('PENDING','CLAIMED')
         )
         AND NOT EXISTS (
           SELECT 1 FROM attendance_sessions s
           WHERE s.device_id=d.device_id AND s.status='ACTIVE'
         )`,
      [id],
    )).rowCount > 0;
  },

  async heartbeat(id, status) {
    await getDatabasePool().query(
      `UPDATE biometric_devices
       SET last_seen_at=CURRENT_TIMESTAMP, reported_mode=$2,
           firmware_version=COALESCE($3,firmware_version), sensor_ready=$4,
           sensor_capacity=COALESCE($5,sensor_capacity), status_updated_at=CURRENT_TIMESTAMP
       WHERE device_id=$1`,
      [id, status.mode, status.firmwareVersion ?? null, status.sensorReady, status.sensorCapacity ?? null],
    );
  },

  async create(data) {
    return (await getDatabasePool().query(
      `INSERT INTO biometric_devices (device_name,api_key_hash,location)
       VALUES ($1,$2,$3) RETURNING ${columns}`,
      [data.deviceName, data.apiKeyHash, data.location ?? null],
    )).rows[0];
  },

  async list() {
    return (await getDatabasePool().query(`SELECT ${columns} FROM biometric_devices ORDER BY device_name`)).rows;
  },

  async update(id, data, client = getDatabasePool()) {
    return (await client.query(
      `UPDATE biometric_devices SET device_name=$2,location=$3,is_active=$4
       WHERE device_id=$1 RETURNING ${columns}`,
      [id, data.deviceName, data.location ?? null, data.isActive],
    )).rows[0];
  },

  async rotateKey(id, apiKeyHash, client = getDatabasePool()) {
    return (await client.query(
      `UPDATE biometric_devices SET api_key_hash=$2 WHERE device_id=$1
       RETURNING device_id AS "deviceId",device_name AS "deviceName"`,
      [id, apiKeyHash],
    )).rows[0];
  },
};
