import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import {
  scoreAgainstCorpus,
  ExistingArticle,
  SimilarityInput,
  SimilarityResult,
  SimilarityThresholds,
  DEFAULT_THRESHOLDS,
} from './content-similarity-rules';
import { canonicalizeTopic, topicTokenOverlap } from './topic-identity';

/**
 * Loads the published corpus and delegates scoring to the pure rules module.
 */
@Injectable()
export class ContentSimilarityService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadExisting(): Promise<ExistingArticle[]> {
    const posts = await this.prisma.blogPost.findMany({
      select: {
        id: true,
        topicKey: true,
        topic: true,
        title: true,
        slug: true,
        primaryKeyword: true,
        secondaryKeywords: true,
        searchIntent: true,
        content: true,
      },
    });
    return posts.map((p) => ({
      id: p.id,
      topicKey: p.topicKey,
      title: p.title,
      slug: p.slug,
      topic: p.topic,
      primaryKeyword: p.primaryKeyword,
      secondaryKeywords: p.secondaryKeywords ?? [],
      searchIntent: p.searchIntent,
      content: p.content,
    }));
  }

  async check(
    candidate: SimilarityInput,
    thresholds?: Partial<SimilarityThresholds>,
    existing?: ExistingArticle[],
  ): Promise<SimilarityResult> {
    const corpus = existing ?? (await this.loadExisting());
    return scoreAgainstCorpus(
      candidate,
      corpus,
      thresholds ? { ...DEFAULT_THRESHOLDS, ...thresholds } : DEFAULT_THRESHOLDS,
    );
  }

  /**
   * Cheap pre-flight used while triaging a batch of discovered topics, so an
   * obvious duplicate is never enqueued in the first place.
   */
  async isLikelyDuplicateTopic(topic: string, knownTopicKeys: Set<string>): Promise<boolean> {
    const key = canonicalizeTopic(topic).topicKey;
    if (knownTopicKeys.has(key)) return true;

    const existing = await this.loadExisting();
    return existing.some(
      (post) =>
        !!post.topicKey &&
        topicTokenOverlap(topic, post.topic ?? post.title) >= DEFAULT_THRESHOLDS.topicOverlap,
    );
  }
}
