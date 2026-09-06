import { withTransaction } from '../../db/transaction.js';
import { ApiError } from '../../utils/apiError.js';
import { requireCourseOwner } from '../courses/course.service.js';
import { enrolmentRepository as enrolments } from './enrolment.repository.js';

export const enrolmentService = {
  async list(user, courseId) {
    await requireCourseOwner(user, courseId);
    return enrolments.list(courseId);
  },
  add: (user, courseId, input) => withTransaction(async (client) => {
    // The course lock serializes enrolment changes against archival.
    await requireCourseOwner(user, courseId, client);
    const student = await enrolments.findStudent(input, client);
    if (!student || student.role !== 'STUDENT') throw new ApiError(404, 'STUDENT_NOT_FOUND', 'No student account matches these details.');
    try { return await enrolments.add(courseId, student.studentId, client); }
    catch (error) {
      if (error.code === '23505') throw new ApiError(409, 'ALREADY_ENROLLED', 'This student is already enrolled.');
      throw error;
    }
  }),
  remove: (user, courseId, studentId) => withTransaction(async (client) => {
    await requireCourseOwner(user, courseId, client);
    if (!await enrolments.remove(courseId, studentId, client)) throw new ApiError(404, 'STUDENT_NOT_ENROLLED', 'This student is not enrolled.');
  }),
};
