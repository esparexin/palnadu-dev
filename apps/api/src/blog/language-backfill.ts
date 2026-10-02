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

/** Every row without a language is legacy English content: plan it for `en`. */
export function planLanguageBackfill(posts: BackfillRow[], topics: BackfillRow[]): BackfillPlan {
  return {
    postIds: missingLanguage(posts).map((p) => p.id),
    topicIds: missingLanguage(topics).map((t) => t.id),
  };
}
