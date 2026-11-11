import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ContentSimilarityService } from '../content-similarity.service';
import { canonicalizeTopic, SearchIntent, toTopicKey } from '../topic-identity';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { ClaimedTopic, QueueCandidate } from './types';
import { getAllInitialSeeds } from './blog-seeds';

export const STALE_CLAIM_MS = 5 * 60 * 1000;

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

  async claimNextTopic(workerId: string, maxAttempts: number): Promise<ClaimedTopic | null> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

    const candidate = await this.prisma.blogTopic.findFirst({
      where: {
        attempts: { lt: maxAttempts },
        OR: [
          { status: TopicStatus.PENDING, OR: [{ nextRetryAt: null }, { nextRetryAt: { isSet: false } as any }, { nextRetryAt: { lte: now } }] },
          { status: TopicStatus.CLAIMED, claimedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;

    const claim = await this.prisma.blogTopic.updateMany({
      where: {
        id: candidate.id,
        status: { in: [TopicStatus.PENDING, TopicStatus.CLAIMED, TopicStatus.FAILED] },
        OR: [{ claimedAt: null }, { claimedAt: { isSet: false } as any }, { claimedAt: { lt: staleBefore } }],
      },
      data: { status: TopicStatus.CLAIMED, claimedAt: now, claimedBy: workerId },
    });

    if (claim.count === 0) return null;
    return { ...candidate, status: TopicStatus.CLAIMED };
  }

  async claimNextTopicForLanguage(
    workerId: string,
    language: BlogLanguage,
    maxAttempts: number,
  ): Promise<ClaimedTopic | null> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

    const candidate = await this.prisma.blogTopic.findFirst({
      where: {
        language,
        attempts: { lt: maxAttempts },
        OR: [
          { status: TopicStatus.PENDING, OR: [{ nextRetryAt: null }, { nextRetryAt: { isSet: false } as any }, { nextRetryAt: { lte: now } }] },
          { status: TopicStatus.CLAIMED, claimedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!candidate) return null;

    const claim = await this.prisma.blogTopic.updateMany({
      where: {
        id: candidate.id,
        status: { in: [TopicStatus.PENDING, TopicStatus.CLAIMED, TopicStatus.FAILED] },
        OR: [{ claimedAt: null }, { claimedAt: { isSet: false } as any }, { claimedAt: { lt: staleBefore } }],
      },
      data: { status: TopicStatus.CLAIMED, claimedAt: now, claimedBy: workerId },
    });

    if (claim.count === 0) return null;
    return { ...candidate, status: TopicStatus.CLAIMED };
  }

  async releaseTopic(
    topicKey: string,
    language: BlogLanguage,
    error: string,
    nextRetryAt: Date,
  ): Promise<void> {
    const row = await this.prisma.blogTopic.findUnique({
      where: { topicKey_language: { topicKey, language } },
    });
    if (!row) return;

    await this.prisma.blogTopic.update({
      where: { topicKey_language: { topicKey, language } },
      data: {
        status: row.attempts + 1 >= this.maxAttempts ? TopicStatus.FAILED : TopicStatus.PENDING,
        lastError: error.slice(0, 500),
        nextRetryAt,
        claimedAt: null,
        claimedBy: null,
      },
    });
  }

  async replenishQueueIfLow(minPending = 10, maxToEnqueue = 15): Promise<number> {
    const pendingCount = await this.prisma.blogTopic.count({
      where: { status: TopicStatus.PENDING, attempts: { lt: this.maxAttempts } },
    });
    if (pendingCount >= minPending) return 0;

    const needed = minPending - pendingCount;
    const limit = Math.min(needed + 5, maxToEnqueue);

    const generatedKeys = new Set(
      (await this.prisma.blogPost.findMany({ select: { topicKey: true, language: true } })).map(
        (p) => `${p.topicKey}::${p.language}`,
      ),
    );

    let enqueued = 0;
    for (const seed of getAllInitialSeeds(generatedKeys)) {
      if (enqueued >= limit) break;
      const res = await this.enqueueTopic(seed);
      if (res.enqueued) enqueued += 1;
    }

    if (enqueued > 0) {
      this.logger.log(`Replenished queue with ${enqueued} seed topics (had ${pendingCount} pending)`);
    }
    return enqueued;
  }
}
