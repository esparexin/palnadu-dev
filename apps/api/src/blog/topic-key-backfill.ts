/**
 * Pure planner for the topicKey backfill migration.
 *
 * Derives stable identity for legacy posts (which predate topicKey entirely)
 * using the SAME canonical identity the automation uses for new topics, so a
 * backfilled key means the same thing as a generated key. Framework-free so
 * the collision and language behavior is covered by tests, not just review.
 *
 * Rules:
 * - key source is the post title (best available signal for legacy content),
 *   falling back to the slug when the title yields nothing usable;
 * - collisions append `-2`, `-3`, … so the later compound unique index can be
 *   created without data loss. A suffixed key is an honest flag: two posts
 *   normalizing identically are true duplicates awaiting editorial review;
 * - Telugu titles resolve through the same concept-first identity as English,
 *   so cross-language pairs converge rather than fragment.
 */
import { canonicalizeTopic } from '../automation/topic-identity';

export interface LegacyPost {
  id: string;
  slug: string;
  title: string;
  language?: unknown;
}

export interface TopicKeyAssignment {
  id: string;
  slug: string;
  topicKey: string;
  /** True when a collision forced a `-n` suffix: needs editorial review. */
  suffixed: boolean;
}

export function assignTopicKeys(
  posts: LegacyPost[],
  taken: Set<string> = new Set(),
): TopicKeyAssignment[] {
  const used = new Set(taken);
  const out: TopicKeyAssignment[] = [];

  for (const post of posts) {
    const base =
      canonicalizeTopic(post.title).topicKey ||
      canonicalizeTopic(post.slug).topicKey ||
      post.slug;

    let key = base;
    let n = 2;
    while (used.has(key)) {
      key = `${base}-${n}`;
      n += 1;
    }
    used.add(key);

    out.push({ id: post.id, slug: post.slug, topicKey: key, suffixed: key !== base });
  }

  return out;
}
