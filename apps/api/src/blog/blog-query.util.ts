import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

/**
 * 3-tier fallback runner for queries against MongoDB blog posts:
 * Tier 1: Query with full relations ({ author, category }).
 * Tier 2: If author relation fails (orphaned authorId), query with { category } only.
 * Tier 3: If category also fails (orphaned categoryId), query raw posts without includes.
 */
async function resilientPostQuery<T>(
  primary: () => Promise<T>,
  fallbackWithoutAuthor: () => Promise<T>,
  fallbackRaw: () => Promise<T>,
): Promise<T> {
  try {
    return await primary();
  } catch {
    try {
      return await fallbackWithoutAuthor();
    } catch {
      return await fallbackRaw();
    }
  }
}

/** Queries published posts with 3-tier resilience against orphaned relations in MongoDB. */
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
    () =>
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
      }),
  );
}

/** Queries admin posts with 3-tier resilience against orphaned relations in MongoDB. */
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
    () =>
      prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
  );
}

/** Fetches one admin post with 3-tier resilience against orphaned relations. */
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
    () =>
      prisma.blogPost.findUnique({
        where: { id },
      }),
  );
}
