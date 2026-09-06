import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { courseController as courses } from './course.controller.js';
import { courseSchema, courseUpdateSchema } from './course.validation.js';
import { enrolmentController as enrolments } from '../enrolments/enrolment.controller.js';
import { enrolmentSchema } from '../enrolments/enrolment.validation.js';

export function createCourseRouter(authService) {
  const router = Router();
  router.use(createAuthenticateUser(authService), requireRole('STUDENT', 'LECTURER'));
  router.get('/', courses.list);
  router.post('/', requireRole('LECTURER'), validateBody(courseSchema), courses.create);
  router.get('/:id', validateIds('id'), courses.get);
  router.patch('/:id', requireRole('LECTURER'), validateIds('id'), validateBody(courseUpdateSchema), courses.update);
  router.delete('/:id', requireRole('LECTURER'), validateIds('id'), courses.archive);
  router.get('/:id/students', requireRole('LECTURER'), validateIds('id'), enrolments.list);
  router.post('/:id/enrolments', requireRole('LECTURER'), validateIds('id'), validateBody(enrolmentSchema), enrolments.add);
  router.delete('/:id/enrolments/:studentId', requireRole('LECTURER'), validateIds('id', 'studentId'), enrolments.remove);
  return router;
}
