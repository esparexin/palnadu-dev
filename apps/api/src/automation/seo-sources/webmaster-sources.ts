import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { CredentialGatedSource } from './base-source';
import { DiscoveredTopic, ReferenceSource, ReferenceSourceId, SourceConfidence } from './types';

@Injectable()
export class PageSpeedInsightsSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'pagespeed-insights';
  readonly confidence: SourceConfidence = 'verified_external';
  readonly capabilities = ['technical SEO insights', 'existing content analysis', 'Core Web Vitals'];
  private readonly logger = new Logger(PageSpeedInsightsSource.name);
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('PAGESPEED_API_KEY');
  }

  isConfigured(): boolean {
    return true;
  }

  async discover(): Promise<DiscoveredTopic[]> {
    return [];
  }

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

@Injectable()
export class ScreamingFrogSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'screaming-frog';
  readonly confidence: SourceConfidence = 'verified_external';
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

@Injectable()
export class BingWebmasterSource extends CredentialGatedSource {
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'bing-webmaster';
  readonly confidence: SourceConfidence = 'verified_external';
  readonly capabilities = ['sitemap submission', 'URL indexing', 'search traffic statistics'];
  readonly credentialKeys = ['BING_WEBMASTER_API_KEY', 'BING_SITE_URL'];

  async submitUrl(url: string): Promise<boolean> {
    const apiKey = this.config.get<string>('BING_WEBMASTER_API_KEY');
    const siteUrl = this.config.get<string>('BING_SITE_URL');
    if (!apiKey || !siteUrl) return false;

    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, url }),
        signal: AbortSignal.timeout(15000),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`Bing URL submission failed: ${String(err)}`);
      return false;
    }
  }

  async submitSitemap(sitemapUrl: string): Promise<boolean> {
    const apiKey = this.config.get<string>('BING_WEBMASTER_API_KEY');
    const siteUrl = this.config.get<string>('BING_SITE_URL');
    if (!apiKey || !siteUrl) return false;

    const endpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed?apikey=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, feedUrl: sitemapUrl }),
        signal: AbortSignal.timeout(15000),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`Bing sitemap submission failed: ${String(err)}`);
      return false;
    }
  }

  async fetchTopics(): Promise<DiscoveredTopic[]> {
    return [];
  }
}

@Injectable()
export class IndexNowSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'indexnow';
  readonly confidence: SourceConfidence = 'verified_external';
  readonly capabilities = ['instant index notification', 'Bing & Yandex crawl dispatch'];
  private readonly logger = new Logger(IndexNowSource.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return true;
  }

  async submitUrls(host: string, urlList: string[], key?: string): Promise<any> {
    const apiKey = key || this.config.get<string>('INDEXNOW_KEY') || 'palnadudev-indexnow-key';
    const payload = {
      host,
      key: apiKey,
      keyLocation: `https://${host}/${apiKey}.txt`,
      urlList: urlList.slice(0, 100),
    };

    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      return {
        success: res.status === 200 || res.status === 202,
        submitted: urlList.length,
        status: res.status,
      };
    } catch (err) {
      this.logger.warn(`IndexNow submission failed: ${String(err)}`);
      return { success: false, submitted: 0, status: 500 };
    }
  }

  async discover(): Promise<DiscoveredTopic[]> {
    return [];
  }
}
