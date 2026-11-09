import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildTopic } from './base-source';
import { DiscoveredTopic, ReferenceSource, ReferenceSourceId, SourceConfidence } from './types';

@Injectable()
export class AnswerThePublicSource implements ReferenceSource {
  readonly id: ReferenceSourceId = 'answerthepublic';
  readonly confidence: SourceConfidence = 'ai_suggestion';
  readonly capabilities = ['customer questions', 'FAQ discovery', 'long-tail question clusters'];
  private readonly logger = new Logger(AnswerThePublicSource.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return true;
  }

  async discover(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const key = this.config.get<string>('ATP_API_KEY');
    if (key) {
      try {
        const topics = await this.fetchFromAtpApi(key, seedPhrases);
        if (topics.length > 0) return topics;
      } catch (err) {
        this.logger.warn(`ATP API failed, falling back to AI customer question generation: ${String(err)}`);
      }
    }

    return this.discoverCustomerQuestions(seedPhrases);
  }

  private async fetchFromAtpApi(key: string, seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];
    for (const seed of seedPhrases.slice(0, 5)) {
      try {
        const res = await fetch('https://api.answerthepublic.com/v3/question-ideas/list', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed, include_questions: true }),
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const json: any = await res.json();
        for (const q of json?.questions ?? []) {
          const t = buildTopic(q, this.id, { intent: 'FAQ', confidence: 'verified_external', note: 'atp api question' });
          if (t) topics.push(t);
        }
      } catch {
        // continue
      }
    }
    return topics;
  }

  private async discoverCustomerQuestions(seedPhrases: string[]): Promise<DiscoveredTopic[]> {
    const topics: DiscoveredTopic[] = [];
    const questionStarters = ['how much does', 'how to choose', 'why do businesses need', 'what is the best'];

    for (const seed of seedPhrases.slice(0, 4)) {
      for (const starter of questionStarters.slice(0, 2)) {
        const query = `${starter} ${seed}`;
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
              intent: 'FAQ',
              confidence: 'ai_suggestion',
              note: 'AI-assisted customer question (via Google question patterns)',
              metrics: {
                searchVolume: null,
                keywordDifficulty: null,
                cpc: null,
                domainAuthority: null,
                backlinks: null,
                status: 'unavailable',
                notes: 'ATP_API_KEY is not configured; volume and CPC metrics are unavailable and not fabricated.',
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
    return `AnswerThePublic discovery error: ${String(err)}`;
  }
}
