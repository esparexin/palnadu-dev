export const META_SIGNATURE_HEADER = 'x-hub-signature-256';

export const WHATSAPP_WEBHOOK_MODE = 'subscribe';

export const WHATSAPP_CONFIG_KEYS = {
  APP_SECRET: 'META_APP_SECRET',
  VERIFY_TOKEN: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  ACCESS_TOKEN: 'WHATSAPP_ACCESS_TOKEN',
  PHONE_NUMBER_ID: 'WHATSAPP_PHONE_NUMBER_ID',
  BUSINESS_ACCOUNT_ID: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
  GRAPH_API_VERSION: 'WHATSAPP_GRAPH_API_VERSION',
  AUTO_REPLY_ENABLED: 'WHATSAPP_AUTO_REPLY_ENABLED',
  AUTO_REPLY_MESSAGE: 'WHATSAPP_AUTO_REPLY_MESSAGE',
  AUTO_REPLY_COOLDOWN_HOURS: 'WHATSAPP_AUTO_REPLY_COOLDOWN_HOURS',
} as const;

export const DEFAULT_GRAPH_API_VERSION = 'v22.0';

export const META_GRAPH_API_BASE_URL = 'https://graph.facebook.com';

export const DEFAULT_OUTBOUND_TIMEOUT_MS = 10000;

export const DEFAULT_MAX_RETRIES = 2;

export const DEFAULT_RETRY_DELAY_MS = 500;

export const AUTO_REPLY_COOLDOWN_HOURS = 24;

export const DEFAULT_ACK_MESSAGE =
  'Thank you for reaching out to Palnadu! We have received your message and our team will get back to you shortly.';


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

export const DEFAULT_CAMPAIGN_BATCH_SIZE = 50;
export const DEFAULT_CAMPAIGN_DELAY_MS = 100;

export const MARKETING_OPT_OUT_KEYWORDS = [
  'stop',
  'unsubscribe',
  'cancel',
  'quit',
  'optout',
  'opt-out',
  'end',
  'revoke',
  'వద్దు',
  'ఆపండి',
] as const;

export const OPT_OUT_REASON_INBOUND_STOP = 'INBOUND_KEYWORD_STOP';


