import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { announcementController as controller } from './announcement.controller.js';
import { announcementSchema, announcementUpdateSchema } from './announcement.validation.js';

export function createAnnouncementRouter(authService) {
  const router = Router();
  const auth = createAuthenticateUser(authService);
  router.get('/courses/:courseId/announcements', auth, requireRole('LECTURER', 'STUDENT'), validateIds('courseId'), controller.listCourse);
  router.post('/courses/:courseId/announcements', auth, requireRole('LECTURER'), validateIds('courseId'), validateBody(announcementSchema), controller.create);
  router.get('/announcements/my', auth, requireRole('STUDENT'), controller.my);
  router.get('/announcements/my/hidden', auth, requireRole('STUDENT'), controller.hidden);
  router.post('/announcements/:id/dismiss', auth, requireRole('STUDENT'), validateIds('id'), controller.dismiss);
  router.delete('/announcements/:id/dismiss', auth, requireRole('STUDENT'), validateIds('id'), controller.restore);
  router.patch('/announcements/:id', auth, requireRole('LECTURER'), validateIds('id'), validateBody(announcementUpdateSchema), controller.update);
  router.delete('/announcements/:id', auth, requireRole('LECTURER'), validateIds('id'), controller.remove);
  return router;
}
