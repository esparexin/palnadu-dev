import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

  async uploadFile(file: Express.Multer.File) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new BadRequestException(
        'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in apps/api/.env',
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'palnadu-dev',
          resource_type: 'auto',
        },
        async (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(error || new Error('Upload failed'));
          }

          try {
            const media = await this.prisma.media.create({
              data: {
                filename: result.public_id,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: result.secure_url,
                metadata: {
                  format: result.format,
                  width: result.width,
                  height: result.height,
                  resource_type: result.resource_type,
                } as Prisma.JsonObject,
              },
            });

            resolve(media);
          } catch (dbErr) {
            reject(dbErr);
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

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
