import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { TopicDiscoveryService } from './topic-discovery.service';
import { DiscoveredTopic } from './seo-sources';
import { BlogLanguage } from '@prisma/client';
import { allocateQuota, BilingualConfig, BilingualQuota } from './bilingual-quota';
import { BlogQueueService } from './blog/blog-queue.service';
import { BlogComposerService } from './blog/blog-composer.service';
import { BlogPublisherService } from './blog/blog-publisher.service';
import { BlogBilingualService } from './blog/blog-bilingual.service';
import { BlogStatusService } from './blog/blog-status.service';
import { BlogBatchService } from './blog/blog-batch.service';
import { inferCategoryFromTopic, resolveOrEnsureCategory } from './blog/blog-seeds';
import { ClaimedTopic, GenerationResult, QueueCandidate, RejectedTopic } from './blog/types';
import { syncExistingTopicPost, toGenerationResultFromPost, recordSingleArticleFailure } from './blog/blog-idempotency.util';

export * from './blog/types';
export * from './blog/blog-queue.service';
export * from './blog/blog-composer.service';
export * from './blog/blog-publisher.service';
export * from './blog/blog-bilingual.service';
export * from './blog/blog-status.service';
export * from './blog/blog-batch.service';

@Injectable()
export class BlogAutomationService {
  private readonly logger = new Logger(BlogAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: BlogQueueService,
    private readonly composerService: BlogComposerService,
    private readonly publisherService: BlogPublisherService,
    private readonly bilingualService: BlogBilingualService,
    private readonly statusService: BlogStatusService,
    private readonly batchService: BlogBatchService,
    private readonly discoveryService: TopicDiscoveryService,
  ) {}

  async getPendingQueueItems() { return this.queueService.getPendingQueueItems(); }
  async enqueueTopic(candidate: QueueCandidate) { return this.queueService.enqueueTopic(candidate); }

  async discoverAndEnqueue(limit = 40): Promise<{ discovered: number; enqueued: number; rejected: string[] }> {
    const candidates = await this.discoveryService.discover(limit);
    let enqueued = 0;
    const rejected: string[] = [];

    for (const c of candidates) {
      const res = await this.queueService.enqueueTopic({
        categorySlug: inferCategoryFromTopic(c.phrase, c.primaryKeyword),
        topic: c.phrase,
        targetLocation: c.sources.join(', '),
        searchIntent: c.intent,
        primaryKeyword: c.primaryKeyword,
        keywords: [...c.secondaryKeywords, ...c.longTailKeywords],
        referenceSources: c.sources,
        source: 'discovery',
      });
      if (res.enqueued) enqueued += 1;
      else rejected.push(`${c.phrase}: ${res.reason}`);
    }

    this.logger.log(`discovery: ${candidates.length} candidates, ${enqueued} enqueued, ${rejected.length} rejected`);
    return { discovered: candidates.length, enqueued, rejected };
  }

  @Cron('0 23 * * *')
  async handleDailyCron() {
    const workerId = `cron:${process.pid}`;
    this.logger.log('Starting automated daily blog generation batch (5 articles)...');
    try {
      try {
        await this.discoverAndEnqueue();
      } catch (err) {
        this.logger.warn(`discovery step failed: ${String(err)}`);
      }

      try {
        await this.queueService.replenishQueueIfLow(10);
      } catch (err) {
        this.logger.warn(`queue replenishment failed: ${String(err)}`);
      }

      const bilingual = await this.readBilingualSwitch();
      if (bilingual.enabled) {
        const { results, rejected } = await this.generateBilingualBatch(bilingual.quota, false, workerId);
        this.logger.log(`Daily bilingual batch completed: ${results.length} generated, ${rejected.length} rejected.`);
      } else {
        const { results, rejected } = await this.generateBatch(5, false, workerId);
        this.logger.log(`Daily blog automation batch completed: ${results.length} generated, ${rejected.length} rejected.`);
      }
    } catch (err) {
      this.logger.error(`Daily blog cron failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async generateBatch(
    count = 5,
    forcePublish = false,
    workerId = `manual:${process.pid}:${Date.now()}`,
  ): Promise<{ results: GenerationResult[]; rejected: RejectedTopic[] }> {
    return this.batchService.generateBatch(count, forcePublish, workerId, (t, f, w) => this.generateForTopic(t, f, w));
  }

  async generateBilingualBatch(
    quota: BilingualQuota,
    forcePublish = false,
    workerId = `manual:${process.pid}:${Date.now()}`,
  ): Promise<{ results: GenerationResult[]; rejected: RejectedTopic[] }> {
    return this.batchService.generateBilingualBatch(quota, forcePublish, workerId, (t, f, w) => this.generateForTopic(t, f, w));
  }

  async generateSingleArticle(
    topic: string,
    categorySlug: string,
    targetLocation?: string,
    forcePublish = false,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<GenerationResult> {
    const enqueued = await this.queueService.enqueueTopic({
      categorySlug,
      topic,
      targetLocation,
      source: 'manual',
      language,
    });

    const topicKey = enqueued.topicKey;
    if (!enqueued.enqueued) {
      if (!topicKey) throw new Error('Cannot generate an unnamed topic.');
      const existing = await this.prisma.blogPost.findUnique({
        where: { topicKey_language: { topicKey, language } },
      });
      if (existing) return toGenerationResultFromPost(existing, categorySlug);
      if (enqueued.reason !== 'already queued') {
        throw new Error(`Topic refused: ${enqueued.reason}.`);
      }
    }

    const queued = await this.prisma.blogTopic.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (!queued) throw new Error(`Topic ${topicKey} could not be queued.`);

    const target = {
      ...queued,
      categorySlug: categorySlug || queued.categorySlug,
      targetLocation: targetLocation ?? queued.targetLocation,
    };

    try {
      return await this.generateForTopic(target, forcePublish, `manual:${process.pid}:${Date.now()}`);
    } catch (err) {
      await recordSingleArticleFailure({
        prisma: this.prisma,
        topicKey,
        language,
        currentAttempts: queued.attempts,
        maxAttempts: this.queueService.maxAttempts,
        retryDelayMs: this.queueService.retryDelayMs,
        err,
      });
      throw err;
    }
  }

  async generateForTopic(
    topicRow: ClaimedTopic,
    forcePublish = false,
    _workerId = 'manual',
  ): Promise<GenerationResult> {
    const started = Date.now();
    const { topicKey, topic, categorySlug, language } = topicRow;
    this.logger.log(`Generating ${language} article for topicKey="${topicKey}" [${categorySlug}]`);

    const category = await resolveOrEnsureCategory(this.prisma, categorySlug);
    if (!category) throw new Error(`no_category: no blog category "${categorySlug}".`);

    const author = await this.prisma.user.findFirst({
      where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      orderBy: { createdAt: 'asc' },
    });
    if (!author) throw new Error('No admin author found in database for blog generation.');

    const existingForTopic = await this.prisma.blogPost.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (existingForTopic) {
      this.logger.log(`Idempotent retry skip: post already exists for topicKey="${topicKey}" [${language}]`);
      return syncExistingTopicPost(this.prisma, existingForTopic, category.name);
    }

    const [existingSlugs, existingTitles] = await Promise.all([
      this.prisma.blogPost.findMany({ where: { language }, select: { slug: true } }),
      this.prisma.blogPost.findMany({ where: { language }, select: { title: true } }),
    ]);

    const composed = await this.composerService.composeArticle(
      topicRow,
      !!category,
      new Set(existingSlugs.map((p) => p.slug)),
      new Set(existingTitles.map((p) => p.title.toLowerCase().trim())),
      false,
    );

    if (!composed.validation.passed) {
      const isTemplateOnly =
        composed.validation.forceDraft &&
        composed.validation.failures.every((f: { name: string }) => f.name === 'content_originality');
      if (!isTemplateOnly) {
        throw new Error(`validation: ${composed.validation.failures.map((f: { name: string }) => f.name).join(', ')}`);
      }
    }

    const publishStatus = await this.publisherService.decidePublishStatus(forcePublish, composed.validation);

    return this.publisherService.persistAndNotify(
      topicRow,
      composed,
      category.id,
      category.name,
      author.id,
      publishStatus,
      started,
    );
  }

  async readBilingualSwitch(): Promise<BilingualConfig> {
    return this.bilingualService.readBilingualSwitch();
  }

  async getBilingualStatus(): Promise<BilingualConfig & { pending: { te: number; en: number } }> {
    return this.bilingualService.getBilingualStatus();
  }

  async setBilingualConfig(input: { enabled?: boolean; te?: number; en?: number }): Promise<BilingualConfig> {
    return this.bilingualService.setBilingualConfig(input);
  }

  async getStatus() {
    return this.statusService.getStatus();
  }
}
