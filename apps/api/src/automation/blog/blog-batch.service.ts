import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TopicStatus } from '@prisma/client';
import { allocateQuota, BilingualQuota } from '../bilingual-quota';
import { BlogQueueService } from './blog-queue.service';
import { ClaimedTopic, GenerationResult, RejectedTopic, RejectionReason } from './types';

@Injectable()
export class BlogBatchService {
  private readonly logger = new Logger(BlogBatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: BlogQueueService,
  ) {}

  async generateBatch(
    count = 5,
    forcePublish = false,
    workerId = `manual:${process.pid}:${Date.now()}`,
    generateFn: (topic: ClaimedTopic, forcePublish: boolean, workerId: string) => Promise<GenerationResult>,
  ): Promise<{ results: GenerationResult[]; rejected: RejectedTopic[] }> {
    const results: GenerationResult[] = [];
    const rejected: RejectedTopic[] = [];

    for (let i = 0; i < count; i++) {
      const topic = await this.queueService.claimNextTopic(workerId, this.queueService.maxAttempts);
      if (!topic) break;
      await this.attemptTopic(topic, forcePublish, workerId, results, rejected, generateFn);
    }

    return { results, rejected };
  }

  async generateBilingualBatch(
    quota: BilingualQuota,
    forcePublish = false,
    workerId = `manual:${process.pid}:${Date.now()}`,
    generateFn: (topic: ClaimedTopic, forcePublish: boolean, workerId: string) => Promise<GenerationResult>,
  ): Promise<{ results: GenerationResult[]; rejected: RejectedTopic[] }> {
    const results: GenerationResult[] = [];
    const rejected: RejectedTopic[] = [];
    const now = new Date();

    const pending = await this.prisma.blogTopic.findMany({
      where: {
        status: TopicStatus.PENDING,
        attempts: { lt: this.queueService.maxAttempts },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { isSet: false } as any },
          { nextRetryAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    const selected = allocateQuota(pending, quota);

    for (const row of selected) {
      const topic = await this.queueService.claimTopicById(workerId, row, this.queueService.maxAttempts);
      if (!topic) continue;
      await this.attemptTopic(topic, forcePublish, workerId, results, rejected, generateFn);
    }

    return { results, rejected };
  }

  async attemptTopic(
    topic: ClaimedTopic,
    forcePublish: boolean,
    workerId: string,
    results: GenerationResult[],
    rejected: RejectedTopic[],
    generateFn: (topic: ClaimedTopic, forcePublish: boolean, workerId: string) => Promise<GenerationResult>,
  ): Promise<void> {
    const topicKey = topic.topicKey;
    try {
      const generated = await generateFn(topic, forcePublish, workerId);
      results.push(generated);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      const reason: RejectionReason = detail.startsWith('validation:') ? 'validation_failed' : 'generation_failed';
      rejected.push({ topicKey, topic: topic.topic, reason, detail });

      const currentAttempts = (topic.attempts ?? 0) + 1;
      const exhausted = currentAttempts >= this.queueService.maxAttempts;
      const permanent = reason === 'validation_failed' || exhausted;

      await this.prisma.blogTopic.update({
        where: { topicKey_language: { topicKey, language: topic.language } },
        data: {
          attempts: { increment: 1 },
          lastError: detail.slice(0, 500),
          status: permanent ? TopicStatus.FAILED : TopicStatus.PENDING,
          nextRetryAt: permanent ? null : new Date(Date.now() + this.queueService.retryDelayMs),
          claimedAt: null,
          claimedBy: null,
        },
      });
      this.logger.error(`topicKey="${topicKey}" ${reason} (attempt ${currentAttempts}): ${detail}`);
    }
  }
}
