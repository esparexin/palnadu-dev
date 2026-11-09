import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Please enter your email' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Please enter your password' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const userRoleValues = [
  'SUPER_ADMIN',
  'ADMIN',
  'EDITOR',
  'PROJECT_MANAGER',
  'DEVELOPER',
] as const;

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(100),
  role: z.enum(userRoleValues),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(userRoleValues).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
