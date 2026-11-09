import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MAX_LINES = 249;
const TARGET_DIRS = ['apps', 'packages', 'scripts'];
const VALID_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.git',
  '.cache',
  'coverage',
]);

console.log(`🔍 Checking strict 250-line file policy (max ${MAX_LINES} lines per file)...`);

const violations = [];
let filesScanned = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(path.join(dir, entry.name));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (VALID_EXTENSIONS.has(ext)) {
        filesScanned++;
        const filePath = path.join(dir, entry.name);
        const content = fs.readFileSync(filePath, 'utf-8');
        // Count physical lines
        const lines = content.length === 0 ? 0 : content.split('\n').length;

        if (lines > MAX_LINES) {
          const relPath = path.relative(rootDir, filePath);
          violations.push({ path: relPath, lines });
        }
      }
    }
  }
}

for (const target of TARGET_DIRS) {
  const targetPath = path.join(rootDir, target);
  if (fs.existsSync(targetPath)) {
    walk(targetPath);
  }
}

if (violations.length > 0) {
  console.error(`\n❌ Strict line count policy failed! ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
  for (const v of violations) {
    console.error(`  - ${v.path}: ${v.lines} lines (exceeds maximum of ${MAX_LINES})`);
  }
  console.error('\nEvery source file must contain at most 249 lines. Decompose oversized files into modules.\n');
  process.exit(1);
} else {
  console.log(`✅ All ${filesScanned} source files strictly comply with the maximum 249-line policy.`);
}
