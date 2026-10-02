/**
 * Pure planning for the language backfill migration.
 *
 * Framework-free: which rows need `language: 'en'` is decided here so the
 * migration is covered by the regression suite against fake rows instead of a
 * live database. `prisma/backfill-language.ts` only executes the plan.
 */

export interface BackfillRow {
  id: string;
  language?: unknown;
}

export interface BackfillPlan {
  postIds: string[];
  topicIds: string[];
}

/** Rows missing `language`, decided client-side: MongoDB has nothing to match on. */
export function missingLanguage<T extends BackfillRow>(rows: T[]): T[] {
  return rows.filter((r) => r.language === undefined || r.language === null);
}

/**
 * Extract a usable id from a raw document key. `$runCommandRaw` returns
 * Extended JSON (`{ $oid: '...' }`); passing that object through `String()`
 * yields "[object Object]", which Prisma rejects as a malformed ObjectID.
 * Exported so the migration's id handling is covered by tests, not just code
 * review — this exact bug failed the first production backfill run.
 */
export function toHexId(id: unknown): string {
  if (typeof id === 'string') return id;
  if (id && typeof (id as { $oid?: unknown }).$oid === 'string') {
    return (id as { $oid: string }).$oid;
  }
  throw new Error(`Unrecognized _id shape: ${JSON.stringify(id).slice(0, 80)}`);
}

/** Every row without a language is legacy English content: plan it for `en`. */
export function planLanguageBackfill(posts: BackfillRow[], topics: BackfillRow[]): BackfillPlan {
  return {
    postIds: missingLanguage(posts).map((p) => p.id),
    topicIds: missingLanguage(topics).map((t) => t.id),
  };
}
