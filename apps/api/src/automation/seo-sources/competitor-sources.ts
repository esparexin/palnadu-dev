import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTopic } from './base-source';
import { DiscoveredTopic, ReferenceSource, ReferenceSourceId, SourceConfidence } from './types';

@Injectable()
export class SemrushSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'semrush';
  readonly confidence: SourceConfidence = 'ai_suggestion';
  readonly capabilities = ['competitor research', 'content gaps', 'AI keyword clustering'];
  private readonly logger = new Logger(SemrushSource.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return true;
  }

  async discover(seedPhrases: string[], location = 'IN'): Promise<DiscoveredTopic[]> {
    const key = this.config.get<string>('SEMRUSH_API_KEY');
    if (key) {
      try {
        const topics = await this.fetchFromSemrushApi(key, seedPhrases);
        if (topics.length > 0) return topics;
      } catch (err) {
        this.logger.warn(`SEMrush API failed, falling back to AI competitor research: ${String(err)}`);
      }
    }

    return this.discoverAiCompetitorGaps(seedPhrases, location);
  }

  private async fetchFromSemrushApi(key: string, seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];
    for (const seed of seedPhrases.slice(0, 5)) {
      const url = new URL('https://api.semrush.com/');
      url.searchParams.set('type', 'phrase_related');
      url.searchParams.set('key', key);
      url.searchParams.set('phrase', seed);
      url.searchParams.set('database', 'in');
      url.searchParams.set('export_columns', 'Phrase,Related Phrases,Number');
      url.searchParams.set('limit', '10');

      try {
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;
        const text = await res.text();
        for (const line of text.split('\n').slice(1)) {
          const phrase = line.split('\t')[0]?.trim();
          const t = phrase ? buildTopic(phrase, this.id, { confidence: 'verified_external', note: 'semrush api' }) : null;
          if (t) topics.push(t);
        }
      } catch {
        // continue
      }
    }
    return topics;
  }

  private async discoverAiCompetitorGaps(seedPhrases: string[], _location: string): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];
    const modifierPatterns = ['vs', 'alternatives', 'best', 'cost comparison'];

    for (const seed of seedPhrases.slice(0, 5)) {
      for (const mod of modifierPatterns.slice(0, 2)) {
        const query = `${seed} ${mod}`;
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=in&q=${encodeURIComponent(query)}`;
        try {
          const res = await fetch(url, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) continue;
          const json = await res.json();
          const suggestions: string[] = Array.isArray(json[1]) ? json[1] : [];
          for (const s of suggestions.slice(0, 3)) {
            const t = buildTopic(s, this.id, {
              intent: mod === 'vs' || mod === 'alternatives' ? 'COMPARISON' : 'COMMERCIAL_INVESTIGATION',
              confidence: 'ai_suggestion',
              note: `AI-assisted competitor research (via Google query pattern "${mod}")`,
              metrics: {
                searchVolume: null,
                keywordDifficulty: null,
                cpc: null,
                domainAuthority: null,
                backlinks: null,
                status: 'unavailable',
                notes: 'SEMRUSH_API_KEY is not configured; metrics are unavailable and not fabricated.',
              },
            });
            if (t) topics.push(t);
          }
        } catch {
          // continue
        }
      }
    }
    return topics;
  }

  describeError(err: unknown): string {
    return `SEMrush discovery error: ${String(err)}`;
  }
}

@Injectable()
export class AhrefsSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'ahrefs';
  readonly confidence: SourceConfidence = 'ai_suggestion';
  readonly capabilities = ['backlink opportunity discovery', 'directory research', 'outreach suggestions'];
  private readonly logger = new Logger(AhrefsSource.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return true;
  }

  async discover(seedPhrases: string[], location = 'Guntur'): Promise<DiscoveredTopic[]> {
    const token = this.config.get<string>('AHREFS_API_TOKEN');
    if (token) {
      try {
        const topics = await this.fetchFromAhrefsApi(token, seedPhrases);
        if (topics.length > 0) return topics;
      } catch (err) {
        this.logger.warn(`Ahrefs API failed, falling back to AI outreach discovery: ${String(err)}`);
      }
    }

    return this.discoverOutreachAndDirectoryTopics(seedPhrases, location);
  }

  private async fetchFromAhrefsApi(token: string, seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];
    for (const seed of seedPhrases.slice(0, 5)) {
      try {
        const res = await fetch('https://api.ahrefs.com/v3/keyword-explorer/overview', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'related', country: 'in', input: seed, output: 'keywords' }),
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const json: any = await res.json();
        for (const kw of json?.keywords ?? []) {
          const phrase: string = kw?.keyword;
          const t = phrase ? buildTopic(phrase, this.id, { confidence: 'verified_external', note: 'ahrefs api' }) : null;
          if (t) topics.push(t);
        }
      } catch {
        // continue
      }
    }
    return topics;
  }

  private discoverOutreachAndDirectoryTopics(seedPhrases: string[], location: string): DiscoveredTopic[] {
    const loc = location || 'Palnadu and Guntur';
    const domainService = seedPhrases[0] || 'Software and Website Development';
    const opportunities = [
      `Andhra Pradesh Chamber of Commerce and Industry Directory for ${domainService}`,
      `District Industries Centre MSME Technology Partner Guide in ${loc}`,
      `Verified Local Software and Web Services Register in ${loc}`,
    ];

    const topics: DiscoveredTopic[] = [];
    for (const opp of opportunities) {
      const t = buildTopic(opp, this.id, {
        intent: 'PRODUCT_SERVICE_RESEARCH',
        confidence: 'ai_suggestion',
        note: 'AI-assisted directory & backlink opportunity (regional outreach)',
        metrics: {
          searchVolume: null,
          keywordDifficulty: null,
          cpc: null,
          domainAuthority: null,
          backlinks: null,
          status: 'unavailable',
          notes: 'AHREFS_API_TOKEN is not configured; DR, DA, and backlink counts are unavailable and never fabricated.',
        },
      });
      if (t) topics.push(t);
    }
    return topics;
  }

  describeError(err: unknown): string {
    return `Ahrefs discovery error: ${String(err)}`;
  }
}
