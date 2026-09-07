import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, PublishStatus } from '@prisma/client';

@Injectable()
export class CaseStudiesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CaseStudyCreateInput) {
    const existing = await this.prisma.caseStudy.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException(`Case study with slug '${data.slug}' already exists`);
    }
    return this.prisma.caseStudy.create({ data });
  }

  // Public: published case studies
  async findPublished() {
    return this.prisma.caseStudy.findMany({
      where: { status: PublishStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        problem: true,
        solution: true,
        technology: true,
        result: true,
        images: true,
        createdAt: true,
      },
    });
  }

  // Public: single case study
  async findBySlug(slug: string) {
    return this.prisma.caseStudy.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
      },
    });
  }

  // Admin: all case studies
  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CaseStudyWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { problem: { contains: search, mode: 'insensitive' } },
        { solution: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [caseStudies, total] = await Promise.all([
      this.prisma.caseStudy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, company: true } },
        },
      }),
      this.prisma.caseStudy.count({ where }),
    ]);

    return {
      data: caseStudies,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    return this.prisma.caseStudy.findUnique({
      where: { id },
      include: { client: true },
    });
  }

  async update(id: string, data: Prisma.CaseStudyUpdateInput) {
    return this.prisma.caseStudy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.caseStudy.delete({
      where: { id },
    });
  }
}
