import { z } from 'zod';
import { Role } from '@prisma/client';

export const UserCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Invalid role' }) }),
  isActive: z.boolean().default(true),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  passwordHash: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Invalid role' }) }).optional(),
  isActive: z.boolean().optional(),
});
