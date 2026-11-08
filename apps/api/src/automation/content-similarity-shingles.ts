const DOMAIN_NOISE = new Set([
  'business', 'businesses', 'software', 'system', 'systems', 'solution', 'solutions',
  'company', 'companies', 'service', 'services', 'development', 'website', 'app',
  'apps', 'gunter', 'guntur', 'palnadu', 'andhra', 'pradesh', 'india', 'modern',
  'growing', 'enterprise', 'enterprises', 'team', 'work', 'time', 'need', 'help',
  'best', 'good', 'use', 'using', 'used', 'make', 'makes', 'made', 'get', 'gets',
]);

export function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !DOMAIN_NOISE.has(w)),
  );
}

/** Jaccard similarity of two word sets. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/** Word-level shingle (3-gram) Jaccard over normalised text. */
export function shingleSimilarity(a: string, b: string, shingleSize = 3): number {
  const shingles = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + shingleSize <= words.length; i++) {
      out.add(words.slice(i, i + shingleSize).join(' '));
    }
    return out;
  };
  return jaccard(shingles(a), shingles(b));
}
