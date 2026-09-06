import { getDatabasePool } from '../../config/database.js';

export const deviceRepository = {
  async byHash(hash, client = getDatabasePool()) { return (await client.query('SELECT device_id AS "deviceId", device_name AS "deviceName", is_active AS "isActive" FROM biometric_devices WHERE api_key_hash=$1', [hash])).rows[0]; },
  async find(id, client) { return (await client.query('SELECT device_id AS "deviceId", is_active AS "isActive" FROM biometric_devices WHERE device_id=$1 FOR SHARE', [id])).rows[0]; },
  async available() { return (await getDatabasePool().query('SELECT device_id AS "deviceId", device_name AS "deviceName", location FROM biometric_devices WHERE is_active=true ORDER BY device_name')).rows; },
  async heartbeat(id) { await getDatabasePool().query('UPDATE biometric_devices SET last_seen_at=CURRENT_TIMESTAMP WHERE device_id=$1', [id]); },
};
