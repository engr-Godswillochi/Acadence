import { z } from 'zod';

export const openSessionSchema = z.object({ deviceId: z.uuid(), scheduleId: z.uuid().optional() }).strict();
export const attendanceSchema = z.object({ sessionId: z.uuid(), sensorSlotId: z.number().int().min(1).max(65535), deviceTimestamp: z.iso.datetime({ offset: true }).optional() }).strict();
