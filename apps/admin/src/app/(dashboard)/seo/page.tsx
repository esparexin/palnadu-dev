'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Globe, RefreshCw, Send } from 'lucide-react';
import { AuditData } from '@/components/seo/types';
import { SeoOverviewTab } from '@/components/seo/seo-overview-tab';
import { LocalSeoTab } from '@/components/seo/local-seo-tab';
import { CrawlerHealthTab } from '@/components/seo/crawler-health-tab';
import { KeywordResearchTab } from '@/components/seo/keyword-research-tab';

export default function SeoDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'crawler' | 'local' | 'keywords'>('overview');
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [runningCrawl, setRunningCrawl] = useState(false);
  const [submittingIndexNow, setSubmittingIndexNow] = useState(false);

  const fetchAudit = async () => {
    try {
      const res = await api.automation.crawlerLatest();
      if (res.success && res.data) {
        setAudit(res.data);
      }
    } catch {
      // no-op if first run
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleRunAudit = async () => {
    setRunningCrawl(true);
    try {
      const res = await api.automation.crawlerRun('https://www.palnadu.dev');
      if (res.success && res.data) {
        setAudit(res.data);
        toast.success(res.message || 'Audit completed successfully');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete audit crawl');
    } finally {
      setRunningCrawl(false);
    }
  };

  const handleIndexNow = async () => {
    setSubmittingIndexNow(true);
    try {
      const res = await api.automation.indexNowSubmit([
        'https://www.palnadu.dev/',
        'https://www.palnadu.dev/locations/macherla',
        'https://www.palnadu.dev/locations/palnadu',
        'https://www.palnadu.dev/blog',
        'https://www.palnadu.dev/te/blog',
      ]);
      if (res.success) {
        toast.success(res.message || 'Dispatched URLs to IndexNow for Bing');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to dispatch IndexNow notification');
    } finally {
      setSubmittingIndexNow(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-palnadu-blue" />
            <h1 className="text-xl font-bold text-palnadu-dark">SEO Management & Optimization</h1>
          </div>
          <p className="text-xs text-palnadu-secondary mt-1">
            Technical health, search engine indexation, Macherla local visibility, and keyword intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleIndexNow}
            disabled={submittingIndexNow}
            className="h-9 text-xs rounded-md border-palnadu-border text-palnadu-dark hover:bg-palnadu-off-white"
          >
            <Send className={`h-3.5 w-3.5 mr-1.5 ${submittingIndexNow ? 'animate-spin' : 'text-palnadu-teal'}`} />
            <span>{submittingIndexNow ? 'Dispatching...' : 'IndexNow Push'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleRunAudit}
            disabled={runningCrawl}
            className="h-9 text-xs rounded-md bg-palnadu-blue text-white hover:bg-palnadu-dark-hover shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${runningCrawl ? 'animate-spin' : ''}`} />
            <span>{runningCrawl ? 'Auditing...' : 'Run Site Crawl'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-palnadu-border">
        {(
          [
            { id: 'overview', label: 'Overview & Metrics' },
            { id: 'local', label: 'Macherla & Local SEO' },
            { id: 'crawler', label: 'Technical Health & Diagnostics' },
            { id: 'keywords', label: 'AI Keyword Intelligence' },
          ] as const
        ).map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className={`h-10 text-xs rounded-none border-b-2 font-semibold px-4 ${
              activeTab === tab.id
                ? 'border-palnadu-blue text-palnadu-blue bg-palnadu-light-blue/20'
                : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && <SeoOverviewTab audit={audit} />}
      {activeTab === 'local' && <LocalSeoTab />}
      {activeTab === 'crawler' && <CrawlerHealthTab audit={audit} />}
      {activeTab === 'keywords' && <KeywordResearchTab />}
    </div>
  );
}
