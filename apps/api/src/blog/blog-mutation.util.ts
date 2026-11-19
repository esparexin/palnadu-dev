import { BadRequestException } from '@nestjs/common';
import { BlogLanguage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  BLOG_MUTATION_INCLUDE,
  isAuthorRelationError,
  mapBlogPostPrismaError,
} from './blog-prisma.util';

/**
 * Resolves an author connect input safely against MongoDB:
 * - If the referenced user exists, connects them.
 * - If the referenced user is missing/orphaned (e.g. stale JWT after db reseed),
 *   falls back to the earliest active admin user.
 * - If no admin exists in the database, safely leaves author unconnected.
 */
export async function resolveSafeAuthorConnect(
  prisma: PrismaService,
  author?: Prisma.UserCreateNestedOneWithoutBlogPostsInput,
): Promise<Prisma.UserCreateNestedOneWithoutBlogPostsInput | undefined> {
  if (!prisma?.user) return author;

  const authorId = author?.connect?.id;
  if (authorId) {
    const exists = await prisma.user.findUnique?.({
      where: { id: authorId },
      select: { id: true },
    });
    if (exists) return { connect: { id: authorId } };
  }

  const fallbackAdmin = await prisma.user.findFirst?.({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return fallbackAdmin ? { connect: { id: fallbackAdmin.id } } : undefined;
}

/**
 * Validates category existence if a category connection is specified.
 * Throws 400 BadRequestException instead of unhandled 500 P2025.
 */
export async function verifyCategoryConnect(
  prisma: PrismaService,
  category?: { connect?: { id?: string } },
): Promise<void> {
  const catId = category?.connect?.id;
  if (catId && prisma?.blogCategory?.findUnique) {
    const exists = await prisma.blogCategory.findUnique({
      where: { id: catId },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`Category '${catId}' not found`);
    }
  }
}

/**
 * Executes a blog creation mutation with author resilience against MongoDB relation failures.
 */
export async function executeResilientCreate(
  prisma: PrismaService,
  data: Prisma.BlogPostCreateInput,
  context: { slug: string; topicKey?: string; language: BlogLanguage },
) {
  try {
    return await prisma.blogPost.create({
      data,
      include: BLOG_MUTATION_INCLUDE,
    });
  } catch (err) {
    if (isAuthorRelationError(err)) {
      const created = await prisma.blogPost.findUnique({
        where: { language_slug: { language: context.language, slug: context.slug } },
        include: { category: true },
      });
      if (created) return created;
      try {
        return await prisma.blogPost.create({
          data: { ...data, author: undefined },
          include: { category: true },
        });
      } catch (innerErr) {
        return mapBlogPostPrismaError(innerErr, context);
      }
    }
    return mapBlogPostPrismaError(err, context);
  }
}

/**
 * Executes a blog update mutation with author resilience against MongoDB relation failures.
 */
export async function executeResilientUpdate(
  prisma: PrismaService,
  id: string,
  data: Prisma.BlogPostUpdateInput,
  context: { id: string; slug: string; topicKey?: string; language: BlogLanguage },
) {
  const updateArgs = { where: { id }, data };
  try {
    return await prisma.blogPost.update({
      ...updateArgs,
      include: BLOG_MUTATION_INCLUDE,
    });
  } catch (err) {
    if (isAuthorRelationError(err)) {
      try {
        return await prisma.blogPost.update({
          ...updateArgs,
          include: { category: true },
        });
      } catch (innerErr) {
        return mapBlogPostPrismaError(innerErr, context);
      }
    }
    return mapBlogPostPrismaError(err, context);
  }
}
