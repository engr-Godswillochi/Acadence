import { ApiError } from '../../utils/apiError.js';
import { withTransaction } from '../../db/transaction.js';
import { courseRepository } from '../courses/course.repository.js';
import { requireCourseOwner } from '../courses/course.service.js';
import { scheduleRepository } from '../schedules/schedule.repository.js';
import { deviceRepository } from '../devices/device.repository.js';
import { notificationRepository } from '../notifications/notification.repository.js';
import { withNotifications } from '../notifications/notification.service.js';
import { attendanceRepository as attendance } from './attendance.repository.js';

async function find(id, client) {
  const item = await attendance.find(id, client);
  if (!item) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Attendance session not found.');
  return item;
}
async function owner(user, courseId, client) {
  const course = await courseRepository.find(courseId, client, Boolean(client));
  if (!course) throw new ApiError(404, 'COURSE_NOT_FOUND', 'Course not found.');
  if (user.role !== 'LECTURER' || user.userId !== course.lecturerId) throw new ApiError(403, 'FORBIDDEN', 'You do not manage this course.');
  return course;
}
export const attendanceService = {
  async list(user, courseId) { await owner(user, courseId); return attendance.list(courseId); },
  async get(user, id) { const item = await find(id); await owner(user, item.courseId); return item; },
  async records(user, id) { await this.get(user, id); return attendance.records(id); },
  async open(user, courseId, data) {
    try {
      return await withTransaction(async (client) => {
        await requireCourseOwner(user, courseId, client);
        if (!await deviceRepository.isAvailable(data.deviceId, client)) throw new ApiError(409, 'DEVICE_UNAVAILABLE', 'Choose an online, idle device with a ready fingerprint sensor.');
        if (data.scheduleId && (await scheduleRepository.find(data.scheduleId, client))?.courseId !== courseId) throw new ApiError(400, 'VALIDATION_ERROR', 'Schedule must belong to this course.');
        return attendance.open(client, user.userId, courseId, data);
      });
    } catch (error) {
      if (error.code === '23505') throw new ApiError(409, 'SESSION_ALREADY_ACTIVE', 'This course or device already has an active session.');
      throw error;
    }
  },
  close: (user, id) => withTransaction(async (client) => {
    const initial = await find(id, client);
    await owner(user, initial.courseId, client);
    const item = await find(id, client);
    if (item.status === 'CLOSED') throw new ApiError(409, 'SESSION_ALREADY_CLOSED', 'Session already closed.');
    return attendance.close(client, id);
  }),
  active: (device) => attendance.active(device.deviceId),
  heartbeat: (device, status) => deviceRepository.heartbeat(device.deviceId, status),
  async devices(user) {
    if (user.role !== 'LECTURER') throw new ApiError(403, 'FORBIDDEN', 'Lecturer access required.');
    return deviceRepository.available();
  },
  async submit(device, data) {
    try {
      return await withNotifications(async (client, emit) => {
        const initial = await find(data.sessionId, client);
        const course = await courseRepository.find(initial.courseId, client, true);
        if (!(await deviceRepository.find(device.deviceId, client))?.isActive) throw new ApiError(401, 'DEVICE_UNAUTHORIZED', 'Unauthorized device.');
        const session = await find(data.sessionId, client);
        if (session.deviceId !== device.deviceId) throw new ApiError(403, 'DEVICE_UNAUTHORIZED', 'Device not assigned to session.');
        if (course.archivedAt || session.status !== 'ACTIVE') throw new ApiError(409, 'NO_ACTIVE_SESSION', 'No active session.');
        const profile = await attendance.profile(client, device.deviceId, data.sensorSlotId);
        if (!profile) throw new ApiError(404, 'BIOMETRIC_PROFILE_NOT_FOUND', 'Unknown fingerprint mapping.');
        if (!await attendance.eligible(client, session.sessionId, course.courseId, profile.studentId)) throw new ApiError(403, 'STUDENT_NOT_ENROLLED', 'Not enrolled in this session.');
        const record = await attendance.record(client, session.sessionId, profile.studentId, device.deviceId, data.eventId);
        emit(await notificationRepository.createForUser(client, profile.studentId, { type: 'ATTENDANCE_RECORDED', title: 'Attendance recorded', message: `${course.courseCode}: attendance recorded.`, relatedEntityId: session.sessionId }));
        return { ...record, studentName: profile.studentName };
      });
    } catch (error) {
      if (error.code === '23505') throw new ApiError(409, 'ATTENDANCE_ALREADY_RECORDED', 'Attendance already recorded.');
      throw error;
    }
  },
  my: (user) => attendance.my(user.userId),
  summary: (user) => attendance.summary(user.userId),
};
