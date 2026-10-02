import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, PublishStatus, BlogLanguage } from '@prisma/client';
import { canJoinGroup, parseLanguageValue, SupportedLanguage } from './blog-translations';

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
      await this.assertCanJoinGroup(translationGroupId, { id: '', language });
    }

    return this.prisma.blogPost.create({
      data: { ...rest, language, translationGroupId: translationGroupId ?? undefined },
      include: { author: { select: { id: true, name: true, avatar: true } }, category: true },
    });
  }

  // Public: published articles (and optionally archived articles).
  // `language` is intentionally NOT defaulted: the API stays backward
  // compatible (no param = all languages, as before) and each caller passes
  // its own locale explicitly (`/blog` passes `en`, `/te/blog/...` passes `te`).
  async findPublished(params: {
    page?: number;
    limit?: number;
    categorySlug?: string;
    search?: string;
    status?: PublishStatus;
    includeArchived?: boolean;
    language?: BlogLanguage;
  } = {}) {
    const { page = 1, limit = 12, categorySlug, search, status, includeArchived, language } = params;
    const skip = (page - 1) * limit;

    const allowedStatuses = status
      ? [status]
      : includeArchived
      ? [PublishStatus.PUBLISHED, PublishStatus.ARCHIVED]
      : [PublishStatus.PUBLISHED];

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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Public: single post by slug, scoped to one language, with related posts
  // in the same language and the published translations for hreflang.
  // `language` defaults to `en` so existing English URLs keep resolving
  // exactly as before.
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

    // Related posts stay in the same language: linking a Telugu article to an
    // English `/blog/<slug>` URL (or vice versa) would 404 under the
    // language-scoped routes.
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

    // Published translations for hreflang. Draft translations are excluded:
    // emitting an hreflang alternate to an unpublished URL is worse than
    // emitting none.
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

  /**
   * Links posts as localized versions of each other.
   *
   * Explicit and group-scoped: at most one post per language may belong to a
   * group, so a second Telugu article for an already-translated subject is
   * refused rather than silently attached. Pass explicit ids; nothing is
   * inferred from matching topicKeys.
   */
  async linkTranslations(postIds: string[], groupId?: string): Promise<{ translationGroupId: string; members: { id: string; slug: string; language: BlogLanguage }[] }> {
    if (postIds.length === 0) {
      throw new BadRequestException('At least one post id is required to form a translation group');
    }

    const posts = await this.prisma.blogPost.findMany({
      where: { id: { in: postIds } },
      select: { id: true, slug: true, language: true, translationGroupId: true },
    });
    if (posts.length !== postIds.length) {
      const found = new Set(posts.map((p) => p.id));
      throw new BadRequestException(
        `Unknown post id(s): ${postIds.filter((id) => !found.has(id)).join(', ')}`,
      );
    }

    const languages = posts.map((p) => p.language as SupportedLanguage);
    const seen = new Set<SupportedLanguage>();
    for (const p of posts) {
      const lang = p.language as SupportedLanguage;
      if (seen.has(lang)) {
        throw new ConflictException(
          `Language '${lang}' is already represented in this group; one post per language only`,
        );
      }
      seen.add(lang);
    }

    // Members already grouped elsewhere keep their existing group only if it
    // is the same one being formed here; otherwise refuse rather than move.
    const foreignGroups = new Set(
      posts.map((p) => p.translationGroupId).filter((g): g is string => !!g && g !== groupId),
    );
    if (groupId && foreignGroups.size > 0) {
      throw new ConflictException(
        `Post(s) already belong to another translation group: ${[...foreignGroups].join(', ')}`,
      );
    }

    const translationGroupId =
      groupId ?? `tg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    // If merging into an existing group, the stored members count too.
    if (groupId) {
      const siblings = await this.prisma.blogPost.findMany({
        where: { translationGroupId: groupId, id: { notIn: postIds } },
        select: { id: true, language: true },
      });
      for (const s of siblings) {
        if (!canJoinGroup(posts.map((p) => ({ id: p.id, language: p.language as SupportedLanguage })), { id: s.id, language: s.language as SupportedLanguage })) {
          throw new ConflictException(
            `Language '${s.language}' is already represented in group '${groupId}'`,
          );
        }
      }
    }

    await this.prisma.blogPost.updateMany({
      where: { id: { in: postIds } },
      data: { translationGroupId },
    });

    const members = await this.prisma.blogPost.findMany({
      where: { translationGroupId },
      select: { id: true, slug: true, language: true },
    });
    return { translationGroupId, members };
  }

  /** Shared by create/update: one post per language per group. */
  private async assertCanJoinGroup(
    translationGroupId: string,
    candidate: { id: string; language: BlogLanguage },
  ): Promise<void> {
    const siblings = await this.prisma.blogPost.findMany({
      where: { translationGroupId, id: { not: candidate.id } },
      select: { id: true, language: true },
    });
    const ok = canJoinGroup(
      siblings.map((s) => ({ id: s.id, language: s.language as SupportedLanguage })),
      { id: candidate.id, language: candidate.language as SupportedLanguage },
    );
    if (!ok) {
      throw new ConflictException(
        `Language '${candidate.language}' is already represented in translation group '${translationGroupId}'`,
      );
    }
  }

  // Admin: all posts
  async findAllAdmin(params: {
    page?: number;
    limit?: number;
    status?: PublishStatus;
    categorySlug?: string;
    search?: string;
    language?: BlogLanguage;
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

  async update(id: string, data: Prisma.BlogPostUpdateInput & { translationGroupId?: string | null }) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Article '${id}' not found`);
    }

    const nextLanguage = (data.language ?? existing.language) as BlogLanguage;
    const nextSlug = typeof data.slug === 'string' ? data.slug : existing.slug;

    // Slug uniqueness is per language: moving a slug across languages (or
    // renaming within one) must not collide with a sibling in that locale.
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
      await this.assertCanJoinGroup(nextGroup, { id, language: nextLanguage });
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: { ...rest, translationGroupId: nextGroup ?? undefined },
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
