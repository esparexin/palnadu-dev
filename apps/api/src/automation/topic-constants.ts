import type { SearchIntent } from './seo-strategy';

/** Intent ordered by commercial proximity — used for topic diversification. */
export const INTENT_ORDER: SearchIntent[] = [
  'INFORMATIONAL',
  'FAQ',
  'HOW_TO',
  'LOCAL',
  'PROBLEM_SOLING',
  'COMMERCIAL_INVESTIGATION',
  'COMPARISON',
  'PRODUCT_SERVICE_RESEARCH',
];

// Filler that carries no topical meaning. Stripped before keying so that
// "The Ultimate Guide to X" and "A Complete Guide About X" collapse together.
export const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'of', 'to', 'in', 'on',
  'at', 'by', 'for', 'with', 'about', 'into', 'from', 'up', 'down', 'out', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'doing',
  'guide', 'ultimate', 'complete', 'comprehensive', 'best', 'top', 'everything', 'need',
  'know', 'tips', 'tricks', 'ways', 'things', 'actually', 'really', 'simply', 'easily',
  'step', 'steps', 'guide', 'introducing', 'understanding', 'explained', 'overview',
  'what', 'why', 'when', 'which', 'does', 'is', 'are',
  'much', 'many', 'long', 'average', 'typical', 'usual', 'exactly', 'really',
]);

/**
 * Semantic normalisation applied before keying.
 */
export const SYNONYMS: Record<string, string> = {
  // money
  cost: 'cost', costs: 'cost', pricing: 'cost', price: 'cost', prices: 'cost',
  charges: 'cost', rates: 'cost', fee: 'cost', fees: 'cost', budget: 'cost',
  estimate: 'cost', quotes: 'cost', quote: 'cost', expensive: 'cost',
  cheap: 'cost', affordable: 'cost', budgeting: 'cost',
  // provider
  company: 'company', companies: 'company', agency: 'company', agencies: 'company',
  provider: 'company', providers: 'company', firm: 'company', vendor: 'company',
  developer: 'company', developers: 'company', freelancer: 'company',
  // building
  build: 'build', building: 'build', develop: 'build', developing: 'build',
  create: 'build', creating: 'build', make: 'build',
  // buying / acquiring
  buy: 'buy', purchase: 'buy', buying: 'buy', acquire: 'buy',
  // time
  time: 'time', timeline: 'time', duration: 'time', long: 'time',
  // amount of work
  team: 'team', people: 'team', staff: 'team',
  // systems
  system: 'system', systems: 'system', platform: 'system', software: 'system',
  tool: 'system', solution: 'system', solutions: 'system', app: 'system',
  applications: 'system', portal: 'system',
  // modernizing & transformation
  modernize: 'modernize', modernizes: 'modernize', modernizing: 'modernize', modernization: 'modernize',
  automate: 'automation', automates: 'automation', automating: 'automation',
  transform: 'transform', transforms: 'transform', transforming: 'transform', transformation: 'transform',
  optimize: 'optimize', optimizes: 'optimize', optimizing: 'optimize', optimization: 'optimize',
  manage: 'management', manages: 'management', managing: 'management',
  deliver: 'delivery', delivers: 'delivery', delivering: 'delivery',
  track: 'tracking', tracks: 'tracking', tracking: 'tracking',
  grow: 'growing', grows: 'growing', growing: 'growing',
  // store
  store: 'ecommerce', shop: 'ecommerce', online: 'ecommerce',
};

/**
 * Service/entity head terms.
 */
export const SERVICE_HINTS = [
  'startup website development', 'startup web application development',
  'startup software development', 'startup technology solutions',
  'startup mvp development', 'startup application development',
  'startup development', 'startup support', 'new startup support',
  'new business website', 'business website development',
  'entrepreneur digital solutions', 'business launch support',
  'digital solutions for new businesses', 'small business technology solutions',
  'website development', 'web development', 'web design', 'app development',
  'android app development', 'ios app development', 'mobile app development',
  'ecommerce', 'e commerce', 'erp', 'crm', 'pos software', 'billing software',
  'school management software', 'admission portal', 'fee portal', 'clinic management',
  'hospital management', 'inventory software', 'accounting software', 'payroll software',
  'digital marketing', 'local seo', 'seo', 'cloud software', 'saas', 'custom software',
  'progressive web app', 'pwa', 'automation', 'gate pass software', 'weighbridge software',
  'cold storage software', 'loan accounting software', 'property portal',
  'new business', 'startup', 'entrepreneur',
];

/**
 * Words that describe the SERVICE rather than the distinguishing question.
 */
export const SERVICE_WORDS = new Set([
  'website', 'web', 'development', 'developing', 'design', 'app', 'android', 'ios',
  'mobile', 'software', 'system', 'systems', 'platform', 'tool', 'solution',
  'solutions', 'portal', 'management', 'erp', 'crm', 'saas', 'pwa', 'automation',
  'store', 'ecommerce', 'service', 'services', 'company', 'companies', 'agency',
  'startup', 'startups', 'entrepreneur', 'entrepreneurs',
]);

/** Stable FNV-1a hash, used only when no usable tokens could be derived. */
export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).slice(0, 10);
}
