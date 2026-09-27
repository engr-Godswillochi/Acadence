import { ApiError } from '../../utils/apiError.js';
import { courseService, requireCourseOwner } from '../courses/course.service.js';
import { notificationRepository } from '../notifications/notification.repository.js';
import { withNotifications } from '../notifications/notification.service.js';
import { scheduleRepository as schedules } from './schedule.repository.js';

function validateRange(data) {
  if (data.startTime >= data.endTime) throw new ApiError(400, 'VALIDATION_ERROR', 'Start time must be before end time. Overnight classes must use separate schedules.');
}
async function find(id, client) {
  const item = await schedules.find(id, client);
  if (!item) throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule not found.');
  return item;
}
async function notify(client, emit, item, action) {
  emit(await notificationRepository.createForCourse(client, item.courseId, {
    type: 'SCHEDULE_CHANGED', title: `Class schedule ${action}`,
    message: `${item.dayOfWeek}, ${item.startTime}–${item.endTime} · ${item.venue} (Africa/Lagos)`, relatedEntityId: item.scheduleId,
  }));
}
export const scheduleService = {
  async listCourse(user, id) { await courseService.get(user, id); return schedules.listCourse(id); },
  my: (user) => schedules.my(user.userId),
  teaching: (user) => schedules.teaching(user.userId),
  create: (user, courseId, data) => withNotifications(async (client, emit) => {
    await requireCourseOwner(user, courseId, client);
    validateRange(data);
    const item = await schedules.create(client, courseId, data);
    await notify(client, emit, item, 'created');
    return item;
  }),
  update: (user, id, data) => withNotifications(async (client, emit) => {
    const initial = await find(id, client);
    await requireCourseOwner(user, initial.courseId, client);
    const merged = { ...await find(id, client), ...data };
    validateRange(merged);
    const item = await schedules.update(client, id, merged);
    await notify(client, emit, item, 'updated');
    return item;
  }),
  remove: (user, id) => withNotifications(async (client, emit) => {
    const initial = await find(id, client);
    await requireCourseOwner(user, initial.courseId, client);
    const item = await find(id, client);
    await schedules.remove(client, id);
    await notify(client, emit, item, 'removed');
  }),
};
