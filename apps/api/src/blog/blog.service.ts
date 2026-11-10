import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, PublishStatus, BlogLanguage } from '@prisma/client';
import { parseLanguageValue } from './blog-translations';
import { assertCanJoinGroup, linkBlogTranslations } from './blog-translation-manager';

/** Languages the API accepts. Anything else is a client error, not a silent default. */
export function parseLanguage(value: unknown): BlogLanguage | undefined {
  const parsed = parseLanguageValue(value);
  if (parsed !== undefined && typeof parsed === 'object') {
    throw new BadRequestException(`Invalid language '${parsed.invalid}'. Expected 'en' or 'te'.`);
  }
  return parsed as BlogLanguage | undefined;
}

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.BlogPostCreateInput & { translationGroupId?: string | null }) {
    const language = (data.language ?? BlogLanguage.en) as BlogLanguage;

    const existing = await this.prisma.blogPost.findUnique({
      where: { language_slug: { language, slug: data.slug } },
    });
    if (existing) {
      throw new ConflictException(`Article with slug '${data.slug}' already exists in '${language}'`);
    }

    const { translationGroupId, ...rest } = data;
    if (translationGroupId !== undefined && translationGroupId !== null) {
      await assertCanJoinGroup(this.prisma, translationGroupId, { id: '', language });
    }

    const publishDate =
      rest.status === PublishStatus.PUBLISHED && rest.publishDate === undefined
        ? new Date()
        : rest.publishDate;

    return this.prisma.blogPost.create({
      data: { ...rest, publishDate, language, translationGroupId: translationGroupId ?? undefined },
      include: { author: { select: { id: true, name: true, avatar: true } }, category: true },
    });
  }

  async findPublished(params: {
    page?: number; limit?: number; categorySlug?: string;
    search?: string; status?: PublishStatus; includeArchived?: boolean; language?: BlogLanguage;
  } = {}) {
    const { page = 1, limit = 12, categorySlug, search, status, includeArchived, language } = params;
    const skip = (page - 1) * limit;

    const allowedStatuses = status
      ? [status]
      : includeArchived ? [PublishStatus.PUBLISHED, PublishStatus.ARCHIVED] : [PublishStatus.PUBLISHED];

    const where: Prisma.BlogPostWhereInput = {
      status: allowedStatuses.length === 1 ? allowedStatuses[0] : { in: allowedStatuses },
      ...(language !== undefined && { language }),
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
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string, language: BlogLanguage = BlogLanguage.en) {
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        language,
        status: { in: [PublishStatus.PUBLISHED, PublishStatus.ARCHIVED] },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: true,
      },
    });

    if (!post) return null;

    const relatedPosts = await this.prisma.blogPost.findMany({
      where: {
        status: { in: [PublishStatus.PUBLISHED, PublishStatus.ARCHIVED] },
        language,
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      take: 2,
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        language: true,
        excerpt: true,
        coverImage: true,
        publishDate: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
      },
    });

    const translations = post.translationGroupId
      ? await this.prisma.blogPost.findMany({
          where: {
            translationGroupId: post.translationGroupId,
            id: { not: post.id },
            status: { in: [PublishStatus.PUBLISHED, PublishStatus.ARCHIVED] },
          },
          select: { id: true, slug: true, language: true },
        })
      : [];

    return { ...post, relatedPosts, translations };
  }

  async linkTranslations(postIds: string[], groupId?: string) {
    return linkBlogTranslations(this.prisma, postIds, groupId);
  }

  async findAllAdmin(params: {
    page?: number; limit?: number; status?: PublishStatus;
    categorySlug?: string; search?: string; language?: BlogLanguage;
  } = {}) {
    const { page = 1, limit = 20, status, categorySlug, search, language } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BlogPostWhereInput = {
      ...(status && { status }),
      ...(language !== undefined && { language }),
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
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneAdmin(id: string) {
    return this.prisma.blogPost.findUnique({
      where: { id },
      include: { author: true, category: true },
    });
  }

  async update(id: string, data: Prisma.BlogPostUpdateInput & { translationGroupId?: string | null }) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Article '${id}' not found`);
    }

    const nextLanguage = (data.language ?? existing.language) as BlogLanguage;
    const nextSlug = typeof data.slug === 'string' ? data.slug : existing.slug;

    if (nextSlug !== existing.slug || nextLanguage !== existing.language) {
      const clash = await this.prisma.blogPost.findUnique({
        where: { language_slug: { language: nextLanguage, slug: nextSlug } },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException(`Article with slug '${nextSlug}' already exists in '${nextLanguage}'`);
      }
    }

    const { translationGroupId, ...rest } = data as Prisma.BlogPostUpdateInput & { translationGroupId?: string | null };
    const nextGroup =
      translationGroupId === undefined ? existing.translationGroupId : translationGroupId;
    if (nextGroup !== null && nextGroup !== undefined) {
      await assertCanJoinGroup(this.prisma, nextGroup, { id, language: nextLanguage });
    }

    let nextPublishDate = rest.publishDate;
    if (rest.status === PublishStatus.PUBLISHED && !existing.publishDate && nextPublishDate === undefined) {
      nextPublishDate = new Date();
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: { ...rest, publishDate: nextPublishDate, translationGroupId: nextGroup ?? undefined },
    });
  }

  async delete(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }

  async getPublishedCount() {
    return this.prisma.blogPost.count({ where: { status: PublishStatus.PUBLISHED } });
  }

  async getCategories() {
    return this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
    });
  }

  async createCategory(data: Prisma.BlogCategoryCreateInput) {
    return this.prisma.blogCategory.create({ data });
  }
}
