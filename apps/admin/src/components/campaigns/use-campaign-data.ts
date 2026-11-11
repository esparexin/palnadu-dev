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
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const contactParams: Record<string, string> = {};
      if (search) contactParams.search = search;
      if (onlyNoWebsite) contactParams.hasWebsite = 'false';

      const [statsRes, campaignsRes, contactsRes, outreachRes, templatesRes] = await Promise.all([
        api.whatsapp.stats(),
        api.whatsapp.campaigns.list(),
        api.whatsapp.contacts.list(contactParams),
        api.whatsapp.outreach.listMessages(),
        api.whatsapp.templates.list(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (campaignsRes.success) setCampaigns(campaignsRes.data);
      if (contactsRes.success) setContacts(contactsRes.data);
      if (outreachRes.success) setOutreachMessages(outreachRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
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
    } catch {
      toast.error('Failed to dispatch campaign.');
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

  return {
    stats,
    campaigns,
    contacts,
    outreachMessages,
    templates,
    loading,
    actionLoadingId,
    handleCreateCampaign,
    handleSendIndividualOutreach,
    handleDispatch,
    handlePause,
    handleImportContacts,
  };
}

