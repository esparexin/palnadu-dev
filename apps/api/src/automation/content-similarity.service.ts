import { Injectable } from '@nestjs/common';
// NOTE: value import, deliberately not `import type`. Nest resolves constructor
// dependencies from emitted decorator metadata; a type-only import erases to
// `Function` and the whole API refuses to boot with an unresolvable dependency.
import { PrismaService } from '../prisma.service';
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
        language: true,
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
      language: p.language ?? null,
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
   *
   * Language-aware: a same-topicKey match in another language is a translation
   * candidate, not a duplicate — it must not block enqueueing.
   */
  async isLikelyDuplicateTopic(
    topic: string,
    knownTopicKeys: Set<string>,
    language?: string | null,
  ): Promise<boolean> {
    const key = canonicalizeTopic(topic).topicKey;
    if (knownTopicKeys.has(key)) return true;

    const existing = await this.loadExisting();
    return existing.some((post) => {
      if (!post.topicKey) return false;
      if (post.topicKey === key) {
        // Same key, other language → translation candidate, not a duplicate.
        if (language && post.language && post.language !== language) return false;
        return true;
      }
      // Cross-language text overlap is script noise; only same-language (or
      // unknown-language) text counts.
      if (language && post.language && post.language !== language) return false;
      return topicTokenOverlap(topic, post.topic ?? post.title) >= DEFAULT_THRESHOLDS.topicOverlap;
    });
  }
}
