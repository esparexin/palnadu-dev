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

  describe('Automation Schemas', () => {
    it('validates automationGenerateSchema with defaults and bounds', async () => {
      const { automationGenerateSchema } = await import('@palnadu/validation');
      const pipe = new ZodValidationPipe(automationGenerateSchema);

      const parsed = pipe.transform({});
      assert.equal(parsed.forcePublish, false);
      assert.equal(parsed.batchCount, 1);
      assert.equal(parsed.language, 'en');

      assert.throws(
        () => pipe.transform({ batchCount: 0 }),
        (err) => err.name === 'BadRequestException',
      );
      assert.throws(
        () => pipe.transform({ batchCount: 100 }),
        (err) => err.name === 'BadRequestException',
      );
      assert.throws(
        () => pipe.transform({ language: 'fr' }),
        (err) => err.name === 'BadRequestException',
      );
    });

    it('validates automationSettingsSchema strictly', async () => {
      const { automationSettingsSchema } = await import('@palnadu/validation');
      const pipe = new ZodValidationPipe(automationSettingsSchema);

      assert.deepEqual(pipe.transform({ autoPublish: true }), { autoPublish: true });
      assert.deepEqual(pipe.transform({ autoPublish: false }), { autoPublish: false });

      assert.throws(
        () => pipe.transform({ autoPublish: 'true' }),
        (err) => err.name === 'BadRequestException',
      );
    });

    it('validates automationBilingualSchema refinement and quota constraints', async () => {
      const { automationBilingualSchema } = await import('@palnadu/validation');
      const pipe = new ZodValidationPipe(automationBilingualSchema);

      assert.deepEqual(pipe.transform({ enabled: true, te: 3, en: 2 }), {
        enabled: true,
        te: 3,
        en: 2,
      });

      // Refusal when completely empty
      assert.throws(
        () => pipe.transform({}),
        (err) => err.name === 'BadRequestException',
      );

      // Refusal on negative quota
      assert.throws(
        () => pipe.transform({ te: -1 }),
        (err) => err.name === 'BadRequestException',
      );
    });

    it('validates automationDiscoverSchema bounds', async () => {
      const { automationDiscoverSchema } = await import('@palnadu/validation');
      const pipe = new ZodValidationPipe(automationDiscoverSchema);

      assert.equal(pipe.transform({}).limit, 40);
      assert.equal(pipe.transform({ limit: 25 }).limit, 25);

      assert.throws(
        () => pipe.transform({ limit: 0 }),
        (err) => err.name === 'BadRequestException',
      );
      assert.throws(
        () => pipe.transform({ limit: 200 }),
        (err) => err.name === 'BadRequestException',
      );
    });
  });
});
