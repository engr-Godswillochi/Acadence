import { z } from 'zod';
export const announcementSchema = z.object({ title: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(10000) }).strict();
export const announcementUpdateSchema = announcementSchema.partial().refine((value) => Object.keys(value).length > 0, 'Supply at least one change.');
