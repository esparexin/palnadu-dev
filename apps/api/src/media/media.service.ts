import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    alt?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.media.create({
      data: {
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        size: data.size,
        url: data.url,
        alt: data.alt,
        metadata: data.metadata as Prisma.JsonObject,
      },
    });
  }

  async findAll(params: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 24, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.MediaWhereInput = {};
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [media, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: media,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.media.findUnique({ where: { id } });
  }

  async update(id: string, data: { alt?: string; metadata?: Record<string, unknown> }) {
    return this.prisma.media.update({
      where: { id },
      data: {
        alt: data.alt,
        metadata: data.metadata as Prisma.JsonObject,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.media.delete({ where: { id } });
  }
}
