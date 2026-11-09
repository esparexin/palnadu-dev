import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MAX_LINES = Number(process.env.MAX_LINES) || 250;
const TARGET_DIRS = ['apps', 'packages', 'scripts'];
const VALID_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.css',
  '.scss',
]);
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.git',
  '.cache',
  'coverage',
  '.agents',
  '.claude',
  '.opencode',
  '.pnpm-store',
]);

console.log(`🔍 Checking strict 250-line file policy (max ${MAX_LINES} lines per file)...`);

const violations = [];
let filesScanned = 0;

function checkFile(filePath) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf-8');
  // Normalize line counting: strip one trailing newline so physical lines match editor line count
  const normalized = (content.endsWith('\n') ? content.slice(0, -1) : content).replace(/\r/g, '');
  const lines = normalized.length === 0 ? 0 : normalized.split('\n').length;

  if (lines > MAX_LINES) {
    const relPath = path.relative(rootDir, filePath);
    violations.push({ path: relPath, lines });
  }
}

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
        checkFile(path.join(dir, entry.name));
      }
    }
  }
}

// 1. Scan root-level source files
for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
  if (entry.isFile()) {
    const ext = path.extname(entry.name);
    if (VALID_EXTENSIONS.has(ext)) {
      checkFile(path.join(rootDir, entry.name));
    }
  }
}

// 2. Scan target directories recursively
for (const target of TARGET_DIRS) {
  const targetPath = path.join(rootDir, target);
  if (fs.existsSync(targetPath)) {
    walk(targetPath);
  }
}

if (violations.length > 0) {
  console.error(
    `\n❌ Strict line count policy failed! ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`,
  );
  for (const v of violations) {
    console.error(`  - ${v.path}: ${v.lines} lines (exceeds maximum of ${MAX_LINES})`);
  }
  console.error(
    `\nEvery source file must contain at most ${MAX_LINES} lines. Decompose oversized files into modules.\n`,
  );
  process.exit(1);
} else {
  console.log(`✅ All ${filesScanned} source files strictly comply with the maximum ${MAX_LINES}-line policy.`);
}
