/**
 * Script detection and transliteration.
 *
 * Framework-free so it can be unit tested directly.
 *
 * Why this exists: the original normalizer stripped anything outside
 * `[a-z0-9]`, which erased Telugu entirely. Every Telugu topic produced an
 * empty topicKey and an empty slug, so Telugu posts could not be identified,
 * deduplicated, or published.
 */

/** Languages the automation can publish in. */
export type ContentLanguage = 'en' | 'te';

export type ScriptKind = 'latin' | 'telugu' | 'mixed' | 'unknown';

// Telugu code points are written as escapes so this file stays valid ASCII
// source regardless of the editor/encoding it is saved with.
const TELUGU_RANGE = /[ఀ-౿]/;
// Latin letters, including accented forms used in transliterated text.
const LATIN_RANGE = /[A-Za-zÀ-ɏ]/;

// Individual marks referenced by name, to keep the tables readable and to avoid
// embedding raw combining characters in source.
const TELUGU_VIRAMA = '్';
const TELUGU_SIGN_AA = 'ా';
const TELUGU_SIGN_I = 'ి';
const TELUGU_SIGN_II = 'ీ';
const TELUGU_SIGN_U = 'ు';
const TELUGU_SIGN_UU = 'ూ';
const TELUGU_SIGN_R = 'ృ';
const TELUGU_SIGN_E = 'ె';
const TELUGU_SIGN_AI = 'ై';
const TELUGU_SIGN_O = 'ొ';
const TELUGU_SIGN_OO = 'ో';
const TELUGU_SIGN_AU = 'ౌ';
const TELUGU_KSHA = 'క్ష';
const TELUGU_TTA = 'త్త';
const TELUGU_DDA = 'ద్ద';
const TELUGU_NNA = 'న్న';
const TELUGU_LLA = 'ల్ల';

/**
 * Detect the dominant script of a phrase.
 *
 * A mixed phrase is reported as `mixed` when both scripts are present, because
 * that is common in Indian business writing ("Website డెవలప్మెంట్") and the
 * caller needs to normalise both halves rather than guess one.
 */
export function detectScript(text: string): ScriptKind {
  const hasTelugu = TELUGU_RANGE.test(text);
  const hasLatin = LATIN_RANGE.test(text);

  if (hasTelugu && hasLatin) return 'mixed';
  if (hasTelugu) return 'telugu';
  if (hasLatin) return 'latin';
  return 'unknown';
}

/** Resolve the publication language for a phrase. */
export function detectLanguage(text: string): ContentLanguage {
  // Count letters rather than testing presence, so one stray brand name in a
  // Telugu sentence does not flip the whole article to English.
  const telugu = (text.match(/[ఀ-౿]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;

  if (telugu > latin) return 'te';
  if (latin > 0) return 'en';
  return 'en';
}

// ── Telugu transliteration ─────────────────────────────────────────────────
//
// Telugu is an abugida: a consonant letter carries an inherent vowel unless it
// is followed by the virama (్), which turns it into a pure consonant for a
// conjunct. The table below maps the consonants and vowels that occur in the
// business/technology vocabulary this engine publishes about.
//
// Anything not in the table is dropped rather than guessed, so transliteration
// is deterministic: the same input always yields the same output.

/** Inherent vowels, i.e. the "a" sound a bare consonant carries. */
const INHERENT_VOWEL: Record<string, string> = {
  క: 'ka', ఖ: 'kha', గ: 'ga', ఘ: 'gha', ఙ: 'nga',
  చ: 'cha', ఛ: 'chha', జ: 'ja', ఝ: 'jha', ఞ: 'nya',
  ట: 'ta', ఠ: 'tha', డ: 'da', ఢ: 'dha', ణ: 'na',
  త: 'ta', థ: 'tha', ద: 'da', ధ: 'dha', న: 'na',
  ప: 'pa', ఫ: 'pha', బ: 'ba', భ: 'bha', మ: 'ma',
  య: 'ya', ర: 'ra', ల: 'la', వ: 'va', శ: 'sha',
  ష: 'sha', స: 'sa', హ: 'ha', ళ: 'la', క్ష: 'ksha',
  ఱ: 'ra',
};

/** Independent vowels. */
const VOWEL: Record<string, string> = {
  అ: 'a', ఆ: 'aa', ఇ: 'i', ఈ: 'ee', ఉ: 'u', ఊ: 'oo',
  ఋ: 'ri', ఎ: 'e', ఏ: 'ee', ఐ: 'ai', ఒ: 'o', ఓ: 'oo',
  ఔ: 'au', అం: 'am', అః: 'ah',
};

/**
 * Long/mark forms written after the base vowel.
 *
 * Telugu vowel signs are combining marks that render on the preceding
 * consonant, so they are indexed separately from the independent vowels above.
 */
const VOWEL_SIGN: Record<string, string> = {
  [TELUGU_SIGN_AA]: 'aa',
  [TELUGU_SIGN_I]: 'i',
  [TELUGU_SIGN_II]: 'ee',
  [TELUGU_SIGN_U]: 'u',
  [TELUGU_SIGN_UU]: 'oo',
  [TELUGU_SIGN_R]: 'ri',
  [TELUGU_SIGN_E]: 'e',
  [TELUGU_SIGN_AI]: 'ai',
  [TELUGU_SIGN_O]: 'o',
  [TELUGU_SIGN_OO]: 'oo',
  [TELUGU_SIGN_AU]: 'au',
  [TELUGU_VIRAMA]: '', // virama: suppresses the inherent vowel
};

/** Common conjuncts that need an explicit mapping. */
const CONJUNCT: Record<string, string> = {
  [TELUGU_KSHA]: 'ksha',
  [TELUGU_TTA]: 'tta',
  [TELUGU_DDA]: 'dda',
  [TELUGU_NNA]: 'nna',
  [TELUGU_LLA]: 'lla',
};

const DIGIT_TE: Record<string, string> = {
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
  '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
};

/**
 * Zero-width joiner (U+200C) and non-joiner (U+200D). Kept as escapes rather
 * than literals: they are invisible in source and ESLint correctly refuses to
 * allow raw joiners inside a character class.
 */
const JOINERS = /[\u200C\u200D]/g;

/**
 * Strip joiners and collapse whitespace. Real Telugu copy contains joiners
 * mid-word, so concept matching must ignore them entirely.
 */
export function removeJoiners(text: string): string {
  return text.replace(JOINERS, '').replace(/\s+/g, ' ').trim();
}

/** Byte-order mark and other zero-width formatting marks. */
const INVISIBLE = /[\uFEFF\u200B]/g;

/**
 * Transliterate Telugu text into ASCII.
 *
 * Telugu is an abugida: a consonant letter implicitly carries a vowel unless a
 * following sign changes it or a virama (U+0C4D) makes it bare. The routine
 * therefore works on *sequences*, not single characters:
 *
 *   consonant + virama + consonant  -> conjunct (look up the pair)
 *   consonant + vowel sign          -> the sign's sound, no inherent vowel
 *   consonant alone                -> consonant + inherent vowel
 *   independent vowel              -> its own sound
 *
 * Deterministic and total: unmapped characters are dropped rather than
 * approximated, so the same input always yields the same output and two runs
 * cannot disagree.
 */
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

    // Independent vowel: emits its own sound and consumes any trailing marks.
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
      // Conjunct: consonant + virama + consonant.
      if (chars[i + 1] === TELUGU_VIRAMA && chars[i + 2] !== undefined) {
        const pair = ch + TELUGU_VIRAMA + chars[i + 2];
        if (CONJUNCT[pair]) {
          out += CONJUNCT[pair];
          i += 2;
          continue;
        }
        // Unknown conjunct: emit the bare consonants, dropping the virama.
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

      // Bare consonant: virama immediately after.
      if (chars[i + 1] === TELUGU_VIRAMA) {
        out += INHERENT_VOWEL[ch].replace(/(?:a|aa)$/, '');
        i += 1;
        continue;
      }

      // Consonant with a vowel sign: the sign replaces the inherent vowel.
      const sign = chars[i + 1];
      if (sign !== undefined && VOWEL_SIGN[sign] !== undefined) {
        out += INHERENT_VOWEL[ch].replace(/(?:a|aa)$/, '') + VOWEL_SIGN[sign];
        i += 1;
        continue;
      }

      // Plain consonant: keep the inherent vowel.
      out += INHERENT_VOWEL[ch];
      continue;
    }

    // Stray combining mark with no consonant in front of it: drop it.
    if (VOWEL_SIGN[ch] !== undefined || ch === TELUGU_VIRAMA) continue;

    // Latin letters, digits and punctuation pass through so mixed phrases
    // ("Website డెవలప్మెంట్") keep their English half intact.
    if (/[A-Za-z0-9\s.,!?/&()'"]/.test(ch)) {
      out += ch;
      continue;
    }

    // Unknown Telugu symbol: drop it rather than guessing.
  }

  return out
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/-+/g, '-');
}

/**
 * Convert any script to ASCII suitable for a URL slug.
 *
 * Guarantees a non-empty result. When transliteration yields nothing usable
 * (e.g. an unsupported script), a deterministic hash of the original input is
 * returned so a slug is always produced and remains stable across runs.
 */
export function toAsciiSlug(input: string): string {
  const script = detectScript(input);
  const ascii =
    script === 'telugu' || script === 'mixed' ? teluguToAscii(input) : input;

  const slug = ascii
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

  if (slug.length >= 2) return slug;

  // Deterministic fallback: never hand validation an empty slug.
  return `topic-${stableHash(input)}`;
}

/** Small, dependency-free FNV-1a hash. Stable across runs and processes. */
export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).slice(0, 10);
}
// ── Concept lexicon: language-neutral subject extraction ───────────────────

/**
 * A concept maps every surface form of one business subject to a single
 * language-neutral id.
 *
 * This is what makes cross-language identity possible WITHOUT comparing
 * transliterated strings. Two articles in different languages that name the
 * same subject with their own wording both resolve to `subject:web-dev`, so the
 * canonical key can be built from concept ids rather than from words.
 *
 * `te` forms are stored in Telugu script; they are matched directly, not
 * transliterated, because the goal is recognition rather than readability.
 */
export interface ConceptEntry {
  id: string;
  en: string[];
  te: string[];
}

/**
 * Kept deliberately small and domain-specific. A general-purpose multilingual
 * thesaurus would risk collapsing unrelated topics; an explicit list makes every
 * collision auditable.
 */
export const CONCEPT_LEXICON: ConceptEntry[] = [
  { id: 'subject:web-dev', en: ['website', 'websites', 'web development', 'web design', 'web app'], te: ['వెబ్ సైట్', 'వెబ్‌సైట్', 'వెబ్ డెవలప్మెంట్', 'వెబ్ డిజైన్'] },
  { id: 'subject:mobile-app', en: ['mobile app', 'android app', 'ios app', 'app development', 'application'], te: ['మొబైల్ యాప్', 'యాప్ డెవలప్మెంట్', 'ఆండ్రాయిడ్ యాప్', 'ఆప్'] },
  { id: 'subject:ecommerce', en: ['ecommerce', 'e commerce', 'online store', 'shopping website'], te: ['ఇ-కామర్స్', 'ఆన్‌లైన్ స్టోర్', 'ఆన్‌లైన్ దుకాణం'] },
  { id: 'subject:erp', en: ['erp', 'inventory software', 'billing software', 'pos software', 'accounting software'], te: ['ఇఆర్‌పి', 'ఇన్వెంటరీ సాఫ్ట్‌వేర్', 'బిల్లింగ్ సాఫ్ట్‌వేర్', 'పి ఓ ఎస్ సాఫ్ట్‌వేర్'] },
  { id: 'subject:school-mgmt', en: ['school management', 'admission portal', 'fee portal', 'student management'], te: ['స్కూల్ మేనేజ్‌మెంట్', 'స్కూల్ సాఫ్ట్‌వేర్', 'అడ్మిషన్ పోర్టల్', 'ఫీ పోర్టల్'] },
  { id: 'subject:healthcare', en: ['hospital management', 'clinic management', 'diagnostic', 'patient appointment'], te: ['హాస్పిటల్ మేనేజ్‌మెంట్', 'క్లినిక్ మేనేజ్‌మెంట్', 'పేషెంట్ అపాయింట్‌మెంట్'] },
  { id: 'subject:seo', en: ['seo', 'local seo', 'google maps seo', 'search engine optimisation', 'search engine optimization'], te: ['ఎస్‌ఇ‌ఓ', 'లోకల్ ఎస్‌ఇ‌ఓ', 'సెర్చ్ ఇంజిన్ ఆప్టిమైజేషన్'] },
  { id: 'subject:digital-marketing', en: ['digital marketing', 'google ads', 'social media marketing', 'ppc'], te: ['డిజిటల్ మార్కెటింగ్', 'గూగుల్ యాడ్స్', 'సోషల్ మీడియా మార్కెటింగ్'] },
  { id: 'subject:saas', en: ['saas', 'mvp', 'minimum viable product', 'startup'], te: ['సాస్', 'ఎమ్‌వీ‌పీ', 'మినిమమ్ వయిబుల్ ప్రొడక్ట్', 'స్టార్టప్'] },
  { id: 'aspect:cost', en: ['cost', 'costs', 'price', 'pricing', 'rates', 'fees', 'charges', 'budget', 'quote'], te: ['ఖర్చు', 'ఖర్చులు', 'ధర', 'ధరలు', 'రేట్లు', 'ఫీలు', 'బడ్జెట్'] },
  { id: 'aspect:time', en: ['time', 'timeline', 'duration', 'how long', 'days', 'weeks'], te: ['సమయం', 'వ్యవధి', 'ఎంత సమయం'] },
  { id: 'aspect:howto', en: ['how to', 'how do', 'steps', 'guide', 'process'], te: ['ఎలా', 'ఎట్టి', 'క్రమం', 'గైడ్', 'ప్రాసెస్'] },
  { id: 'aspect:comparison', en: ['vs', 'versus', 'compare', 'comparison', 'difference', 'better'], te: ['వర్సెస్', 'తేడా', 'పోలిక', 'అంతరం'] },
  { id: 'aspect:best', en: ['best', 'top', 'review', 'recommended'], te: ['ఉత్తమ', 'అత్యుత్తమ', 'సిఫారసు'] },
];

/** Locations, recognised in both languages. */
export const LOCATION_CONCEPTS: Record<ContentLanguage, Record<string, string>> = {
  en: {
    guntur: 'guntur', palnadu: 'palnadu', narasaraopet: 'narasaraopet',
    chilakaluripet: 'chilakaluripet', vinukonda: 'vinukonda', sattenapalli: 'sattenapalle',
    sattenapalle: 'sattenapalle', macherla: 'macherla', piduguralla: 'piduguralla',
    tenali: 'tenali', mangalagiri: 'mangalagiri', bapatla: 'bapatla',
    amaravati: 'amaravati', vijayawada: 'vijayawada', rajahmundry: 'rajahmundry',
    kakinada: 'kakinada', andhra: 'andhra-pradesh', telangana: 'telangana', india: 'india',
  },
  te: {
    'గుంటూర్': 'guntur', 'గుంటూరు': 'guntur',
    'పాలనాడు': 'palnadu',
    'నరసాపురం': 'narasaraopet', 'నరసారావుపేట': 'narasaraopet', 'నరసరావుపేట': 'narasaraopet',
    'చిలకాలురిపేట': 'chilakaluripet',
    'వినుకొండ': 'vinukonda',
    'సత్తెనపల్లి': 'sattenapalle',
    'మచిర్ల': 'macherla', 'మాచేర్ల': 'macherla',
    'పిడుగురాళ్ల': 'piduguralla', 'పిడుగురాల్ల': 'piduguralla',
    'తెనాలి': 'tenali',
    'మంగళగిరి': 'mangalagiri',
    'బాపట్ల': 'bapatla',
    'అమరావతి': 'amaravati',
    'విజయవాడ': 'vijayawada',
    'రాజమంహేరి': 'rajahmundry',
    'కాకినాడ': 'kakinada',
    'ఆంధ్రప్రదేశ్': 'andhra-pradesh', 'ఆంధ్ర': 'andhra-pradesh',
    'తెలంగాణ': 'telangana',
    'భారత': 'india',
  },
};

/** Telugu question/intent markers. */
const TELUGU_INTENT_PATTERNS: { intent: ContentIntent; patterns: RegExp[] }[] = [
  // Latin "vs" is check FIRST: Indian business writing uses "vs" inside Telugu
  // sentences, and the Telugu markers for comparison may be absent entirely.
  { intent: 'COMPARISON', patterns: [/\bvs\.?\b/i, /\bversus\b/i, /వర్సెస్/, /తేడా/, /పోలిక/, /ఏది మంచి/, /ఏది ఉత్తమ/] },
  { intent: 'HOW_TO', patterns: [/ఎలా/, /ఎట్టి/, /క్రమం/, /గైడ్/, /పద్ధతి/] },
  { intent: 'COMMERCIAL_INVESTIGATION', patterns: [/ఖర్చు/, /ధర/, /రేటు/, /ఫీ/, /బడ్జెట్/, /ఉత్తమ/] },
  // Locative case (X-లో = "in X") is the most common Telugu location
  // construction, mirroring English "in <place>". Checked after COMMERCIAL so
  // a cost question about a place stays commercial, exactly like English.
  { intent: 'LOCAL', patterns: [/ఇక్కడ/, /ఇక్కడి/, /దగ్గర/, /అందుకు/, /నా ప్రాంతంలో/, /లో/] },
  { intent: 'PROBLEM_SOLING', patterns: [/సమస్య/, /పరిష్కార/, /ఎందుకు పనిచేయడం లేదు/, /ఖరాప్/] },
  { intent: 'FAQ', patterns: [/ఏమిటి/, /ఏమిటి/, /అర్థం/, /ఎందుకు/] },
];

export type ContentIntent =
  | 'INFORMATIONAL'
  | 'HOW_TO'
  | 'COMMERCIAL_INVESTIGATION'
  | 'COMPARISON'
  | 'LOCAL'
  | 'PROBLEM_SOLING'
  | 'PRODUCT_SERVICE_RESEARCH'
  | 'FAQ';

/** Concepts recognised in a phrase, as language-neutral ids. */
export function extractConcepts(text: string): string[] {
  const lower = text.toLowerCase();
  // Hyphens are orthographic noise ("e-commerce" vs "ecommerce" vs
  // "e commerce"): match against both the raw and the de-hyphenated text so a
  // hyphenated surface form can never miss its concept. (Found because legacy
  // "e-commerce portals" titles produced literal-soup keys.)
  const dehyphenated = lower.replace(/-/g, ' ');
  const found = new Set<string>();

  for (const entry of CONCEPT_LEXICON) {
    for (const form of entry.en) {
      const f = form.toLowerCase();
      if (lower.includes(f) || dehyphenated.includes(f)) {
        found.add(entry.id);
        break;
      }
    }
    if (found.has(entry.id)) continue;

    // Telugu forms are compared with whitespace AND joiners removed. Real copy
    // uses ZWNJ inside compound words ("మేనేజ్‌మెంట్" -> "మేనేజ్మెంట్"), so a
    // joiner-sensitive match silently fails on otherwise identical text.
    const compact = removeJoiners(text);
    for (const form of entry.te) {
      if (compact.includes(removeJoiners(form))) {
        found.add(entry.id);
        break;
      }
    }
  }

  return [...found].sort();
}

/** Detected location, matched across both languages. */
export function extractLocation(text: string, lang: ContentLanguage): string | null {
  const lower = text.toLowerCase();
  const table = LOCATION_CONCEPTS[lang];

  for (const [surface, canonical] of Object.entries(table)) {
    if (lower.includes(surface.toLowerCase())) return canonical;
  }

  // A Telugu phrase may still name an English location, and vice versa.
  const other = LOCATION_CONCEPTS[lang === 'te' ? 'en' : 'te'];
  const compact = removeJoiners(text);
  for (const [surface, canonical] of Object.entries(other)) {
    if (lower.includes(surface.toLowerCase()) || compact.includes(removeJoiners(surface))) {
      return canonical;
    }
  }
  return null;
}

/** Language-aware intent detection. Telugu is classified, not defaulted. */
export function detectIntentMultilingual(text: string, lang: ContentLanguage): ContentIntent {
  const lower = text.toLowerCase();

  if (lang === 'te') {
    for (const { intent, patterns } of TELUGU_INTENT_PATTERNS) {
      if (patterns.some((p) => p.test(text))) return intent;
    }
    return 'INFORMATIONAL';
  }

  const english: { intent: ContentIntent; patterns: RegExp[] }[] = [
    { intent: 'COMPARISON', patterns: [/\bvs\.?\b/, /\bversus\b/, /\bcompare\b/, /\bcomparison\b/, /which is better/, /difference between/, /\balternative/] },
    { intent: 'HOW_TO', patterns: [/\bhow to\b/, /\bhow do\b/, /\bhow can\b/, /\bsteps?\b/, /\bguide to\b/, /\btutorial\b/] },
    { intent: 'COMMERCIAL_INVESTIGATION', patterns: [/\bbest\b/, /\btop \d+\b/, /\breview/, /\bpricing\b/, /\bprice\b/, /\bcost/, /\bfees?\b/, /\bcharges?\b/, /\baffordable\b/, /\bquotes?\b/, /\bbudget\b/, /\brates?\b/] },
    { intent: 'LOCAL', patterns: [/\bnear me\b/, /\bin [a-z]+$/, /\blocal\b/] },
    { intent: 'PROBLEM_SOLING', patterns: [/\bfix\b/, /\bsolve/, /troubleshoot/, /\bproblem/, /\berror/, /\bbroken\b/, /not working/] },
    { intent: 'FAQ', patterns: [/\bfaq\b/, /\bquestions?\b/, /\bq&a\b/, /\bmeaning of\b/, /\bwhat is\b/, /\bwhat are\b/, /\bwhy do\b/, /\bwhy does\b/] },
    { intent: 'PRODUCT_SERVICE_RESEARCH', patterns: [/\bsoftware\b/, /\bplatform\b/, /\bapp\b/, /\bsystem\b/, /\btool\b/, /\bsolution\b/, /\bagency\b/] },
  ];

  for (const { intent, patterns } of english) {
    if (patterns.some((p) => p.test(lower))) return intent;
  }
  return 'INFORMATIONAL';
}

/**
 * Fold a transliterated residual token to a language-neutral concept id.
 *
 * The canonical key must not depend on literal words, because Telugu and
 * English never share vocabulary. Anything the curated lexicon recognises is
 * replaced by its concept id; anything it does not recognise is reported as
 * null so the caller can decide whether to keep it.
 *
 * Returns null when the token carries no recognisable meaning, which is how
 * transliteration noise such as postpositions (guntoorloo = "in Guntur") is
 * excluded from the key instead of fragmenting it.
 */
export function foldTokenToConcept(token: string): string | null {
  const t = token.toLowerCase();
  for (const entry of CONCEPT_LEXICON) {
    if (entry.en.includes(t)) return entry.id;
    // Transliterated Telugu forms are compared after normalisation, since the
    // Latin output of teluguToAscii is what reaches this function.
    const teAscii = entry.te.map((f) => teluguToAscii(f).toLowerCase());
    if (teAscii.includes(t)) return entry.id;
  }
  return null;
}

/**
 * Telugu case endings and postpositions that survive transliteration but carry
 * no topical meaning. Leaving them in the key is what made two languages
 * produce different identities for the same subject.
 */
const MEANINGLESS_SUFFIXES = [
  'loo', 'loo', 'ram', 'andu', 'andu', 'ni', 'nu', 'lo', 'la',
  'a', 'i', 'u', 'e', 'o', 'na', 'va', 'm', 'y',
];

export function isMeaninglessToken(token: string): boolean {
  const t = token.toLowerCase();
  if (t.length <= 1) return true;
  return MEANINGLESS_SUFFIXES.some((s) => t === s || t.endsWith(s) && t.length - s.length <= 3);
}
