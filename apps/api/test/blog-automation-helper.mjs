import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const SOURCES = [
  'topic-identity.ts',
  'seo-strategy.ts',
  'content-similarity-rules.ts',
  'seo-validation-rules.ts',
];

let cachedMod;

export function getAutomationModules() {
  if (cachedMod) return cachedMod;
  const outDir = mkdtempSync(join(tmpdir(), 'seo-engine-test-'));
  execFileSync(
    'npx',
    [
      'tsc',
      ...SOURCES.map((s) => `src/automation/${s}`),
      '--outDir',
      outDir,
      '--module',
      'commonjs',
      '--target',
      'es2022',
      '--moduleResolution',
      'node',
      '--skipLibCheck',
      '--esModuleInterop',
    ],
    { cwd: process.cwd(), stdio: 'pipe' },
  );

  const req = (name) => {
    const nested = join(outDir, 'automation', name);
    if (existsSync(nested)) return require(nested);
    return require(join(outDir, name));
  };
  cachedMod = {
    identity: req('topic-identity.js'),
    strategy: req('seo-strategy.js'),
    similarity: req('content-similarity-rules.js'),
    validation: req('seo-validation-rules.js'),
  };
  return cachedMod;
}
