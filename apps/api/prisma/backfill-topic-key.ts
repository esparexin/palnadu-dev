/**
 * Backfill `blog_posts.topicKey` for legacy rows that predate stable identity.
 *
 * Production currently has 66 posts with NO topic_key at all, which blocks
 * two things: creating the @@unique([topicKey, language]) index, and running
 * the new API code (its reads expect the non-nullable field). This migration
 * is deliberately separate from the language migration: same mechanics,
 * different decision, independently reviewable and rollback-able.
 *
 * What it does:
 * - derives each missing key from the post title via the SAME canonical
 *   identity new topics use (concept-first, cross-language, intent-suffixed),
 *   so a backfilled key means exactly what a generated key means;
 * - appends `-2`, `-3`, … on collision. A suffixed key is an honest duplicate
 *   flag, not silent data loss: those posts need editorial review, not
 *   deletion (deletion decisions stay out of migrations entirely).
 *
 * Writes go through targeted raw `$set` commands, not the model API: legacy
 * documents predate other required fields and the generated client validates
 * whole documents on write (P2032). Raw reads are used for the same reason
 * the language backfill uses them — the client materializes `@default`s on
 * read and would report "0 missing".
 *
 * Reversal: re-run with the field unset per id, or simply leave the values:
 * they are deterministic derivations of titles and harmless if the index is
 * later dropped. Schema reversal: remove the compound uniques, `db:push`.
 *
 * Run with:  pnpm --filter @palnadu/api db:backfill-topic-key [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { toHexId } from '../src/blog/language-backfill';
import { assignTopicKeys } from '../src/blog/topic-key-backfill';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  if (DRY_RUN) console.log('(dry run: no writes will happen)');

  const rows = (await prisma.$runCommandRaw({
    find: 'blog_posts',
    projection: { slug: 1, title: 1, language: 1, topic_key: 1 },
  })) as any;
  const raw = (rows?.cursor?.firstBatch ?? []) as {
    _id: unknown;
    slug: string;
    title: string;
    language?: unknown;
    topic_key?: unknown;
  }[];

  const missing = raw.filter((d) => d.topic_key === undefined || d.topic_key === null);
  console.log(`Blog posts: ${raw.length} total, ${missing.length} physically missing topic_key`);

  const assignments = assignTopicKeys(
    missing.map((d) => ({
      id: toHexId(d._id),
      slug: d.slug,
      title: d.title,
      language: d.language,
    })),
  );

  const suffixed = assignments.filter((a) => a.suffixed);
  for (const a of assignments) {
    console.log(`  ${a.slug} -> ${a.topicKey}${a.suffixed ? '  [SUFFIXED — needs editorial review]' : ''}`);
  }
  if (suffixed.length > 0) {
    console.log(
      `Note: ${suffixed.length} post(s) collided and received suffixed keys. ` +
        `These are true duplicates awaiting an editorial decision, not an error.`,
    );
  }

  if (!DRY_RUN) {
    for (const a of assignments) {
      await prisma.$runCommandRaw({
        update: 'blog_posts',
        updates: [{ q: { _id: { $oid: a.id } }, u: { $set: { topic_key: a.topicKey } } }],
      });
    }
  }

  console.log(
    DRY_RUN
      ? `Would backfill ${assignments.length} post(s).`
      : `Backfilled ${assignments.length} post(s).`,
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
