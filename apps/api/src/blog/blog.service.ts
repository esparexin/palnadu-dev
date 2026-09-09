import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, PublishStatus } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.BlogPostCreateInput) {
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException(`Article with slug '${data.slug}' already exists`);
    }
    return this.prisma.blogPost.create({
      data,
      include: { author: { select: { id: true, name: true, avatar: true } }, category: true },
    });
  }

  // Public: published articles only
  async findPublished(params: {
    page?: number;
    limit?: number;
    categorySlug?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 12, categorySlug, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {
      status: PublishStatus.PUBLISHED,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishDate: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Public: single post by slug with related posts
  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        status: PublishStatus.PUBLISHED,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
      },
    });

    if (!post) return null;

    const relatedPosts = await this.prisma.blogPost.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      take: 2,
      orderBy: { publishDate: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishDate: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
      },
    });

    return { ...post, relatedPosts };
  }

  // Admin: all posts
  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BlogPostWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: { author: true, category: true },
    });
  }

  async update(id: string, data: Prisma.BlogPostUpdateInput) {
    return this.prisma.blogPost.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.blogPost.delete({
      where: { id },
    });
  }

  async getPublishedCount() {
    return this.prisma.blogPost.count({
      where: { status: PublishStatus.PUBLISHED },
    });
  }

  // Categories
  async getCategories() {
    return this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
    });
  }

  async createCategory(data: Prisma.BlogCategoryCreateInput) {
    return this.prisma.blogCategory.create({ data });
  }
}
