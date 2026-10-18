import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Running Secret & Credential Scanning Audit...');

const SECRET_PATTERNS = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_-]{32,}/ },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{32,}/ },
  { name: 'Generic Private Key', regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/ },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
  },
];

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.turbo',
  'pnpm-lock.yaml',
  '.env.example',
  'scripts/scan-secrets.mjs',
];

let violations = [];

function scanFile(filePath) {
  const relPath = path.relative(rootDir, filePath);
  if (IGNORED_PATHS.some((p) => relPath.startsWith(p) || relPath.includes(`/${p}/`))) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const { name, regex } of SECRET_PATTERNS) {
    if (regex.test(content)) {
      violations.push({ file: relPath, secretType: name });
    }
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);
    if (IGNORED_PATHS.some((p) => relPath === p || relPath.startsWith(`${p}/`))) continue;

    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile()) {
      // only scan code and config files
      if (/\.(ts|tsx|js|jsx|json|env|yml|yaml|md|prisma|sh)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  }
}

walkDir(rootDir);

if (violations.length > 0) {
  console.error('\n❌ Security Alert: Secrets or Credentials Detected:');
  violations.forEach((v) => console.error(`  - [${v.secretType}] in ${v.file}`));
  process.exit(1);
} else {
  console.log('✅ Secret & Credential Scanning: Passed (0 active secrets detected)');
}
