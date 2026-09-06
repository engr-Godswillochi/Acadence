import { ApiError } from '../../utils/apiError.js';
import { withTransaction } from '../../db/transaction.js';
import { courseService, requireCourseOwner } from '../courses/course.service.js';
import { notificationRepository } from '../notifications/notification.repository.js';
import { withNotifications } from '../notifications/notification.service.js';
import { announcementRepository as announcements } from './announcement.repository.js';

async function find(id, client) {
  const item = await announcements.find(id, client);
  if (!item || item.deletedAt) throw new ApiError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.');
  return item;
}
export const announcementService = {
  async listCourse(user, courseId) { await courseService.get(user, courseId); return announcements.listCourse(courseId); },
  my: (user) => announcements.my(user.userId),
  create: (user, courseId, data) => withNotifications(async (client, emit) => {
    await requireCourseOwner(user, courseId, client);
    const item = await announcements.create(client, courseId, user.userId, data);
    emit(await notificationRepository.createForCourse(client, courseId, { type: 'ANNOUNCEMENT', title: item.title, message: item.message, relatedEntityId: item.announcementId }));
    return item;
  }),
  update: (user, id, data) => withNotifications(async (client, emit) => {
    const initial = await find(id, client);
    await requireCourseOwner(user, initial.courseId, client);
    const item = await announcements.update(client, id, { ...await find(id, client), ...data });
    emit(await notificationRepository.createForCourse(client, item.courseId, { type: 'ANNOUNCEMENT', title: item.title, message: item.message, relatedEntityId: id }));
    return item;
  }),
  remove: (user, id) => withTransaction(async (client) => {
    const item = await find(id, client); await requireCourseOwner(user, item.courseId, client); await find(id, client); await announcements.remove(client, id);
  }),
};
