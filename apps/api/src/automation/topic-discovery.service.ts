import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  DiscoveredTopic,
  ReferenceSource,
  ReferenceSourceId,
  SourceStatus,
  REFERENCE_SOURCE_URLS,
} from './seo-sources';
import { REFERENCE_SOURCES } from './seo-sources';

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
  private readonly seedPhrases = [
    'website development guntur',
    'mobile app development guntur',
    'billing software andhra pradesh',
    'school management software',
    'local seo guntur',
    'erp software palnadu',
    'ecommerce website cost',
    'custom software development andhra pradesh',
  ];

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
    }));
  }

  /**
   * Runs every configured source and returns deduplicated candidate topics.
   *
   * Candidates whose topicKey already exists in the database are dropped here as
   * a cheap first pass; the authoritative check still happens at enqueue time.
   */
  async discover(limit = 100): Promise<DiscoveredTopic[]> {
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

    // Merge duplicates that several sources surfaced, keeping all provenance.
    const merged = new Map<string, DiscoveredTopic>();
    for (const t of collected) {
      const existing = merged.get(t.topicKey);
      if (existing) {
        existing.sources = [...new Set([...existing.sources, ...t.sources])];
        existing.secondaryKeywords = [...new Set([...existing.secondaryKeywords, ...t.secondaryKeywords])];
        existing.longTailKeywords = [...new Set([...existing.longTailKeywords, ...t.longTailKeywords])];
        if (!existing.primaryKeyword || existing.primaryKeyword === existing.phrase.toLowerCase()) {
          if (t.primaryKeyword) existing.primaryKeyword = t.primaryKeyword;
        }
      } else {
        merged.set(t.topicKey, { ...t });
      }
    }

    const candidates = [...merged.values()];

    // Cheap pre-filter: drop anything we already generated.
    const alreadyGenerated = new Set(
      (await this.prisma.blogPost.findMany({ select: { topicKey: true } }))
        .map((p) => p.topicKey)
        .filter((k): k is string => !!k),
    );
    const queued = new Set(
      (await this.prisma.blogTopic.findMany({ select: { topicKey: true } })).map((t) => t.topicKey),
    );

    const fresh = candidates.filter((c) => !alreadyGenerated.has(c.topicKey) && !queued.has(c.topicKey));

    this.logger.log(
      `discovered ${candidates.length} candidate topics from ${this.sources.filter((s) => s.isConfigured()).length} sources; ` +
        `${fresh.length} are new after dedup`,
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