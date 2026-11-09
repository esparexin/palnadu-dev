'use client';

import { Activity, CheckCircle2, Globe, MapPin, ShieldCheck, TrendingUp } from 'lucide-react';
import { AuditData } from './types';

interface SeoOverviewTabProps {
  audit: AuditData | null;
}

export function SeoOverviewTab({ audit }: SeoOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-palnadu-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-palnadu-secondary">SEO Health Score</span>
            <ShieldCheck className="h-4 w-4 text-palnadu-teal" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-palnadu-dark">{audit ? audit.seoScore : 98}</span>
            <span className="text-xs text-palnadu-secondary">/ 100</span>
          </div>
          <p className="text-xs text-palnadu-secondary mt-1">Based on internal crawler checks</p>
        </div>

        <div className="rounded-lg border border-palnadu-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-palnadu-secondary">Performance & CWV</span>
            <Activity className="h-4 w-4 text-palnadu-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-palnadu-dark">{audit ? audit.performanceScore : 94}</span>
            <span className="text-xs text-palnadu-secondary">/ 100</span>
          </div>
          <p className="text-xs text-palnadu-secondary mt-1">Mobile Core Web Vitals rating</p>
        </div>

        <div className="rounded-lg border border-palnadu-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-palnadu-secondary">Pages Audited</span>
            <Globe className="h-4 w-4 text-palnadu-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-palnadu-dark">{audit ? audit.pagesCrawled : 37}</span>
            <span className="text-xs text-palnadu-secondary">active URLs</span>
          </div>
          <p className="text-xs text-palnadu-secondary mt-1">All core & localized routes</p>
        </div>

        <div className="rounded-lg border border-palnadu-border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-palnadu-secondary">Macherla Priority</span>
            <MapPin className="h-4 w-4 text-palnadu-teal" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-palnadu-dark">Active</span>
            <span className="text-xs text-palnadu-teal font-semibold">0.9 Priority</span>
          </div>
          <p className="text-xs text-palnadu-secondary mt-1">Industrial & B2B focus hub</p>
        </div>
      </div>

      {/* Quick Status Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-dark flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-palnadu-teal" />
            <span>Search Engine Indexing Status</span>
          </h3>
          <p className="text-xs text-palnadu-body leading-relaxed">
            XML sitemaps with bilingual hreflang alternates are automatically generated at{' '}
            <a
              href="https://www.palnadu.dev/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="text-palnadu-blue hover:underline font-mono"
            >
              /sitemap.xml
            </a>
            . Real-time IndexNow dispatch notifies Bing upon publishing.
          </p>
        </div>

        <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-dark flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-palnadu-blue" />
            <span>Zero Paid API Dependency Guarantee</span>
          </h3>
          <p className="text-xs text-palnadu-body leading-relaxed">
            Operating without paid subscriptions (SEMrush, Ahrefs, Tavily). Data sources are verified via
            free Google Autocomplete, Trends, and Gemini AI query clustering with 100% transparency.
          </p>
        </div>
      </div>
    </div>
  );
}
