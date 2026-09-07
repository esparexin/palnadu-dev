import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, PublishStatus } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ServiceCreateInput) {
    const existing = await this.prisma.service.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException(`Service with slug '${data.slug}' already exists`);
    }
    return this.prisma.service.create({ data });
  }

  // Public: only published services
  async findPublished() {
    return this.prisma.service.findMany({
      where: { status: PublishStatus.PUBLISHED },
      orderBy: { order: 'asc' },
    });
  }

  // Public: get single service by slug
  async findBySlug(slug: string) {
    return this.prisma.service.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
      },
    });
  }

  // Admin: all services with pagination & filtering
  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    search?: string;
  } = {}) {
    const { page = 1, limit = 50, status, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ServiceWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
