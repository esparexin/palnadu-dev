import { getAutomationModules } from './blog-automation-helper.mjs';

export function validDraft(overrides = {}) {
  const keyword = 'website development cost guntur';
  const content = [
    `If you are searching ${keyword} this guide covers it. Explore our [Website Development](/services/website-development) services.`,
    Array.from({ length: 700 }, (_, i) => `filler${i}`).join(' '),
  ].join(' ');
  return {
    isTemplateFallback: false,
    title: 'Website Development Cost in Guntur: A Practical Breakdown',
    slug: 'website-development-cost-guntur',
    h1: 'Website Development Cost in Guntur',
    content,
    metaTitle: 'Website Development Cost in Guntur | Palnadu.dev',
    metaDescription: 'A practical breakdown of website development cost in Guntur, including what drives the price.',
    seoTitle: 'Website Development Cost in Guntur | Palnadu.dev',
    seoDescription: 'A practical breakdown of website development cost in Guntur.',
    canonicalUrl: '/blog/website-development-cost-guntur',
    primaryKeyword: keyword,
    secondaryKeywords: ['web design price guntur'],
    searchIntent: 'COMMERCIAL_INVESTIGATION',
    h2Headings: ['What drives cost', 'How to compare quotes'],
    internalLinks: [{ anchor: 'Website Development', url: '/services/website-development' }],
    faq: [],
    ...overrides,
  };
}

export function runValidation(overrides = {}, inputOverrides = {}) {
  const mod = getAutomationModules();
  const draft = validDraft(overrides);
  return mod.validation.validate({
    topicKey: 'website-development-cost-guntur',
    topic: 'Website Development Cost in Guntur',
    draft,
    categorySlug: 'website-development',
    categoryExists: true,
    similarity: { nearest: null, isDuplicate: false, matches: [] },
    topicKeyTaken: false,
    existingSlugs: new Set(),
    existingTitles: new Set(),
    wordCount: draft.content.split(/\s+/).length,
    ...inputOverrides,
  });
}
