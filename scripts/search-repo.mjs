#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/search-repo.mjs <query> [target-dir] [--limit=50] [--ignore-case]

Bounded codebase search utility:
Automatically excludes node_modules, .next, .turbo, dist, .git, and build artifacts.
`);
  process.exit(0);
}

let query = '';
let targetDir = '.';
let maxResults = 50;
let ignoreCase = true;

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    maxResults = Number(arg.split('=')[1]) || 50;
  } else if (arg === '--ignore-case' || arg === '-i') {
    ignoreCase = true;
  } else if (arg === '--match-case') {
    ignoreCase = false;
  } else if (!query) {
    query = arg;
  } else {
    targetDir = arg;
  }
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  '.git',
  '.cache',
  'coverage',
  '.agents',
  '.gemini',
  '.opencode',
  '.pnpm-store',
]);

const IGNORED_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.zip',
  '.tar',
  '.gz',
  '.pdf',
  '.lock',
  '.map',
]);

const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ignoreCase ? 'i' : '');
let matchCount = 0;
const results = [];

function searchFile(filePath) {
  if (matchCount >= maxResults) return;
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTS.has(ext)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        const relPath = path.relative(rootDir, filePath);
        results.push({
          file: relPath,
          line: i + 1,
          text: lines[i].trim().slice(0, 120),
        });
        matchCount++;
        if (matchCount >= maxResults) break;
      }
    }
  } catch {
    // Ignore unreadable/binary files
  }
}

function walk(dir) {
  if (matchCount >= maxResults) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(path.join(dir, entry.name));
      }
    } else if (entry.isFile()) {
      searchFile(path.join(dir, entry.name));
    }
  }
}

const startPath = path.resolve(rootDir, targetDir);
if (fs.existsSync(startPath)) {
  const stat = fs.statSync(startPath);
  if (stat.isDirectory()) {
    walk(startPath);
  } else {
    searchFile(startPath);
  }
} else {
  console.error(`❌ Path not found: ${targetDir}`);
  process.exit(1);
}

console.log(`🔍 Bounded search for "${query}" (Found ${results.length} matches):\n`);
for (const r of results) {
  console.log(`  ${r.file}:${r.line} -> ${r.text}`);
}

if (matchCount >= maxResults) {
  console.log(`\n⚠️ Result limit reached (${maxResults} matches). Refine query for more specificity.`);
}
