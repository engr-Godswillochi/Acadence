import { getDatabasePool } from '../../config/database.js';

const columns = `notification_id AS "notificationId", recipient_id AS "recipientId", type, title, message, related_entity_id AS "relatedEntityId", is_read AS "isRead", created_at AS "createdAt"`;
export const notificationRepository = {
  async createForCourse(client, courseId, data) {
    const result = await client.query(`INSERT INTO notifications (recipient_id,type,title,message,related_entity_id) SELECT student_id,$2,$3,$4,$5 FROM enrolments WHERE course_id=$1 RETURNING ${columns}`, [courseId, data.type, data.title, data.message, data.relatedEntityId]);
    return result.rows;
  },
  async createForUser(client, userId, data) {
    const result = await client.query(`INSERT INTO notifications (recipient_id,type,title,message,related_entity_id) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`, [userId, data.type, data.title, data.message, data.relatedEntityId]);
    return result.rows;
  },
  async list(userId) {
    const result = await getDatabasePool().query(`SELECT ${columns} FROM notifications WHERE recipient_id=$1 ORDER BY created_at DESC, notification_id DESC LIMIT 100`, [userId]);
    const count = await getDatabasePool().query('SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id=$1 AND is_read=FALSE', [userId]);
    return { notifications: result.rows, unreadCount: count.rows[0].count };
  },
  async markRead(userId, id) {
    const result = await getDatabasePool().query('UPDATE notifications SET is_read=TRUE WHERE recipient_id=$1 AND notification_id=$2', [userId, id]);
    return result.rowCount;
  },
  async markAllRead(userId) { await getDatabasePool().query('UPDATE notifications SET is_read=TRUE WHERE recipient_id=$1 AND is_read=FALSE', [userId]); },
};
