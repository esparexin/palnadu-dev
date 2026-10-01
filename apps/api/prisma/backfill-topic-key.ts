/**
 * Backfill `blog_posts.topicKey` before the unique index is created.
 *
 * The field is non-nullable and unique, so legacy rows (written before stable
 * topic identity existed) must be given a key first. This script derives a key
 * from the post's own title — the best available signal for legacy content —
 * and de-duplicates by appending a short suffix when two posts normalise to the
 * same key, so the index can be created without data loss.
 *
 * Run with:  pnpm --filter @palnadu/api db:backfill-topic-key
 *
 * This is a data migration, not a schema migration: review output before
 * relying on it, since derived keys for legacy posts are best-effort.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Same normalization as the automation's topic identity module. */
function toTopicKey(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: { id: true, title: true, slug: true, topicKey: true },
    orderBy: { createdAt: 'asc' },
  });

  const missing = posts.filter((p) => !p.topicKey);
  console.log(`Total posts: ${posts.length}`);
  console.log(`Missing topicKey: ${missing.length}`);

  if (missing.length === 0) {
    console.log('Nothing to backfill.');
    return;
  }

  const taken = new Set(
    posts.filter((p) => p.topicKey).map((p) => p.topicKey as string),
  );

  let updated = 0;
  for (const post of missing) {
    const base = toTopicKey(post.title) || toTopicKey(post.slug) || post.slug;

    // Guarantee uniqueness by suffixing on collision with an already-used key.
    let key = base;
    let n = 2;
    while (taken.has(key)) {
      key = `${base}-${n}`;
      n += 1;
    }
    taken.add(key);

    await prisma.blogPost.update({ where: { id: post.id }, data: { topicKey: key } });
    console.log(`  ${post.slug} -> ${key}`);
    updated += 1;
  }

  console.log(`Backfilled ${updated} post(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });