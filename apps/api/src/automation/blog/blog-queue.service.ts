import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ContentSimilarityService } from '../content-similarity.service';
import { canonicalizeTopic, SearchIntent, toTopicKey } from '../topic-identity';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { ClaimedTopic, QueueCandidate } from './types';
import { getAllInitialSeeds } from './blog-seeds';
import { recoverTransientFailedTopics } from './blog-queue-recovery.util';
import {
  STALE_CLAIM_MS,
  atomicClaimTopic,
  claimAllocatedTopicRow,
  claimManualTopicByKey,
} from './blog-queue-claim.util';

export { STALE_CLAIM_MS };

@Injectable()
export class BlogQueueService {
  private readonly logger = new Logger(BlogQueueService.name);
  readonly maxAttempts = 3;
  readonly retryDelayMs = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly similarityService: ContentSimilarityService,
  ) {}

  async getPendingQueueItems() {
    const generatedKeys = new Set(
      (await this.prisma.blogPost.findMany({ select: { topicKey: true, language: true } })).map(
        (p) => `${p.topicKey}::${p.language}`,
      ),
    );

    const rows = await this.prisma.blogTopic.findMany({ orderBy: { createdAt: 'asc' } });

    return rows.map((row) => {
      const done =
        row.status === TopicStatus.COMPLETED || generatedKeys.has(`${row.topicKey}::${row.language}`);
      return {
        topicKey: row.topicKey,
        topic: row.topic,
        categorySlug: row.categorySlug,
        targetLocation: row.targetLocation,
        searchIntent: (row.searchIntent as SearchIntent) ?? null,
        primaryKeyword: row.primaryKeyword,
        referenceSources: row.referenceSources,
        slug: row.topicKey,
        language: row.language,
        isGenerated: done,
        status: done
          ? ('COMPLETED' as const)
          : row.status === TopicStatus.CLAIMED
            ? ('CLAIMED' as const)
            : row.status === TopicStatus.FAILED
              ? ('FAILED' as const)
              : ('PENDING' as const),
        attempts: row.attempts,
      };
    });
  }

  async enqueueTopic(candidate: QueueCandidate): Promise<{ enqueued: boolean; topicKey: string; reason?: string }> {
    const topicKey = toTopicKey(candidate.topic);
    if (!topicKey) return { enqueued: false, topicKey: '', reason: 'empty topic' };
    const language = candidate.language ?? BlogLanguage.en;

    const existing = await this.prisma.blogTopic.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (existing) return { enqueued: false, topicKey, reason: 'already queued' };

    const generated = await this.prisma.blogPost.findUnique({
      where: { topicKey_language: { topicKey, language } },
      select: { id: true },
    });
    if (generated) return { enqueued: false, topicKey, reason: 'already generated' };

    const similarity = await this.similarityService.isLikelyDuplicateTopic(
      candidate.topic,
      new Set(),
      language,
    );
    if (similarity) {
      return { enqueued: false, topicKey, reason: 'overlaps existing content' };
    }

    const canonical = canonicalizeTopic(candidate.topic);

    try {
      await this.prisma.blogTopic.create({
        data: {
          topicKey,
          topic: candidate.topic,
          language,
          categorySlug: candidate.categorySlug,
          targetLocation: candidate.targetLocation ?? null,
          searchIntent: candidate.searchIntent ?? canonical.intent,
          primaryKeyword: candidate.primaryKeyword ?? canonical.normalizedTopic,
          keywords: candidate.keywords ?? [],
          referenceSources: candidate.referenceSources ?? [],
        },
      });
      return { enqueued: true, topicKey };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const target = err?.meta?.target ? ` (${Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target})` : '';
        return { enqueued: false, topicKey, reason: `duplicate topicKey (unique index${target})` };
      }
      throw err;
    }
  }

  async claimNextTopic(
    workerId: string,
    maxAttempts: number,
    language?: BlogLanguage,
  ): Promise<ClaimedTopic | null> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

    const candidate = await this.prisma.blogTopic.findFirst({
      where: {
        ...(language ? { language } : {}),
        attempts: { lt: maxAttempts },
        OR: [
          { status: TopicStatus.PENDING, OR: [{ nextRetryAt: null }, { nextRetryAt: { isSet: false } as any }, { nextRetryAt: { lte: now } }] },
          { status: TopicStatus.CLAIMED, claimedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;

    return atomicClaimTopic({
      prisma: this.prisma,
      candidate,
      workerId,
      now,
      staleBefore,
      allowedStatuses: [TopicStatus.PENDING, TopicStatus.CLAIMED],
      maxAttempts,
    });
  }

  async claimTopicById(
    workerId: string,
    target: { topicKey: string; language: BlogLanguage },
    maxAttempts: number,
  ): Promise<ClaimedTopic | null> {
    return claimAllocatedTopicRow({ prisma: this.prisma, workerId, target, maxAttempts });
  }

  async claimTopicByKey(
    workerId: string,
    topicKey: string,
    language: BlogLanguage,
  ): Promise<ClaimedTopic | null> {
    return claimManualTopicByKey({ prisma: this.prisma, workerId, topicKey, language });
  }

  async claimNextTopicForLanguage(
    workerId: string,
    language: BlogLanguage,
    maxAttempts: number,
  ): Promise<ClaimedTopic | null> {
    return this.claimNextTopic(workerId, maxAttempts, language);
  }

  async replenishQueueForLanguages(
    minPending = 10,
    maxToEnqueue = 15,
    languages: BlogLanguage[] = [BlogLanguage.en, BlogLanguage.te],
  ): Promise<number> {
    let total = 0;
    for (const language of [...new Set(languages)]) {
      total += await this.replenishQueueIfLow(minPending, maxToEnqueue, language);
    }
    return total;
  }

  async replenishQueueIfLow(
    minPending = 10,
    maxToEnqueue = 15,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<number> {
    const pendingCount = await this.prisma.blogTopic.count({
      where: { status: TopicStatus.PENDING, attempts: { lt: this.maxAttempts }, language },
    });
    if (pendingCount >= minPending) return 0;

    const deficit = minPending - pendingCount;
    const recovered = await recoverTransientFailedTopics(this.prisma, {
      language,
      maxAttempts: this.maxAttempts,
      limit: Math.min(deficit, 3),
    });

    const remainingNeeded = deficit - recovered;
    let enqueued = 0;
    if (remainingNeeded > 0) {
      const limit = Math.min(remainingNeeded + 5, maxToEnqueue);
      const generatedKeys = new Set(
        (await this.prisma.blogPost.findMany({ where: { language }, select: { topicKey: true, language: true } })).map(
          (p) => `${p.topicKey}::${p.language}`,
        ),
      );

      for (const seed of getAllInitialSeeds(generatedKeys, language)) {
        if (enqueued >= limit) break;
        const res = await this.enqueueTopic(seed);
        if (res.enqueued) enqueued += 1;
      }
    }

    if (recovered > 0 || enqueued > 0) {
      this.logger.log(
        `Replenished [${language}] queue: ${recovered} transient recovered, ${enqueued} seeds enqueued (had ${pendingCount} pending)`,
      );
    }
    return recovered + enqueued;
  }
}
