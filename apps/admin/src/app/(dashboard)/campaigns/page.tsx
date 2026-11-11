'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, UploadCloud, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CampaignKpiCards } from '@/components/campaigns/campaign-kpi-cards';
import { CampaignTable } from '@/components/campaigns/campaign-table';
import { ContactTable } from '@/components/campaigns/contact-table';
import { CampaignModal } from '@/components/campaigns/campaign-modal';
import { ContactImportModal } from '@/components/campaigns/contact-import-modal';
import type {
  CampaignSummary,
  MarketingContactItem,
  WhatsAppStats,
  CreateCampaignFormData,
} from '@/components/campaigns/types';

export default function CampaignsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'contacts'>('campaigns');
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [contacts, setContacts] = useState<MarketingContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const contactParams: Record<string, string> = {};
      if (search) contactParams.search = search;
      if (onlyNoWebsite) contactParams.hasWebsite = 'false';

      const [statsRes, campaignsRes, contactsRes] = await Promise.all([
        api.whatsapp.stats(),
        api.whatsapp.campaigns.list(),
        api.whatsapp.contacts.list(contactParams),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (campaignsRes.success) setCampaigns(campaignsRes.data);
      if (contactsRes.success) setContacts(contactsRes.data);
    } catch {
      toast.error('Failed to load WhatsApp campaign data.');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-palnadu-dark">WhatsApp Marketing & Outreach</h1>
          <p className="text-xs text-palnadu-secondary">Paced outreach and campaign tracking for regional businesses without websites.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="h-9 gap-1.5 text-xs">
            <UploadCloud className="h-4 w-4 text-palnadu-teal" />
            <span>Import Contacts</span>
          </Button>
          <Button size="sm" onClick={() => setCampaignModalOpen(true)} className="h-9 gap-1.5 bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs">
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>

      <CampaignKpiCards stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-md border border-palnadu-border bg-palnadu-off-white p-1">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'campaigns' ? 'bg-palnadu-white text-palnadu-dark shadow-xs' : 'text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === 'contacts' ? 'bg-palnadu-white text-palnadu-dark shadow-xs' : 'text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            Business Contacts ({contacts.length})
          </button>
        </div>

        {activeTab === 'contacts' && (
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-palnadu-secondary" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business, phone, city..."
                className="h-9 pl-8 text-xs"
              />
            </div>
            <Button
              variant={onlyNoWebsite ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyNoWebsite(!onlyNoWebsite)}
              className="h-9 text-xs"
            >
              No Website Only
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'campaigns' ? (
        <CampaignTable
          campaigns={campaigns}
          loading={loading}
          onDispatch={handleDispatch}
          onPause={handlePause}
          actionLoadingId={actionLoadingId}
        />
      ) : (
        <ContactTable contacts={contacts} loading={loading} />
      )}

      <CampaignModal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onSubmit={handleCreateCampaign}
      />

      <ContactImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportContacts}
      />
    </div>
  );
}
