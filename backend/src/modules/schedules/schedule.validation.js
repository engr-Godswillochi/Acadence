import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm (24-hour time).');
export const scheduleSchema = z.object({
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: time,
  endTime: time,
  venue: z.string().trim().min(1).max(160),
}).strict();
export const scheduleUpdateSchema = scheduleSchema.partial().refine((data) => Object.keys(data).length > 0, 'Provide at least one field.');
