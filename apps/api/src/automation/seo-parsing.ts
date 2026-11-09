export function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function arr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
}

export function objArr<T extends Record<string, string> = Record<string, string>>(
  v: unknown,
  keys: string[],
): T[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => Object.fromEntries(keys.map((k) => [k, str(x[k])])) as T)
    .filter((x) => keys.every((k) => ((x as Record<string, string>)[k] ?? '').length > 0));
}

/** Slugify defensively: the LLM sometimes returns spaces, underscores or mixed case. */
export function normaliseSlug(input: string): string {
  return str(input)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
    .slice(0, 90);
}

/** Recovers headings when the LLM omits the structured arrays. */
export function extractHeadings(markdown: string, level: 2 | 3): string[] {
  const re = new RegExp(`^#{${level}}\\s+(.+)$`, 'gm');
  return [...markdown.matchAll(re)].map((m) => (m[1] ?? '').trim()).filter(Boolean);
}

/**
 * Tolerant JSON extraction. Models frequently wrap JSON in a ```json fence or
 * prepend prose; a bare JSON.parse would throw and silently drop the whole
 * generation into the fallback path.
 */
export function parseLooseJson(raw: string): Record<string, unknown> {
  const text = raw.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // 2. Outer markdown code fence: ```json ... ``` or ``` ... ```
  const outerFence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (outerFence && outerFence[1]) {
    try {
      return JSON.parse(outerFence[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Outermost JSON object braces { ... }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // continue
    }
  }

  throw new Error('LLM response did not contain parseable JSON');
}
