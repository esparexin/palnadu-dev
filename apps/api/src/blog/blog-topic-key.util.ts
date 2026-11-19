import { BlogLanguage } from '@prisma/client';
import { toTopicKey } from '../automation/topic-identity';

interface TopicKeyPostStore {
  blogPost: {
    findUnique: (args: {
      where: { topicKey_language: { topicKey: string; language: BlogLanguage } };
      select?: { id?: boolean; slug?: boolean };
    }) => Promise<{ id?: string; slug?: string } | null>;
  };
}

/**
 * Resolves a collision-free topicKey for manually authored blog posts.
 *
 * For manual editorial posts, the topic identity is initially derived from the title
 * via canonicalizeTopic(). If that key is already claimed by another post in the same
 * language (e.g. from automated generation or prior article with a similar concept),
 * it disambiguates by appending the post slug or sequential numeric suffix so
 * @@unique([topicKey, language]) is never violated.
 */
export async function resolveUniqueManualTopicKey(
  prisma: TopicKeyPostStore,
  title: string,
  slug: string,
  language: BlogLanguage,
): Promise<string> {
  const baseKey = toTopicKey(title) || slug;
  const existing = await prisma.blogPost.findUnique({
    where: { topicKey_language: { topicKey: baseKey, language } },
    select: { id: true, slug: true },
  });

  if (!existing || existing.slug === slug) {
    return baseKey;
  }

  const candidate = `${baseKey}-${slug}`.slice(0, 120);
  const clash = await prisma.blogPost.findUnique({
    where: { topicKey_language: { topicKey: candidate, language } },
    select: { id: true },
  });
  if (!clash) return candidate;

  let counter = 2;
  while (counter <= 50) {
    const suffixed = `${baseKey}-${counter}`.slice(0, 120);
    const taken = await prisma.blogPost.findUnique({
      where: { topicKey_language: { topicKey: suffixed, language } },
      select: { id: true },
    });
    if (!taken) return suffixed;
    counter++;
  }

  return `${baseKey}-${Date.now().toString(36)}`.slice(0, 120);
}
