import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type {
  CampaignSummary,
  MarketingContactItem,
  WhatsAppStats,
  CreateCampaignFormData,
  IndividualOutreachMessageItem,
  WhatsAppTemplateDefinition,
  SendIndividualOutreachInput,
} from './types';

export function useCampaignData(search: string, onlyNoWebsite: boolean) {
  const { toast } = useToast();
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [contacts, setContacts] = useState<MarketingContactItem[]>([]);
  const [outreachMessages, setOutreachMessages] = useState<IndividualOutreachMessageItem[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplateDefinition[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const contactParams: Record<string, string> = {};
      if (search) contactParams.search = search;
      if (onlyNoWebsite) contactParams.hasWebsite = 'false';

      const [statsRes, campaignsRes, contactsRes, outreachRes, templatesRes] = await Promise.allSettled([
        api.whatsapp.stats(),
        api.whatsapp.campaigns.list(),
        api.whatsapp.contacts.list(contactParams),
        api.whatsapp.outreach.listMessages(),
        api.whatsapp.templates.list(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.data);
      if (campaignsRes.status === 'fulfilled' && campaignsRes.value.success) setCampaigns(campaignsRes.value.data);
      if (contactsRes.status === 'fulfilled' && contactsRes.value.success) setContacts(contactsRes.value.data);
      if (outreachRes.status === 'fulfilled' && outreachRes.value.success) setOutreachMessages(outreachRes.value.data);

      if (templatesRes.status === 'fulfilled' && templatesRes.value.success) {
        setTemplates(templatesRes.value.data);
        setTemplatesError(null);
      } else {
        setTemplates([]);
        const reason = templatesRes.status === 'rejected' ? templatesRes.reason : null;
        setTemplatesError(
          reason instanceof Error
            ? reason.message
            : 'Unable to verify Meta-approved templates.',
        );
      }

      if (
        statsRes.status === 'rejected' ||
        campaignsRes.status === 'rejected' ||
        contactsRes.status === 'rejected' ||
        outreachRes.status === 'rejected'
      ) {
        toast.error('Failed to load WhatsApp data.');
      }
    } catch {
      toast.error('Failed to load WhatsApp data.');
    } finally {
      setLoading(false);
    }
  }, [search, onlyNoWebsite, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCampaign = async (formData: CreateCampaignFormData) => {
    const res = await api.whatsapp.campaigns.create(formData);
    if (res.success) {
      toast.success('Campaign created in Draft status.');
      loadData();
    }
  };

  const handleSendIndividualOutreach = async (formData: SendIndividualOutreachInput) => {
    const res = await api.whatsapp.outreach.send(formData);
    if (res.success) {
      toast.success(
        res.data.deduplicated
          ? 'Duplicate request intercepted: returned existing message.'
          : 'Individual WhatsApp message dispatched successfully!',
      );
      loadData();
    }
  };

  const handleDispatch = async (campaign: CampaignSummary) => {
    setActionLoadingId(campaign.id);
    try {
      const res = await api.whatsapp.campaigns.dispatch(campaign.id);
      if (res.success) {
        toast.success(`Batch dispatch completed for "${campaign.name}".`);
        loadData();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to dispatch campaign.');
      loadData();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePause = async (campaign: CampaignSummary) => {
    setActionLoadingId(campaign.id);
    try {
      const res = await api.whatsapp.campaigns.pause(campaign.id);
      if (res.success) {
        toast.info(`Campaign "${campaign.name}" paused.`);
        loadData();
      }
    } catch {
      toast.error('Failed to pause campaign.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleImportContacts = async (newContacts: Parameters<typeof api.whatsapp.contacts.import>[0]) => {
    const res = await api.whatsapp.contacts.import(newContacts);
    if (res.success) {
      toast.success(`Imported ${res.data.imported} contacts (${res.data.duplicates} duplicates skipped).`);
      loadData();
    }
  };

  const handleReconcileOutreach = async (id: string, confirmedStatus: 'DELIVERED' | 'FAILED') => {
    try {
      const res = await api.whatsapp.outreach.reconcile(id, { confirmedStatus });
      if (res.success) {
        toast.success(`Message reconciled as ${confirmedStatus} without duplicate dispatch.`);
        loadData();
      }
    } catch {
      toast.error('Failed to reconcile message status.');
    }
  };

  return {
    stats,
    campaigns,
    contacts,
    outreachMessages,
    templates,
    templatesError,
    loading,
    actionLoadingId,
    handleCreateCampaign,
    handleSendIndividualOutreach,
    handleReconcileOutreach,
    handleDispatch,
    handlePause,
    handleImportContacts,
  };
}

