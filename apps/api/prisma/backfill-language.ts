/**
 * Backfill `language` on blog_posts and blog_topics before `db push`.
 *
 * Why this is required: MongoDB has no column defaults, so Prisma's
 * `@default(en)` only applies to rows created through the client. Legacy
 * documents predate the field entirely and read back without it. Marking the
 * column required is what keeps every future write honest, but it means these
 * rows must exist before the new client (or a `db push`) touches them.
 *
 * What it does:
 *   - every blog post missing `language` becomes `en` (all legacy content is English)
 *   - every queued topic missing `language` becomes `en`
 *
 * Safe to re-run: rows that already have a language are never touched, so it
 * is idempotent, and Telugu rows written later are left alone.
 *
 * Reversal: this script only fills in *missing* values; to roll back the
 * migration, unset the field again:
 *
 *   db.blog_posts.updateMany({ language: 'en' }, ...)  -- only for rows you
 *   can prove were backfilled, or simply leave them: `en` is the correct
 *   value for all legacy content anyway. The schema reversal itself is:
 *   remove the `language` field, restore `slug @unique`, drop the compound
 *   index, then `prisma db push`.
 *
 * Run with:  pnpm --filter @palnadu/api db:backfill-language [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { planLanguageBackfill } from '../src/blog/language-backfill';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (DRY_RUN) console.log('(dry run: no writes will happen)');

  const posts = (await prisma.blogPost.findMany({
    select: { id: true, slug: true, language: true },
    orderBy: { createdAt: 'asc' },
  })) as { id: string; slug: string; language?: unknown }[];

  const topics = (await prisma.blogTopic.findMany({
    select: { id: true, topicKey: true, language: true },
    orderBy: { createdAt: 'asc' },
  })) as { id: string; topicKey: string; language?: unknown }[];

  const plan = planLanguageBackfill(posts, topics);
  const postsToFix = posts.filter((p) => plan.postIds.includes(p.id));
  const topicsToFix = topics.filter((t) => plan.topicIds.includes(t.id));

  console.log(`Blog posts: ${posts.length} total, ${postsToFix.length} missing language`);
  console.log(`Queued topics: ${topics.length} total, ${topicsToFix.length} missing language`);

  if (!DRY_RUN) {
    for (const p of postsToFix) {
      await prisma.blogPost.update({ where: { id: p.id }, data: { language: 'en' } });
      console.log(`  post ${p.slug} -> en`);
    }
    for (const t of topicsToFix) {
      await prisma.blogTopic.update({ where: { id: t.id }, data: { language: 'en' } });
      console.log(`  topic ${t.topicKey} -> en`);
    }
  }

  console.log(
    DRY_RUN
      ? `Would backfill ${postsToFix.length} post(s) and ${topicsToFix.length} topic(s).`
      : `Backfilled ${postsToFix.length} post(s) and ${topicsToFix.length} topic(s).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
