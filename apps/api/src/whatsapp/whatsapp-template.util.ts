import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type {
  WhatsAppMetaTemplate,
  WhatsAppTemplateDefinition,
} from '@palnadu/types';
import {
  WHATSAPP_CONFIG_KEYS,
  DEFAULT_GRAPH_API_VERSION,
  META_GRAPH_API_BASE_URL,
  WHATSAPP_TEMPLATE_PARAMETER_SPECS,
  TEMPLATE_CACHE_TTL_MS,
} from './whatsapp.constants';
import { WhatsAppApiException, safeJson } from './whatsapp-api.util';
import { inspectTemplateBodyVariables } from './whatsapp-template-params.util';

const logger = new Logger('WhatsAppTemplateUtil');

let cachedTemplates: WhatsAppMetaTemplate[] | null = null;
let cacheExpiry = 0;

export function resetTemplateCacheForTesting(): void {
  cachedTemplates = null;
  cacheExpiry = 0;
}

export async function fetchMetaApprovedTemplates(
  config: ConfigService,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<WhatsAppMetaTemplate[]> {
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
    throw new WhatsAppApiException(
      'Meta Business Account credentials missing. Live template verification is required.',
      502,
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

export function mapMetaTemplatesToDefinitions(
  approvedTemplates: WhatsAppMetaTemplate[],
): WhatsAppTemplateDefinition[] {
  return approvedTemplates
    .filter((t) => t.status === 'APPROVED')
    .map((tmpl) => {
      const spec = WHATSAPP_TEMPLATE_PARAMETER_SPECS[tmpl.name];
      const bodyText = tmpl.components?.find((c) => c.type === 'BODY')?.text || '';
      const inspected = inspectTemplateBodyVariables(tmpl);
      const requiredParameters =
        inspected && inspected.variables.length > 0
          ? inspected.variables.map((v) => {
              const matchedSpecParam = spec?.requiredParameters.find(
                (p) => (v.named ? p.key === v.key : p.index === v.index),
              );
              const key = v.named ? v.key : matchedSpecParam?.key || v.key;
              return {
                index: v.index,
                key,
                label: matchedSpecParam?.label || key,
                placeholder: matchedSpecParam?.placeholder || `Enter ${key}`,
              };
            })
          : spec?.requiredParameters || [];

      return {
        name: tmpl.name,
        displayTitle: spec?.displayTitle || tmpl.name,
        languageCode: tmpl.language,
        category: tmpl.category,
        description: spec?.description || `Meta-approved ${tmpl.category} template`,
        sampleText: bodyText,
        requiredParameters,
      };
    });
}

