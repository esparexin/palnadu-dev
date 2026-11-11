import type { CampaignSummary, MarketingContactItem, WhatsAppStats } from '@/lib/api/whatsapp';

export type { CampaignSummary, MarketingContactItem, WhatsAppStats };

export interface CreateCampaignFormData {
  name: string;
  description: string;
  templateName: string;
  languageCode: string;
  targetAudience: string;
}

export const initialCampaignFormData: CreateCampaignFormData = {
  name: '',
  description: '',
  templateName: 'b2b_website_outreach_v1',
  languageCode: 'en_US',
  targetAudience: 'NO_WEBSITE',
};

export interface ContactImportFormData {
  csvText: string;
}
