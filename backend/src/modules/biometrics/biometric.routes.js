import { Router } from 'express';
import { createAuthenticateUser } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import { validateIds } from '../../middleware/params.middleware.js';
import { authenticateDevice } from '../devices/device.auth.js';
import { biometricService as service } from './biometric.service.js';
import { z } from 'zod';

const createDeviceSchema = z.object({ deviceName: z.string().trim().min(1).max(160), location: z.string().trim().max(160).optional() }).strict();
const updateDeviceSchema = z.object({ deviceName: z.string().trim().min(1).max(160).optional(), location: z.string().trim().max(160).nullable().optional(), isActive: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0, 'Supply at least one device change.');
const enrolSchema = z.object({ studentId: z.uuid(), deviceId: z.uuid(), sensorSlotId: z.number().int().min(1).max(65535) }).strict();
const studentSearchSchema = z.object({ q: z.string().trim().max(120).default('') }).strict();
const enrollmentJobSchema = z.object({ studentId: z.uuid(), deviceId: z.uuid() }).strict();
const enrollmentFailureSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_]+$/).max(64) }).strict();

export function createBiometricRouter(authService) {
  const router = Router();
  const authenticate = createAuthenticateUser(authService);
  router.use('/admin', authenticate, requireRole('ADMIN'));

  router.post('/admin/devices', validateBody(createDeviceSchema), async (request, response) => response.status(201).json({ success: true, data: await service.createDevice(request.validatedBody) }));
  router.get('/admin/devices', async (request, response) => response.json({ success: true, data: { devices: await service.listDevices() } }));
  router.patch('/admin/devices/:id', validateIds('id'), validateBody(updateDeviceSchema), async (request, response) => response.json({ success: true, data: { device: await service.updateDevice(request.params.id, request.validatedBody) } }));
  router.post('/admin/devices/:id/rotate-key', validateIds('id'), async (request, response) => response.json({ success: true, data: await service.rotateDeviceKey(request.params.id) }));
  router.get('/admin/students', validateQuery(studentSearchSchema), async (request, response) => response.json({ success: true, data: { students: await service.students(request.validatedQuery.q) } }));
  router.post('/admin/biometric-enrolments', validateBody(enrollmentJobSchema), async (request, response) => response.status(202).json({ success: true, data: { job: await service.createEnrollmentJob(request.user, request.validatedBody) } }));
  router.get('/admin/biometric-enrolments/:id', validateIds('id'), async (request, response) => response.json({ success: true, data: { job: await service.getEnrollmentJob(request.params.id) } }));
  router.post('/admin/biometric-enrolments/:id/cancel', validateIds('id'), async (request, response) => response.json({ success: true, data: { job: await service.cancelEnrollmentJob(request.params.id) } }));
  router.post('/admin/biometrics/enrol', validateBody(enrolSchema), async (request, response) => response.status(201).json({ success: true, data: { profile: await service.enrol(request.validatedBody) } }));
  router.get('/admin/biometrics', async (request, response) => response.json({ success: true, data: { profiles: await service.listProfiles() } }));
  router.delete('/admin/biometrics/:id', validateIds('id'), async (request, response) => { await service.remove(request.params.id); response.json({ success: true, data: {} }); });

  router.get('/device/work', authenticateDevice, async (request, response) => response.json({ success: true, data: { work: await service.deviceWork(request.device) } }));
  router.post('/device/biometric-enrolments/:id/complete', authenticateDevice, validateIds('id'), async (request, response) => response.json({ success: true, data: { profile: await service.completeEnrollment(request.device, request.params.id) } }));
  router.post('/device/biometric-enrolments/:id/fail', authenticateDevice, validateIds('id'), validateBody(enrollmentFailureSchema), async (request, response) => response.json({ success: true, data: { job: await service.failEnrollment(request.device, request.params.id, request.validatedBody.code) } }));
  return router;
}
