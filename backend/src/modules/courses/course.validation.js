import { z } from 'zod';

const fields = {
  courseCode: z.string().trim().toUpperCase().min(2).max(30),
  courseTitle: z.string().trim().min(2).max(160),
  creditUnits: z.number().int().min(1).max(6),
  academicSession: z.string().regex(/^\d{4}\/\d{4}$/).refine((value) => Number(value.slice(5)) === Number(value.slice(0, 4)) + 1, 'Use consecutive academic years, such as 2026/2027.'),
  semester: z.enum(['FIRST', 'SECOND']),
};
export const courseSchema = z.object(fields).strict();
export const courseUpdateSchema = courseSchema.partial().refine((value) => Object.keys(value).length > 0, 'Supply at least one change.');
