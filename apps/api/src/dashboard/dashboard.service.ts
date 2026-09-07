import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LeadStatus, ProjectStatus, PublishStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalLeads,
      newLeads,
      activeProjects,
      totalClients,
      publishedArticles,
      recentLeads,
    ] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { status: LeadStatus.NEW } }),
      this.prisma.project.count({ where: { status: ProjectStatus.ACTIVE } }),
      this.prisma.client.count(),
      this.prisma.blogPost.count({ where: { status: PublishStatus.PUBLISHED } }),
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

    return {
      totalLeads,
      newLeads,
      activeProjects,
      totalClients,
      publishedArticles,
      recentLeads,
    };
  }
}
