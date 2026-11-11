import { z } from 'zod';

export const whatsAppConsentTypeSchema = z.enum([
  'WEBSITE_LEAD_FORM',
  'INBOUND_WHATSAPP_INQUIRY',
  'SIGNED_AGREEMENT',
  'VERIFIED_CRM_LEAD',
]);

export const whatsAppConsentEvidenceSchema = z.object({
  consentType: whatsAppConsentTypeSchema,
  consentEvidenceRef: z
    .string()
    .trim()
    .min(3, 'Consent evidence reference must be at least 3 characters')
    .max(100, 'Consent evidence reference must not exceed 100 characters'),
  consentTimestamp: z
    .string()
    .datetime({ message: 'Consent timestamp must be a valid ISO datetime' }),
  recipientPhone: z
    .string()
    .trim()
    .min(8, 'Consent recipient phone number must be at least 8 digits')
    .max(20, 'Consent recipient phone number must not exceed 20 digits'),
});

export const sendIndividualOutreachSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number must be at least 8 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^\+?[0-9\s\-()]+$/, 'Phone number contains invalid characters'),
  businessName: z
    .string()
    .trim()
    .min(1, 'Business name is required')
    .max(100, 'Business name must not exceed 100 characters'),
  contactName: z
    .string()
    .trim()
    .max(100, 'Contact name must not exceed 100 characters')
    .optional(),
  templateName: z
    .string()
    .trim()
    .min(1, 'Template name is required')
    .max(100, 'Template name must not exceed 100 characters'),
  languageCode: z
    .string()
    .trim()
    .min(2, 'Language code must be at least 2 characters')
    .max(10, 'Language code must not exceed 10 characters'),
  parameters: z.record(z.string()).optional(),
  consentEvidence: whatsAppConsentEvidenceSchema,
  idempotencyKey: z
    .string()
    .trim()
    .min(8, 'Idempotency key must be at least 8 characters')
    .max(64, 'Idempotency key must not exceed 64 characters')
    .optional(),
  saveContact: z.boolean().default(false),
});

export type WhatsAppConsentEvidenceInput = z.infer<typeof whatsAppConsentEvidenceSchema>;
export type SendIndividualOutreachInput = z.infer<typeof sendIndividualOutreachSchema>;
