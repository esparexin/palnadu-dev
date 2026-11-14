import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
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
