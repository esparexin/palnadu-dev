import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { canonicalizeTopic, SearchIntent } from './topic-identity';

/**
 * DI token for the discovery-source adapters.
 *
 * Lives here — not in automation.module.ts — because topic-discovery.service
 * needs it and the module needs the service. Defining it in the module
 * created a CommonJS import cycle that left the token `undefined` at
 * decoration time, so Nest could not resolve the dependency and the whole
 * API refused to boot.
 */
export const REFERENCE_SOURCES = 'REFERENCE_SOURCES';

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
  | 'screaming-frog';

/**
 * Reference URL each integration corresponds to.
 *
 * These are the canonical entry points a human would use. They are recorded for
 * provenance and for the admin UI; they are NOT scraped. Search Console,
 * Keyword Planner, Semrush and Ahrefs all require authentication and expose no
 * usable public API, and Scraping any of them would violate their terms and
 * return nothing account-specific anyway. Each adapter below therefore reads
 * from an official API only when credentials are configured, and otherwise
 * reports itself unavailable rather than inventing data.
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
};

export type Availability = 'available' | 'unconfigured' | 'error';

export interface SourceStatus {
  id: ReferenceSourceId;
  referenceUrl: string;
  availability: Availability;
  /** What kind of signal this source contributes when available. */
  capabilities: string[];
  detail?: string;
}

export interface SourceResult {
  topics: DiscoveredTopic[];
  status: SourceStatus;
}

/**
 * A pluggable reference source. Implementations must never fabricate data:
 * if credentials or network access are missing they return an empty topic list
 * with an accurate availability status.
 */
export interface ReferenceSource {
  readonly id: ReferenceSourceId;
  readonly capabilities: string[];
  isConfigured(): boolean;
  discover(seedPhrases: string[], location?: string): Promise<DiscoveredTopic[]>;
  describeError?(err: unknown): string;
}

/** Shared helper: turn a raw phrase into a fully-populated topic. */
export function buildTopic(
  phrase: string,
  sourceId: ReferenceSourceId,
  extras: Partial<DiscoveredTopic> = {},
): DiscoveredTopic | null {
  const cleaned = phrase.replace(/\s+/g, ' ').trim();
  // Very short fragments are autocomplete noise, not topics.
  if (cleaned.length < 6 || cleaned.length > 120) return null;

  const canonical = canonicalizeTopic(cleaned);
  if (!canonical.topicKey || canonical.tokens.length === 0) return null;

  return {
    phrase: cleaned,
    topicKey: canonical.topicKey,
    intent: extras.intent ?? canonical.intent,
    primaryKeyword: extras.primaryKeyword ?? cleaned.toLowerCase(),
    secondaryKeywords: extras.secondaryKeywords ?? [],
    longTailKeywords: extras.longTailKeywords ?? [],
    sources: [sourceId],
    ...(extras.note ? { note: extras.note } : {}),
  };
}

@Injectable()
export class GoogleAutocompleteSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'google-autocomplete';
  readonly capabilities = ['long-tail discovery', 'related searches', 'question queries'];
  private readonly logger = new Logger(GoogleAutocompleteSource.name);
  /** Public suggestion endpoint; no credentials required. */
  private readonly endpoint = 'https://suggestqueries.google.com/complete/search';

  isConfigured(): boolean {
    return true;
  }

  async discover(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];

    for (const seed of seedPhrases) {
      // The "client=firefox" variant returns JSONP we do not need; the plain
      // response is pipe-delimited which we parse defensively.
      const url = `${this.endpoint}?client=toolbar&hl=en&gl=in&q=${encodeURIComponent(seed)}`;
      try {
        const res = await fetch(url, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;

        const body = await res.text();
        const suggestions = this.parseSuggestions(body);
        for (const s of suggestions) {
          const t = buildTopic(s, this.id);
          if (t) topics.push(t);
        }
        this.logger.debug(`autocomplete "${seed}" -> ${suggestions.length} suggestions`);
      } catch (err) {
        this.logger.warn(`autocomplete failed for "${seed}": ${String(err)}`);
      }
    }

    return topics;
  }

  /**
   * Response is a 4-element array-ish string. We deliberately take only the
   * suggestion list and ignore any embedded metadata.
   */
  private parseSuggestions(body: string): string[] {
    try {
      // Firefox client returns a real JSON array.
      const trimmed = body.trim();
      if (trimmed.startsWith('[')) {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json) && Array.isArray(json[1])) {
          return json[1].filter((x: unknown): x is string => typeof x === 'string');
        }
      }
      // Otherwise fall back to the pipe-delimited form:
      // ["q",["a","b"],["d"],[],...]
      const start = trimmed.indexOf('[');
      if (start === -1) return [];
      const arrStart = trimmed.indexOf('[', start + 1);
      if (arrStart === -1) return [];
      let depth = 0;
      let end = -1;
      for (let i = arrStart; i < trimmed.length; i++) {
        if (trimmed[i] === '[') depth++;
        else if (trimmed[i] === ']') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end === -1) return [];
      const list = JSON.parse(trimmed.slice(arrStart, end + 1));
      return Array.isArray(list) ? list.filter((x: unknown): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  describeError(err: unknown): string {
    return `Google autocomplete request failed: ${String(err)}`;
  }
}

@Injectable()
export class GoogleTrendsSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'google-trends';
  readonly capabilities = ['trending topics', 'seasonal searches'];
  private readonly logger = new Logger(GoogleTrendsSource.name);

  isConfigured(): boolean {
    return true;
  }

  /**
   * Uses the public daily-trends RSS feed. This yields real trending terms,
   * which we narrow to those plausibly relevant to the business before
   * proposing them as topics.
   */
  async discover(_seedPhrases: string[], location = 'IN'): Promise<DiscoveredTopic[]> {
    const url = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(location)}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];

      const xml = await res.text();
      const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)]
        .map((m) => m[1]?.trim())
        .filter((t): t is string => !!t);

      // First <title> is the feed title, not a trend.
      const trends = titles.slice(1).filter((t) => isBusinessRelevant(t));
      const topics: DiscoveredTopic[] = [];
      for (const t of trends) {
        const topic = buildTopic(t, this.id, { note: 'trending search' });
        if (topic) topics.push(topic);
      }
      return topics;
    } catch (err) {
      this.logger.warn(`trends fetch failed: ${String(err)}`);
      return [];
    }
  }

  describeError(err: unknown): string {
    return `Google Trends RSS fetch failed: ${String(err)}`;
  }
}

/**
 * Keeps trending noise out of the content pipeline. A trending news headline is
 * not a topic a client will ever search for on our site.
 */
function isBusinessRelevant(phrase: string): boolean {
  const p = phrase.toLowerCase();
  const relevant = [
    'software', 'website', 'app', 'digital', 'seo', 'marketing', 'business',
    'startup', 'technology', 'tech', 'cloud', 'data', 'ai', 'mobile', 'online',
    'shop', 'store', 'billing', 'payment', 'school', 'hospital', 'clinic',
  ];
  return relevant.some((k) => p.includes(k));
}

@Injectable()
export class PageSpeedInsightsSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'pagespeed-insights';
  readonly capabilities = ['technical SEO insights', 'existing content analysis', 'Core Web Vitals'];
  private readonly logger = new Logger(PageSpeedInsightsSource.name);
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('PAGESPEED_API_KEY');
  }

  /** The endpoint works without a key but is heavily rate-limited. */
  isConfigured(): boolean {
    return true;
  }

  /**
   * PageSpeed scores pages, not keywords. It contributes *which of our own URLs
   * underperform*, so discovery can prioritise topics for pages that need work.
   * It does not invent topics itself.
   */
  async discover(): Promise<DiscoveredTopic[]> {
    return [];
  }

  /**
   * Returns a diagnostic report for a URL, used by the discovery service to
   * decide whether the site's own content needs topical expansion.
   */
  async analyseUrl(url: string): Promise<{
    url: string;
    performance: number | null;
    seo: number | null;
    opportunities: string[];
  } | null> {
    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('strategy', 'mobile');
    if (this.apiKey) endpoint.searchParams.set('key', this.apiKey);

    try {
      const res = await fetch(endpoint.toString(), { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return null;
      const json: any = await res.json();
      const cats = json?.lighthouseResult?.categories ?? {};
      return {
        url,
        performance: cats.performance?.score ?? null,
        seo: cats.seo?.score ?? null,
        opportunities: this.extractOpportunities(json),
      };
    } catch (err) {
      this.logger.warn(`pagespeed failed for ${url}: ${String(err)}`);
      return null;
    }
  }

  private extractOpportunities(json: any): string[] {
    const audits = json?.lighthouseResult?.audits ?? {};
    const out: string[] = [];
    for (const [id, audit] of Object.entries<any>(audits)) {
      if (audit?.score !== null && audit?.score < 0.5 && audit?.scoreDisplayMode !== 'notApplicable') {
        const title: string = audit?.title ?? id;
        out.push(`${id}: ${title}`);
      }
    }
    return out.slice(0, 10);
  }

  describeError(err: unknown): string {
    return `PageSpeed request failed: ${String(err)}`;
  }
}

/**
 * Credential-gated adapters.
 *
 * Each of these services requires an authenticated account and provides no
 * public, keyless API. They are implemented to use the official API when a
 * credential is present, and to report `unconfigured` otherwise. Crucially they
 * never scrape the marketing URL and never fabricate metrics.
 */
abstract class CredentialGatedSource implements ReferenceSource {
  abstract readonly id: ReferenceSourceId;
  abstract readonly capabilities: string[];
  abstract readonly credentialKeys: string[];
  protected readonly logger: Logger;

  constructor(protected readonly config: ConfigService) {
    this.logger = new Logger(this.constructor.name);
  }

  isConfigured(): boolean {
    return this.credentialKeys.some((k) => !!this.config.get<string>(k));
  }

  /** Subclasses implement the real API call; return [] if not possible. */
  abstract fetchTopics(seedPhrases: string[], location?: string): Promise<DiscoveredTopic[]>;

  async discover(seedPhrases: string[], location?: string): Promise<DiscoveredTopic[]> {
    if (!this.isConfigured()) return [];
    try {
      return await this.fetchTopics(seedPhrases, location);
    } catch (err) {
      this.logger.warn(`${this.id} API call failed: ${String(err)}`);
      return [];
    }
  }

  describeError(err: unknown): string {
    return `${this.id} API call failed: ${String(err)}`;
  }
}

@Injectable()
export class GoogleSearchConsoleSource extends CredentialGatedSource {
  // Explicit constructor: Nest resolves DI from the subclass's own
  // design:paramtypes, not the inherited constructor. Without this,
  // ConfigService injects as undefined and every credential check throws.
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'google-search-console';
  readonly capabilities = ['search queries', 'page performance', 'content gap analysis'];
  readonly credentialKeys = ['GSC_ACCESS_TOKEN', 'GSC_SITE_URL'];

  /** Requires an OAuth token and a verified property. */
  async fetchTopics(seedPhrases: string[], location?: string): Promise<DiscoveredTopic[]> {
    const token = this.config.get<string>('GSC_ACCESS_TOKEN');
    const siteUrl = this.config.get<string>('GSC_SITE_URL');
    if (!token || !siteUrl) return [];

    const endpoint = new URL('https://searchconsole.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query');
    endpoint.searchParams.set('dimensions', 'query');
    endpoint.searchParams.set('rowLimit', '100');

    const res = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];

    const json: any = await res.json();
    const rows: any[] = json?.rows ?? [];
    const topics: DiscoveredTopic[] = [];
    for (const row of rows) {
      const query: string = row.keys?.[0];
      if (!query) continue;
      // Only propose queries we do not already cover well.
      if (row.impressions < 3) continue;
      const t = buildTopic(query, this.id, { note: `gsc impressions=${row.impressions}` });
      if (t) topics.push(t);
    }
    void seedPhrases;
    void location;
    return topics;
  }
}

@Injectable()
export class GoogleKeywordPlannerSource extends CredentialGatedSource {
  // Explicit constructor: Nest resolves DI from the subclass's own
  // design:paramtypes, not the inherited constructor. Without this,
  // ConfigService injects as undefined and every credential check throws.
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'google-keyword-planner';
  readonly capabilities = ['search volume', 'keyword difficulty', 'commercial intent'];
  readonly credentialKeys = ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET'];

  /**
   * Requires a Google Ads developer token and OAuth. Implemented as a guarded
   * no-op until those are provisioned.
   */
  async fetchTopics(): Promise<DiscoveredTopic[]> {
    return [];
  }
}

@Injectable()
export class SemrushSource extends CredentialGatedSource {
  // Explicit constructor: Nest resolves DI from the subclass's own
  // design:paramtypes, not the inherited constructor. Without this,
  // ConfigService injects as undefined and every credential check throws.
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'semrush';
  readonly capabilities = ['competitor research', 'content gaps', 'keyword difficulty'];
  readonly credentialKeys = ['SEMRUSH_API_KEY'];

  async fetchTopics(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const key = this.config.get<string>('SEMRUSH_API_KEY');
    if (!key) return [];

    const topics: DiscoveredTopic[] = [];
    for (const seed of seedPhrases.slice(0, 10)) {
      const url = new URL('https://api.semrush.com/');
      url.searchParams.set('type', 'phrase_related');
      url.searchParams.set('key', key);
      url.searchParams.set('phrase', seed);
      url.searchParams.set('database', 'in');
      url.searchParams.set('export_columns', 'Phrase,Related Phrases,Number');
      url.searchParams.set('limit', '20');

      try {
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const text = await res.text();
        for (const line of text.split('\n').slice(1)) {
          const phrase = line.split('\t')[0]?.trim();
          const t = phrase ? buildTopic(phrase, this.id, { note: 'semrush related' }) : null;
          if (t) topics.push(t);
        }
      } catch {
        // skip this seed, continue with the rest
      }
    }
    return topics;
  }
}

@Injectable()
export class AhrefsSource extends CredentialGatedSource {
  // Explicit constructor: Nest resolves DI from the subclass's own
  // design:paramtypes, not the inherited constructor. Without this,
  // ConfigService injects as undefined and every credential check throws.
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'ahrefs';
  readonly capabilities = ['content gaps', 'competitor research', 'backlink profile'];
  readonly credentialKeys = ['AHREFS_API_TOKEN'];

  async fetchTopics(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const token = this.config.get<string>('AHREFS_API_TOKEN');
    if (!token) return [];

    const topics: DiscoveredTopic[] = [];
    for (const seed of seedPhrases.slice(0, 10)) {
      try {
        const res = await fetch('https://api.ahrefs.com/v3/keyword-explorer/overview', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'related',
            country: 'in',
            input: seed,
            output: 'keywords',
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const json: any = await res.json();
        for (const kw of json?.keywords ?? []) {
          const phrase: string = kw?.keyword;
          const t = phrase ? buildTopic(phrase, this.id, { note: 'ahrefs related' }) : null;
          if (t) topics.push(t);
        }
      } catch {
        // skip this seed
      }
    }
    return topics;
  }
}

@Injectable()
export class AnswerThePublicSource extends CredentialGatedSource {
  // Explicit constructor: Nest resolves DI from the subclass's own
  // design:paramtypes, not the inherited constructor. Without this,
  // ConfigService injects as undefined and every credential check throws.
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'answerthepublic';
  readonly capabilities = ['related questions', 'FAQ discovery', 'content gap questions'];
  readonly credentialKeys = ['ATP_API_KEY'];

  async fetchTopics(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const key = this.config.get<string>('ATP_API_KEY');
    if (!key) return [];

    const topics: DiscoveredTopic[] = [];
    for (const seed of seedPhrases.slice(0, 5)) {
      try {
        const res = await fetch('https://api.answerthepublic.com/v3/question-ideas/list', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed, include_questions: true }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) continue;
        const json: any = await res.json();
        for (const q of json?.questions ?? []) {
          const t = buildTopic(q, this.id, { intent: 'FAQ', note: 'atp question' });
          if (t) topics.push(t);
        }
      } catch {
        // skip this seed
      }
    }
    return topics;
  }
}

/**
 * Screaming Frog is a desktop crawler with no public HTTP API. It is supported
 * only by ingesting a user-exported CSV, which the discovery service reads from
 * a configured path. Without that file the source is simply unavailable.
 */
@Injectable()
export class ScreamingFrogSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'screaming-frog';
  readonly capabilities = ['technical SEO audit', 'internal content inventory'];
  private readonly logger = new Logger(ScreamingFrogSource.name);
  private readonly exportPath: string | undefined;

  constructor(config: ConfigService) {
    this.exportPath = config.get<string>('SCREAMINGFROG_EXPORT_PATH');
  }

  isConfigured(): boolean {
    return !!this.exportPath;
  }

  async discover(): Promise<DiscoveredTopic[]> {
    // Content is read by TopicDiscoveryService via readExport(); this adapter
    // contributes no network discovery.
    this.logger.debug(`Screaming Frog export path: ${this.exportPath ?? '(not configured)'}`);
    return [];
  }

  readExport(): string | null {
    if (!this.exportPath) return null;
    try {
      if (!existsSync(this.exportPath)) return null;
      return readFileSync(this.exportPath, 'utf8');
    } catch (err) {
      this.logger.warn(`Screaming Frog export unreadable: ${String(err)}`);
      return null;
    }
  }
}