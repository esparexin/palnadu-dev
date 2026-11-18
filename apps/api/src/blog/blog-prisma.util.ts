import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BlogLanguage, Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { parseLanguageValue } from './blog-translations';

/** Languages the API accepts. Anything else is a client error, not a silent default. */
export function parseLanguage(value: unknown): BlogLanguage | undefined {
  const parsed = parseLanguageValue(value);
  if (parsed !== undefined && typeof parsed === 'object') {
    throw new BadRequestException(`Invalid language '${parsed.invalid}'. Expected 'en' or 'te'.`);
  }
  return parsed as BlogLanguage | undefined;
}

/** Publication statuses the API accepts. Invalid non-empty status is a 400 client error. */
export function parsePublishStatus(value: unknown): PublishStatus | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return undefined;
  const upper = value.toUpperCase();
  if (upper in PublishStatus) {
    return upper as PublishStatus;
  }
  throw new BadRequestException(`Invalid status '${value}'. Expected DRAFT, PUBLISHED, or ARCHIVED.`);
}

export const PUBLIC_READ_STATUSES: PublishStatus[] = [
  PublishStatus.PUBLISHED,
  PublishStatus.ARCHIVED,
];

export const BLOG_MUTATION_INCLUDE = {
  author: { select: { id: true, name: true, avatar: true } },
  category: true,
} as const;

interface PrismaErrorLike {
  code?: string;
  meta?: { target?: unknown };
}

/** Checks whether an unknown error matches a Prisma known error code (e.g. P2002, P2025). */
export function isPrismaErrorCode(err: unknown, code: string): boolean {
  return Boolean(
    err && typeof err === 'object' && 'code' in err && (err as PrismaErrorLike).code === code,
  );
}

function targetsTopicKey(err: unknown): boolean {
  const target = (err as PrismaErrorLike | null)?.meta?.target;
  if (Array.isArray(target)) {
    return target.some((entry) => /topic_?key/i.test(String(entry)));
  }
  return typeof target === 'string' && /topic_?key/i.test(target);
}

/** Maps Prisma unique/not-found errors on BlogPost mutations to NestJS HTTP exceptions. */
export function mapBlogPostPrismaError(
  err: unknown,
  context: { id?: string; slug?: string; topicKey?: string; language: BlogLanguage },
): never {
  if (isPrismaErrorCode(err, 'P2002')) {
    if (targetsTopicKey(err)) {
      throw new ConflictException(
        `Article with topicKey '${context.topicKey ?? ''}' already exists in '${context.language}'`,
      );
    }
    throw new ConflictException(
      `Article with slug '${context.slug ?? ''}' already exists in '${context.language}'`,
    );
  }
  if (isPrismaErrorCode(err, 'P2025') && context.id) {
    throw new NotFoundException(`Article '${context.id}' not found`);
  }
  throw err;
}

/** Shared Prisma where-clause builder for admin and public blog listings. */
export function buildBlogPostWhere(params: {
  statuses?: PublishStatus[];
  status?: PublishStatus;
  language?: BlogLanguage;
  categorySlug?: string;
  search?: string;
}): Prisma.BlogPostWhereInput {
  const { statuses, status, language, categorySlug, search } = params;
  const statusFilter = statuses
    ? statuses.length === 1
      ? statuses[0]
      : { in: statuses }
    : status;

  return {
    ...(statusFilter && { status: statusFilter }),
    ...(language !== undefined && { language }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
}

/** Loads related articles and linked localized siblings for a published/archived post. */
export async function fetchPostSlugCompanions(
  prisma: PrismaService,
  post: { id: string; categoryId: string | null; translationGroupId: string | null },
  language: BlogLanguage,
) {
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      status: { in: PUBLIC_READ_STATUSES },
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
    ? await prisma.blogPost.findMany({
        where: {
          translationGroupId: post.translationGroupId,
          id: { not: post.id },
          status: { in: PUBLIC_READ_STATUSES },
        },
        select: { id: true, slug: true, language: true },
      })
    : [];

  return { relatedPosts, translations };
}

/** Fallback runner for queries that may fail due to orphaned MongoDB author relations. */
async function resilientPostQuery<T>(
  queryWithAuthor: () => Promise<T>,
  queryFallback: () => Promise<T>,
): Promise<T> {
  try {
    return await queryWithAuthor();
  } catch {
    return await queryFallback();
  }
}

/** Queries published posts with resilience against orphaned author relations in MongoDB. */
export async function findPublishedBlogPosts(
  prisma: PrismaService,
  params: { where: Prisma.BlogPostWhereInput; skip: number; limit: number },
) {
  const { where, skip, limit } = params;
  return resilientPostQuery(
    () =>
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    () =>
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
  );
}

/** Queries admin posts with resilience against orphaned author relations in MongoDB. */
export async function findAllAdminBlogPosts(
  prisma: PrismaService,
  params: {
    where: Prisma.BlogPostWhereInput;
    skip: number;
    limit: number;
    orderBy: Prisma.BlogPostOrderByWithRelationInput[];
  },
) {
  const { where, skip, limit, orderBy } = params;
  return resilientPostQuery(
    () =>
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
    () =>
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
  );
}

/** Fetches one admin post with resilience against orphaned author relations. */
export async function findOneAdminBlogPost(prisma: PrismaService, id: string) {
  return resilientPostQuery(
    () =>
      prisma.blogPost.findUnique({
        where: { id },
        include: { author: true, category: true },
      }),
    () =>
      prisma.blogPost.findUnique({
        where: { id },
        include: { category: true },
      }),
  );
}
