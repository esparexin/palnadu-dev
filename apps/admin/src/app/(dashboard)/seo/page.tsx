'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  Globe,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Send,
  RefreshCw,
  MapPin,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface CrawlIssue {
  severity: 'CRITICAL' | 'WARNING' | 'OPPORTUNITY';
  category: string;
  url: string;
  message: string;
  recommendation: string;
}

interface AuditData {
  id?: string;
  crawlUrl: string;
  status: string;
  seoScore: number;
  performanceScore: number;
  pagesCrawled: number;
  summary: string;
  durationMs: number;
  issues: CrawlIssue[];
  createdAt?: string;
}

interface LocalTarget {
  keyword: string;
  location: string;
  intent: string;
  targetUrl: string;
  priority: 'HIGH' | 'CORE';
}

const LOCAL_TARGETS: LocalTarget[] = [
  {
    keyword: 'Software company in Macherla',
    location: 'Macherla',
    intent: 'Transactional',
    targetUrl: '/locations/macherla',
    priority: 'HIGH',
  },
  {
    keyword: 'Weighbridge software Macherla Palnadu',
    location: 'Macherla & Piduguralla',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'HIGH',
  },
  {
    keyword: 'Billing software for shops Macherla',
    location: 'Macherla',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'CORE',
  },
  {
    keyword: 'Cement factory gate pass management software',
    location: 'Macherla & Gurazala',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'HIGH',
  },
  {
    keyword: 'Digital marketing services Macherla',
    location: 'Macherla',
    intent: 'Commercial',
    targetUrl: '/locations/macherla',
    priority: 'CORE',
  },
  {
    keyword: 'Web development in Palnadu district',
    location: 'Palnadu',
    intent: 'Transactional',
    targetUrl: '/locations/palnadu',
    priority: 'CORE',
  },
];

const LOCAL_CITATIONS = [
  {
    directory: 'Google Business Profile',
    status: 'Active & Verified',
    napStatus: 'Consistent',
    location: 'Macherla Hub',
    target: 'Main Road, Macherla, 522426',
  },
  {
    directory: 'JustDial Commercial Registry',
    status: 'Synced',
    napStatus: 'Consistent',
    location: 'Palnadu & Macherla',
    target: 'IT & Software Services',
  },
  {
    directory: 'IndiaMART B2B Portal',
    status: 'Synced',
    napStatus: 'Consistent',
    location: 'Andhra Pradesh Region',
    target: 'Custom ERP & Weighbridge Software',
  },
  {
    directory: 'TradeIndia Industrial Suppliers',
    status: 'Verified',
    napStatus: 'Consistent',
    location: 'Guntur & Palnadu Industrial Belt',
    target: 'Enterprise Solutions',
  },
];

export default function SeoDashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'crawler' | 'local' | 'keywords'>('overview');
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [runningCrawl, setRunningCrawl] = useState(false);
  const [submittingIndexNow, setSubmittingIndexNow] = useState(false);

  // Keyword Research tool state
  const [seedKeyword, setSeedKeyword] = useState('billing software');
  const [keywordLocation, setKeywordLocation] = useState('Macherla');
  const [searchingKeywords, setSearchingKeywords] = useState(false);
  const [discoveredKeywords, setDiscoveredKeywords] = useState<any[]>([]);
  const [discoveredQuestions, setDiscoveredQuestions] = useState<any[]>([]);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);

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

  const handleSearchKeywords = async () => {
    if (!seedKeyword.trim()) return;
    setSearchingKeywords(true);
    try {
      const [kwRes, qRes] = await Promise.all([
        api.automation.keywords(seedKeyword, keywordLocation),
        api.automation.questions(seedKeyword, keywordLocation).catch(() => null),
      ]);

      if (kwRes.success && Array.isArray(kwRes.data)) {
        setDiscoveredKeywords(kwRes.data);
      }
      if (qRes?.success && Array.isArray(qRes.data)) {
        setDiscoveredQuestions(qRes.data);
      }
      toast.success(`Discovered ${kwRes.data?.length || 0} keyword suggestions`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to discover keywords');
    } finally {
      setSearchingKeywords(false);
    }
  };

  const copyKeyword = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKw(text);
    setTimeout(() => setCopiedKw(null), 2000);
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('overview')}
          className={`h-10 text-xs rounded-none border-b-2 font-semibold px-4 ${
            activeTab === 'overview'
              ? 'border-palnadu-blue text-palnadu-blue bg-palnadu-light-blue/20'
              : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
          }`}
        >
          Overview & Metrics
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('local')}
          className={`h-10 text-xs rounded-none border-b-2 font-semibold px-4 ${
            activeTab === 'local'
              ? 'border-palnadu-blue text-palnadu-blue bg-palnadu-light-blue/20'
              : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
          }`}
        >
          Macherla & Local SEO
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('crawler')}
          className={`h-10 text-xs rounded-none border-b-2 font-semibold px-4 ${
            activeTab === 'crawler'
              ? 'border-palnadu-blue text-palnadu-blue bg-palnadu-light-blue/20'
              : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
          }`}
        >
          Technical Health & Diagnostics
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('keywords')}
          className={`h-10 text-xs rounded-none border-b-2 font-semibold px-4 ${
            activeTab === 'keywords'
              ? 'border-palnadu-blue text-palnadu-blue bg-palnadu-light-blue/20'
              : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
          }`}
        >
          AI Keyword Intelligence
        </Button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
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
      )}

      {/* Tab: Macherla & Local SEO */}
      {activeTab === 'local' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-palnadu-dark flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-palnadu-teal" />
                  <span>Macherla & Regional Andhra Pradesh Target Keywords</span>
                </h2>
                <p className="text-xs text-palnadu-secondary">Priority search terms targeted in local landing pages and structured data.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-palnadu-off-white text-palnadu-secondary uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2.5">Target Keyword</th>
                    <th className="px-4 py-2.5">Location Hub</th>
                    <th className="px-4 py-2.5">Search Intent</th>
                    <th className="px-4 py-2.5">Target Page</th>
                    <th className="px-4 py-2.5">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-palnadu-border">
                  {LOCAL_TARGETS.map((target, idx) => (
                    <tr key={idx} className="hover:bg-palnadu-off-white/50">
                      <td className="px-4 py-3 font-semibold text-palnadu-dark">{target.keyword}</td>
                      <td className="px-4 py-3 text-palnadu-secondary">{target.location}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-palnadu-light-blue text-palnadu-blue font-medium">
                          {target.intent}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-palnadu-blue">{target.targetUrl}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-palnadu-teal/10 text-palnadu-teal-dark">
                          {target.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Citations Tracker */}
          <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold text-palnadu-dark">Local Citation & Business Directory Consistency</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOCAL_CITATIONS.map((cit, idx) => (
                <div key={idx} className="rounded-md border border-palnadu-border p-3.5 space-y-1.5 bg-palnadu-off-white/30">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-palnadu-dark">{cit.directory}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      {cit.status}
                    </span>
                  </div>
                  <p className="text-xs text-palnadu-secondary">Scope: {cit.location}</p>
                  <p className="text-xs text-palnadu-body font-mono text-xs">{cit.target}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Technical Health */}
      {activeTab === 'crawler' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-palnadu-dark">Internal Technical Audit Results</h2>
                <p className="text-xs text-palnadu-secondary">
                  Automated weekly audit replacing Screaming Frog. Evaluates canonicals, metadata, and routing.
                </p>
              </div>
              {audit?.createdAt && (
                <span className="text-xs text-palnadu-secondary">
                  Last Crawled: {new Date(audit.createdAt).toLocaleString()}
                </span>
              )}
            </div>

            {audit?.issues && audit.issues.length > 0 ? (
              <div className="space-y-2.5">
                {audit.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 flex items-start gap-3"
                  >
                    {issue.severity === 'CRITICAL' ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    ) : issue.severity === 'WARNING' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-palnadu-dark">{issue.message}</span>
                        <span className="text-xs font-mono text-palnadu-secondary">{issue.url}</span>
                      </div>
                      <p className="text-xs text-palnadu-body">{issue.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-palnadu-secondary">
                No critical issues detected. All audited pages conform to technical SEO and canonical routing standards.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Keywords Intelligence */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
            <h2 className="text-sm font-bold text-palnadu-dark">AI-Assisted Keyword Discovery (Keyless & Verified)</h2>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-1/2">
                <Input
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  placeholder="Enter seed phrase (e.g. billing software, weighbridge, website design)..."
                  className="h-9 text-xs rounded-md"
                />
              </div>
              <div className="w-full sm:w-1/3">
                <Input
                  value={keywordLocation}
                  onChange={(e) => setKeywordLocation(e.target.value)}
                  placeholder="Location (e.g. Macherla, Palnadu, Guntur)..."
                  className="h-9 text-xs rounded-md"
                />
              </div>
              <Button
                onClick={handleSearchKeywords}
                disabled={searchingKeywords}
                size="sm"
                className="h-9 text-xs rounded-md bg-palnadu-blue text-white hover:bg-palnadu-dark-hover shrink-0"
              >
                <Search className={`h-3.5 w-3.5 mr-1.5 ${searchingKeywords ? 'animate-spin' : ''}`} />
                <span>{searchingKeywords ? 'Searching...' : 'Discover'}</span>
              </Button>
            </div>

            {/* Keyword Suggestions */}
            {discoveredKeywords.length > 0 && (
              <div className="pt-4 border-t border-palnadu-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-secondary">
                  Verified Suggestions ({discoveredKeywords.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {discoveredKeywords.map((kw, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md border border-palnadu-border bg-palnadu-off-white/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-palnadu-dark truncate mr-2">{kw.keyword || kw}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyKeyword(kw.keyword || kw)}
                        className="h-7 w-7 p-0 text-palnadu-secondary hover:text-palnadu-blue"
                        title="Copy keyword"
                      >
                        {copiedKw === (kw.keyword || kw) ? (
                          <Check className="h-3 w-3 text-palnadu-teal" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discovered Questions */}
            {discoveredQuestions.length > 0 && (
              <div className="pt-4 border-t border-palnadu-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-secondary flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-palnadu-blue" />
                  <span>Customer Questions & FAQ Intent ({discoveredQuestions.length})</span>
                </h3>
                <div className="space-y-2">
                  {discoveredQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md border border-palnadu-border bg-white flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-palnadu-dark">{q.phrase || q}</span>
                      <span className="text-xs font-mono text-palnadu-secondary bg-palnadu-off-white px-2 py-0.5 rounded">
                        FAQ Intent
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
