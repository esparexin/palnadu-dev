import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { WhatsAppMetaTemplate, WhatsAppMetaTemplateComponent } from '@palnadu/types';
import {
  WHATSAPP_CONFIG_KEYS,
  DEFAULT_GRAPH_API_VERSION,
  META_GRAPH_API_BASE_URL,
  APPROVED_WHATSAPP_TEMPLATES,
  TEMPLATE_CACHE_TTL_MS,
} from './whatsapp.constants';
import { WhatsAppApiException, safeJson } from './whatsapp-api.util';

const logger = new Logger('WhatsAppTemplateUtil');

let cachedTemplates: WhatsAppMetaTemplate[] | null = null;
let cacheExpiry = 0;

export function getMockTemplatesForTesting(): WhatsAppMetaTemplate[] {
  return APPROVED_WHATSAPP_TEMPLATES.map((tmpl) => ({
    name: tmpl.name,
    status: 'APPROVED' as const,
    language: tmpl.languageCode,
    category: tmpl.category as 'MARKETING' | 'UTILITY',
    components: [
      {
        type: 'BODY' as const,
        text: tmpl.sampleText,
      },
    ],
  }));
}

export function resetTemplateCacheForTesting(): void {
  cachedTemplates = null;
  cacheExpiry = 0;
}

export async function fetchMetaApprovedTemplates(
  config: ConfigService,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<WhatsAppMetaTemplate[]> {
  const isTestEnv = process.env.NODE_ENV === 'test';
  const now = Date.now();

  if (cachedTemplates && now < cacheExpiry) {
    return cachedTemplates;
  }

  const token = (
    config.get<string>(WHATSAPP_CONFIG_KEYS.ACCESS_TOKEN) ||
    config.get<string>(WHATSAPP_CONFIG_KEYS.ACCESS_TOKEN_FALLBACK)
  )?.trim();

  const businessAccountId = config
    .get<string>(WHATSAPP_CONFIG_KEYS.BUSINESS_ACCOUNT_ID)
    ?.trim();

  const version =
    config.get<string>(WHATSAPP_CONFIG_KEYS.GRAPH_API_VERSION)?.trim() ||
    DEFAULT_GRAPH_API_VERSION;

  if (!token || !businessAccountId) {
    if (isTestEnv) {
      logger.warn('Meta credentials unconfigured in test environment. Using verified test catalog.');
      cachedTemplates = getMockTemplatesForTesting();
      cacheExpiry = now + TEMPLATE_CACHE_TTL_MS;
      return cachedTemplates;
    }
    throw new WhatsAppApiException(
      'Meta Business Account credentials missing. Live template verification is required in production.',
      500,
    );
  }

  const url = `${META_GRAPH_API_BASE_URL}/${version}/${businessAccountId}/message_templates?status=APPROVED&limit=100`;

  try {
    const response = await fetchFn(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await safeJson<{ error?: { message?: string; code?: number } }>(response);
      const msg = errorBody?.error?.message || `HTTP ${response.status}: Failed to fetch Meta templates`;
      if (isTestEnv) {
        logger.warn(`Meta template fetch failed in test (${msg}). Falling back to test catalog.`);
        cachedTemplates = getMockTemplatesForTesting();
        cacheExpiry = now + TEMPLATE_CACHE_TTL_MS;
        return cachedTemplates;
      }
      throw new WhatsAppApiException(msg, response.status, errorBody?.error as never);
    }

    const data = (await response.json()) as { data?: WhatsAppMetaTemplate[] };
    const rawTemplates = Array.isArray(data?.data) ? data.data : [];
    const approved = rawTemplates.filter((t) => t.status === 'APPROVED');

    cachedTemplates = approved;
    cacheExpiry = now + TEMPLATE_CACHE_TTL_MS;
    logger.log(`Verified ${approved.length} approved WhatsApp templates from Meta Business Account`);
    return approved;
  } catch (err: unknown) {
    if (err instanceof WhatsAppApiException) throw err;
    if (isTestEnv) {
      logger.warn(`Network error fetching Meta templates in test. Falling back to test catalog.`);
      cachedTemplates = getMockTemplatesForTesting();
      cacheExpiry = now + TEMPLATE_CACHE_TTL_MS;
      return cachedTemplates;
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new WhatsAppApiException(`Failed to verify approved templates with Meta: ${msg}`, 502);
  }
}

export function validateTemplateAgainstMeta(
  templateName: string,
  languageCode: string,
  approvedTemplates: WhatsAppMetaTemplate[],
): WhatsAppMetaTemplate {
  const match = approvedTemplates.find(
    (t) => t.name === templateName && t.language === languageCode && t.status === 'APPROVED',
  );

  if (!match) {
    throw new WhatsAppApiException(
      `Template "${templateName}" (${languageCode}) is not currently approved in Meta Business Account.`,
      400,
    );
  }

  return match;
}

