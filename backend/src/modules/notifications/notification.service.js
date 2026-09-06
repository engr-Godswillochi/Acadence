import { withTransaction } from '../../db/transaction.js';
import { ApiError } from '../../utils/apiError.js';
import { notificationRepository } from './notification.repository.js';
import { publishNotifications } from './notification.stream.js';

export async function withNotifications(work) {
  const pending = [];
  const result = await withTransaction((client) => work(client, (rows) => pending.push(...rows)));
  publishNotifications(pending);
  return result;
}

export const notificationService = {
  list: (user) => notificationRepository.list(user.userId),
  async markRead(user, id) {
    if (!await notificationRepository.markRead(user.userId, id)) throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  },
  markAllRead: (user) => notificationRepository.markAllRead(user.userId),
};
