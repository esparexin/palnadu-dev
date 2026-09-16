import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig, sitemapPages } from '../dist/index.js';

describe('SEO Configuration & Domain Canonicalization SSOT', () => {
  it('should define canonical domain as https://www.palnadu.dev without trailing slash', () => {
    assert.equal(siteConfig.url, 'https://www.palnadu.dev');
    assert.ok(!siteConfig.url.endsWith('/'), 'siteConfig.url must not end with a trailing slash');
  });

  it('should have brandName and name matching Palnadu.dev exactly', () => {
    assert.equal(siteConfig.name, 'Palnadu.dev');
    assert.equal(siteConfig.brandName, 'Palnadu.dev');
  });

  it('should define absolute ogImage hosted on canonical domain', () => {
    assert.equal(siteConfig.ogImage, 'https://www.palnadu.dev/og.png');
  });

  it('should ensure all sitemap paths start with / or are root empty string', () => {
    for (const page of sitemapPages) {
      assert.ok(
        page.path === '' || page.path.startsWith('/'),
        `Sitemap path "${page.path}" must either be empty string or start with /`
      );
      assert.ok(
        !page.path.endsWith('/') || page.path === '',
        `Sitemap path "${page.path}" must not end with a trailing slash (except root empty string)`
      );
    }
  });

  it('should have zero duplicate paths in sitemapPages registry', () => {
    const paths = sitemapPages.map((p) => p.path);
    const uniquePaths = new Set(paths);
    assert.equal(paths.length, uniquePaths.size, 'All paths in sitemapPages must be unique');
  });

  it('should verify all required stable favicon assets exist on disk', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const publicDir = path.resolve(__dirname, '../../../apps/web/public');

    const requiredAssets = [
      'favicon.ico',
      'favicon-48.png',
      'favicon-96.png',
      'favicon-192.png',
      'apple-touch-icon.png',
    ];

    for (const asset of requiredAssets) {
      const fullPath = path.join(publicDir, asset);
      assert.ok(fs.existsSync(fullPath), `Required favicon asset missing: ${asset}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 0, `Favicon asset must not be empty: ${asset}`);
    }
  });
});
