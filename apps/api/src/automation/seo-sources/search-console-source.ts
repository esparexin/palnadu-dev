import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTopic, CredentialGatedSource } from './base-source';
import { DiscoveredTopic, ReferenceSourceId, SourceConfidence, TopicMetrics } from './types';

interface GscSearchAnalyticsRow {
  keys?: unknown[];
  clicks?: unknown;
  impressions?: unknown;
  ctr?: unknown;
  position?: unknown;
}

function toFiniteMetric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function buildGscMetrics(
  impressions: number,
  clicks: number | null,
  ctr: number | null,
  position: number | null,
): { metrics: TopicMetrics; note: string } {
  const parts = [`impressions=${impressions}`];
  if (clicks !== null) parts.push(`clicks=${clicks}`);
  if (ctr !== null) parts.push(`ctr=${Number(ctr.toFixed(4))}`);
  if (position !== null) parts.push(`position=${Number(position.toFixed(2))}`);
  const summary = parts.join(' ');
  return {
    metrics: {
      searchVolume: null,
      keywordDifficulty: null,
      cpc: null,
      domainAuthority: null,
      backlinks: null,
      impressions,
      clicks,
      ctr,
      position,
      status: 'verified',
      notes: `Verified via Google Search Console (90d): ${summary}`,
    },
    note: `gsc ${summary}`,
  };
}

@Injectable()
export class GoogleSearchConsoleSource extends CredentialGatedSource {
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'google-search-console';
  readonly confidence: SourceConfidence = 'verified_google';
  readonly capabilities = ['search queries', 'page performance', 'content gap analysis'];
  readonly credentialKeys = ['GSC_ACCESS_TOKEN', 'GSC_SITE_URL'];

  override isConfigured(): boolean {
    return this.credentialKeys.every((k) => !!this.config.get<string>(k)?.trim());
  }

  private getCredentials(): { token: string; siteUrl: string } | null {
    const token = this.config.get<string>('GSC_ACCESS_TOKEN')?.trim();
    const siteUrl = this.config.get<string>('GSC_SITE_URL')?.trim();
    return token && siteUrl ? { token, siteUrl } : null;
  }

  /** Requires an OAuth token and a verified property. */
  async fetchTopics(seedPhrases: string[], location?: string): Promise<DiscoveredTopic[]> {
    const creds = this.getCredentials();
    if (!creds) return [];

    const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(creds.siteUrl)}/searchAnalytics/query`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        dimensions: ['query'],
        rowLimit: 100,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      this.logger.warn(`GSC searchAnalytics query failed: HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as { rows?: unknown };
    const rows = Array.isArray(json?.rows) ? (json.rows as GscSearchAnalyticsRow[]) : [];
    const topics: DiscoveredTopic[] = [];
    for (const row of rows) {
      const query = typeof row?.keys?.[0] === 'string' ? row.keys[0].trim() : '';
      if (!query) continue;
      const impressions = toFiniteMetric(row.impressions);
      // Only propose queries with meaningful verified search visibility.
      if (impressions === null || impressions < 3) continue;
      const clicks = toFiniteMetric(row.clicks);
      const ctr = toFiniteMetric(row.ctr);
      const position = toFiniteMetric(row.position);
      const { metrics, note } = buildGscMetrics(impressions, clicks, ctr, position);
      const t = buildTopic(query, this.id, {
        confidence: 'verified_google',
        metrics,
        note,
      });
      if (t) topics.push(t);
    }
    void seedPhrases;
    void location;
    return topics;
  }

  /**
   * Official Google Search Console URL Inspection API.
   * Returns index status, mobile usability, and rich results verdict for a specific URL.
   */
  async inspectUrl(inspectionUrl: string): Promise<any> {
    const creds = this.getCredentials();
    if (!creds) return null;

    try {
      const endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl, siteUrl: creds.siteUrl }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      this.logger.warn(`GSC inspectUrl failed for ${inspectionUrl}: ${String(err)}`);
      return null;
    }
  }

  /**
   * Official Google Search Console Sitemap Submission API.
   */
  async submitSitemap(sitemapUrl: string): Promise<boolean> {
    const creds = this.getCredentials();
    if (!creds) return false;

    try {
      const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(creds.siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${creds.token}` },
        signal: AbortSignal.timeout(15000),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`GSC submitSitemap failed: ${String(err)}`);
      return false;
    }
  }
}
