// ─── Sitemap Pages (SSOT) ─────────────────────────────────────
// Every public page must be registered here.
// sitemap.ts, canonical URLs, and future audits all read from this list.
// When you add a new page, add it here — everything else is automatic.

export interface SitemapPage {
  /** Route path relative to site root, e.g. '/about' (use '' for homepage) */
  path: string;
  /** How often the content changes */
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority 0.0 – 1.0 */
  priority: number;
}

export const sitemapPages: SitemapPage[] = [
  // ── Core ──
  { path: '',            changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/grow',       changeFrequency: 'weekly',  priority: 0.9 },
  { path: '/about',      changeFrequency: 'monthly', priority: 0.7 },
  { path: '/services',   changeFrequency: 'monthly', priority: 0.9 },
  { path: '/work',       changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog',       changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/contact',    changeFrequency: 'monthly', priority: 0.7 },
  // ── SEO / Local Directory ──
  { path: '/industries', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/locations',  changeFrequency: 'monthly', priority: 0.7 },
  // ── Core Location Hubs (Genuine Topical Authority) ──
  { path: '/locations/guntur',         changeFrequency: 'monthly', priority: 0.8 },
  { path: '/locations/palnadu',        changeFrequency: 'monthly', priority: 0.8 },
  { path: '/locations/narasaraopet',   changeFrequency: 'monthly', priority: 0.8 },
  { path: '/locations/chilakaluripet', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/locations/sattenapalle',   changeFrequency: 'monthly', priority: 0.7 },
  { path: '/locations/vinukonda',      changeFrequency: 'monthly', priority: 0.7 },
  { path: '/locations/macherla',       changeFrequency: 'weekly',  priority: 0.9 },
  // ── Legal ──
  { path: '/privacy',    changeFrequency: 'yearly',  priority: 0.3 },
  { path: '/terms',      changeFrequency: 'yearly',  priority: 0.3 },
];
