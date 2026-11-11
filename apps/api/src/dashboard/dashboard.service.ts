import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LeadStatus, ProjectStatus, PublishStatus } from '@prisma/client';

export interface RecentLead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  requiredHelp: string;
  status: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeProjects: number;
  totalClients: number;
  publishedArticles: number;
  recentLeads: RecentLead[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private cachedStats: DashboardStats | null = null;
  private cacheExpiresAt = 0;
  private static readonly CACHE_TTL_MS = 10_000;

  constructor(private prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const now = Date.now();
    if (this.cachedStats && now < this.cacheExpiresAt) {
      return this.cachedStats;
    }

    const fetchStart = Date.now();
    try {
      const [
        leadStatusGroups,
        activeProjects,
        totalClients,
        publishedArticles,
        recentLeads,
      ] = await Promise.all([
        this.prisma.lead.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.project.count({
          where: { status: ProjectStatus.ACTIVE },
        }),
        this.prisma.client.count(),
        this.prisma.blogPost.count({
          where: { status: PublishStatus.PUBLISHED },
        }),
        this.prisma.lead.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            requiredHelp: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

      let totalLeads = 0;
      let newLeads = 0;
      for (const group of leadStatusGroups) {
        const count = group._count?._all ?? 0;
        totalLeads += count;
        if (group.status === LeadStatus.NEW) {
          newLeads = count;
        }
      }

      const freshStats: DashboardStats = {
        totalLeads,
        newLeads,
        activeProjects,
        totalClients,
        publishedArticles,
        recentLeads,
      };

      this.cachedStats = freshStats;
      this.cacheExpiresAt = now + DashboardService.CACHE_TTL_MS;

      const duration = Date.now() - fetchStart;
      this.logger.log(
        `Dashboard stats refreshed (${duration}ms): ` +
        `leads=${totalLeads} (new=${newLeads}), projects=${activeProjects}, clients=${totalClients}, articles=${publishedArticles}`,
      );

      return freshStats;
    } catch (err: any) {
      if (this.cachedStats) {
        this.logger.warn(
          `Failed to refresh dashboard stats from database, returning stale cache: ${err?.message || err}`,
        );
        return this.cachedStats;
      }

      this.logger.error(`Failed to fetch dashboard stats: ${err?.message || err}`);
      return {
        totalLeads: 0,
        newLeads: 0,
        activeProjects: 0,
        totalClients: 0,
        publishedArticles: 0,
        recentLeads: [],
      };
    }
  }

  invalidateCache(): void {
    this.cachedStats = null;
    this.cacheExpiresAt = 0;
  }
}
