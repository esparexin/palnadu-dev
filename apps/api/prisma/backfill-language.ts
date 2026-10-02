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
 *   - every blog post missing `language` becomes `en`, EXCEPT the slugs in
 *     TE_LANGUAGE_OVERRIDES, which are known Telugu content and become `te`.
 *     A schema default is migration safety, not a language classifier: the
 *     dry run proved the default would have mislabelled real Telugu posts.
 *   - every queued topic missing `language` becomes `en`
 *
 * Auditable override list (approved 2026-10-02; do not extend silently —
 * each entry is a reviewed content decision, not a heuristic):
 *   - upi-mdr: Telugu-titled UPI article, Telugu body
 *   - 22000: Telugu-titled Subhash Chandra article, Telugu body
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
import { planLanguageBackfill, toHexId } from '../src/blog/language-backfill';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

/** Reviewed Telugu content that must not receive the `en` default. */
export const TE_LANGUAGE_OVERRIDES = new Set(['upi-mdr', '22000']);

async function main() {
  if (DRY_RUN) console.log('(dry run: no writes will happen)');

  // Raw reads, deliberately NOT via the Prisma model API: the generated client
  // materializes `@default(en)` on read, which makes every legacy document
  // look already-backfilled and would report "0 missing". The migration cares
  // about what is physically stored, so we inspect the raw documents.
  const postRows = await prisma.$runCommandRaw({
    find: 'blog_posts',
    projection: { slug: 1, language: 1 },
  });
  const topicRows = await prisma.$runCommandRaw({
    find: 'blog_topics',
    projection: { topicKey: 1, language: 1 },
  });
  const rawPosts = ((postRows as any)?.cursor?.firstBatch ?? []) as {
    _id: { $oid: string };
    slug: string;
    language?: unknown;
  }[];
  const rawTopics = ((topicRows as any)?.cursor?.firstBatch ?? []) as {
    _id: { $oid: string };
    topicKey: string;
    language?: unknown;
  }[];

  // $runCommandRaw returns Extended JSON: _id arrives as { $oid: '...' },
  // and String() on that yields "[object Object]" — an invalid ObjectID that
  // fails the update. Extract the hex string explicitly.
  const rawId = (d: { _id: unknown }): string => toHexId(d._id);
  const posts = rawPosts.map((d) => ({ id: rawId(d), slug: d.slug, language: d.language }));
  const topics = rawTopics.map((d) => ({ id: rawId(d), topicKey: d.topicKey, language: d.language }));

  const plan = planLanguageBackfill(posts, topics);
  const postsToFix = posts.filter((p) => plan.postIds.includes(p.id));
  const topicsToFix = topics.filter((t) => plan.topicIds.includes(t.id));

  console.log(`Blog posts: ${posts.length} total, ${postsToFix.length} physically missing language`);
  console.log(`Queued topics: ${topics.length} total, ${topicsToFix.length} physically missing language`);

  if (!DRY_RUN) {
    // Raw updates, deliberately NOT via the model API: production documents
    // predate other required fields (notably topic_key), and the generated
    // client validates full documents on write, failing with P2032 before
    // touching anything. A targeted $set of one field needs no such
    // validation and keeps this migration isolated from the topicKey
    // migration, which stays a separate decision.
    for (const p of postsToFix) {
      const language = TE_LANGUAGE_OVERRIDES.has(p.slug) ? 'te' : 'en';
      await prisma.$runCommandRaw({
        update: 'blog_posts',
        updates: [{ q: { _id: { $oid: p.id } }, u: { $set: { language } } }],
      });
      console.log(`  post ${p.slug} -> ${language}`);
    }
    for (const t of topicsToFix) {
      await prisma.$runCommandRaw({
        update: 'blog_topics',
        updates: [{ q: { _id: { $oid: t.id } }, u: { $set: { language: 'en' } } }],
      });
      console.log(`  topic ${t.topicKey} -> en`);
    }
  }

  const tePlanned = postsToFix.filter((p) => TE_LANGUAGE_OVERRIDES.has(p.slug));
  if (tePlanned.length > 0) {
    console.log(`Telugu overrides: ${tePlanned.map((p) => p.slug).join(', ')} -> te`);
  }

  console.log(
    DRY_RUN
      ? `Would backfill ${postsToFix.length} post(s) (${tePlanned.length} te, ${postsToFix.length - tePlanned.length} en) and ${topicsToFix.length} topic(s).`
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
