import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, PublishStatus, BlogLanguage } from '@prisma/client';
import { assertCanJoinGroup, linkBlogTranslations } from './blog-translation-manager';
import { resolveUniqueManualTopicKey } from './blog-topic-key.util';
import {
  executeResilientCreate,
  executeResilientUpdate,
  resolveSafeAuthorConnect,
  verifyCategoryConnect,
} from './blog-mutation.util';
import {
  BLOG_MUTATION_INCLUDE,
  PUBLIC_READ_STATUSES,
  buildBlogPostWhere,
  fetchPostSlugCompanions,
  findAllAdminBlogPosts,
  findOneAdminBlogPost,
  findPublishedBlogPosts,
  isPrismaErrorCode,
  parseLanguage,
  resilientPostQuery,
} from './blog-prisma.util';

export { parseLanguage };

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async resolveUniqueTopicKey(title: string, slug: string, language: BlogLanguage = BlogLanguage.en): Promise<string> {
    return resolveUniqueManualTopicKey(this.prisma, title, slug, language);
  }

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

    const author = await resolveSafeAuthorConnect(this.prisma, rest.author);
    await verifyCategoryConnect(this.prisma, rest.category);

    return executeResilientCreate(
      this.prisma,
      { ...rest, author, publishDate, language, translationGroupId: translationGroupId ?? undefined },
      { slug: rest.slug, topicKey: rest.topicKey, language },
    );
  }

  async findPublished(params: {
    page?: number; limit?: number; categorySlug?: string;
    search?: string; status?: PublishStatus; includeArchived?: boolean; language?: BlogLanguage;
  } = {}) {
    const { page = 1, limit = 12, categorySlug, search, status, includeArchived, language } = params;
    const skip = (page - 1) * limit;

    const allowedStatuses = status
      ? [status]
      : includeArchived ? PUBLIC_READ_STATUSES : [PublishStatus.PUBLISHED];

    const where = buildBlogPostWhere({
      statuses: allowedStatuses,
      language,
      categorySlug,
      search,
    });

    const [posts, total] = await Promise.all([
      findPublishedBlogPosts(this.prisma, { where, skip, limit }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string, language: BlogLanguage = BlogLanguage.en) {
    const post = await resilientPostQuery(
      () =>
        this.prisma.blogPost.findFirst({
          where: { slug, language, status: { in: PUBLIC_READ_STATUSES } },
          include: BLOG_MUTATION_INCLUDE,
        }),
      () =>
        this.prisma.blogPost.findFirst({
          where: { slug, language, status: { in: PUBLIC_READ_STATUSES } },
          include: { category: true },
        }),
    );

    if (!post) return null;

    const companions = await fetchPostSlugCompanions(this.prisma, post, language);
    return { ...post, ...companions };
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
    const where = buildBlogPostWhere({ status, language, categorySlug, search });

    // Drafts have publishDate: null; sorting publishDate desc first pushes them below all published posts in MongoDB.
    const orderBy: Prisma.BlogPostOrderByWithRelationInput[] =
      status === PublishStatus.PUBLISHED
        ? [{ publishDate: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }, { publishDate: 'desc' }];

    const [posts, total] = await Promise.all([
      findAllAdminBlogPosts(this.prisma, { where, skip, limit, orderBy }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneAdmin(id: string) {
    return findOneAdminBlogPost(this.prisma, id);
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
    const requestedGroup = translationGroupId === '' ? null : translationGroupId;
    const nextGroup =
      requestedGroup === undefined ? existing.translationGroupId : requestedGroup;
    if (nextGroup !== null && nextGroup !== undefined) {
      await assertCanJoinGroup(this.prisma, nextGroup, { id, language: nextLanguage });
    }

    await verifyCategoryConnect(this.prisma, rest.category);

    let nextPublishDate = rest.publishDate;
    if (rest.status === PublishStatus.PUBLISHED && !existing.publishDate && nextPublishDate === undefined) {
      nextPublishDate = new Date();
    }

    const groupUpdate = requestedGroup === undefined ? undefined : nextGroup;
    return executeResilientUpdate(
      this.prisma,
      id,
      { ...rest, publishDate: nextPublishDate, translationGroupId: groupUpdate },
      { id, slug: nextSlug, topicKey: existing.topicKey, language: nextLanguage },
    );
  }

  async delete(id: string) {
    try {
      return await this.prisma.blogPost.delete({ where: { id } });
    } catch (err) {
      if (isPrismaErrorCode(err, 'P2025')) {
        throw new NotFoundException(`Article '${id}' not found`);
      }
      throw err;
    }
  }

  async getCategories() {
    return this.prisma.blogCategory.findMany({
      include: { _count: { select: { posts: true } } },
    });
  }

  async createCategory(data: Prisma.BlogCategoryCreateInput) {
    const existing = await this.prisma.blogCategory.findUnique?.({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException(`Category with slug '${data.slug}' already exists`);
    }
    try {
      return await this.prisma.blogCategory.create({ data });
    } catch (err) {
      if (isPrismaErrorCode(err, 'P2002')) {
        throw new ConflictException(`Category with slug '${data.slug}' already exists`);
      }
      throw err;
    }
  }
}
