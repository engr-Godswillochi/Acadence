import { ApiError } from '../../utils/apiError.js';
import { withTransaction } from '../../db/transaction.js';
import { courseService, requireCourseOwner } from '../courses/course.service.js';
import { courseRepository } from '../courses/course.repository.js';
import { enrolmentRepository } from '../enrolments/enrolment.repository.js';
import { assignmentRepository as assignments } from './assignment.repository.js';
import { orderTasks } from './assignment.priority.js';

async function findAssignment(id, client) {
  const assignment = await assignments.find(id, client);
  if (!assignment || assignment.deletedAt) throw new ApiError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found.');
  return assignment;
}

export const assignmentService = {
  async listCourse(user, courseId) { await courseService.get(user, courseId); return assignments.listCourse(courseId); },
  async my(user) { return orderTasks(await assignments.listStudent(user.userId)); },
  async get(user, id) { const assignment = await findAssignment(id); await courseService.get(user, assignment.courseId); return assignment; },
  create: (user, courseId, data) => withTransaction(async (client) => {
    await requireCourseOwner(user, courseId, client);
    if (new Date(data.deadline) <= new Date()) throw new ApiError(400, 'VALIDATION_ERROR', 'New assignments need a future deadline.');
    return assignments.create(courseId, data, client);
  }),
  update: (user, id, data) => withTransaction(async (client) => {
    const initial = await findAssignment(id, client);
    await requireCourseOwner(user, initial.courseId, client);
    const current = await findAssignment(id, client);
    return assignments.update(id, { ...current, ...data }, client);
  }),
  remove: (user, id) => withTransaction(async (client) => {
    const initial = await findAssignment(id, client);
    await requireCourseOwner(user, initial.courseId, client);
    await findAssignment(id, client);
    await assignments.remove(id, client);
  }),
  setStatus: (user, id, status) => withTransaction(async (client) => {
    const initial = await findAssignment(id, client);
    const course = await courseRepository.find(initial.courseId, client, true);
    if (!course || course.archivedAt) throw new ApiError(404, 'COURSE_NOT_FOUND', 'Course not found.');
    await findAssignment(id, client);
    if (user.role !== 'STUDENT' || !await enrolmentRepository.exists(course.courseId, user.userId)) throw new ApiError(403, 'FORBIDDEN', 'You are not enrolled in this course.');
    return assignments.setStatus(id, user.userId, status, client);
  }),
};
