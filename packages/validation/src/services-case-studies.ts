import { z } from 'zod';
import { dbIdSchema, publishStatusValues } from './common';

export const createServiceSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  shortDescription: z.string().trim().min(10).max(500),
  content: z.string().trim().min(20),
  icon: z.string().max(100).optional(),
  heroImage: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  faqs: z
    .array(
      z.object({
        question: z.string().min(5),
        answer: z.string().min(10),
      }),
    )
    .optional(),
  status: z.enum(publishStatusValues).default('DRAFT'),
  order: z.number().int().min(0).default(0),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const createCaseStudySchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  clientId: dbIdSchema.optional(),
  problem: z.string().trim().min(20),
  solution: z.string().trim().min(20),
  technology: z.array(z.string()).min(1),
  result: z.string().trim().min(20),
  images: z.array(z.string().url()).optional(),
  content: z.string().optional(),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(publishStatusValues).default('DRAFT'),
});

export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;

export const createClientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  company: z.string().trim().max(200).optional().or(z.literal('')),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(25).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(3000).optional().or(z.literal('')),
  leadId: dbIdSchema.optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const projectStatusValues = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
] as const;

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(200),
  clientId: dbIdSchema,
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  status: z.enum(projectStatusValues).default('PLANNING'),
  startDate: z.string().datetime().optional(),
  expectedCompletion: z.string().datetime().optional(),
  technology: z.array(z.string()).optional(),
  budget: z.string().trim().max(100).optional().or(z.literal('')),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateMediaSchema = z.object({
  alt: z.string().trim().max(300).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
