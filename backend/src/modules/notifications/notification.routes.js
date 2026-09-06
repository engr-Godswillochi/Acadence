import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { notificationController as controller } from './notification.controller.js';
import { openNotificationStream } from './notification.stream.js';

export function createNotificationRouter(authService) {
  const router = Router();
  router.use(createAuthenticateUser(authService));
  router.get('/', controller.list);
  router.get('/stream', openNotificationStream);
  router.patch('/read-all', controller.markAllRead);
  router.patch('/:id/read', validateIds('id'), controller.markRead);
  return router;
}
