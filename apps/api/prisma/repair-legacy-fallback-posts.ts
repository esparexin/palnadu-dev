/**
 * Repair legacy blog posts corrupted by naive string slicing and demote
 * duplicate template fallback posts to DRAFT.
 *
 * Background:
 * In September 2026, fallback articles were generated using naive `.slice(0, 45)`
 * and `.slice(0, 155)`, causing mid-word truncation in `seoTitle` and `seoDescription`.
 * Additionally, 48 posts share identical boilerplate template bodies, which Google
 * Search Console flagged under "Crawled - currently not indexed".
 *
 * What this script does:
 * 1. Identifies posts generated from the fallback template (corrupted seoTitle/seoDesc).
 * 2. Re-derives clean, word-boundary-safe seoTitle and seoDescription.
 * 3. Demotes template fallback posts from PUBLISHED to DRAFT so they do not drag down
 *    site-wide quality in Google Search Console before editorial rewrites.
 *
 * Usage:
 *   pnpm --filter @palnadu/api db:repair-legacy-fallback-posts --dry-run
 *   pnpm --filter @palnadu/api db:repair-legacy-fallback-posts --execute
 */
import { PrismaClient } from '@prisma/client';
import {
  buildFallbackMetaTitle,
  buildFallbackMetaDescription,
} from '../src/automation/content-research/structured-fallback';

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes('--execute');
const DRY_RUN = !EXECUTE || process.argv.includes('--dry-run');

export function toHexId(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && '$oid' in (raw as Record<string, unknown>)) {
    return String((raw as Record<string, unknown>).$oid);
  }
  return String(raw);
}

export function isTemplateFallbackPost(post: {
  seoTitle?: string | null;
  seoDescription?: string | null;
  content?: string | null;
}): boolean {
  const desc = post.seoDescription ?? '';
  const title = post.seoTitle ?? '';
  const body = post.content ?? '';

  if (desc.endsWith('enterpri')) return true;
  if (/(\bStac\b|\bf\b|\bSca\b|\bBusine\b)\s*\|\s*Palnadu\.dev/.test(title)) return true;
  if (body.includes('informal operational methods stop working') && body.includes('fragmented WhatsApp chat threads')) {
    return true;
  }
  return false;
}

async function main() {
  console.log(`[Repair Legacy Posts] Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'EXECUTE (live database writes)'}`);

  const rows = (await prisma.$runCommandRaw({
    find: 'blog_posts',
    projection: { _id: 1, slug: 1, title: 1, status: 1, seoTitle: 1, seoDescription: 1, content: 1, excerpt: 1 },
  })) as any;

  const raw = (rows?.cursor?.firstBatch ?? []) as {
    _id: unknown;
    slug: string;
    title: string;
    status: string;
    seoTitle?: string;
    seoDescription?: string;
    content?: string;
    excerpt?: string;
  }[];

  console.log(`Loaded ${raw.length} total blog posts from database.`);

  const targets = raw.filter(isTemplateFallbackPost);
  console.log(`Identified ${targets.length} template fallback / corrupted posts.`);

  let updatedCount = 0;
  for (const post of targets) {
    const id = toHexId(post._id);
    const cleanTitle = buildFallbackMetaTitle(post.title);
    const cleanDesc = buildFallbackMetaDescription(
      post.excerpt || post.seoDescription || post.title,
      155,
    );

    console.log(`\nPost: ${post.slug} (${id})`);
    console.log(`  Current Status: ${post.status} -> Target: DRAFT`);
    console.log(`  Current seoTitle: "${post.seoTitle}" -> Target: "${cleanTitle}"`);
    console.log(`  Current seoDesc:  "${post.seoDescription}" -> Target: "${cleanDesc}"`);

    if (!DRY_RUN) {
      await prisma.$runCommandRaw({
        update: 'blog_posts',
        updates: [
          {
            q: { _id: { $oid: id } },
            u: {
              $set: {
                status: 'DRAFT',
                seoTitle: cleanTitle,
                seoDescription: cleanDesc,
                updatedAt: new Date(),
              },
            },
          },
        ],
      });
      updatedCount++;
    }
  }

  console.log('\n================ SUMMARY ================');
  console.log(
    DRY_RUN
      ? `Dry run complete. ${targets.length} posts would be updated to DRAFT with repaired metadata.`
      : `Successfully repaired and demoted ${updatedCount} posts to DRAFT in MongoDB.`,
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
