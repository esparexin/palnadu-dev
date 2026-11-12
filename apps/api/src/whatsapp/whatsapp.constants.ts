export const META_SIGNATURE_HEADER = 'x-hub-signature-256';

export const WHATSAPP_WEBHOOK_MODE = 'subscribe';

export const WHATSAPP_CONFIG_KEYS = {
  APP_SECRET: 'META_APP_SECRET',
  APP_SECRET_FALLBACK: 'WHATSAPP_APP_SECRET',
  VERIFY_TOKEN: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  VERIFY_TOKEN_FALLBACK: 'META_VERIFY_TOKEN',
  ACCESS_TOKEN: 'WHATSAPP_ACCESS_TOKEN',
  ACCESS_TOKEN_FALLBACK: 'META_ACCESS_TOKEN',
  PHONE_NUMBER_ID: 'WHATSAPP_PHONE_NUMBER_ID',
  BUSINESS_PHONE: 'WHATSAPP_BUSINESS_PHONE_NUMBER',
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
export const MIN_CAMPAIGN_BATCH_SIZE = 1;
export const MAX_CAMPAIGN_BATCH_SIZE = 100;

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

export const INDIVIDUAL_OUTREACH_RECIPIENT_COOLDOWN_MS = 60000;
export const MAX_ADMIN_OUTREACH_PER_MINUTE = 15;
export const OUTREACH_LEASE_EXPIRY_MS = 45000;
export const TEMPLATE_CACHE_TTL_MS = 15 * 60 * 1000;

import { PALNADU_CUSTOMER_ACKNOWLEDGEMENT_TEMPLATE } from '@palnadu/validation';

export { PALNADU_CUSTOMER_ACKNOWLEDGEMENT_TEMPLATE };

export interface TemplateMetadataSpec {
  displayTitle: string;
  description: string;
  allowBusinessNameFallback?: boolean;
  requiredParameters: Array<{
    index: number;
    key: string;
    label: string;
    placeholder: string;
  }>;
}

export const WHATSAPP_TEMPLATE_PARAMETER_SPECS: Record<string, TemplateMetadataSpec> = {
  [PALNADU_CUSTOMER_ACKNOWLEDGEMENT_TEMPLATE]: {
    displayTitle: 'Customer Acknowledgement',
    description: 'Marketing acknowledgement template for authorized customer leads.',
    allowBusinessNameFallback: false,
    requiredParameters: [
      {
        index: 1,
        key: 'customer_name',
        label: 'Customer Name',
        placeholder: 'e.g. Ramesh Kumar',
      },
    ],
  },
  b2b_website_outreach_v1: {
    displayTitle: 'B2B Website Outreach (English)',
    description: 'Initial outreach to Palnadu businesses without a website.',
    allowBusinessNameFallback: true,
    requiredParameters: [
      {
        index: 1,
        key: 'business_name',
        label: 'Business Name',
        placeholder: 'e.g. Sri Lakshmi Rice Mill',
      },
    ],
  },
  b2b_website_outreach_te: {
    displayTitle: 'B2B Website Outreach (Telugu)',
    description: 'Telugu outreach for regional businesses in Narasaraopet, Chilakaluripet, Guntur.',
    allowBusinessNameFallback: true,
    requiredParameters: [
      {
        index: 1,
        key: 'business_name',
        label: 'Business Name',
        placeholder: 'ఉదా: శ్రీ లక్ష్మి రైస్ మిల్లు',
      },
    ],
  },
  b2b_intro_v1: {
    displayTitle: 'B2B General Introduction',
    description: 'General introduction to Palnadu.dev web and software development services.',
    allowBusinessNameFallback: true,
    requiredParameters: [
      {
        index: 1,
        key: 'business_name',
        label: 'Business Name',
        placeholder: 'e.g. Kaveri Pesticides',
      },
    ],
  },
};

export const APPROVED_WHATSAPP_TEMPLATES = [
  {
    name: 'b2b_website_outreach_v1',
    displayTitle: 'B2B Website Outreach (English)',
    languageCode: 'en_US',
    category: 'MARKETING',
    description: 'Initial outreach to Palnadu businesses without a website.',
    sampleText:
      'Hello {{1}}, we noticed your business in Palnadu does not have an official website yet. Palnadu.dev builds modern, affordable websites for local businesses. Would you be open to a quick chat?',
    requiredParameters: [
      {
        index: 1,
        key: 'business_name',
        label: 'Business Name',
        placeholder: 'e.g. Sri Lakshmi Rice Mill',
      },
    ],
  },
  {
    name: 'b2b_website_outreach_te',
    displayTitle: 'B2B Website Outreach (Telugu)',
    languageCode: 'te',
    category: 'MARKETING',
    description: 'Telugu outreach for regional businesses in Narasaraopet, Chilakaluripet, Guntur.',
    sampleText:
      'నమస్కారం {{1}}, పల్నాడులో మీ వ్యాపారానికి ఇంకా సొంత వెబ్‌సైట్ లేదా? స్థానిక వ్యాపారాల కోసం Palnadu.dev ఆధునిక వెబ్‌సైట్లు మరియు సాఫ్ట్‌వేర్ అందిస్తోంది. వివరాల కోసం ఇక్కడ ప్రత్యుత్తరం ఇవ్వండి.',
    requiredParameters: [
      {
        index: 1,
        key: 'business_name',
        label: 'Business Name',
        placeholder: 'ఉదా: శ్రీ లక్ష్మి రైస్ మిల్లు',
      },
    ],
  },
  {
    name: 'b2b_intro_v1',
    displayTitle: 'B2B General Introduction',
    languageCode: 'en_US',
    category: 'MARKETING',
    description: 'General introduction to Palnadu.dev web and software development services.',
    sampleText:
      'Hello {{1}}, greetings from Palnadu.dev! We specialize in custom web apps, billing software, and digital solutions for local enterprises.',
    requiredParameters: [
      {
        index: 1,
        key: 'business_name',
        label: 'Business Name',
        placeholder: 'e.g. Kaveri Pesticides',
      },
    ],
  },
] as const;



