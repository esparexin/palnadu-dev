/**
 * Single source of truth for filtering discovered topic phrases so irrelevant
 * consumer news, piracy/navigational noise, and off-strategy trends do not
 * enter the blog automation queue.
 */

const DISALLOWED_TOPIC_PATTERNS: readonly RegExp[] = [
  /\b(apk|mod apk|crack|cracked|keygen|torrent|pirated|free download|ringtone|wallpaper|status video)\b/i,
  /\b(ipl|cricket|match score|live score|dream11|movie|trailer|box office|song|lyrics|actor|actress|serial|horoscope|rashifal|lottery|weather|earthquake)\b/i,
  /\b(share price|stock price|stock market|ipo|nifty|sensex|dividend|exam date|admit card|hall ticket|answer key|syllabus|cut off)\b/i,
  /\b(login|sign in|customer care|toll free|helpline|complaint number|wikipedia|youtube)\b/i,
];

const TREND_NOISE_PATTERNS: readonly RegExp[] = [
  /\b(unboxing|rumor|rumour|leak|leaked|holiday|holidays|arrest|arrested|accident|death|deaths|scam|outage|down today|recharge|tariff|festival|giveaway)\b/i,
  /\b(price in india|launch date|release date)\b/i,
];

const STRONG_SERVICE_PHRASE_RE =
  /\b(website development|web development|web design|app development|mobile app development|software development|custom software|billing software|pos software|erp software|crm software|school management software|clinic management|hospital management|inventory software|accounting software|ecommerce website|local seo|seo services|digital marketing|mvp development|business automation|web application|progressive web app|payment gateway|gst billing)\b/i;

const TECH_OR_DIGITAL_SIGNAL_RE =
  /\b(software|website|websites|web app|app|apps|seo|digital|cloud|automation|ecommerce|e-commerce|erp|crm|pos|saas|portal|platform|ai|chatbot|api)\b/i;

const BUSINESS_OR_REGION_CONTEXT_RE =
  /\b(business|businesses|small business|startup|startups|msme|sme|enterprise|company|companies|retail|wholesale|shop|shops|store|stores|school|schools|college|clinic|hospital|pharmacy|merchant|traders|restaurant|logistics|warehouse|local|andhra|palnadu|guntur|vijayawada|narasaraopet|tenali|mangalagiri|chilakaluripet|sattenapalli|macherla|vinukonda)\b/i;

/**
 * Validates that a candidate search phrase is a multi-word, non-junk topic
 * suitable for blog discovery across all reference sources.
 */
export function isViableTopicPhrase(phrase: string): boolean {
  const cleaned = phrase.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 6 || cleaned.length > 120) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;

  if (!/[a-zA-Z]{2,}|[\u0C05-\u0C39]/.test(cleaned)) return false;

  return !DISALLOWED_TOPIC_PATTERNS.some((re) => re.test(cleaned));
}

/**
 * Strict relevance filter for national Google Trends RSS items: requires
 * word-boundary matches on engineering/business intent rather than substrings
 * (preventing "air"/"train"/"mumbai" matching "ai" or "whatsapp" matching "app").
 */
export function isBusinessRelevantTrend(phrase: string): boolean {
  if (!isViableTopicPhrase(phrase)) return false;
  if (TREND_NOISE_PATTERNS.some((re) => re.test(phrase))) return false;

  if (STRONG_SERVICE_PHRASE_RE.test(phrase)) return true;

  return (
    TECH_OR_DIGITAL_SIGNAL_RE.test(phrase) &&
    BUSINESS_OR_REGION_CONTEXT_RE.test(phrase)
  );
}

function decodeBasicXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/** Extracts `<title>` entries scoped to RSS `<item>` blocks. */
export function extractTrendTitlesFromRss(xml: string): string[] {
  const itemMatches = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];
  const rawTitles: string[] = [];

  if (itemMatches.length > 0) {
    for (const itemMatch of itemMatches) {
      const titleMatch = itemMatch[1]?.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      if (titleMatch?.[1]) rawTitles.push(titleMatch[1]);
    }
  } else {
    const allTitles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi)]
      .map((m) => m[1])
      .filter((t): t is string => !!t);
    rawTitles.push(...allTitles.slice(1));
  }

  return rawTitles
    .map((t) => decodeBasicXmlEntities(t).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
