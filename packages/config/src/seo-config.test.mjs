import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  siteConfig,
  sitemapPages,
  services,
  coreLocations,
  getOrganizationSchema,
  getOrganizationRef,
  getWebsiteSchema,
  getBreadcrumbSchema,
} from '../dist/index.js';

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

  it('should verify all required brand logo assets exist across web and admin', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const webPublic = path.resolve(__dirname, '../../../apps/web/public');
    const adminPublic = path.resolve(__dirname, '../../../apps/admin/public');

    const brandFiles = [
      'palnadu-logo-horizontal.png',
      'palnadu-logo-white.png',
      'palnadu-logo-horizontal.svg',
      'palnadu-logo-white.svg',
      'logo.png',
      'favicon.ico',
      'favicon-48.png',
      'apple-touch-icon.png',
    ];

    for (const dir of [webPublic, adminPublic]) {
      for (const file of brandFiles) {
        const fullPath = path.join(dir, file);
        assert.ok(fs.existsSync(fullPath), `Brand file missing: ${path.relative(__dirname, fullPath)}`);
        const stats = fs.statSync(fullPath);
        assert.ok(stats.size > 0, `Brand file must not be empty: ${file}`);
      }
    }
  });

  it('should generate valid authorative Organization schema with canonical @id', () => {
    const org = getOrganizationSchema();
    assert.equal(org['@context'], 'https://schema.org');
    assert.equal(org['@type'], 'Organization');
    assert.equal(org['@id'], 'https://www.palnadu.dev/#organization');
    assert.equal(org.name, 'Palnadu.dev');
    assert.equal(org.legalName, 'Palnadu.dev');
    assert.equal(org.url, 'https://www.palnadu.dev');
    assert.equal(org.logo['@id'], 'https://www.palnadu.dev/#logo');
    assert.ok(Array.isArray(org.knowsAbout) && org.knowsAbout.length > 0);
  });

  it('should generate lightweight Organization ref with matching @id', () => {
    const ref = getOrganizationRef();
    assert.equal(ref['@type'], 'Organization');
    assert.equal(ref['@id'], 'https://www.palnadu.dev/#organization');
    assert.equal(ref.name, 'Palnadu.dev');
  });

  it('should generate WebSite schema linked to Organization publisher', () => {
    const website = getWebsiteSchema();
    assert.equal(website['@context'], 'https://schema.org');
    assert.equal(website['@type'], 'WebSite');
    assert.equal(website['@id'], 'https://www.palnadu.dev/#website');
    assert.equal(website.url, 'https://www.palnadu.dev');
    assert.equal(website.publisher['@id'], 'https://www.palnadu.dev/#organization');
  });

  it('should generate BreadcrumbList with correct 1-based positions and absolute URLs', () => {
    const breadcrumb = getBreadcrumbSchema([
      { name: 'Home', path: '' },
      { name: 'Services', path: '/services' },
      { name: 'Web Development', path: '/services/web-development' },
    ]);
    assert.equal(breadcrumb['@context'], 'https://schema.org');
    assert.equal(breadcrumb['@type'], 'BreadcrumbList');
    assert.equal(breadcrumb.itemListElement.length, 3);
    assert.equal(breadcrumb.itemListElement[0].position, 1);
    assert.equal(breadcrumb.itemListElement[0].item, 'https://www.palnadu.dev');
    assert.equal(breadcrumb.itemListElement[1].position, 2);
    assert.equal(breadcrumb.itemListElement[1].item, 'https://www.palnadu.dev/services');
    assert.equal(breadcrumb.itemListElement[2].position, 3);
    assert.equal(breadcrumb.itemListElement[2].item, 'https://www.palnadu.dev/services/web-development');
  });

  it('should include all primary Palnadu.dev brand services with unique slugs', () => {
    const requiredSlugs = [
      'website-development',
      'web-development',
      'android-app-development',
      'ios-app-development',
      'business-automation',
      'digital-marketing',
    ];

    const serviceSlugs = services.map((s) => s.slug);
    const uniqueSlugs = new Set(serviceSlugs);
    assert.equal(serviceSlugs.length, uniqueSlugs.size, 'Service slugs must be unique');

    for (const required of requiredSlugs) {
      assert.ok(
        serviceSlugs.includes(required),
        `Required Palnadu.dev service "${required}" must be registered in services list`
      );
    }
  });

  it('should include all 7 authentic regional location hubs with geo coordinates and sitemap entries', () => {
    const requiredHubs = [
      'guntur',
      'palnadu',
      'narasaraopet',
      'chilakaluripet',
      'sattenapalle',
      'vinukonda',
      'macherla',
    ];

    const locationSlugs = coreLocations.map((l) => l.slug);
    assert.equal(locationSlugs.length, 7, 'Must have exactly 7 core location hubs');

    const sitemapPaths = sitemapPages.map((p) => p.path);

    for (const hub of requiredHubs) {
      const loc = coreLocations.find((l) => l.slug === hub);
      assert.ok(loc, `Location hub "${hub}" must be registered in coreLocations`);
      assert.ok(loc.name.length > 0, `Location "${hub}" must have a valid name`);
      assert.ok(loc.economicProfile.length > 50, `Location "${hub}" must have authentic economic profile`);
      assert.ok(loc.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number', `Location "${hub}" must have numeric geo coordinates`);
      assert.ok(
        sitemapPaths.includes(`/locations/${hub}`),
        `Location hub "/locations/${hub}" must be registered in sitemapPages`
      );
    }
  });
});
