import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running Route Generation & Static Page Integrity Smoke Test...');
let errors = [];

// 1. Web App Routes
const webManifestPath = path.join(rootDir, 'apps/web/.next/prerender-manifest.json');
if (!fs.existsSync(webManifestPath)) {
  errors.push('apps/web/.next/prerender-manifest.json not found. Run "pnpm build" first.');
} else {
  const manifest = JSON.parse(fs.readFileSync(webManifestPath, 'utf-8'));
  const routes = Object.keys(manifest.routes || {});

  const requiredWebRoutes = [
    '/',
    '/about',
    '/contact',
    '/services',
    '/locations',
    '/locations/guntur',
    '/locations/palnadu',
    '/locations/narasaraopet',
    '/services/website-development',
    '/services/mobile-app-development',
  ];

  for (const route of requiredWebRoutes) {
    if (!routes.includes(route)) {
      errors.push(`apps/web is missing required prerendered static route: "${route}"`);
    }
  }
}

// 2. Admin App Routes
const adminManifestPath = path.join(rootDir, 'apps/admin/.next/prerender-manifest.json');
if (!fs.existsSync(adminManifestPath)) {
  errors.push('apps/admin/.next/prerender-manifest.json not found. Run "pnpm build" first.');
} else {
  const manifest = JSON.parse(fs.readFileSync(adminManifestPath, 'utf-8'));
  const routes = Object.keys(manifest.routes || {});

  const requiredAdminRoutes = ['/login', '/dashboard', '/blog', '/settings', '/clients', '/users'];

  for (const route of requiredAdminRoutes) {
    if (!routes.includes(route)) {
      errors.push(`apps/admin is missing required prerendered static route: "${route}"`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ Route Generation & Smoke Test Failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Route Generation & Smoke Test: Passed (All critical routes prerendered cleanly)');
}
