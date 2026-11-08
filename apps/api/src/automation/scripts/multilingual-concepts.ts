import { ContentLanguage, removeJoiners, teluguToAscii } from './transliteration';

export interface ConceptEntry {
  id: string;
  en: string[];
  te: string[];
}

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

export type ContentIntent =
  | 'INFORMATIONAL'
  | 'HOW_TO'
  | 'COMMERCIAL_INVESTIGATION'
  | 'COMPARISON'
  | 'LOCAL'
  | 'PROBLEM_SOLING'
  | 'PRODUCT_SERVICE_RESEARCH'
  | 'FAQ';

const TELUGU_INTENT_PATTERNS: { intent: ContentIntent; patterns: RegExp[] }[] = [
  { intent: 'COMPARISON', patterns: [/\bvs\.?\b/i, /\bversus\b/i, /వర్సెస్/, /తేడా/, /పోలిక/, /ఏది మంచి/, /ఏది ఉత్తమ/] },
  { intent: 'HOW_TO', patterns: [/ఎలా/, /ఎట్టి/, /క్రమం/, /గైడ్/, /పద్ధతి/] },
  { intent: 'COMMERCIAL_INVESTIGATION', patterns: [/ఖర్చు/, /ధర/, /రేటు/, /ఫీ/, /బడ్జెట్/, /ఉత్తమ/] },
  { intent: 'LOCAL', patterns: [/ఇక్కడ/, /ఇక్కడి/, /దగ్గర/, /అందుకు/, /నా ప్రాంతంలో/, /లో/] },
  { intent: 'PROBLEM_SOLING', patterns: [/సమస్య/, /పరిష్కార/, /ఎందుకు పనిచేయడం లేదు/, /ఖరాప్/] },
  { intent: 'FAQ', patterns: [/ఏమిటి/, /ఏమిటి/, /అర్థం/, /ఎందుకు/] },
];

export function extractConcepts(text: string): string[] {
  const lower = text.toLowerCase();
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

export function extractLocation(text: string, lang: ContentLanguage): string | null {
  const lower = text.toLowerCase();
  const table = LOCATION_CONCEPTS[lang];

  for (const [surface, canonical] of Object.entries(table)) {
    if (lower.includes(surface.toLowerCase())) return canonical;
  }

  const other = LOCATION_CONCEPTS[lang === 'te' ? 'en' : 'te'];
  const compact = removeJoiners(text);
  for (const [surface, canonical] of Object.entries(other)) {
    if (lower.includes(surface.toLowerCase()) || compact.includes(removeJoiners(surface))) {
      return canonical;
    }
  }
  return null;
}

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

export function foldTokenToConcept(token: string): string | null {
  const t = token.toLowerCase();
  for (const entry of CONCEPT_LEXICON) {
    if (entry.en.includes(t)) return entry.id;
    const teAscii = entry.te.map((f) => teluguToAscii(f).toLowerCase());
    if (teAscii.includes(t)) return entry.id;
  }
  return null;
}

const MEANINGLESS_SUFFIXES = [
  'loo', 'loo', 'ram', 'andu', 'andu', 'ni', 'nu', 'lo', 'la',
  'a', 'i', 'u', 'e', 'o', 'na', 'va', 'm', 'y',
];

export function isMeaninglessToken(token: string): boolean {
  const t = token.toLowerCase();
  if (t.length <= 1) return true;
  return MEANINGLESS_SUFFIXES.some((s) => t === s || t.endsWith(s) && t.length - s.length <= 3);
}
