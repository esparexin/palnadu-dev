import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { canonicalizeTopic } from '../topic-identity';
import { isViableTopicPhrase } from './topic-relevance';
import {
  DiscoveredTopic,
  ReferenceSource,
  ReferenceSourceId,
  SourceConfidence,
  TopicMetrics,
} from './types';

/** Shared helper: turn a raw phrase into a fully-populated topic. */
export function buildTopic(
  phrase: string,
  sourceId: ReferenceSourceId,
  extras: Partial<DiscoveredTopic> = {},
): DiscoveredTopic | null {
  const cleaned = phrase.replace(/\s+/g, ' ').trim();
  // Drop short fragments, single-word autocomplete noise, and off-topic junk.
  if (!isViableTopicPhrase(cleaned)) return null;

  const canonical = canonicalizeTopic(cleaned);
  if (!canonical.topicKey || canonical.tokens.length === 0) return null;

  const defaultConfidence: SourceConfidence =
    sourceId === 'google-autocomplete' ||
    sourceId === 'google-trends' ||
    sourceId === 'google-search-console' ||
    sourceId === 'google-keyword-planner'
      ? 'verified_google'
      : sourceId === 'pagespeed-insights' || sourceId === 'screaming-frog'
        ? 'verified_external'
        : 'ai_suggestion';

  const defaultMetrics: TopicMetrics = {
    searchVolume: null,
    keywordDifficulty: null,
    cpc: null,
    domainAuthority: null,
    backlinks: null,
    status: 'unavailable',
    notes: 'Metrics unavailable without enterprise paid API; values are never fabricated.',
  };

  return {
    phrase: cleaned,
    topicKey: canonical.topicKey,
    intent: extras.intent ?? canonical.intent,
    primaryKeyword: extras.primaryKeyword ?? cleaned.toLowerCase(),
    secondaryKeywords: extras.secondaryKeywords ?? [],
    longTailKeywords: extras.longTailKeywords ?? [],
    sources: [sourceId],
    confidence: extras.confidence ?? defaultConfidence,
    metrics: extras.metrics ?? defaultMetrics,
    ...(extras.note ? { note: extras.note } : {}),
  };
}

/**
 * Credential-gated adapters base class.
 */
export abstract class CredentialGatedSource implements ReferenceSource {
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
