import { Inject, Injectable, Logger } from '@nestjs/common';
import { BlogLanguage } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  DiscoveredTopic,
  ReferenceSource,
  ReferenceSourceId,
  SourceStatus,
  REFERENCE_SOURCE_URLS,
  REFERENCE_SOURCES,
  isViableTopicPhrase,
} from './seo-sources';
import { DISCOVERY_SEED_PHRASES } from './discovery-seeds';

/**
 * Website intelligence + reference-source discovery.
 *
 * Pipeline (per the automation design):
 *
 *   existing blogs -> topics -> keywords -> intent -> URLs
 *     -> content similarity -> gaps -> new topic opportunities
 *
 * Discovery output is only ever *proposed* here. Enqueueing happens in
 * BlogAutomationService after the topic-level duplicate check, so no path can
 * write a queue row that bypasses dedup.
 */
@Injectable()
export class TopicDiscoveryService {
  private readonly logger = new Logger(TopicDiscoveryService.name);

  /** Seeds used when no live source yields anything useful. */
  private readonly seedPhrases = DISCOVERY_SEED_PHRASES;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REFERENCE_SOURCES) private readonly sources: ReferenceSource[],
  ) {}

  /** Availability of every registered source, for the admin UI. */
  async sourceStatuses(): Promise<SourceStatus[]> {
    return this.sources.map((s) => ({
      id: s.id,
      referenceUrl: REFERENCE_SOURCE_URLS[s.id],
      availability: s.isConfigured() ? ('available' as const) : ('unconfigured' as const),
      capabilities: s.capabilities,
      confidence: s.confidence,
    }));
  }

  /**
   * Runs every configured source and returns deduplicated candidate topics for the target language.
   *
   * Candidates whose (topicKey, language) already exists in the database are dropped here
   * as a cheap first pass; the authoritative check still happens at enqueue time.
   */
  async discover(
    limit = 100,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<DiscoveredTopic[]> {
    const candidates = await this.collectMergedCandidates();
    return this.filterFreshForLanguage(candidates, language, limit);
  }

  /** Collects reference-source candidates once and filters independently per target language. */
  async discoverForLanguages(
    limit = 100,
    languages: BlogLanguage[] = [BlogLanguage.en],
  ): Promise<Array<{ language: BlogLanguage; topics: DiscoveredTopic[] }>> {
    const uniqueLanguages = [...new Set(languages)];
    const candidates = await this.collectMergedCandidates();
    return Promise.all(
      uniqueLanguages.map(async (language) => ({
        language,
        topics: await this.filterFreshForLanguage(candidates, language, limit),
      })),
    );
  }

  private async collectMergedCandidates(): Promise<DiscoveredTopic[]> {
    const collected: DiscoveredTopic[] = [];

    const results = await Promise.allSettled(
      this.sources
        .filter((s) => s.isConfigured())
        .map((s) => this.runSource(s)),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') collected.push(...r.value);
      else this.logger.warn(`source failed: ${String(r.reason)}`);
    }

    if (collected.length === 0) {
      this.logger.warn('No reference source returned topics; no new topics will be discovered.');
    }

    // Merge duplicates that several sources surfaced, keeping all provenance and highest confidence.
    const merged = new Map<string, DiscoveredTopic>();
    for (const t of collected) {
      if (!isViableTopicPhrase(t.phrase)) continue;
      const existing = merged.get(t.topicKey);
      if (existing) {
        existing.sources = [...new Set([...existing.sources, ...t.sources])];
        existing.secondaryKeywords = [...new Set([...existing.secondaryKeywords, ...t.secondaryKeywords])];
        existing.longTailKeywords = [...new Set([...existing.longTailKeywords, ...t.longTailKeywords])];
        if (!existing.primaryKeyword || existing.primaryKeyword === existing.phrase.toLowerCase()) {
          if (t.primaryKeyword) existing.primaryKeyword = t.primaryKeyword;
        }
        // Confidence hierarchy: verified_google > verified_external > ai_suggestion
        if (t.confidence === 'verified_google') {
          existing.confidence = 'verified_google';
        } else if (existing.confidence !== 'verified_google' && t.confidence) {
          existing.confidence = t.confidence;
        }
        if (t.metrics && (!existing.metrics || (existing.metrics.status !== 'verified' && t.metrics.status === 'verified'))) {
          existing.metrics = t.metrics;
        }
        if (t.note && (!existing.note || t.metrics?.status === 'verified')) {
          existing.note = t.note;
        }
      } else {
        merged.set(t.topicKey, { ...t });
      }
    }

    return [...merged.values()];
  }

  private async filterFreshForLanguage(
    candidates: DiscoveredTopic[],
    language: BlogLanguage,
    limit: number,
  ): Promise<DiscoveredTopic[]> {
    const matchesLang = (rowLang?: BlogLanguage | null) =>
      rowLang === language || (!rowLang && language === BlogLanguage.en);

    const [postRows, topicRows] = await Promise.all([
      this.prisma.blogPost.findMany({ where: { language }, select: { topicKey: true, language: true } }),
      this.prisma.blogTopic.findMany({ where: { language }, select: { topicKey: true, language: true } }),
    ]);

    const alreadyGenerated = new Set(
      postRows
        .filter((p) => p.topicKey && matchesLang(p.language))
        .map((p) => p.topicKey as string),
    );
    const queued = new Set(
      topicRows
        .filter((t) => matchesLang(t.language))
        .map((t) => t.topicKey),
    );

    const fresh = candidates.filter((c) => !alreadyGenerated.has(c.topicKey) && !queued.has(c.topicKey));

    this.logger.log(
      `discovered ${candidates.length} candidate topics from ${this.sources.filter((s) => s.isConfigured()).length} sources; ` +
        `${fresh.length} are new [${language}] after dedup`,
    );

    return fresh.slice(0, limit);
  }

  private async runSource(source: ReferenceSource): Promise<DiscoveredTopic[]> {
    const started = Date.now();
    try {
      const topics = await source.discover(this.seedPhrases, 'IN');
      this.logger.log(
        `${source.id}: ${topics.length} topics in ${Date.now() - started}ms`,
      );
      return topics;
    } catch (err) {
      this.logger.warn(`${source.id} failed: ${String(err)}`);
      return [];
    }
  }

  /**
   * Summarises what the site already covers, so discovery can target gaps
   * instead of restating existing articles.
   */
  async coverageReport(): Promise<{
    totalPosts: number;
    published: number;
    drafts: number;
    topicsCovered: string[];
    keywordsCovered: string[];
    intentsCovered: Record<string, number>;
    topLevelGaps: number;
  }> {
    const posts = await this.prisma.blogPost.findMany({
      select: {
        topicKey: true,
        primaryKeyword: true,
        searchIntent: true,
        status: true,
      },
    });

    const intents: Record<string, number> = {};
    for (const p of posts) {
      const k = p.searchIntent ?? 'UNSET';
      intents[k] = (intents[k] ?? 0) + 1;
    }

    return {
      totalPosts: posts.length,
      published: posts.filter((p) => p.status === 'PUBLISHED').length,
      drafts: posts.filter((p) => p.status === 'DRAFT').length,
      topicsCovered: posts.map((p) => p.topicKey).filter((k): k is string => !!k),
      keywordsCovered: posts.map((p) => p.primaryKeyword).filter((k): k is string => !!k),
      intentsCovered: intents,
      topLevelGaps: Object.keys(intents).length,
    };
  }

  /**
   * Seeds for the discovery sources. Public so the admin UI can offer
   * "discover from this seed" without duplicating the list.
   */
  getSeedPhrases(): string[] {
    return [...this.seedPhrases];
  }

  /** Ids of sources that can currently contribute. */
  activeSourceIds(): ReferenceSourceId[] {
    return this.sources.filter((s) => s.isConfigured()).map((s) => s.id);
  }
}