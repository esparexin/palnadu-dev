import { z } from 'zod';

export const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/;

export const dbIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$|^[0-9a-fA-F-]{36}$/, 'Invalid ID format');

export const publishStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
