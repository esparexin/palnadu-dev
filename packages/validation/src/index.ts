import { z } from 'zod';

// ─── Lead / Contact Form ──────────────────────────────────────

export const projectStageValues = [
  'JUST_AN_IDEA',
  'EXISTING_BUSINESS',
  'EXISTING_PRODUCT',
  'EXISTING_WEBSITE',
  'MANUAL_PROCESS',
  'NEED_TECHNICAL_HELP',
  'OTHER',
] as const;

export const requiredHelpValues = [
  'IDEA_VALIDATION',
  'WEB_APPLICATION',
  'MOBILE_APPLICATION',
  'CUSTOM_SOFTWARE',
  'AUTOMATION',
  'TECHNICAL_CONSULTING',
  'MVP_DEVELOPMENT',
  'NOT_SURE',
] as const;

export const leadStatusValues = [
  'NEW',
  'CONTACTED',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'NOT_QUALIFIED',
  'ON_HOLD',
] as const;

export const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,16}$/;

export const createLeadSchema = z.object({
  name: z
    .string({ required_error: 'Please enter your name' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Please enter your email address' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address (e.g. name@domain.com)'),
  phone: z
    .string()
    .trim()
    .max(25, 'Phone number cannot exceed 25 characters')
    .refine((val) => !val || phoneRegex.test(val), {
      message: 'Please enter a valid phone number',
    })
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .trim()
    .max(200, 'Company name cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  problemDescription: z
    .string({ required_error: 'Please describe your idea or problem' })
    .trim()
    .min(10, 'Please share at least 10 characters about what you want to build or solve')
    .max(5000, 'Description cannot exceed 5000 characters'),
  currentSituation: z
    .string()
    .trim()
    .max(2000, 'Current situation cannot exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  projectStage: z.enum(projectStageValues).default('JUST_AN_IDEA'),
  requiredHelp: z.enum(requiredHelpValues).default('NOT_SURE'),
  budget: z
    .string()
    .trim()
    .max(100, 'Budget description cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  additionalInfo: z
    .string()
    .trim()
    .max(3000, 'Additional information cannot exceed 3000 characters')
    .optional()
    .or(z.literal('')),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const dbIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$|^[0-9a-fA-F-]{36}$/, 'Invalid ID format');

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedTo: dbIdSchema.optional().nullable(),
  notes: z.string().max(5000).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

// ─── Auth ─────────────────────────────────────────────────────

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

// ─── User ─────────────────────────────────────────────────────

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

// ─── Service ──────────────────────────────────────────────────

export const publishStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

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

// ─── Case Study ───────────────────────────────────────────────

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

// ─── Blog ─────────────────────────────────────────────────────

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(2).max(300),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500).optional().or(z.literal('')),
  content: z.string().trim().min(50),
  coverImage: z.string().url().optional().or(z.literal('')),
  categoryId: dbIdSchema.optional(),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogImage: z.string().url().optional().or(z.literal('')),
  publishDate: z.string().datetime().optional(),
  status: z.enum(publishStatusValues).default('DRAFT'),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const createBlogCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional(),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;

// ─── Client ───────────────────────────────────────────────────

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

// ─── Project ──────────────────────────────────────────────────

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

// ─── Media ────────────────────────────────────────────────────

export const updateMediaSchema = z.object({
  alt: z.string().trim().max(300).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

export { z };
