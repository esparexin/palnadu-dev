import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TopicDiscoveryService } from '../topic-discovery.service';
import { TopicStatus } from '@prisma/client';

@Injectable()
export class BlogStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discoveryService: TopicDiscoveryService,
  ) {}

  async getStatus() {
    const [
      totalPosts, draftPosts, publishedPosts, archivedPosts,
      failedTopics, claimedTopics, pendingTopics, completedTopics, queueRows,
    ] = await Promise.all([
      this.prisma.blogPost.count(),
      this.prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      this.prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.blogPost.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.FAILED } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.CLAIMED } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.PENDING } }),
      this.prisma.blogTopic.count({ where: { status: TopicStatus.COMPLETED } }),
      this.prisma.blogTopic.findMany({ orderBy: { createdAt: 'asc' }, take: 50 }),
    ]);

    const autoPublishSetting = await this.prisma.siteSetting.findUnique({ where: { key: 'auto_publish_blogs' } });
    const coverage = await this.discoveryService.coverageReport();

    return {
      engineStatus: 'active',
      schedule: 'Daily at 05:00 IST (23:00 UTC)',
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
    };
  }
}
