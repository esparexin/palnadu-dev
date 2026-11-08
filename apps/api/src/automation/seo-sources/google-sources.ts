import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTopic, CredentialGatedSource } from './base-source';
import { DiscoveredTopic, ReferenceSource, ReferenceSourceId, SourceConfidence } from './types';

@Injectable()
export class GoogleAutocompleteSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'google-autocomplete';
  readonly confidence: SourceConfidence = 'verified_google';
  readonly capabilities = ['long-tail discovery', 'related searches', 'question queries', 'verified Google suggestions'];
  private readonly logger = new Logger(GoogleAutocompleteSource.name);
  private readonly endpoint = 'https://suggestqueries.google.com/complete/search';

  isConfigured(): boolean {
    return true;
  }

  async discover(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];

    for (const seed of seedPhrases) {
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
          const t = buildTopic(s, this.id, { confidence: 'verified_google' });
          if (t) topics.push(t);
        }
        this.logger.debug(`autocomplete "${seed}" -> ${suggestions.length} suggestions`);
      } catch (err) {
        this.logger.warn(`autocomplete failed for "${seed}": ${String(err)}`);
      }
    }

    return topics;
  }

  private parseSuggestions(body: string): string[] {
    try {
      const trimmed = body.trim();
      if (trimmed.startsWith('[')) {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json) && Array.isArray(json[1])) {
          return json[1].filter((x: unknown): x is string => typeof x === 'string');
        }
      }

      const xmlMatches = [...trimmed.matchAll(/<suggestion\s+data="([^"]+)"/g)];
      if (xmlMatches.length > 0) {
        return xmlMatches.map((m) => m[1]?.trim()).filter((x): x is string => !!x);
      }

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
  readonly confidence: SourceConfidence = 'verified_google';
  readonly capabilities = ['trending topics', 'seasonal searches', 'verified Google Trends India'];
  private readonly logger = new Logger(GoogleTrendsSource.name);

  isConfigured(): boolean {
    return true;
  }

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

      const trends = titles.slice(1).filter((t) => isBusinessRelevant(t));
      const topics: DiscoveredTopic[] = [];
      for (const t of trends) {
        const topic = buildTopic(t, this.id, {
          confidence: 'verified_google',
          note: 'trending search (Google Trends India)',
        });
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
export class GoogleKeywordPlannerSource extends CredentialGatedSource {
  constructor(config: ConfigService) {
    super(config);
  }
  readonly id: ReferenceSourceId = 'google-keyword-planner';
  readonly confidence: SourceConfidence = 'verified_google';
  readonly capabilities = ['search volume', 'keyword difficulty', 'commercial intent'];
  readonly credentialKeys = ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET'];

  async fetchTopics(): Promise<DiscoveredTopic[]> {
    return [];
  }
}
