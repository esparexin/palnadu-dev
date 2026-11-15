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
   *
   * Verifies against BOTH published posts (blogPost) and active queue items (blogTopic).
   */
  async isLikelyDuplicateTopic(
    topic: string,
    knownTopicKeys: Set<string>,
    language?: string | null,
  ): Promise<boolean> {
    const candidateCanonical = canonicalizeTopic(topic);
    const key = candidateCanonical.topicKey;
    if (knownTopicKeys.has(key)) return true;

    const existingPosts = await this.loadExisting();
    const activeTopics =
      (await this.prisma.blogTopic?.findMany?.({
        where: {
          language: language ? (language as any) : undefined,
          status: { in: ['PENDING', 'CLAIMED', 'FAILED'] as any },
        },
        select: { topicKey: true, topic: true, language: true },
      })) ?? [];

    const corpus = [
      ...existingPosts.map((p) => ({ topicKey: p.topicKey, topic: p.topic ?? p.title, language: p.language })),
      ...activeTopics.map((t) => ({ topicKey: t.topicKey, topic: t.topic, language: t.language })),
    ];

    return corpus.some((item) => {
      if (!item.topicKey) return false;
      if (item.topicKey === key) {
        if (language && item.language && item.language !== language) return false;
        return true;
      }
      if (language && item.language && item.language !== language) return false;

      const itemCanonical = canonicalizeTopic(item.topic);
      // Legitimate regional variation: different locations are NEVER duplicates
      if (
        candidateCanonical.location &&
        itemCanonical.location &&
        candidateCanonical.location !== itemCanonical.location
      ) {
        return false;
      }

      // Check 1: Token overlap >= threshold
      if (topicTokenOverlap(topic, item.topic) >= DEFAULT_THRESHOLDS.topicOverlap) {
        return true;
      }

      // Check 2: Same location + same core concept pair (subject + aspect) + same intent
      if (
        candidateCanonical.location &&
        itemCanonical.location &&
        candidateCanonical.location === itemCanonical.location &&
        candidateCanonical.intent === itemCanonical.intent &&
        candidateCanonical.concepts.length > 0 &&
        itemCanonical.concepts.length > 0
      ) {
        const shared = candidateCanonical.concepts.filter((c) => itemCanonical.concepts.includes(c));
        if (shared.some((c) => c.startsWith('subject:')) && shared.some((c) => c.startsWith('aspect:'))) {
          return true;
        }
      }

      return false;
    });
  }
}
