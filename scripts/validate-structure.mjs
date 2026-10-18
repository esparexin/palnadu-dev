import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running Monorepo Structure & File Organization Audit...');
let errors = [];

// 1. Root Directory Hygiene
const forbiddenRootEntries = ['logos', 'temp', 'tmp', 'dist', 'build', 'out'];
for (const entry of forbiddenRootEntries) {
  if (fs.existsSync(path.join(rootDir, entry))) {
    errors.push(
      `Root directory contains forbidden or alien directory: "${entry}/". Assets belong in packages/config/assets/`,
    );
  }
}

// 2. Monorepo Package Verification
const expectedApps = ['web', 'admin', 'api'];
const expectedPackages = ['config', 'types', 'ui', 'validation', 'eslint-config'];

for (const app of expectedApps) {
  const appPath = path.join(rootDir, 'apps', app);
  if (!fs.existsSync(appPath)) {
    errors.push(`Expected workspace app "apps/${app}" is missing`);
  } else if (!fs.existsSync(path.join(appPath, 'package.json'))) {
    errors.push(`App "apps/${app}" is missing package.json`);
  }
}

for (const pkg of expectedPackages) {
  const pkgPath = path.join(rootDir, 'packages', pkg);
  if (!fs.existsSync(pkgPath)) {
    errors.push(`Expected workspace package "packages/${pkg}" is missing`);
  } else if (!fs.existsSync(path.join(pkgPath, 'package.json'))) {
    errors.push(`Package "packages/${pkg}" is missing package.json`);
  }
}

// 3. Database Engine Alignment (MongoDB Atlas)
const apiEnvExample = path.join(rootDir, 'apps/api/.env.example');
if (fs.existsSync(apiEnvExample)) {
  const content = fs.readFileSync(apiEnvExample, 'utf-8');
  if (content.includes('postgresql://') || content.includes('postgres:16')) {
    errors.push(
      'apps/api/.env.example contains PostgreSQL references. The project standard is MongoDB Atlas.',
    );
  }
}

// 4. SSOT Tailwind Configuration Alignment
for (const app of ['web', 'admin']) {
  const tailwindConfigPath = path.join(rootDir, 'apps', app, 'tailwind.config.js');
  if (fs.existsSync(tailwindConfigPath)) {
    const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
    if (!configContent.includes('@palnadu/config/tailwind-preset')) {
      errors.push(
        `apps/${app}/tailwind.config.js does not extend @palnadu/config/tailwind-preset (SSOT violation)`,
      );
    }
  }
}

// Summary & Exit
if (errors.length > 0) {
  console.error('\n❌ Monorepo Structure Validation Failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log(
    '✅ Monorepo Structure & File Organization: Passed (All 8 workspaces verified, 0 anomalies)',
  );
}
