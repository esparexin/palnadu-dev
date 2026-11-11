/**
 * Mandatory Internal Backlink Policy for Palnadu.dev Auto-Blogging.
 * Pure logic module for link extraction, validation, and contextual embedding.
 */

export const VALID_INTERNAL_DESTINATIONS = new Set<string>([
  '/services/website-development',
  '/services/web-development',
  '/services/custom-software',
  '/services/business-automation',
  '/services/android-app-development',
  '/services/mobile-app-development',
  '/services/ios-app-development',
  '/services/mvp-development',
  '/services/idea-validation',
  '/services/seo-aeo-geo',
  '/services/digital-marketing',
  '/services/software-testing-qa',
  '/services/practical-training',
  '/services/technical-consulting',
  '/contact',
  '/about',
  '/work',
  '/grow',
  '/services',
]);

export const GENERIC_ANCHOR_REGEX =
  /^(click here|read more|learn more|here|link|this link|more info|website|web page|check here|view more|details|page|ఇక్కడ క్లిక్ చేయండి|మరింత చదవండి|ఇక్కడ చూడండి|మరిన్ని వివరాలు)$/i;

export interface ExtractedBacklink {
  anchor: string;
  url: string;
  index: number;
}

export interface BacklinkValidationResult {
  passed: boolean;
  count: number;
  validLinks: { anchor: string; url: string }[];
  failures: string[];
  detail: string;
}

export function extractInternalBacklinks(content: string): ExtractedBacklink[] {
  const results: ExtractedBacklink[] = [];
  const regex = /(?<!!)\[([^\]]+)\]\((\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    results.push({
      anchor: match[1].trim(),
      url: match[2].trim(),
      index: match.index,
    });
  }
  return results;
}

export function validateArticleBacklinks(
  content: string,
  slug: string,
  _language: 'en' | 'te' = 'en',
): BacklinkValidationResult {
  const extracted = extractInternalBacklinks(content);
  const failures: string[] = [];
  const validLinks: { anchor: string; url: string }[] = [];
  const seenUrls = new Set<string>();
  const selfUrls = new Set([`/blog/${slug}`, `/te/blog/${slug}`, `/blog/${slug}/`, `/te/blog/${slug}/`]);

  for (const link of extracted) {
    const { anchor, url } = link;
    if (selfUrls.has(url)) {
      failures.push(`Self-referencing backlink to "${url}"`);
      continue;
    }
    if (!VALID_INTERNAL_DESTINATIONS.has(url)) {
      failures.push(`Unrecognized or non-whitelisted internal path "${url}"`);
      continue;
    }
    if (GENERIC_ANCHOR_REGEX.test(anchor) || anchor.length < 3) {
      failures.push(`Generic or non-descriptive anchor text "${anchor}" for "${url}"`);
      continue;
    }
    if (seenUrls.has(url)) {
      failures.push(`Duplicate backlink to "${url}"`);
      continue;
    }
    seenUrls.add(url);
    validLinks.push({ anchor, url });
  }

  if (validLinks.length < 1) {
    failures.push('Missing mandatory internal backlink (minimum 1 required in content body)');
  }

  const passed = failures.length === 0 && validLinks.length >= 1;
  const count = validLinks.length;
  const detail = passed
    ? `${count} valid internal backlink(s) naturally embedded in body: ${validLinks.map((l) => l.url).join(', ')}`
    : `Backlink policy violation: ${failures.join('; ')}`;

  return { passed, count, validLinks, failures, detail };
}

export function buildContextualBacklinkProse(
  categorySlug: string,
  language: 'en' | 'te' = 'en',
  existingUrls: Set<string> = new Set(),
): string {
  const isTe = language === 'te';
  if (isTe) {
    const p1 = !existingUrls.has('/services/website-development')
      ? 'మా [వెబ్‌సైట్ డెవలప్‌మెంట్ సేవలు](/services/website-development)'
      : 'మా [వెబ్ అప్లికేషన్ల డెవలప్‌మెంట్](/services/web-development)';
    const p2 = !existingUrls.has('/services/business-automation')
      ? 'మరియు [బిజినెస్ ఆటోమేషన్ సిస్టమ్స్](/services/business-automation)'
      : 'మరియు [కస్టమ్ సాఫ్ట్‌వేర్ సొల్యూషన్స్](/services/custom-software)';
    return `ఆధునిక డిజిటల్ వ్యవస్థలను నిర్మించేటప్పుడు ప్రాంతీయ వ్యాపారాలకు పటిష్టమైన సాంకేతిక మద్దతు అవసరం. వ్యాపార ప్రక్రియల విస్తరణ కోసం ${p1} ${p2} పరిష్కారాలను పరిశీలించండి. మీ సాంకేతిక ప్రాజెక్ట్ అవసరాల గురించి చర్చించడానికి మా [సంప్రదింపు పేజీ](/contact) ద్వారా సంప్రదించండి.`;
  }

  const link1 = !existingUrls.has('/services/web-development')
    ? '[Web Applications & Full-Stack Engineering](/services/web-development)'
    : '[Website Development Services](/services/website-development)';
  const link2 = !existingUrls.has('/services/business-automation')
    ? '[Business Automation Systems](/services/business-automation)'
    : '[Custom Software Solutions](/services/custom-software)';

  return `When modernizing regional operations, enterprises in Andhra Pradesh require scalable architectures. Explore our specialized ${link1} and ${link2} to streamline workflows. For direct architectural consultation, connect through our [Contact Page](/contact).`;
}

export function embedContextualBacklinks(
  rawContent: string,
  slug: string,
  categorySlug: string,
  language: 'en' | 'te' = 'en',
  targetLinks: { anchor: string; url: string }[] = [],
): string {
  let content = rawContent;
  const initialValidation = validateArticleBacklinks(content, slug, language);
  if (initialValidation.passed && initialValidation.count >= 2) {
    return content;
  }

  const existingUrls = new Set(initialValidation.validLinks.map((l) => l.url));
  const missingTargetLinks = targetLinks.filter(
    (l) => l.url && !existingUrls.has(l.url) && !content.includes(l.url) && !l.url.endsWith(`/${slug}`),
  );

  let proseToEmbed = '';
  if (missingTargetLinks.length >= 2) {
    const isTe = language === 'te';
    const l1 = missingTargetLinks[0];
    const l2 = missingTargetLinks[1];
    proseToEmbed = isTe
      ? `ప్రాంతీయ వ్యాపారాల సాంకేతిక విస్తరణ కోసం మా [${l1.anchor}](${l1.url}) మరియు [${l2.anchor}](${l2.url}) పరిష్కారాలను పరిశీలించండి.`
      : `To accelerate your digital transformation, explore our specialized [${l1.anchor}](${l1.url}) alongside scalable [${l2.anchor}](${l2.url}) tailored for regional operations.`;
  } else {
    proseToEmbed = buildContextualBacklinkProse(categorySlug, language, existingUrls);
  }

  // Insert naturally into body before section 3 or section 4 if available
  const p3 = content.split('## 3. ');
  if (p3.length === 2) {
    content = `${p3[0].trim()}\n\n${proseToEmbed}\n\n## 3. ${p3[1]}`;
  } else {
    const p2 = content.split('## 2. ');
    if (p2.length === 2) {
      content = `${p2[0].trim()}\n\n${proseToEmbed}\n\n## 2. ${p2[1]}`;
    } else {
      content = `${content.trim()}\n\n${proseToEmbed}\n`;
    }
  }

  return content;
}
