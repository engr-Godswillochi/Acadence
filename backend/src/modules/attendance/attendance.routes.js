import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { authenticateDevice } from '../devices/device.auth.js';
import { attendanceController as controller } from './attendance.controller.js';
import { attendanceSchema, openSessionSchema } from './attendance.validation.js';

export function createAttendanceRouter(authService) {
  const router = Router();
  const auth = createAuthenticateUser(authService);
  router.get('/courses/:courseId/attendance-sessions', auth, requireRole('LECTURER'), validateIds('courseId'), controller.list);
  router.post('/courses/:courseId/attendance-sessions', auth, requireRole('LECTURER'), validateIds('courseId'), validateBody(openSessionSchema), controller.open);
  router.get('/attendance-sessions/:id', auth, requireRole('LECTURER'), validateIds('id'), controller.get);
  router.patch('/attendance-sessions/:id/close', auth, requireRole('LECTURER'), validateIds('id'), controller.close);
  router.get('/attendance-sessions/:id/live', auth, requireRole('LECTURER'), validateIds('id'), controller.records);
  router.get('/attendance-sessions/:id/records', auth, requireRole('LECTURER'), validateIds('id'), controller.records);
  router.get('/attendance/devices', auth, requireRole('LECTURER'), controller.devices);
  router.get('/attendance/my', auth, requireRole('STUDENT'), controller.my);
  router.get('/attendance/my/summary', auth, requireRole('STUDENT'), controller.summary);
  router.get('/device/session/active', authenticateDevice, controller.active);
  router.post('/device/attendance', authenticateDevice, validateBody(attendanceSchema), controller.submit);
  router.post('/device/heartbeat', authenticateDevice, controller.heartbeat);
  return router;
}
