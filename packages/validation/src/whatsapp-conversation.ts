import { z } from 'zod';

export const whatsAppConversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  humanTakeover: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        if (val.toLowerCase() === 'true') return true;
        if (val.toLowerCase() === 'false') return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  search: z.string().trim().optional(),
});

export type WhatsAppConversationQueryInput = z.infer<
  typeof whatsAppConversationQuerySchema
>;

export const whatsAppTakeoverSchema = z.object({
  enabled: z.boolean({
    required_error: 'enabled is required',
    invalid_type_error: 'enabled must be a boolean',
  }),
});

export type WhatsAppTakeoverInput = z.infer<typeof whatsAppTakeoverSchema>;

export const whatsAppManualReplySchema = z.object({
  text: z
    .string({
      required_error: 'Reply text is required',
    })
    .trim()
    .min(1, 'Reply text cannot be empty')
    .max(4096, 'Reply text cannot exceed 4096 characters'),
});

export type WhatsAppManualReplyInput = z.infer<typeof whatsAppManualReplySchema>;
