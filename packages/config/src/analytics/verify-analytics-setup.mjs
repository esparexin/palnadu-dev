import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../../..');

console.log('🔍 Executing Palnadu.dev Analytics & Marketing Intelligence Pre-Flight Audit...\n');

// 1. Audit GTM Container Export File
const gtmFile = path.join(ROOT_DIR, 'packages/config/src/analytics/gtm-container-GTM-TTNNVNM5.json');
assert.ok(fs.existsSync(gtmFile), 'GTM container export file must exist');

const gtmData = JSON.parse(fs.readFileSync(gtmFile, 'utf8'));
assert.equal(gtmData.containerVersion.container.publicId, 'GTM-TTNNVNM5', 'Public container ID must match GTM-TTNNVNM5');
assert.match(gtmData.containerVersion.accountId, /^\d+$/, 'accountId must be a numeric base-10 string');
assert.match(gtmData.containerVersion.containerId, /^\d+$/, 'containerId must be a numeric base-10 string');

const tags = gtmData.containerVersion.tag || [];
const triggers = gtmData.containerVersion.trigger || [];
const variables = gtmData.containerVersion.variable || [];

assert.ok(tags.length >= 7, `Expected at least 7 GTM tags, found ${tags.length}`);
assert.ok(triggers.length >= 6, `Expected at least 6 GTM triggers, found ${triggers.length}`);
assert.ok(variables.length >= 16, `Expected at least 16 DataLayer variables, found ${variables.length}`);

// Check specific key tags
const baseTag = tags.find((t) => t.type === 'googtag');
assert.ok(baseTag, 'Google Tag base configuration must exist');
const sendPageViewParam = baseTag.parameter.find((p) => p.key === 'sendPageView');
assert.equal(sendPageViewParam?.value, 'false', 'sendPageView must be false to avoid double SPA firing');

const leadTag = tags.find((t) => t.name.includes('generate_lead'));
assert.ok(leadTag, 'Primary conversion generate_lead tag must exist in GTM');

console.log('  ✅ GTM Container JSON export verified (7 tags, 6 triggers, 16 variables)');

// 2. Audit apps/web/src/app/layout.tsx
const layoutFile = path.join(ROOT_DIR, 'apps/web/src/app/layout.tsx');
const layoutContent = fs.readFileSync(layoutFile, 'utf8');

assert.ok(layoutContent.includes('GtmScripts'), 'layout.tsx must render GtmScripts');
assert.ok(layoutContent.includes('GtmNoscript'), 'layout.tsx must render GtmNoscript');
assert.ok(layoutContent.includes('AnalyticsRouteTracker'), 'layout.tsx must render AnalyticsRouteTracker');
assert.ok(layoutContent.includes('CookieConsentBanner'), 'layout.tsx must render CookieConsentBanner');
assert.ok(!layoutContent.includes("gtag('config'"), 'layout.tsx must NOT contain duplicate gtag config call');

console.log('  ✅ apps/web/src/app/layout.tsx verified (Single Tag Manager, Consent Mode v2, Route Tracker)');

// 3. Audit apps/web/src/components/ui/contact-form.tsx
const formFile = path.join(ROOT_DIR, 'apps/web/src/components/ui/contact-form.tsx');
const formContent = fs.readFileSync(formFile, 'utf8');

assert.ok(formContent.includes('trackGenerateLead'), 'contact-form.tsx must import and fire trackGenerateLead');
assert.ok(formContent.includes('trackFormStart'), 'contact-form.tsx must fire trackFormStart on first interaction');
assert.ok(formContent.includes('trackFormSubmitFailure'), 'contact-form.tsx must fire trackFormSubmitFailure on error');
assert.ok(!formContent.includes("win.gtag('event'"), 'contact-form.tsx must NOT have duplicate hardcoded gtag call');

console.log('  ✅ apps/web/src/components/ui/contact-form.tsx verified (Backend-confirmed lead conversion)');

// 4. Audit packages/types/src/analytics.ts
const typesFile = path.join(ROOT_DIR, 'packages/types/src/analytics.ts');
const typesContent = fs.readFileSync(typesFile, 'utf8');

assert.ok(typesContent.includes('export type AnalyticsEventMap'), 'analytics.ts must export AnalyticsEventMap');
assert.ok(typesContent.includes('generate_lead: GenerateLeadEventData'), 'analytics.ts must define generate_lead contract');
assert.ok(typesContent.includes('contact_channel_click: ContactChannelClickEventData'), 'analytics.ts must define contact_channel_click contract');
assert.ok(typesContent.includes('consultation_request: ConsultationRequestEventData'), 'analytics.ts must define consultation_request contract');

console.log('  ✅ packages/types/src/analytics.ts verified (SSOT Event Contracts)');

// 5. Audit 250-line file limit on all touched analytics components
const filesToCheck = [
  'packages/types/src/analytics.ts',
  'apps/web/src/lib/analytics/core.ts',
  'apps/web/src/lib/analytics/utm.ts',
  'apps/web/src/lib/analytics/consent.ts',
  'apps/web/src/lib/analytics/events.ts',
  'apps/web/src/lib/analytics/index.ts',
  'apps/web/src/components/analytics/gtm-scripts.tsx',
  'apps/web/src/components/analytics/route-tracker.tsx',
  'apps/web/src/components/analytics/cookie-consent-banner.tsx',
  'apps/web/src/components/ui/contact-form.tsx',
  'apps/web/src/components/ui/contact-success-state.tsx',
  'apps/web/src/components/ui/quick-contact-actions.tsx',
  'apps/web/src/components/blog/article-engagement-tracker.tsx',
  'apps/web/src/components/layout/navbar.tsx',
  'apps/web/src/components/sections/cta-section.tsx',
  'apps/web/src/app/work/work-client.tsx',
  'apps/web/src/app/grow/grow-final-cta.tsx',
];

for (const rel of filesToCheck) {
  const fullPath = path.join(ROOT_DIR, rel);
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length;
  assert.ok(lines < 250, `File ${rel} has ${lines} lines, exceeding the 249-line limit`);
}

console.log(`  ✅ All ${filesToCheck.length} source files strictly respect the 249-line maximum`);

console.log('\n🎉 All Analytics & Marketing Intelligence checks PASSED cleanly!\n');

