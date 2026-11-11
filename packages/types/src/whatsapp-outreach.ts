export type WhatsAppConsentType =
  | 'WEBSITE_LEAD_FORM'
  | 'INBOUND_WHATSAPP_INQUIRY'
  | 'SIGNED_AGREEMENT'
  | 'VERIFIED_CRM_LEAD';

export interface WhatsAppConsentEvidence {
  consentType: WhatsAppConsentType;
  consentEvidenceRef: string;
  consentTimestamp: string;
  recipientPhone: string;
}

export interface WhatsAppMetaTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: string;
  text?: string;
  example?: {
    body_text?: string[][];
    header_text?: string[];
  };
}

export interface WhatsAppMetaTemplate {
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED';
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: WhatsAppMetaTemplateComponent[];
}

export interface WhatsAppTemplateParameterSpec {
  index: number;
  key: string;
  label: string;
  placeholder: string;
}

export interface WhatsAppTemplateDefinition {
  name: string;
  displayTitle: string;
  languageCode: string;
  category: string;
  description: string;
  sampleText: string;
  requiredParameters: WhatsAppTemplateParameterSpec[];
}

export interface SendIndividualOutreachInput {
  phone: string;
  businessName: string;
  contactName?: string;
  templateName: string;
  languageCode: string;
  parameters?: Record<string, string>;
  consentEvidence: WhatsAppConsentEvidence;
  idempotencyKey?: string;
  saveContact?: boolean;
}

export interface IndividualOutreachDispatchResult {
  success: boolean;
  wamId: string;
  recipientPhone: string;
  status: string;
  deduplicated?: boolean;
  reconciled?: boolean;
  requiresReconciliation?: boolean;
  contactSaved?: boolean;
  contactId?: string;
  timestamp: string;
}

export interface IndividualOutreachMessageItem {
  id: string;
  wamId: string;
  to: string;
  businessName?: string;
  templateName: string;
  languageCode: string;
  status: string;
  statusTimestamp?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  consentType?: WhatsAppConsentType;
  consentEvidenceRef?: string;
}

