import type {
  CampaignSummary,
  MarketingContactItem,
  WhatsAppStats,
  IndividualOutreachMessageItem,
  WhatsAppTemplateDefinition,
  SendIndividualOutreachInput,
} from '@/lib/api/whatsapp';
import type { WhatsAppConsentType } from '@palnadu/types';

export type {
  CampaignSummary,
  MarketingContactItem,
  WhatsAppStats,
  IndividualOutreachMessageItem,
  WhatsAppTemplateDefinition,
  SendIndividualOutreachInput,
  WhatsAppConsentType,
};

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

export interface IndividualOutreachFormData {
  phone: string;
  businessName: string;
  contactName: string;
  templateName: string;
  languageCode: string;
  parameters: Record<string, string>;
  consentType: WhatsAppConsentType;
  consentEvidenceRef: string;
  saveContact: boolean;
}

export const initialOutreachFormData: IndividualOutreachFormData = {
  phone: '+91 ',
  businessName: '',
  contactName: '',
  templateName: 'b2b_website_outreach_v1',
  languageCode: 'en_US',
  parameters: {},
  consentType: 'WEBSITE_LEAD_FORM',
  consentEvidenceRef: '',
  saveContact: false,
};
