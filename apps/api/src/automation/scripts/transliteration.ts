import {
  TELUGU_VIRAMA,
  INHERENT_VOWEL,
  VOWEL,
  VOWEL_SIGN,
  CONJUNCT,
  DIGIT_TE,
} from './telugu-tables';

export type ContentLanguage = 'en' | 'te';
export type ScriptKind = 'latin' | 'telugu' | 'mixed' | 'unknown';

const TELUGU_RANGE = /[ఀ-౿]/;
const LATIN_RANGE = /[A-Za-zÀ-ɏ]/;
const JOINERS = /[\u200C\u200D]/g;
const INVISIBLE = /[\uFEFF\u200B]/g;

export function detectScript(text: string): ScriptKind {
  const hasTelugu = TELUGU_RANGE.test(text);
  const hasLatin = LATIN_RANGE.test(text);

  if (hasTelugu && hasLatin) return 'mixed';
  if (hasTelugu) return 'telugu';
  if (hasLatin) return 'latin';
  return 'unknown';
}

export function teluguScriptRatio(text: string): number {
  const telugu = (text.match(/[ఀ-౿]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const total = telugu + latin;
  return total === 0 ? 0 : telugu / total;
}

export function detectLanguage(text: string): ContentLanguage {
  const telugu = (text.match(/[ఀ-౿]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;

  if (telugu > latin) return 'te';
  if (latin > 0) return 'en';
  return 'en';
}

export function removeJoiners(text: string): string {
  return text.replace(JOINERS, '').replace(/\s+/g, ' ').trim();
}

export function teluguToAscii(input: string): string {
  if (!input) return '';

  const chars = [...input.replace(JOINERS, '').replace(INVISIBLE, '')];
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (DIGIT_TE[ch]) {
      out += DIGIT_TE[ch];
      continue;
    }

    if (VOWEL[ch]) {
      out += VOWEL[ch];
      while (i + 1 < chars.length && VOWEL_SIGN[chars[i + 1]] !== undefined && chars[i + 1] !== TELUGU_VIRAMA) {
        out += VOWEL_SIGN[chars[i + 1]];
        i++;
      }
      continue;
    }

    const isConsonant = INHERENT_VOWEL[ch] !== undefined;

    if (isConsonant) {
      if (chars[i + 1] === TELUGU_VIRAMA && chars[i + 2] !== undefined) {
        const pair = ch + TELUGU_VIRAMA + chars[i + 2];
        if (CONJUNCT[pair]) {
          out += CONJUNCT[pair];
          i += 2;
          continue;
        }
        out += INHERENT_VOWEL[ch].replace(/(?:a|aa)$/, '');
        i += 1;
        while (i + 1 < chars.length && CONJUNCT[chars[i] + TELUGU_VIRAMA + chars[i + 1]]) {
          out += CONJUNCT[chars[i] + TELUGU_VIRAMA + chars[i + 1]];
          i += 2;
        }
        if (INHERENT_VOWEL[chars[i]] !== undefined) {
          out += INHERENT_VOWEL[chars[i]].replace(/(?:a|aa)$/, '');
        }
        continue;
      }

      if (chars[i + 1] === TELUGU_VIRAMA) {
        out += INHERENT_VOWEL[ch].replace(/(?:a|aa)$/, '');
        i += 1;
        continue;
      }

      const sign = chars[i + 1];
      if (sign !== undefined && VOWEL_SIGN[sign] !== undefined) {
        out += INHERENT_VOWEL[ch].replace(/(?:a|aa)$/, '') + VOWEL_SIGN[sign];
        i += 1;
        continue;
      }

      out += INHERENT_VOWEL[ch];
      continue;
    }

    if (VOWEL_SIGN[ch] !== undefined || ch === TELUGU_VIRAMA) continue;

    if (/[A-Za-z0-9\s.,!?/&()'"]/.test(ch)) {
      out += ch;
      continue;
    }
  }

  return out.replace(/\s+/g, ' ').trim().replace(/-+/g, '-');
}

export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).slice(0, 10);
}

export function toAsciiSlug(input: string): string {
  const script = detectScript(input);
  const ascii = script === 'telugu' || script === 'mixed' ? teluguToAscii(input) : input;

  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
    .slice(0, 90);

  if (slug.length >= 2) return slug;

  return `topic-${stableHash(input)}`;
}
