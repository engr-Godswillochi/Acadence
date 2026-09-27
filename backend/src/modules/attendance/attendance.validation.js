import { z } from 'zod';

export const openSessionSchema = z.object({ deviceId: z.uuid(), scheduleId: z.uuid().optional() }).strict();
export const attendanceSchema = z.object({ sessionId: z.uuid(), sensorSlotId: z.number().int().min(1).max(65535), eventId: z.string().trim().min(8).max(64).optional(), deviceTimestamp: z.iso.datetime({ offset: true }).optional() }).strict();

export const heartbeatSchema = z.object({
  mode: z.enum(['IDLE', 'ENROLLMENT', 'ATTENDANCE', 'ERROR']),
  firmwareVersion: z.string().trim().min(1).max(64).optional(),
  sensorReady: z.boolean(),
  sensorCapacity: z.number().int().min(1).max(65535).optional(),
}).strict();
