import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running Contract & Shared Package Synchronization Audit...');
let errors = [];

// 1. Verify Shared Package Build Artifacts (dist/)
const compiledPackages = ['types', 'config', 'ui', 'validation'];
for (const pkg of compiledPackages) {
  const distPath = path.join(rootDir, 'packages', pkg, 'dist');
  if (!fs.existsSync(distPath)) {
    errors.push(
      `Package "@palnadu/${pkg}" is missing compiled build artifact: "packages/${pkg}/dist"`,
    );
  }
}

/** Recursively read combined .d.ts content for modular package dist directories */
function readAllDts(pkgName) {
  const distPath = path.join(rootDir, 'packages', pkgName, 'dist');
  if (!fs.existsSync(distPath)) return '';
  let combined = '';
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
        combined += fs.readFileSync(fullPath, 'utf-8') + '\n';
      }
    }
  }
  walk(distPath);
  return combined;
}

// 2. Verify Canonical Exports in packages/types/dist
const typesContent = readAllDts('types');
if (typesContent) {
  const requiredTypes = ['BlogPost', 'BlogLanguage', 'Lead', 'Client', 'User'];
  for (const t of requiredTypes) {
    if (!typesContent.includes(t)) {
      errors.push(`@palnadu/types is missing canonical export: "${t}"`);
    }
  }
}

// 3. Verify Canonical Exports in packages/config/dist
const configContent = readAllDts('config');
if (configContent) {
  const requiredConfigExports = ['slugify', 'siteConfig', 'coreLocations', 'services'];
  for (const exp of requiredConfigExports) {
    if (!configContent.includes(exp)) {
      errors.push(`@palnadu/config is missing canonical export: "${exp}"`);
    }
  }
}

// 4. Verify Canonical Exports in packages/ui/dist
const uiContent = readAllDts('ui');
if (uiContent) {
  const requiredUiExports = [
    'Button',
    'Input',
    'Label',
    'Textarea',
    'BrandLogo',
    'ConfirmDialog',
    'SectionHeading',
    'useToast',
  ];
  for (const exp of requiredUiExports) {
    if (!uiContent.includes(exp)) {
      errors.push(`@palnadu/ui is missing canonical export: "${exp}"`);
    }
  }
}

// 5. Verify Canonical Exports in packages/validation/dist
const validationContent = readAllDts('validation');
if (validationContent) {
  const requiredValidationExports = [
    'createLeadSchema',
    'loginSchema',
    'createClientSchema',
    'updateUserSchema',
  ];
  for (const exp of requiredValidationExports) {
    if (!validationContent.includes(exp)) {
      errors.push(`@palnadu/validation is missing canonical export: "${exp}"`);
    }
  }
}

// 6. Prisma Schema Synchronization
const prismaSchemaPath = path.join(rootDir, 'apps/api/prisma/schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf-8');
  const requiredPrismaFields = ['topicKey', 'translationGroupId', 'language'];
  for (const field of requiredPrismaFields) {
    if (!schemaContent.includes(field)) {
      errors.push(`Prisma schema is missing synchronized bilingual field: "${field}"`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ Contract & Shared Package Synchronization Failed:');
  errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Contract & Shared Package Synchronization: Passed (All SSOT contracts verified)');
}
