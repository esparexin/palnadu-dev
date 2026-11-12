import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { TopicDiscoveryService } from './topic-discovery.service';
import { BlogLanguage } from '@prisma/client';
import { allocateQuota, BilingualConfig, BilingualQuota } from './bilingual-quota';
import { BlogQueueService } from './blog/blog-queue.service';
import { BlogComposerService } from './blog/blog-composer.service';
import { BlogPublisherService } from './blog/blog-publisher.service';
import { BlogBilingualService } from './blog/blog-bilingual.service';
import { BlogStatusService } from './blog/blog-status.service';
import { DAILY_CRON_EXPRESSION, type DailyCronTriggerSource, readDailyCronStatus } from './blog/blog-cron-lock.util';
import { executeDailyPipelineSteps, runDailyCronBatch, startDailyCronInBackground } from './blog/blog-cron-runner.util';
import { BlogBatchService } from './blog/blog-batch.service';
import { resolveOrEnsureCategory } from './blog/blog-seeds';
import { enqueueDiscoveredTopicsForLanguages } from './blog/blog-queue-recovery.util';
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

  async discoverAndEnqueue(
    limit = 40,
    languages?: BlogLanguage[],
  ): Promise<{ discovered: number; enqueued: number; rejected: string[] }> {
    const targetLanguages = languages ?? (await this.resolveActiveLanguages());
    return enqueueDiscoveredTopicsForLanguages({
      logger: this.logger,
      discoveryService: this.discoveryService,
      enqueueTopic: (c) => this.queueService.enqueueTopic(c),
      languages: targetLanguages,
      limit,
    });
  }

  private async resolveActiveLanguages(): Promise<BlogLanguage[]> {
    if (!this.bilingualService) return [BlogLanguage.en];
    const bilingual = await this.readBilingualSwitch();
    return bilingual.enabled ? [BlogLanguage.en, BlogLanguage.te] : [BlogLanguage.en];
  }

  @Cron(DAILY_CRON_EXPRESSION)
  handleDailyCron() {
    return this.runDailyAutomation('cron');
  }

  runDailyAutomation(source: DailyCronTriggerSource = 'cron', force = false) {
    return runDailyCronBatch(this.prisma, this.logger, source, force, () =>
      executeDailyPipelineSteps(this.logger, source, this.pipelineDeps()),
    );
  }

  startDailyAutomationInBackground(source: DailyCronTriggerSource = 'cron', force = false) {
    return startDailyCronInBackground(this.prisma, this.logger, source, force, () =>
      executeDailyPipelineSteps(this.logger, source, this.pipelineDeps()),
    );
  }

  getDailyCronStatus() {
    return readDailyCronStatus(this.prisma);
  }

  private pipelineDeps() {
    return {
      discoverAndEnqueue: () => this.discoverAndEnqueue(),
      replenishQueueIfLow: async (min: number) =>
        this.queueService.replenishQueueForLanguages(min, 15, await this.resolveActiveLanguages()),
      readBilingualSwitch: () => this.readBilingualSwitch(),
      generateBilingualBatch: this.generateBilingualBatch.bind(this),
      generateBatch: this.generateBatch.bind(this),
    };
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
