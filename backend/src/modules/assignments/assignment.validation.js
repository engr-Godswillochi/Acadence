import { z } from 'zod';

const fields = {
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(10000),
  deadline: z.iso.datetime({ offset: true }),
  difficultyRating: z.number().int().min(1).max(5),
};
export const assignmentSchema = z.object({ ...fields, description: fields.description.default('') }).strict();
export const assignmentUpdateSchema = z.object(fields).strict().partial().refine((value) => Object.keys(value).length > 0, 'Supply at least one change.');
export const taskStatusSchema = z.object({ status: z.enum(['PENDING', 'COMPLETED']) }).strict();
