import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { scheduleController as controller } from './schedule.controller.js';
import { scheduleSchema, scheduleUpdateSchema } from './schedule.validation.js';

export function createScheduleRouter(authService) {
  const router = Router();
  const auth = createAuthenticateUser(authService);
  router.get('/courses/:courseId/schedules', auth, requireRole('LECTURER', 'STUDENT'), validateIds('courseId'), controller.listCourse);
  router.post('/courses/:courseId/schedules', auth, requireRole('LECTURER'), validateIds('courseId'), validateBody(scheduleSchema), controller.create);
  router.get('/schedules/my', auth, requireRole('STUDENT'), controller.my);
  router.patch('/schedules/:id', auth, requireRole('LECTURER'), validateIds('id'), validateBody(scheduleUpdateSchema), controller.update);
  router.delete('/schedules/:id', auth, requireRole('LECTURER'), validateIds('id'), controller.remove);
  return router;
}
