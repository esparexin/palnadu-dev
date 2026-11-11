import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IndexNowSource } from '../seo-sources';
import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { ComposedArticle } from './blog-composer.service';
import { ClaimedTopic, GenerationResult } from './types';
import { extractInternalBacklinks } from './backlink-policy';

@Injectable()
export class BlogPublisherService {
  private readonly logger = new Logger(BlogPublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly indexNow?: IndexNowSource,
  ) {}

  async decidePublishStatus(
    forcePublish: boolean,
    validation: { forceDraft: boolean; failures?: { name: string }[] },
  ): Promise<PublishStatus> {
    let shouldPublish = forcePublish;
    if (!shouldPublish) {
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'auto_publish_blogs' },
      });
      shouldPublish = setting?.value === true;
    }

    const hasBacklinkFailure = validation.failures?.some((f) => f.name === 'internal_links');
    if (hasBacklinkFailure) {
      if (shouldPublish) {
        this.logger.warn('Backlink validation failed; forcing DRAFT status despite auto-publish.');
      }
      shouldPublish = false;
    }
    if (validation.forceDraft) {
      if (shouldPublish) {
        this.logger.warn('Draft produced a template-fallback; forcing DRAFT despite auto-publish.');
      }
      shouldPublish = false;
    }
    const publishStatus = shouldPublish ? PublishStatus.PUBLISHED : PublishStatus.DRAFT;
    return publishStatus;
  }

  async persistAndNotify(
    topicRow: ClaimedTopic,
    composed: ComposedArticle,
    categoryId: string,
    categoryName: string,
    authorId: string,
    publishStatus: PublishStatus,
    startedAt: number,
  ): Promise<GenerationResult> {
    const { topicKey, topic, language } = topicRow;
    const { draft, enrichedContent, coverImage, images, wordCount, validation, llmProvider } = composed;
    const isPublished = publishStatus === PublishStatus.PUBLISHED;

    const post = await this.prisma.blogPost.create({
      data: {
        topicKey,
        topic,
        language,
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: enrichedContent,
        coverImage,
        categoryId,
        authorId,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        canonicalUrl: draft.canonicalUrl,
        ogImage: coverImage,
        status: publishStatus,
        publishDate: isPublished ? new Date() : null,
        imageMetadata: images as any,
        faqData: draft.faq as any,
        primaryKeyword: draft.primaryKeyword,
        secondaryKeywords: draft.secondaryKeywords,
        relatedKeywords: draft.relatedKeywords,
        longTailKeywords: draft.longTailKeywords,
        searchIntent: draft.searchIntent,
        tags: draft.tags,
        internalLinks: draft.internalLinks as any,
        externalRefs: draft.externalReferences as any,
        llmProvider,
        referenceSources: topicRow.referenceSources ?? [],
      },
    });

    const inBodyLinks = extractInternalBacklinks(enrichedContent);
    this.logger.log(
      `Backlink Audit: "${draft.title}" [${language}] -> ${inBodyLinks.length} backlink(s): ${inBodyLinks.map((l) => l.url).join(', ') || 'none'} | Status: ${publishStatus}`,
    );

    await this.prisma.blogTopic.update({
      where: { topicKey_language: { topicKey, language } },
      data: { status: TopicStatus.COMPLETED, postId: post.id, claimedAt: null, claimedBy: null },
    });

    await this.prisma.blogGenerationLog.create({
      data: {
        topicKey,
        topic,
        language,
        postId: post.id,
        primaryKeyword: draft.primaryKeyword,
        secondaryKeywords: draft.secondaryKeywords,
        searchIntent: draft.searchIntent,
        referenceSources: topicRow.referenceSources ?? [],
        generatedTitle: draft.title,
        generatedSlug: draft.slug,
        llmProvider,
        validationResult: validation.summary,
        similarityResult: composed.similaritySummary,
        status: publishStatus,
        publishedUrl: isPublished
          ? post.language === BlogLanguage.te
            ? `/te/blog/${post.slug}`
            : `/blog/${post.slug}`
          : null,
        failureReason: !validation.passed ? validation.failures.map((f: { name: string }) => f.name).join(', ') : null,
        durationMs: Date.now() - startedAt,
      },
    });

    if (isPublished && this.indexNow) {
      const canonicalPath = post.language === BlogLanguage.te ? `/te/blog/${post.slug}` : `/blog/${post.slug}`;
      const fullUrl = `https://www.palnadu.dev${canonicalPath}`;
      this.indexNow.submitUrls('www.palnadu.dev', [fullUrl]).catch((err: unknown) => {
        this.logger.warn(`Real-time IndexNow notification failed: ${String(err)}`);
      });
    }

    await this.prisma.notification.create({
      data: {
        title: validation.forceDraft
          ? 'Automated Blog Needs Rewriting (LLM Fallback)'
          : isPublished
            ? 'Automated Blog Published'
            : 'New Blog Draft Ready for Review',
        message: validation.forceDraft
          ? `"${post.title}" fell back to the static template because LLM generation did not succeed. Saved as DRAFT.`
          : `"${post.title}" was generated with ${images.length} licensed images (${inBodyLinks.length} backlinks) and is currently ${publishStatus}.`,
        type: 'BLOG_AUTOMATION',
        read: false,
        data: {
          postId: post.id,
          slug: post.slug,
          status: publishStatus,
          topicKey,
          llmProvider,
          templateFallback: validation.forceDraft,
          internalBacklinksCount: inBodyLinks.length,
          internalBacklinkUrls: inBodyLinks.map((l) => l.url),
          validationStatus: validation.passed ? 'PASSED' : 'FAILED',
        },
      },
    });

    this.logger.log(`post created topicKey="${topicKey}" [${publishStatus}] in ${Date.now() - startedAt}ms`);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: categoryName,
      status: publishStatus,
      wordCount,
      imagesCount: images.length,
      url: post.language === BlogLanguage.te ? `/te/blog/${post.slug}` : `/blog/${post.slug}`,
      topicKey,
    };
  }
}
