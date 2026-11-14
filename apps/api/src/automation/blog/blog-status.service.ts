import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TopicDiscoveryService } from '../topic-discovery.service';
import { TopicStatus } from '@prisma/client';
import { DAILY_CRON_SCHEDULE } from './blog-cron-lock.util';
import { getAllInitialSeeds } from './blog-seeds';
import { STALE_CLAIM_MS } from './blog-queue-claim.util';

@Injectable()
export class BlogStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discoveryService: TopicDiscoveryService,
  ) {}

  async getStatus() {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);

    const [
      totalPosts, draftPosts, publishedPosts, archivedPosts,
      failedTopics, claimedTopics, pendingTopics, completedTopics, activeQueue,
      pendingTe, pendingEn, failedTe, failedEn, claimedTe, claimedEn,
      staleTe, staleEn,
      teExistingTopic, enExistingTopic, teExistingPost, enExistingPost,
    ] = await Promise.all([
      this.prisma.blogPost.count(),
      this.prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      this.prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.blogPost.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.FAILED } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.PENDING, attempts: { lt: 3 } } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.COMPLETED } }),
      this.prisma.blogTopic.findMany({
        where: { status: { not: TopicStatus.COMPLETED } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.PENDING, attempts: { lt: 3 }, language: 'te' as any } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.PENDING, attempts: { lt: 3 }, language: 'en' as any } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.FAILED, language: 'te' as any } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.FAILED, language: 'en' as any } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED, language: 'te' as any } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED, language: 'en' as any } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED, language: 'te' as any, claimedAt: { lt: staleBefore } } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED, language: 'en' as any, claimedAt: { lt: staleBefore } } }),
      this.prisma.blogTopic?.findMany?.({ where: { language: 'te' as any }, select: { topicKey: true } }) ?? Promise.resolve([]),
      this.prisma.blogTopic?.findMany?.({ where: { language: 'en' as any }, select: { topicKey: true } }) ?? Promise.resolve([]),
      this.prisma.blogPost?.findMany?.({ where: { language: 'te' as any }, select: { topicKey: true } }) ?? Promise.resolve([]),
      this.prisma.blogPost?.findMany?.({ where: { language: 'en' as any }, select: { topicKey: true } }) ?? Promise.resolve([]),
    ]);

    const queueRows =
      activeQueue.length > 0
        ? activeQueue
        : (await this.prisma.blogTopic?.findMany?.({ orderBy: { createdAt: 'desc' }, take: 15 })) ?? [];

    const autoPublishSetting = await this.prisma.siteSetting.findUnique({ where: { key: 'auto_publish_blogs' } });
    const coverage = await this.discoveryService.coverageReport();

    const teKeys = new Set([...teExistingTopic.map((t) => t.topicKey), ...teExistingPost.map((p) => p.topicKey)]);
    const enKeys = new Set([...enExistingTopic.map((t) => t.topicKey), ...enExistingPost.map((p) => p.topicKey)]);
    const teSeedsLeft = getAllInitialSeeds(teKeys, 'te' as any).length;
    const enSeedsLeft = getAllInitialSeeds(enKeys, 'en' as any).length;

    const teExhausted = teSeedsLeft === 0 && pendingTe < 10;
    const enExhausted = enSeedsLeft === 0 && pendingEn < 10;
    const isHealthy = pendingTe >= 10 && pendingEn >= 10 && !teExhausted && !enExhausted;

    const queueHealth = {
      pending: { te: pendingTe, en: pendingEn, total: pendingTe + pendingEn },
      failed: { te: failedTe, en: failedEn, total: failedTopics },
      inFlight: { te: claimedTe, en: claimedEn, total: claimedTopics },
      staleInFlight: { te: staleTe, en: staleEn, total: staleTe + staleEn },
      healthy: isHealthy,
      replenishmentNeeded: { te: pendingTe < 10, en: pendingEn < 10 },
      supplyExhausted: { te: teExhausted, en: enExhausted },
    };

    return {
      engineStatus: 'active',
      schedule: DAILY_CRON_SCHEDULE,
      autoPublishEnabled: autoPublishSetting?.value === true,
      referenceSources: await this.discoveryService.sourceStatuses(),
      statistics: {
        totalPosts, draftPosts, publishedPosts, archivedPosts,
        queuePending: pendingTopics, queueCompleted: completedTopics,
        queueInFlight: claimedTopics, queueFailed: failedTopics,
      },
      coverage: {
        topicsCovered: coverage.topicsCovered.length,
        keywordsCovered: coverage.keywordsCovered.length,
        intentsCovered: coverage.intentsCovered,
      },
      upcomingQueue: queueRows,
      queueHealth,
    };
  }
}
