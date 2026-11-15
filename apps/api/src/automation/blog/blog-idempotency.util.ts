import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { toTopicKey } from '../topic-identity';
import type { ComposedArticle } from './blog-composer.service';
import type { GenerationResult } from './types';

export interface ExistingBlogPostLike {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PublishStatus;
  language: BlogLanguage;
  topicKey: string;
  imageMetadata?: unknown;
}

export function toGenerationResultFromPost(
  post: ExistingBlogPostLike,
  categoryName: string,
): GenerationResult {
  const images = Array.isArray(post.imageMetadata) ? post.imageMetadata.length : 0;
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: categoryName,
    status: post.status,
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
    imagesCount: images,
    url: post.language === BlogLanguage.te ? `/te/blog/${post.slug}` : `/blog/${post.slug}`,
    topicKey: post.topicKey,
  };
}

export async function findExistingPostForTopic(
  prisma: PrismaService,
  topicKey: string,
  topic: string,
  language: BlogLanguage,
): Promise<ExistingBlogPostLike | null> {
  const direct = await prisma.blogPost.findUnique({
    where: { topicKey_language: { topicKey, language } },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      status: true,
      language: true,
      topicKey: true,
      imageMetadata: true,
    },
  });
  if (direct) return direct;

  const canonicalKey = toTopicKey(topic);
  if (canonicalKey && canonicalKey !== topicKey) {
    const canonicalMatch = await prisma.blogPost.findUnique({
      where: { topicKey_language: { topicKey: canonicalKey, language } },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        status: true,
        language: true,
        topicKey: true,
        imageMetadata: true,
      },
    });
    if (canonicalMatch) return canonicalMatch;
  }

  return null;
}

export async function resolveDuplicateValidationPost(
  prisma: PrismaService,
  topicRowId: string,
  composed: ComposedArticle,
  categoryName: string,
  logger: Logger,
): Promise<GenerationResult | null> {
  const isDuplicateSimilarity = composed.validation.failures.some(
    (f) => f.name === 'content_similarity' && composed.similarity?.nearest?.postId,
  );
  if (!isDuplicateSimilarity || !composed.similarity?.nearest?.postId) return null;

  const matched = await prisma.blogPost.findUnique({
    where: { id: composed.similarity.nearest.postId },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      status: true,
      language: true,
      topicKey: true,
      imageMetadata: true,
    },
  });
  if (!matched) return null;

  logger.log(
    `Duplicate detected during validation: resolving to existing post "${matched.title}" (${matched.id})`,
  );
  await prisma.blogTopic.update({
    where: { id: topicRowId },
    data: {
      status: TopicStatus.COMPLETED,
      postId: matched.id,
      lastError: null,
      claimedAt: null,
      claimedBy: null,
    },
  }).catch(() => undefined);

  return toGenerationResultFromPost(matched, categoryName);
}

export async function syncExistingTopicPost(
  prisma: PrismaService,
  existing: ExistingBlogPostLike,
  categoryName: string,
): Promise<GenerationResult> {
  await prisma.blogTopic.update({
    where: { topicKey_language: { topicKey: existing.topicKey, language: existing.language } },
    data: {
      status: TopicStatus.COMPLETED,
      postId: existing.id,
      claimedAt: null,
      claimedBy: null,
    },
  }).catch(() => undefined);

  return toGenerationResultFromPost(existing, categoryName);
}

export async function recordSingleArticleFailure(params: {
  prisma: PrismaService;
  topicKey: string;
  language: BlogLanguage;
  currentAttempts: number;
  maxAttempts: number;
  retryDelayMs: number;
  err: unknown;
}): Promise<void> {
  const msg = params.err instanceof Error ? params.err.message : String(params.err);
  const exhausted = params.currentAttempts + 1 >= params.maxAttempts;
  const permanent = exhausted;
  await params.prisma.blogTopic.update({
    where: { topicKey_language: { topicKey: params.topicKey, language: params.language } },
    data: {
      attempts: { increment: 1 },
      lastError: msg.slice(0, 500),
      status: permanent ? TopicStatus.FAILED : TopicStatus.PENDING,
      nextRetryAt: permanent ? null : new Date(Date.now() + params.retryDelayMs),
      claimedAt: null,
      claimedBy: null,
    },
  }).catch(() => {});
}
