import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { TopicDiscoveryService } from './topic-discovery.service';
import { BlogLanguage, PublishStatus } from '@prisma/client';
import { allocateQuota, BilingualConfig, BilingualQuota } from './bilingual-quota';
import { BlogQueueService } from './blog/blog-queue.service';
import { BlogComposerService } from './blog/blog-composer.service';
import { BlogPublisherService } from './blog/blog-publisher.service';
import { BlogBilingualService } from './blog/blog-bilingual.service';
import { BlogStatusService } from './blog/blog-status.service';
import { DAILY_CRON_EXPRESSION, type DailyCronTriggerSource, readDailyCronStatus } from './blog/blog-cron-lock.util';
import { executeDailyPipelineSteps, runDailyCronBatch, startDailyCronInBackground } from './blog/blog-cron-runner.util';
import { executeSingleArticleWorkflow } from './blog/blog-single-runner.util';
import { BlogBatchService } from './blog/blog-batch.service';
import { resolveOrEnsureCategory } from './blog/blog-seeds';
import { enqueueDiscoveredTopicsForLanguages } from './blog/blog-queue-recovery.util';
import { ClaimedTopic, GenerationResult, QueueCandidate, RejectedTopic } from './blog/types';
import {
  syncExistingTopicPost,
  toGenerationResultFromPost,
  recordSingleArticleFailure,
  findExistingPostForTopic,
  resolveDuplicateValidationPost,
} from './blog/blog-idempotency.util';

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
    let res = { discovered: 0, enqueued: 0, rejected: [] as string[] };
    try {
      res = await enqueueDiscoveredTopicsForLanguages({
        logger: this.logger,
        discoveryService: this.discoveryService,
        enqueueTopic: (c) => this.queueService.enqueueTopic(c),
        languages: targetLanguages,
        limit,
      });
    } catch (err) {
      this.logger.warn(`External discovery provider failure: ${String(err)}`);
      res.rejected.push(`discovery_provider_error: ${String(err)}`);
    }

    for (const lang of targetLanguages) {
      try {
        await this.queueService.replenishQueueIfLow(10, 15, lang);
      } catch (err) {
        this.logger.warn(`Replenishment failed for ${lang}: ${String(err)}`);
      }
    }
    return res;
  }

  private async resolveActiveLanguages(): Promise<BlogLanguage[]> {
    if (!this.bilingualService) return [BlogLanguage.en];
    const bilingual = await this.readBilingualSwitch();
    return bilingual.enabled ? [BlogLanguage.en, BlogLanguage.te] : [BlogLanguage.en];
  }

  @Cron(DAILY_CRON_EXPRESSION)
  handleDailyCron() { return this.runDailyAutomation('cron'); }

  runDailyAutomation(source: DailyCronTriggerSource = 'cron', force = false) {
    return runDailyCronBatch(this.prisma, this.logger, source, force, () => executeDailyPipelineSteps(this.logger, source, this.pipelineDeps()));
  }

  startDailyAutomationInBackground(source: DailyCronTriggerSource = 'cron', force = false) {
    return startDailyCronInBackground(this.prisma, this.logger, source, force, () => executeDailyPipelineSteps(this.logger, source, this.pipelineDeps()));
  }

  getDailyCronStatus() { return readDailyCronStatus(this.prisma); }

  private pipelineDeps() {
    return {
      discoverAndEnqueue: () => this.discoverAndEnqueue(),
      replenishQueueIfLow: async (min: number) => this.queueService.replenishQueueForLanguages(min, 15, await this.resolveActiveLanguages()),
      readBilingualSwitch: () => this.readBilingualSwitch(),
      generateBilingualBatch: this.generateBilingualBatch.bind(this),
      generateBatch: this.generateBatch.bind(this),
    };
  }

  async generateBatch(count = 5, forcePublish = false, workerId = `manual:${process.pid}:${Date.now()}`) {
    return this.batchService.generateBatch(count, forcePublish, workerId, (t, f, w) => this.generateForTopic(t, f, w));
  }

  async generateBilingualBatch(quota: BilingualQuota, forcePublish = false, workerId = `manual:${process.pid}:${Date.now()}`) {
    return this.batchService.generateBilingualBatch(quota, forcePublish, workerId, (t, f, w) => this.generateForTopic(t, f, w));
  }

  async generateSingleArticle(
    topic: string,
    categorySlug: string,
    targetLocation?: string,
    forcePublish = false,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<GenerationResult> {
    return executeSingleArticleWorkflow({
      prisma: this.prisma,
      queueService: this.queueService,
      topic,
      categorySlug,
      targetLocation,
      forcePublish,
      language,
      generateFn: (target, force, workerId) => this.generateForTopic(target, force, workerId),
    });
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

    const existingForTopic = await findExistingPostForTopic(this.prisma, topicKey, topic, language);
    if (existingForTopic) {
      this.logger.log(`Idempotent retry skip: post already exists for topicKey="${topicKey}" [${language}]`);
      await this.prisma.blogTopic.update({
        where: { id: topicRow.id },
        data: { status: 'COMPLETED' as any, postId: existingForTopic.id, claimedAt: null, claimedBy: null },
      }).catch(() => undefined);
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

    const hasOriginalityFailure = composed.validation.failures.some(
      (f: { name: string }) => f.name === 'content_originality',
    );
    const shouldForceDraft = composed.validation.forceDraft || hasOriginalityFailure || !composed.validation.passed;

    if (!composed.validation.passed) {
      const resolved = await resolveDuplicateValidationPost(
        this.prisma,
        topicRow.id,
        composed,
        category.name,
        this.logger,
      );
      if (resolved) return resolved;
    }

    const publishStatus = shouldForceDraft
      ? PublishStatus.DRAFT
      : await this.publisherService.decidePublishStatus(forcePublish, composed.validation);

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

  async readBilingualSwitch(): Promise<BilingualConfig> { return this.bilingualService.readBilingualSwitch(); }
  async getBilingualStatus() { return this.bilingualService.getBilingualStatus(); }
  async setBilingualConfig(input: { enabled?: boolean; te?: number; en?: number }) { return this.bilingualService.setBilingualConfig(input); }
  async getStatus() { return this.statusService.getStatus(); }
}
