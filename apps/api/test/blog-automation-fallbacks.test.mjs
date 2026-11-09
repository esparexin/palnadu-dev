import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runValidation as run } from './blog-automation-validation-fixtures.mjs';

describe('publishing fallbacks and language validation', () => {
  it('blocks a template-fallback draft from being published', () => {
    const outcome = run({ isTemplateFallback: true });
    assert.equal(outcome.passed, false);
    const check = outcome.failures.find((f) => f.name === 'content_originality');
    assert.ok(check, 'originality check should fail for template output');
    assert.match(check.detail, /fallback template/);
  });

  it('signals forceDraft for template output', () => {
    const forced = run({ isTemplateFallback: true });
    assert.equal(forced.forceDraft, true, 'caller must be told to force DRAFT');

    const normal = run();
    assert.equal(normal.forceDraft, false);
  });

  it('records the template decision as a non-blocking advisory', () => {
    const outcome = run({ isTemplateFallback: true });
    const marker = outcome.checks.find((c) => c.name === 'template_fallback_marker');
    assert.ok(marker, 'marker check should be present');
    assert.equal(marker.blocking, false, 'marker is advisory, not a second gate');
    assert.equal(marker.passed, false);
  });

  it('an LLM draft passes originality even with identical structure', () => {
    const outcome = run({ isTemplateFallback: false });
    assert.equal(outcome.passed, true, outcome.summary);
  });

  it('passes a genuinely Telugu draft on script coverage', () => {
    const teBody = Array.from(
      { length: 40 },
      () => 'గుంటూర్‌లో వ్యాపారం కోసం వెబ్‌సైట్ ఖర్చు గురించి వివరంగా మాట్లాడుకుందాం Palnadu.dev.',
    ).join(' ');
    const outcome = run(
      {
        title: 'గుంటూర్‌లో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత?',
        content: teBody,
        primaryKeyword: 'వెబ్‌సైట్ ఖర్చు',
        secondaryKeywords: ['గుంటూర్ ధర'],
      },
      { language: 'te' },
    );
    const check = outcome.checks.find((c) => c.name === 'telugu_script_coverage');
    assert.ok(check, 'script coverage check should run for te drafts');
    assert.equal(check.blocking, true);
    assert.equal(check.passed, true, check.detail);
  });

  it('blocks an English body saved under a Telugu tag', () => {
    const outcome = run(
      {
        title: 'Website Development Cost in Guntur',
        content: Array.from({ length: 40 }, () => 'Website development cost in Guntur depends on features.').join(
          ' ',
        ),
      },
      { language: 'te' },
    );
    const check = outcome.checks.find((c) => c.name === 'telugu_script_coverage');
    assert.ok(check, 'script coverage check should run for te drafts');
    assert.equal(check.passed, false);
    assert.match(check.detail, /not Telugu/);
  });

  it('skips the script check entirely for English drafts', () => {
    for (const language of [undefined, 'en']) {
      const outcome = run({}, language === undefined ? {} : { language });
      const check = outcome.checks.find((c) => c.name === 'telugu_script_coverage');
      assert.equal(check, undefined, 'no script check outside te drafts');
    }
  });
});
