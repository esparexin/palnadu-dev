'use client';

import { useState } from 'react';
import { Plus, UploadCloud, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CampaignKpiCards } from '@/components/campaigns/campaign-kpi-cards';
import { CampaignTable } from '@/components/campaigns/campaign-table';
import { ContactTable } from '@/components/campaigns/contact-table';
import { CampaignModal } from '@/components/campaigns/campaign-modal';
import { ContactImportModal } from '@/components/campaigns/contact-import-modal';
import { OutreachGuideCard } from '@/components/campaigns/outreach-guide-card';
import { IndividualOutreachModal } from '@/components/campaigns/individual-outreach-modal';
import { IndividualOutreachTable } from '@/components/campaigns/individual-outreach-table';
import { useCampaignData } from '@/components/campaigns/use-campaign-data';
import { ConversationManager } from '@/components/campaigns/conversation-manager';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<'outreach' | 'campaigns' | 'contacts' | 'conversations'>('outreach');
  const [search, setSearch] = useState('');
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [outreachModalOpen, setOutreachModalOpen] = useState(false);

  const {
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
  } = useCampaignData(search, onlyNoWebsite);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">WhatsApp Marketing & Outreach</h1>
          <p className="text-xs text-palnadu-secondary">Individual outreach and bulk campaigns for regional businesses without websites.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)} className="h-9 gap-1.5 text-xs cursor-pointer">
            <UploadCloud className="h-4 w-4 text-palnadu-teal" />
            <span>Import Contacts</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCampaignModalOpen(true)} className="h-9 gap-1.5 text-xs cursor-pointer">
            <Plus className="h-4 w-4 text-palnadu-blue" />
            <span>Create Campaign</span>
          </Button>
          <Button size="sm" onClick={() => setOutreachModalOpen(true)} className="h-9 gap-1.5 bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs cursor-pointer">
            <Send className="h-4 w-4" />
            <span>Send Direct Message</span>
          </Button>
        </div>
      </div>

      <OutreachGuideCard />
      <CampaignKpiCards stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-md border border-palnadu-border bg-palnadu-off-white p-1">
          <button
            onClick={() => setActiveTab('outreach')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'outreach' ? 'bg-palnadu-white text-palnadu-dark shadow-sm' : 'text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            Individual Outreach ({outreachMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'campaigns' ? 'bg-palnadu-white text-palnadu-dark shadow-sm' : 'text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            Bulk Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'contacts' ? 'bg-palnadu-white text-palnadu-dark shadow-sm' : 'text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            Business Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'conversations' ? 'bg-palnadu-white text-palnadu-dark shadow-sm' : 'text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            Assistant Chats
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
              className="h-9 text-xs cursor-pointer"
            >
              No Website Only
            </Button>
          </div>
        )}
      </div>

      {activeTab === 'outreach' && (
        <IndividualOutreachTable
          messages={outreachMessages}
          loading={loading}
          onOpenOutreachModal={() => setOutreachModalOpen(true)}
          onReconcileMessage={handleReconcileOutreach}
        />
      )}

      {activeTab === 'campaigns' && (
        <CampaignTable
          campaigns={campaigns}
          loading={loading}
          onDispatch={handleDispatch}
          onPause={handlePause}
          actionLoadingId={actionLoadingId}
        />
      )}

      {activeTab === 'contacts' && (
        <ContactTable contacts={contacts} loading={loading} />
      )}

      {activeTab === 'conversations' && (
        <ConversationManager />
      )}

      <IndividualOutreachModal
        open={outreachModalOpen}
        onClose={() => setOutreachModalOpen(false)}
        onSubmit={handleSendIndividualOutreach}
        templates={templates}
      />

      <CampaignModal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onSubmit={handleCreateCampaign}
        templates={templates}
        templatesError={templatesError}
      />

      <ContactImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportContacts}
      />
    </div>
  );
}
