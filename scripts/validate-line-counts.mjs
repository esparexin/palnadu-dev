import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MAX_LINES = Number(process.env.MAX_LINES) || 249;
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

const args = process.argv.slice(2);
let targetFiles = [];

if (args.includes('--changed') || args.includes('--staged')) {
  try {
    const gitCmd = args.includes('--staged') ? 'git diff --cached --name-only' : 'git status --porcelain';
    const output = execSync(gitCmd, { cwd: rootDir, encoding: 'utf-8' });
    targetFiles = output
      .split('\n')
      .map((l) => (args.includes('--staged') ? l.trim() : l.slice(3).trim()))
      .filter(Boolean)
      .map((f) => path.resolve(rootDir, f))
      .filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  } catch {
    targetFiles = [];
  }
} else if (args.length > 0 && !args[0].startsWith('-')) {
  targetFiles = args.map((f) => path.resolve(rootDir, f)).filter((f) => fs.existsSync(f));
}

const violations = [];
const nearThreshold = [];
let filesScanned = 0;

function checkFile(filePath) {
  filesScanned++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const normalized = (content.endsWith('\n') ? content.slice(0, -1) : content).replace(/\r/g, '');
  const lines = normalized.length === 0 ? 0 : normalized.split('\n').length;
  const relPath = path.relative(rootDir, filePath);

  if (lines > MAX_LINES) {
    violations.push({ path: relPath, lines });
  } else if (lines >= 220) {
    nearThreshold.push({ path: relPath, lines });
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

console.log(`🔍 Checking strict 250-line file policy (max ${MAX_LINES} lines per file)...`);

if (targetFiles.length > 0) {
  for (const f of targetFiles) {
    const ext = path.extname(f);
    if (VALID_EXTENSIONS.has(ext)) {
      checkFile(f);
    }
  }
} else {
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
}

if (nearThreshold.length > 0 && violations.length === 0) {
  console.log(`ℹ️ Architecture notice: ${nearThreshold.length} file(s) are approaching the line limit (220–${MAX_LINES} lines).`);
  console.log('   Proactively extract helpers/types/constants to prevent repetitive line-trimming.');
}

if (violations.length > 0) {
  console.error(`\n❌ Strict line count policy failed! ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
  for (const v of violations) {
    console.error(`  - ${v.path}: ${v.lines} lines (exceeds maximum of ${MAX_LINES})`);
  }
  console.error(`\nEvery source file must contain at most ${MAX_LINES} lines. Decompose oversized files into modules.\n`);
  process.exit(1);
} else {
  console.log(`✅ All ${filesScanned} checked source file(s) strictly comply with the maximum ${MAX_LINES}-line policy.`);
}
