'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GeminiSettingsPanel } from '@/components/automation/gemini-settings-panel';

type TabKey = 'ai-config' | 'blog-automation' | 'sources';

const AUTOMATION_TABS: ReadonlyArray<{
  id: TabKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'ai-config', label: 'AI Configuration (Gemini API)', Icon: Bot },
  { id: 'blog-automation', label: 'Automated Blogging Pipeline', Icon: Sparkles },
  { id: 'sources', label: 'Reference Sources', Icon: Layers },
];

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('ai-config');

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">
          Automation & AI Configuration
        </h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">
          Manage AI providers, Google Cloud project identities, scheduled blogging workflows, and SEO sources.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-palnadu-border">
        {AUTOMATION_TABS.map(({ id, label, Icon }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 h-auto rounded-none text-xs font-semibold border-b-2 transition-colors',
              activeTab === id
                ? 'border-palnadu-blue text-palnadu-blue hover:bg-transparent hover:text-palnadu-blue'
                : 'border-transparent text-palnadu-secondary hover:bg-transparent hover:text-palnadu-dark',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Button>
        ))}
      </div>

      {activeTab === 'ai-config' && <GeminiSettingsPanel />}

      {activeTab === 'blog-automation' && (
        <div className="rounded-xl border border-palnadu-border bg-white shadow-sm p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-palnadu-border pb-3">
            <Sparkles className="h-4 w-4 text-palnadu-teal" />
            <h2 className="text-sm font-bold text-palnadu-dark">Daily Auto-Blogging Engine</h2>
          </div>
          <p className="text-palnadu-body leading-relaxed">
            The background cron automatically runs daily at 05:00 AM IST, generating up to 5 comprehensive technical articles (3 English + 2 Telugu in bilingual mode, saved as drafts unless auto-publish is enabled).
            Every generated article strictly enforces the <strong>Mandatory Internal Backlink Policy</strong> with 2–3 contextual in-body links before publication.
          </p>
          <div className="p-4 rounded-lg bg-palnadu-off-white/50 border border-palnadu-border space-y-2">
            <p className="font-semibold text-palnadu-dark">Live Publishing Safeguards Active:</p>
            <ul className="list-disc pl-5 space-y-1 text-palnadu-secondary">
              <li>Minimum 1 verified internal backlink required for publishing.</li>
              <li>Generic anchor text (&quot;Click Here&quot;, &quot;Read More&quot;) strictly blocked.</li>
              <li>Telugu language articles use natural Telugu prose for embedded anchor context.</li>
              <li>Articles failing backlink or SEO checks are automatically held in DRAFT status for review.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="rounded-xl border border-palnadu-border bg-white shadow-sm p-6 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-palnadu-border pb-3">
            <Layers className="h-4 w-4 text-palnadu-blue" />
            <h2 className="text-sm font-bold text-palnadu-dark">Reference Sources & Signals</h2>
          </div>
          <p className="text-palnadu-body leading-relaxed">
            Topic discovery draws signals across Google Live Suggest, Google Trends, Google Search Console, PageSpeed Insights, and Webmaster APIs to guarantee regional and high-intent commercial relevance.
          </p>
        </div>
      )}
    </div>
  );
}
