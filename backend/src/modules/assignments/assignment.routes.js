import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { assignmentController as assignments } from './assignment.controller.js';
import { assignmentSchema, assignmentUpdateSchema, taskStatusSchema } from './assignment.validation.js';

export function createAssignmentRouter(authService) {
  const router = Router();
  const auth = createAuthenticateUser(authService);
  const lecturer = requireRole('LECTURER');
  router.get('/courses/:courseId/assignments', auth, requireRole('LECTURER', 'STUDENT'), validateIds('courseId'), assignments.listCourse);
  router.post('/courses/:courseId/assignments', auth, lecturer, validateIds('courseId'), validateBody(assignmentSchema), assignments.create);
  router.get('/assignments/my', auth, requireRole('STUDENT'), assignments.my);
  router.get('/assignments/:id', auth, requireRole('LECTURER', 'STUDENT'), validateIds('id'), assignments.get);
  router.patch('/assignments/:id', auth, lecturer, validateIds('id'), validateBody(assignmentUpdateSchema), assignments.update);
  router.delete('/assignments/:id', auth, lecturer, validateIds('id'), assignments.remove);
  router.patch('/assignments/:id/status', auth, requireRole('STUDENT'), validateIds('id'), validateBody(taskStatusSchema), assignments.setStatus);
  return router;
}
