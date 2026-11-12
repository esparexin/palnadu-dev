import { MARKETING_OPT_OUT_KEYWORDS } from './whatsapp.constants';

const OPT_OUT_KEYWORDS_SET = new Set<string>(
  MARKETING_OPT_OUT_KEYWORDS.map((k) => k.toLowerCase()),
);

const EDGE_PUNCTUATION = new Set('.,!?;:"\'()[]{}<>…–—-');

/**
 * Strips leading and trailing punctuation in linear O(n) time without regex backtracking.
 */
function stripEdgePunctuation(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && EDGE_PUNCTUATION.has(value.charAt(start))) {
    start += 1;
  }
  while (end > start && EDGE_PUNCTUATION.has(value.charAt(end - 1))) {
    end -= 1;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}

export function isOptOutKeywordText(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return false;

  const normalizedFull = stripEdgePunctuation(trimmed);
  if (normalizedFull && OPT_OUT_KEYWORDS_SET.has(normalizedFull)) {
    return true;
  }

  const tokens = trimmed.split(/\s+/);
  const firstToken = stripEdgePunctuation(tokens[0] || '');
  if (firstToken && OPT_OUT_KEYWORDS_SET.has(firstToken)) {
    return true;
  }

  if (tokens.length >= 2) {
    const combinedFirstTwo = `${stripEdgePunctuation(tokens[0] || '')}${stripEdgePunctuation(tokens[1] || '')}`;
    if (combinedFirstTwo === 'optout') {
      return true;
    }
  }
  return false;
}
