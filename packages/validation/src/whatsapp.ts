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


