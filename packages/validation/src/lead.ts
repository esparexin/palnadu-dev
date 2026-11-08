import { z } from 'zod';
import { phoneRegex, dbIdSchema } from './common';

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

export const updateLeadSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedTo: dbIdSchema.optional().nullable(),
  notes: z.string().max(5000).optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
