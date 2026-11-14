import { adminApi } from './client';
import type {
  SendIndividualOutreachInput,
  IndividualOutreachDispatchResult,
  IndividualOutreachMessageItem,
  WhatsAppTemplateDefinition,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppConversationFilterParams,
} from '@palnadu/types';

export type {
  SendIndividualOutreachInput,
  IndividualOutreachDispatchResult,
  IndividualOutreachMessageItem,
  WhatsAppTemplateDefinition,
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppConversationFilterParams,
};

export interface CampaignSummary {
  id: string;
  name: string;
  description?: string;
  templateName: string;
  languageCode: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  targetAudience?: string;
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MarketingContactItem {
  id: string;
  businessName: string;
  contactName?: string;
  phone: string;
  city?: string;
  category?: string;
  hasWebsite: boolean;
  websiteUrl?: string;
  optInStatus: 'OPTED_IN' | 'UNVERIFIED' | 'OPTED_OUT';
  optOutReason?: string;
  optOutTimestamp?: string;
  createdAt: string;
}

export interface WhatsAppStats {
  totalCampaigns: number;
  totalContacts: number;
  withoutWebsite: number;
  optedIn: number;
  optedOut: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
}

export const whatsappApi = {
  stats: () => adminApi<{ success: boolean; data: WhatsAppStats }>('/api/admin/whatsapp/stats'),

  templates: {
    list: () => adminApi<{ success: boolean; data: WhatsAppTemplateDefinition[] }>('/api/admin/whatsapp/templates'),
  },

  outreach: {
    send: (data: SendIndividualOutreachInput) =>
      adminApi<{ success: boolean; data: IndividualOutreachDispatchResult }>('/api/admin/whatsapp/outreach/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listMessages: (params?: { page?: number; limit?: number }) =>
      adminApi<{
        success: boolean;
        data: IndividualOutreachMessageItem[];
        total: number;
        page: number;
        totalPages: number;
      }>('/api/admin/whatsapp/outreach/messages', {
        params: params ? { page: String(params.page || 1), limit: String(params.limit || 20) } : undefined,
      }),
    reconcile: (id: string, data: { confirmedStatus: 'SENT' | 'DELIVERED' | 'FAILED'; metaWamId?: string; notes?: string }) =>
      adminApi<{ success: boolean; data: { success: boolean; id: string; status: string; reconciled: boolean } }>(
        `/api/admin/whatsapp/outreach/${id}/reconcile`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
  },

  campaigns: {
    list: (params?: Record<string, string | undefined>) =>
      adminApi<{ success: boolean; data: CampaignSummary[]; total: number; page: number; totalPages: number }>(
        '/api/admin/whatsapp/campaigns',
        { params: params as Record<string, string> | undefined },
      ),
    get: (id: string) => adminApi<{ success: boolean; data: CampaignSummary }>(`/api/admin/whatsapp/campaigns/${id}`),
    create: (data: { name: string; description?: string; templateName: string; languageCode: string; targetAudience?: string }) =>
      adminApi<{ success: boolean; data: CampaignSummary }>('/api/admin/whatsapp/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    dispatch: (id: string, options?: { batchSize?: number }) =>
      adminApi<{ success: boolean; data: unknown }>(`/api/admin/whatsapp/campaigns/${id}/dispatch`, {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }),
    pause: (id: string) =>
      adminApi<{ success: boolean; data: CampaignSummary }>(`/api/admin/whatsapp/campaigns/${id}/pause`, {
        method: 'POST',
      }),
  },

  contacts: {
    list: (params?: Record<string, string | undefined>) =>
      adminApi<{ success: boolean; data: MarketingContactItem[]; total: number; page: number; totalPages: number }>(
        '/api/admin/whatsapp/contacts',
        { params: params as Record<string, string> | undefined },
      ),
    import: (contacts: Array<{ businessName: string; phone: string; contactName?: string; city?: string; category?: string; hasWebsite?: boolean; notes?: string }>) =>
      adminApi<{ success: boolean; data: { imported: number; duplicates: number; total: number } }>(
        '/api/admin/whatsapp/contacts/import',
        {
          method: 'POST',
          body: JSON.stringify({ contacts }),
        },
      ),
  },

  conversations: {
    list: (params?: WhatsAppConversationFilterParams) =>
      adminApi<{
        success: boolean;
        data: WhatsAppConversation[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>('/api/admin/whatsapp/conversations', {
        params: params
          ? {
              page: String(params.page || 1),
              limit: String(params.limit || 20),
              ...(params.humanTakeover !== undefined ? { humanTakeover: String(params.humanTakeover) } : {}),
              ...(params.search ? { search: params.search } : {}),
            }
          : undefined,
      }),
    get: (phone: string) =>
      adminApi<{
        success: boolean;
        data: { conversation: WhatsAppConversation | null; messages: WhatsAppMessage[] };
      }>(`/api/admin/whatsapp/conversations/${encodeURIComponent(phone)}`),
    toggleTakeover: (phone: string, enabled: boolean) =>
      adminApi<{ success: boolean; data: WhatsAppConversation }>(
        `/api/admin/whatsapp/conversations/${encodeURIComponent(phone)}/takeover`,
        {
          method: 'POST',
          body: JSON.stringify({ enabled }),
        },
      ),
    reply: (phone: string, text: string) =>
      adminApi<{ success: boolean; data: WhatsAppMessage }>(
        `/api/admin/whatsapp/conversations/${encodeURIComponent(phone)}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        },
      ),
  },
};
