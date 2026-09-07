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

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().max(20).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  problemDescription: z
    .string()
    .min(10, 'Please describe your problem in at least 10 characters')
    .max(5000),
  currentSituation: z.string().max(2000).optional().or(z.literal('')),
  projectStage: z.enum(projectStageValues),
  requiredHelp: z.enum(requiredHelpValues),
  budget: z.string().max(100).optional().or(z.literal('')),
  additionalInfo: z.string().max(3000).optional().or(z.literal('')),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

// ─── Auth ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  role: z.enum(userRoleValues),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ─── Service ──────────────────────────────────────────────────

export const publishStatusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export const createServiceSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  shortDescription: z.string().min(10).max(500),
  content: z.string().min(20),
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
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  clientId: z.string().uuid().optional(),
  problem: z.string().min(20),
  solution: z.string().min(20),
  technology: z.array(z.string()).min(1),
  result: z.string().min(20),
  images: z.array(z.string().url()).optional(),
  content: z.string().optional(),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  status: z.enum(publishStatusValues).default('DRAFT'),
});

export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;

// ─── Blog ─────────────────────────────────────────────────────

export const createBlogPostSchema = z.object({
  title: z.string().min(2).max(300),
  slug: z
    .string()
    .min(2)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(500).optional().or(z.literal('')),
  content: z.string().min(50),
  coverImage: z.string().url().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional(),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogImage: z.string().url().optional().or(z.literal('')),
  publishDate: z.string().datetime().optional(),
  status: z.enum(publishStatusValues).default('DRAFT'),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const createBlogCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).optional(),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;

// ─── Client ───────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  company: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(3000).optional().or(z.literal('')),
  leadId: z.string().uuid().optional(),
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
  name: z.string().min(2).max(200),
  clientId: z.string().uuid(),
  description: z.string().max(5000).optional().or(z.literal('')),
  status: z.enum(projectStatusValues).default('PLANNING'),
  startDate: z.string().datetime().optional(),
  expectedCompletion: z.string().datetime().optional(),
  technology: z.array(z.string()).optional(),
  budget: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ─── Media ────────────────────────────────────────────────────

export const updateMediaSchema = z.object({
  alt: z.string().max(300).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

// Re-export zod
export { z };
