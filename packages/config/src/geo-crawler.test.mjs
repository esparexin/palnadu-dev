import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig } from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webAppDir = path.resolve(__dirname, '../../../apps/web');

describe('GEO and Crawler Accessibility Verification', () => {
  it('should verify robots.ts unblocks Next.js assets and allows AI crawlers', () => {
    const robotsPath = path.join(webAppDir, 'src/app/robots.ts');
    assert.ok(fs.existsSync(robotsPath), 'robots.ts must exist');

    const content = fs.readFileSync(robotsPath, 'utf8');
    assert.ok(content.includes('/_next/static/'), 'robots.ts must allow /_next/static/');
    assert.ok(content.includes('/_next/image/'), 'robots.ts must allow /_next/image/');
    assert.ok(content.includes('GPTBot'), 'robots.ts must declare GPTBot');
    assert.ok(content.includes('PerplexityBot'), 'robots.ts must declare PerplexityBot');
    assert.ok(content.includes('ClaudeBot'), 'robots.ts must declare ClaudeBot');
    assert.ok(content.includes('Google-Extended'), 'robots.ts must declare Google-Extended');
    assert.ok(content.includes('Applebot'), 'robots.ts must declare Applebot');
    assert.ok(!content.includes("disallow: ['/admin/', '/api/', '/_next/']"), 'Must not block all /_next/ globally');
  });

  it('should verify llms.txt exists and contains valid canonical URLs and services', () => {
    const llmsPath = path.join(webAppDir, 'public/llms.txt');
    assert.ok(fs.existsSync(llmsPath), 'llms.txt must exist in apps/web/public');

    const content = fs.readFileSync(llmsPath, 'utf8');
    assert.ok(content.length > 200, 'llms.txt must have meaningful content');
    assert.ok(content.includes('# Palnadu.dev'), 'llms.txt must contain H1 with Palnadu.dev');
    assert.ok(content.includes(siteConfig.url), 'llms.txt must contain the canonical website URL');
    assert.ok(content.includes(siteConfig.contact.email), 'llms.txt must contain official contact email');
    assert.ok(content.includes(siteConfig.contact.phone), 'llms.txt must contain official phone');
    assert.ok(content.includes('Website Development'), 'llms.txt must include primary services');
    assert.ok(content.includes('Macherla'), 'llms.txt must include regional presence');
  });
});
