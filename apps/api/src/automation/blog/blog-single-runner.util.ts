import { BlogLanguage } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import type { BlogQueueService } from './blog-queue.service';
import type { ClaimedTopic, GenerationResult } from './types';
import {
  findExistingPostForTopic,
  recordSingleArticleFailure,
  toGenerationResultFromPost,
} from './blog-idempotency.util';

export interface SingleArticleWorkflowOptions {
  prisma: PrismaService;
  queueService: BlogQueueService;
  topic: string;
  categorySlug: string;
  targetLocation?: string;
  forcePublish?: boolean;
  language?: BlogLanguage;
  generateFn: (
    topicRow: ClaimedTopic,
    forcePublish: boolean,
    workerId: string,
  ) => Promise<GenerationResult>;
}

export async function executeSingleArticleWorkflow(
  opts: SingleArticleWorkflowOptions,
): Promise<GenerationResult> {
  const {
    prisma,
    queueService,
    topic,
    categorySlug,
    targetLocation,
    forcePublish = false,
    language = BlogLanguage.en,
    generateFn,
  } = opts;

  const enqueued = await queueService.enqueueTopic({
    categorySlug,
    topic,
    targetLocation,
    source: 'manual',
    language,
  });

  const topicKey = enqueued.topicKey;
  if (!enqueued.enqueued) {
    if (!topicKey) throw new Error('Cannot generate an unnamed topic.');
    const existing = await findExistingPostForTopic(prisma, topicKey, topic, language);
    if (existing) return toGenerationResultFromPost(existing, categorySlug);
    if (enqueued.reason !== 'already queued') {
      throw new Error(`Topic refused: ${enqueued.reason}.`);
    }
  }

  const workerId = `manual:${process.pid}:${Date.now()}`;
  const claimed = await queueService.claimTopicByKey(workerId, topicKey, language);
  if (!claimed) {
    const donePost = await findExistingPostForTopic(prisma, topicKey, topic, language);
    if (donePost) return toGenerationResultFromPost(donePost, categorySlug);
    throw new Error(`Topic ${topicKey} (${language}) is already claimed by another worker.`);
  }

  const target: ClaimedTopic = {
    ...claimed,
    categorySlug: categorySlug || claimed.categorySlug,
    targetLocation: targetLocation ?? claimed.targetLocation,
  };

  try {
    return await generateFn(target, forcePublish, workerId);
  } catch (err) {
    await recordSingleArticleFailure({
      prisma,
      topicKey,
      language,
      currentAttempts: claimed.attempts ?? 0,
      maxAttempts: queueService.maxAttempts,
      retryDelayMs: queueService.retryDelayMs,
      err,
    });
    throw err;
  }
}
