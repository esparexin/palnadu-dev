import { z } from 'zod';

export const whatsAppWebhookVerifySchema = z.object({
  'hub.mode': z.literal('subscribe', {
    errorMap: () => ({ message: 'hub.mode must be "subscribe"' }),
  }),
  'hub.challenge': z.string().min(1, 'hub.challenge is required'),
  'hub.verify_token': z.string().min(1, 'hub.verify_token is required'),
});

export type WhatsAppWebhookVerifyInput = z.infer<typeof whatsAppWebhookVerifySchema>;

