export const META_SIGNATURE_HEADER = 'x-hub-signature-256';

export const WHATSAPP_WEBHOOK_MODE = 'subscribe';

export const WHATSAPP_CONFIG_KEYS = {
  APP_SECRET: 'META_APP_SECRET',
  VERIFY_TOKEN: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  ACCESS_TOKEN: 'WHATSAPP_ACCESS_TOKEN',
  PHONE_NUMBER_ID: 'WHATSAPP_PHONE_NUMBER_ID',
  BUSINESS_ACCOUNT_ID: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
  GRAPH_API_VERSION: 'WHATSAPP_GRAPH_API_VERSION',
} as const;

export const DEFAULT_GRAPH_API_VERSION = 'v22.0';

/**
 * Progression rank to prevent status regression when webhooks arrive out-of-order.
 * Higher rank indicates later state in the lifecycle.
 * E.g., a message in READ (30) cannot regress to DELIVERED (20) or SENT (10).
 */
export const STATUS_PROGRESSION_RANK: Record<string, number> = {
  RECEIVED: 0,
  SENT: 10,
  DELIVERED: 20,
  READ: 30,
  FAILED: 40,
};

export const NOTIFICATION_TYPE_WHATSAPP_MESSAGE = 'WHATSAPP_MESSAGE';

