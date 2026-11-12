import { SearchIntent } from '../topic-identity';

/**
 * DI token for the discovery-source adapters.
 */
export const REFERENCE_SOURCES = 'REFERENCE_SOURCES';

/**
 * Four-tier source confidence system:
 * 1. verified_google: Live Google public endpoints (Autocomplete, Trends) or authenticated Google APIs (GSC, Ads).
 * 2. verified_external: Direct from verified external tools (PageSpeed Insights, Screaming Frog crawl).
 * 3. ai_suggestion: AI-assisted topic clustering, customer questions, or backlink outreach angles.
 * 4. unavailable: Metric is not fabricated and requires an enterprise API.
 */
export type SourceConfidence =
  | 'verified_google'
  | 'verified_external'
  | 'ai_suggestion'
  | 'unavailable';

export interface TopicMetrics {
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  domainAuthority: number | null;
  backlinks: number | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  position?: number | null;
  status: 'verified' | 'unavailable';
  notes?: string;
}

/**
 * A candidate search topic discovered from a reference source.
 */
export interface DiscoveredTopic {
  /** The raw phrase a person would search for. */
  phrase: string;
  /** Stable identity, derived from the phrase only. */
  topicKey: string;
  intent: SearchIntent;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  /** Which source(s) surfaced this, for the audit trail. */
  sources: string[];
  /** Data confidence tier (verified Google, external research, or AI suggestion). */
  confidence?: SourceConfidence;
  /** Verified or unverified metrics (strictly never fabricated). */
  metrics?: TopicMetrics;
  /** Optional free-text hint such as a location or seasonality note. */
  note?: string;
}

export type ReferenceSourceId =
  | 'google-autocomplete'
  | 'google-trends'
  | 'pagespeed-insights'
  | 'google-search-console'
  | 'google-keyword-planner'
  | 'semrush'
  | 'ahrefs'
  | 'answerthepublic'
  | 'screaming-frog'
  | 'bing-webmaster'
  | 'indexnow';

/**
 * Reference URL each integration corresponds to.
 */
export const REFERENCE_SOURCE_URLS: Record<ReferenceSourceId, string> = {
  'google-autocomplete': 'https://www.google.com/search?q=*',
  'google-trends': 'https://trends.google.com/trends/',
  'pagespeed-insights': 'https://pagespeed.web.dev/',
  'google-search-console': 'https://search.google.com/search-console',
  'google-keyword-planner': 'https://ads.google.com/home/tools/keyword-planner/',
  semrush: 'https://www.semrush.com/',
  ahrefs: 'https://ahrefs.com/',
  answerthepublic: 'https://answerthepublic.com/',
  'screaming-frog': 'https://www.screamingfrog.co.uk/seo-spider/',
  'bing-webmaster': 'https://www.bing.com/webmasters/',
  indexnow: 'https://www.indexnow.org/',
};

export type Availability = 'available' | 'unconfigured' | 'error';

export interface SourceStatus {
  id: ReferenceSourceId;
  referenceUrl: string;
  availability: Availability;
  /** What kind of signal this source contributes when available. */
  capabilities: string[];
  confidence?: SourceConfidence;
  detail?: string;
}

export interface SourceResult {
  topics: DiscoveredTopic[];
  status: SourceStatus;
}

/**
 * A pluggable reference source. Implementations must never fabricate data:
 * if credentials or network access are missing they return an empty topic list
 * or transparent AI-assisted suggestions with an accurate confidence status.
 */
export interface ReferenceSource {
  readonly id: ReferenceSourceId;
  readonly capabilities: string[];
  readonly confidence?: SourceConfidence;
  isConfigured(): boolean;
  discover(seedPhrases: string[], location?: string): Promise<DiscoveredTopic[]>;
  describeError?(err: unknown): string;
}
