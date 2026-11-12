import { z } from 'zod';

export const whatsAppWebhookVerifySchema = z
  .preprocess((input) => {
    if (!input || typeof input !== 'object') return input;
    const record = input as Record<string, unknown>;
    const hub =
      record.hub && typeof record.hub === 'object'
        ? (record.hub as Record<string, unknown>)
        : undefined;

    return {
      'hub.mode': record['hub.mode'] ?? hub?.mode,
      'hub.challenge':
        record['hub.challenge'] !== undefined
          ? String(record['hub.challenge'])
          : hub?.challenge !== undefined
            ? String(hub.challenge)
            : undefined,
      'hub.verify_token': record['hub.verify_token'] ?? hub?.verify_token,
    };
  }, z.object({
    'hub.mode': z.literal('subscribe', {
      errorMap: () => ({ message: 'hub.mode must be "subscribe"' }),
    }),
    'hub.challenge': z.string().min(1, 'hub.challenge is required'),
    'hub.verify_token': z.string().min(1, 'hub.verify_token is required'),
  }));

export type WhatsAppWebhookVerifyInput = z.infer<typeof whatsAppWebhookVerifySchema>;

export const whatsAppRawMessageSchema = z
  .object({
    from: z.string(),
    id: z.string(),
    timestamp: z.string(),
    type: z.string().default('text'),
    text: z.object({ body: z.string() }).optional(),
    image: z
      .object({
        id: z.string().optional(),
        mime_type: z.string().optional(),
        caption: z.string().optional(),
      })
      .passthrough()
      .optional(),
    document: z
      .object({
        id: z.string().optional(),
        mime_type: z.string().optional(),
        caption: z.string().optional(),
      })
      .passthrough()
      .optional(),
    audio: z
      .object({
        id: z.string().optional(),
        mime_type: z.string().optional(),
      })
      .passthrough()
      .optional(),
    video: z
      .object({
        id: z.string().optional(),
        mime_type: z.string().optional(),
        caption: z.string().optional(),
      })
      .passthrough()
      .optional(),
    interactive: z
      .object({
        type: z.string().optional(),
        button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
        list_reply: z
          .object({ id: z.string(), title: z.string(), description: z.string().optional() })
          .optional(),
      })
      .passthrough()
      .optional(),
    button: z
      .object({ text: z.string().optional(), payload: z.string().optional() })
      .passthrough()
      .optional(),
    location: z
      .object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        name: z.string().optional(),
        address: z.string().optional(),
      })
      .passthrough()
      .optional(),
    reaction: z
      .object({ message_id: z.string().optional(), emoji: z.string().optional() })
      .passthrough()
      .optional(),
    context: z
      .object({ from: z.string().optional(), id: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const whatsAppChangeValueSchema = z
  .object({
    messaging_product: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    contacts: z.array(z.record(z.unknown())).optional(),
    messages: z.array(whatsAppRawMessageSchema).optional(),
    statuses: z.array(z.record(z.unknown())).optional(),
  })
  .passthrough();

export const whatsAppChangeSchema = z
  .object({
    field: z.string(),
    value: whatsAppChangeValueSchema,
  })
  .passthrough();

export const whatsAppEntrySchema = z
  .object({
    id: z.string().optional(),
    changes: z.array(whatsAppChangeSchema).optional(),
  })
  .passthrough();

export const whatsAppWebhookPayloadSchema: z.ZodType<Record<string, unknown>> = z
  .object({
    object: z.string(),
    entry: z.array(whatsAppEntrySchema).optional(),
  })
  .passthrough();


export type WhatsAppWebhookPayloadValidated = z.infer<typeof whatsAppWebhookPayloadSchema>;

export const whatsAppTemplateParameterSchema = z
  .object({
    type: z.enum(['text', 'currency', 'date_time', 'image', 'document', 'video']),
    text: z.string().optional(),
    image: z.object({ id: z.string().optional(), link: z.string().optional() }).optional(),
    document: z
      .object({ id: z.string().optional(), link: z.string().optional(), filename: z.string().optional() })
      .optional(),
    video: z.object({ id: z.string().optional(), link: z.string().optional() }).optional(),
    currency: z
      .object({ fallback_value: z.string(), code: z.string(), amount_1000: z.number() })
      .optional(),
    date_time: z.object({ fallback_value: z.string() }).optional(),
  })
  .passthrough();

export const whatsAppTemplateComponentSchema = z
  .object({
    type: z.enum(['header', 'body', 'button']),
    sub_type: z.enum(['url', 'quick_reply']).optional(),
    index: z.string().optional(),
    parameters: z.array(whatsAppTemplateParameterSchema).default([]),
  })
  .passthrough();

export const whatsAppSendTemplateSchema = z.object({
  to: z.string().min(1, 'Recipient phone number is required'),
  templateName: z.string().min(1, 'Template name is required'),
  languageCode: z.string().min(2, 'Valid language code is required'),
  components: z.array(whatsAppTemplateComponentSchema).optional(),
});

export type WhatsAppSendTemplateInput = z.infer<typeof whatsAppSendTemplateSchema>;

export const createMarketingCampaignSchema = z.object({
  name: z.string().trim().min(1, 'Campaign name is required'),
  description: z.string().trim().optional(),
  templateName: z.string().trim().min(1, 'Template name is required'),
  languageCode: z.string().trim().min(2, 'Valid language code is required'),
  targetAudience: z.string().trim().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const createMarketingContactSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  contactName: z.string().optional(),
  phone: z.string().min(8, 'Valid phone number is required'),
  city: z.string().optional().default('Palnadu'),
  category: z.string().optional(),
  hasWebsite: z.boolean().default(false),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type CreateMarketingCampaignInput = z.infer<typeof createMarketingCampaignSchema>;
export type CreateMarketingContactInput = z.infer<typeof createMarketingContactSchema>;




