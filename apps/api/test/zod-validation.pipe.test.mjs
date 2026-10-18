import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let ZodValidationPipe;
let tempDir;

before(() => {
  const cacheDir = join(process.cwd(), 'node_modules/.cache');
  mkdirSync(cacheDir, { recursive: true });
  tempDir = mkdtempSync(join(cacheDir, 'pipe-test-'));
  const outDir = tempDir;
  execFileSync(
    'npx',
    [
      'tsc',
      'src/common/pipes/zod-validation.pipe.ts',
      '--outDir',
      outDir,
      '--module',
      'commonjs',
      '--target',
      'es2022',
      '--moduleResolution',
      'node',
      '--skipLibCheck',
      '--experimentalDecorators',
      '--emitDecoratorMetadata',
    ],
    { cwd: process.cwd(), stdio: 'pipe' },
  );
  const pipeMod = require(join(outDir, 'zod-validation.pipe.js'));
  ZodValidationPipe = pipeMod.ZodValidationPipe;
});

after(() => {
  if (tempDir) {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
});

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    email: z.string().email(),
    age: z.number().min(18),
  });

  it('passes valid input and returns parsed data', () => {
    const pipe = new ZodValidationPipe(testSchema);
    const valid = { email: 'admin@palnadu.dev', age: 25 };
    const result = pipe.transform(valid);
    assert.deepEqual(result, valid);
  });

  it('throws BadRequestException with field path on validation failure', () => {
    const pipe = new ZodValidationPipe(testSchema);
    const invalid = { email: 'not-an-email', age: 12 };
    assert.throws(
      () => pipe.transform(invalid),
      (err) => {
        assert.equal(err.name, 'BadRequestException');
        assert.match(err.message, /email/);
        return true;
      },
    );
  });

  it('rejects null or non-object values when an object is expected', () => {
    const pipe = new ZodValidationPipe(testSchema);
    assert.throws(
      () => pipe.transform(null),
      (err) => {
        assert.equal(err.name, 'BadRequestException');
        return true;
      },
    );
  });
});
