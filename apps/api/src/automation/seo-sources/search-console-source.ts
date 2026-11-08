import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTopic, CredentialGatedSource } from './base-source';
import { DiscoveredTopic, ReferenceSourceId, SourceConfidence } from './types';

@Injectable()
export class GoogleSearchConsoleSource extends CredentialGatedSource {
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'google-search-console';
  readonly confidence: SourceConfidence = 'verified_google';
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
      const t = buildTopic(query, this.id, {
        confidence: 'verified_google',
        note: `gsc impressions=${row.impressions}`,
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
    const token = this.config.get<string>('GSC_ACCESS_TOKEN');
    const siteUrl = this.config.get<string>('GSC_SITE_URL');
    if (!token || !siteUrl) return null;

    try {
      const endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionUrl, siteUrl }),
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
    const token = this.config.get<string>('GSC_ACCESS_TOKEN');
    const siteUrl = this.config.get<string>('GSC_SITE_URL');
    if (!token || !siteUrl) return false;

    try {
      const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`GSC submitSitemap failed: ${String(err)}`);
      return false;
    }
  }
}
