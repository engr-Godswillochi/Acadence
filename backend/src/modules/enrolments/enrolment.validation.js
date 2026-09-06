import { z } from 'zod';

export const enrolmentSchema = z.object({ studentId: z.uuid().optional(), studentEmail: z.string().trim().toLowerCase().email().max(254).optional() }).strict().refine((input) => Boolean(input.studentId) !== Boolean(input.studentEmail), 'Supply either studentId or studentEmail.');
