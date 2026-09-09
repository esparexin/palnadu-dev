import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({
      data,
      include: { client: true, members: { include: { user: true } } },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: ProjectStatus;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ProjectWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, company: true } },
          members: { include: { user: { select: { id: true, name: true, role: true } } } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        members: { include: { user: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: { client: true, members: { include: { user: true } } },
    });
  }

  async getActiveCount() {
    return this.prisma.project.count({
      where: { status: ProjectStatus.ACTIVE },
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
