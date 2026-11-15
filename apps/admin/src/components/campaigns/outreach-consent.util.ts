import type { WhatsAppConsentType } from './types';

export const OUTREACH_SELECT_CLASSES =
  'flex h-9 w-full rounded-md border border-palnadu-border bg-palnadu-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

export interface ConsentFieldInfo {
  label: string;
  placeholder: string;
  guidance?: string;
}

export function getConsentFieldInfo(type: WhatsAppConsentType): ConsentFieldInfo {
  switch (type) {
    case 'DIRECT_ADMIN_OUTREACH':
      return {
        label: 'Documented Consent Basis *',
        placeholder: 'e.g. In-person meeting at mill / Phone consultation consent (min 10 chars)',
        guidance:
          'Meta policy requires verifiable opt-in consent before initiating business outreach. Record meeting notes, referral context, or phone consent details (min 10 characters).',
      };
    case 'WEBSITE_LEAD_FORM':
    case 'VERIFIED_CRM_LEAD':
      return {
        label: 'Website Lead ID (24-hex) *',
        placeholder: '24-character hexadecimal Lead ID (e.g. 507f1f77bcf86cd799439011)',
      };
    case 'SIGNED_AGREEMENT':
      return {
        label: 'Agreement Document Ref *',
        placeholder: 'Uploaded agreement filename or document ID',
      };
    case 'INBOUND_WHATSAPP_INQUIRY':
      return {
        label: 'Inbound Message WamID *',
        placeholder: 'Inbound WhatsApp message ID (within 24 hours)',
      };
  }
}
