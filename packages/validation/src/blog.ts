import { z } from 'zod';
import { dbIdSchema, publishStatusValues } from './common';

export const blogLanguageValues = ['en', 'te'] as const;
export type BlogLanguageValue = (typeof blogLanguageValues)[number];

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(2).max(300),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  language: z.enum(blogLanguageValues).default('en'),
  translationGroupId: z.string().trim().min(1).optional().nullable(),
  excerpt: z.string().trim().max(500).optional().or(z.literal('')),
  content: z.string().trim().min(50),
  coverImage: z.string().url().optional().or(z.literal('')),
  categoryId: dbIdSchema.optional(),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  ogImage: z.string().url().optional().or(z.literal('')),
  publishDate: z.string().datetime().optional().nullable().or(z.literal('')),
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

export const linkTranslationsSchema = z.object({
  postIds: z.array(dbIdSchema).min(1, 'At least one post id is required to form a translation group'),
  translationGroupId: z.string().trim().min(1).optional(),
});

export type LinkTranslationsInput = z.infer<typeof linkTranslationsSchema>;

// ─── Blog Automation & Topic Queue ────────────────────────────

export const automationGenerateSchema = z.object({
  topic: z.string().trim().min(3).max(300).optional(),
  categorySlug: z.string().trim().min(2).max(100).optional(),
  targetLocation: z.string().trim().max(200).optional(),
  forcePublish: z.boolean().optional().default(false),
  batchCount: z.number().int().min(1).max(50).optional().default(1),
  language: z.enum(blogLanguageValues).optional().default('en'),
});

export type AutomationGenerateInput = z.infer<typeof automationGenerateSchema>;

export const automationSettingsSchema = z.object({
  autoPublish: z.boolean({ required_error: 'autoPublish boolean is required' }),
});

export type AutomationSettingsInput = z.infer<typeof automationSettingsSchema>;

export const automationDiscoverSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(40),
});

export type AutomationDiscoverInput = z.infer<typeof automationDiscoverSchema>;

export const automationBilingualSchema = z
  .object({
    enabled: z.boolean().optional(),
    te: z.number().int().min(0).max(50).optional(),
    en: z.number().int().min(0).max(50).optional(),
  })
  .refine(
    (data) => data.enabled !== undefined || data.te !== undefined || data.en !== undefined,
    { message: 'Provide at least one of: enabled, te, en.' },
  );

export type AutomationBilingualInput = z.infer<typeof automationBilingualSchema>;

export const geminiKeyInputSchema = z.object({
  apiKey: z
    .string({ required_error: 'API key is required' })
    .trim()
    .min(20, 'API key must be at least 20 characters')
    .max(256, 'API key exceeds maximum length')
    .regex(
      /^(AIza|AQ)[0-9A-Za-z-_\.]{25,250}$/,
      'Invalid Gemini API key format (must start with AIza or AQ)',
    ),
  primaryModel: z.string().trim().max(100).optional(),
});

export type GeminiKeyInput = z.infer<typeof geminiKeyInputSchema>;

export const geminiRetryPendingSchema = z.object({
  primaryModel: z.string().trim().max(100).optional(),
  activate: z.boolean().optional().default(false),
});

export type GeminiRetryPendingInput = z.infer<typeof geminiRetryPendingSchema>;

