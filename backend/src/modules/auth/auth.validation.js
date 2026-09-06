import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8, 'Use at least 8 characters.').refine(
  (value) => Buffer.byteLength(value, 'utf8') <= 72,
  'Use a password of at most 72 UTF-8 bytes.',
);
const identifier = z.string().trim().toUpperCase().min(1).max(50);

export const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email,
  password,
  role: z.enum(['STUDENT', 'LECTURER']),
  matricNumber: identifier.optional(),
  staffNumber: identifier.optional(),
}).strict().superRefine((data, context) => {
  if (data.role === 'STUDENT' && !data.matricNumber) {
    context.addIssue({ code: 'custom', path: ['matricNumber'], message: 'Matric number is required.' });
  }
  if ((data.role === 'STUDENT' && data.staffNumber) || (data.role === 'LECTURER' && data.matricNumber)) {
    context.addIssue({ code: 'custom', path: ['role'], message: 'Use the identifier for your selected role.' });
  }
});

export const loginSchema = z.object({ email, password }).strict();
