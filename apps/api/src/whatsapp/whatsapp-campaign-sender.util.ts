import type { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma.service';
import type { WhatsAppApiClient } from './whatsapp-api.client';
import type { WhatsAppMetaTemplate } from '@palnadu/types';
import type { MarketingCampaign, MarketingContact } from '@prisma/client';
import { WHATSAPP_CONFIG_KEYS } from './whatsapp.constants';
import { buildTemplateComponents } from './whatsapp-template-params.util';
import {
  acquireCampaignRecipientReservation,
  recordCampaignDispatchSuccess,
  recordCampaignDispatchFailure,
} from './whatsapp-campaign-dispatch.util';

export async function resolveApprovedCampaignTemplate(
  apiClient: WhatsAppApiClient,
  templateName: string,
  languageCode: string,
): Promise<WhatsAppMetaTemplate | undefined> {
  if (typeof apiClient.fetchApprovedTemplates !== 'function') {
    return undefined;
  }
  const templates = await apiClient.fetchApprovedTemplates().catch(() => []);
  return templates.find(
    (t) => t.name === templateName && t.language === languageCode && t.status === 'APPROVED',
  );
}

export async function dispatchCampaignContact(
  prisma: PrismaService,
  config: ConfigService,
  apiClient: WhatsAppApiClient,
  logger: Logger,
  campaign: MarketingCampaign,
  contact: MarketingContact,
  matchedTemplate?: WhatsAppMetaTemplate,
): Promise<boolean> {
  const businessPhone =
    config.get<string>(WHATSAPP_CONFIG_KEYS.BUSINESS_PHONE)?.trim() || 'palnadu_business';

  const reserved = await acquireCampaignRecipientReservation(prisma, campaign.id, contact.phone);
  if (!reserved) {
    logger.warn(`Skipping recipient ${contact.phone}: reservation already claimed`);
    return false;
  }

  try {
    const { components } = buildTemplateComponents({
      templateName: campaign.templateName,
      matchedTemplate,
      parameters: {
        ...(contact.businessName ? { business_name: contact.businessName } : {}),
        ...(contact.contactName ? { customer_name: contact.contactName } : {}),
      },
      fallbackBusinessName: contact.businessName,
    });

    const response = await apiClient.sendTemplateMessage({
      to: contact.phone,
      templateName: campaign.templateName,
      languageCode: campaign.languageCode,
      ...(components.length > 0 ? { components } : {}),
    });

    const wamId = response.messages[0]?.id;
    if (!wamId) throw new Error('Meta API response missing message id');

    await recordCampaignDispatchSuccess(
      prisma,
      campaign.id,
      contact.phone,
      wamId,
      businessPhone,
      campaign.templateName,
      campaign.languageCode,
    );
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Campaign dispatch error for ${contact.phone}: ${msg}`);
    await recordCampaignDispatchFailure(
      prisma,
      campaign.id,
      contact.phone,
      businessPhone,
      campaign.templateName,
      err,
      campaign.languageCode,
    );
    return false;
  }
}

