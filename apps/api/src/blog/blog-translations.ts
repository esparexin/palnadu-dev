/**
 * Translation-group rules.
 *
 * A translation group answers "which localized versions belong together?" —
 * nothing more. It is deliberately separate from `topicKey`, which answers
 * "is this topic already represented?" A group must be assigned explicitly;
 * it is never inferred from matching topicKeys, because one English article
 * may legitimately sit beside several Telugu articles covering different
 * search intents.
 *
 * Framework-free so the rules can be unit tested without Nest or Prisma.
 * The database only carries `translationGroupId` plus an index; MongoDB
 * compound unique indexes reject multiple documents with a null key, which
 * would break every ungrouped post, so the one-post-per-language-per-group
 * invariant is enforced here, at the service boundary, instead.
 */

export type SupportedLanguage = 'en' | 'te';

/**
 * Narrow an unknown query/body value to a supported language.
 * Returns undefined for missing values; anything else that is not exactly
 * 'en' or 'te' is invalid. The service turns invalid into a 400; the pure
 * predicate stays here so it can be tested without Nest.
 */
export function parseLanguageValue(value: unknown): SupportedLanguage | undefined | { invalid: string } {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'en' || value === 'te') return value;
  return { invalid: String(value) };
}

export interface GroupMember {
  id: string;
  language: SupportedLanguage;
  slug: string;
}

/** A group groups posts by id; members carry at least id + language (+ slug for messages). */
export function validateTranslationGroup(
  members: Pick<GroupMember, 'id' | 'language'>[],
): { ok: true } | { ok: false; reason: string } {
  if (members.length === 0) {
    return { ok: false, reason: 'a translation group needs at least one post' };
  }
  const seen = new Map<SupportedLanguage, string>();
  for (const m of members) {
    const first = seen.get(m.language);
    if (first !== undefined && first !== m.id) {
      return {
        ok: false,
        reason: `language '${m.language}' is already represented in the group by post '${first}'`,
      };
    }
    seen.set(m.language, m.id);
  }
  return { ok: true };
}

/** True when adding this post to the group would keep the invariant intact. */
export function canJoinGroup(
  existing: Pick<GroupMember, 'id' | 'language'>[],
  candidate: Pick<GroupMember, 'id' | 'language'>,
): boolean {
  return validateTranslationGroup([...existing, candidate]).ok;
}

/** Filter a member list down to the languages actually present. */
export function groupLanguages(
  members: Pick<GroupMember, 'language'>[],
): SupportedLanguage[] {
  const out: SupportedLanguage[] = [];
  if (members.some((m) => m.language === 'en')) out.push('en');
  if (members.some((m) => m.language === 'te')) out.push('te');
  return out;
}
