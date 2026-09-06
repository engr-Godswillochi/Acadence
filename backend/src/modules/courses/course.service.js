import { ApiError } from '../../utils/apiError.js';
import { withTransaction } from '../../db/transaction.js';
import { courseRepository as courses } from './course.repository.js';
import { enrolmentRepository as enrolments } from '../enrolments/enrolment.repository.js';

export async function requireCourseOwner(user, id, client) {
  const course = await courses.find(id, client, Boolean(client));
  if (!course || course.archivedAt) throw new ApiError(404, 'COURSE_NOT_FOUND', 'Course not found.');
  if (user.role !== 'LECTURER' || course.lecturerId !== user.userId) throw new ApiError(403, 'FORBIDDEN', 'You do not manage this course.');
  return course;
}

async function mapConflict(work) {
  try { return await work(); }
  catch (error) {
    if (error.code === '23505') throw new ApiError(409, 'COURSE_ALREADY_EXISTS', 'This course already exists for that session and semester.');
    throw error;
  }
}

export const courseService = {
  list: (user) => courses.list(user),
  create: (user, data) => mapConflict(() => courses.create(user.userId, data)),
  async get(user, id) {
    const course = await courses.find(id);
    if (!course || course.archivedAt) throw new ApiError(404, 'COURSE_NOT_FOUND', 'Course not found.');
    const allowed = user.role === 'LECTURER' ? course.lecturerId === user.userId : user.role === 'STUDENT' && await enrolments.exists(id, user.userId);
    if (!allowed) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this course.');
    return course;
  },
  update: (user, id, data) => mapConflict(() => withTransaction(async (client) => {
    const current = await requireCourseOwner(user, id, client);
    return courses.update(id, { ...current, ...data }, client);
  })),
  archive: (user, id) => withTransaction(async (client) => {
    await requireCourseOwner(user, id, client);
    await courses.archive(id, client);
  }),
};
