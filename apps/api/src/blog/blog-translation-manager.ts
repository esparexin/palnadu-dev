import { BadRequestException, ConflictException } from '@nestjs/common';
import { BlogLanguage } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { canJoinGroup, SupportedLanguage } from './blog-translations';

/** Shared by create/update: one post per language per group. */
export async function assertCanJoinGroup(
  prisma: PrismaService,
  translationGroupId: string,
  candidate: { id: string; language: BlogLanguage },
): Promise<void> {
  const siblings = await prisma.blogPost.findMany({
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

/**
 * Links posts as localized versions of each other.
 */
export async function linkBlogTranslations(
  prisma: PrismaService,
  postIds: string[],
  groupId?: string,
): Promise<{ translationGroupId: string; members: { id: string; slug: string; language: BlogLanguage }[] }> {
  if (postIds.length === 0) {
    throw new BadRequestException('At least one post id is required to form a translation group');
  }

  const posts = await prisma.blogPost.findMany({
    where: { id: { in: postIds } },
    select: { id: true, slug: true, language: true, translationGroupId: true },
  });
  if (posts.length !== postIds.length) {
    const found = new Set(posts.map((p) => p.id));
    throw new BadRequestException(
      `Unknown post id(s): ${postIds.filter((id) => !found.has(id)).join(', ')}`,
    );
  }

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

  if (groupId) {
    const siblings = await prisma.blogPost.findMany({
      where: { translationGroupId: groupId, id: { notIn: postIds } },
      select: { id: true, language: true },
    });
    for (const s of siblings) {
      if (
        !canJoinGroup(
          posts.map((p) => ({ id: p.id, language: p.language as SupportedLanguage })),
          { id: s.id, language: s.language as SupportedLanguage },
        )
      ) {
        throw new ConflictException(
          `Language '${s.language}' is already represented in group '${groupId}'`,
        );
      }
    }
  }

  await prisma.blogPost.updateMany({
    where: { id: { in: postIds } },
    data: { translationGroupId },
  });

  const members = await prisma.blogPost.findMany({
    where: { translationGroupId },
    select: { id: true, slug: true, language: true },
  });
  return { translationGroupId, members };
}
