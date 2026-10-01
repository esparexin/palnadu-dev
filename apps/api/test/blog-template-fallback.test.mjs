import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Template-fallback detection.
 *
 * The fallback path in ContentResearchService emits one fixed body for every
 * topic, substituting only the title and location. If two topics produce the
 * same body, publishing them would create many distinct URLs carrying identical
 * content — the bulk-generated pattern Google classifies as scaled content
 * abuse. These tests assert the generator can be *identified* as a template
 * producer, so the publish step can force DRAFT.
 */

let source;
before(() => {
  source = readFileSync('src/automation/content-research.service.ts', 'utf8');
});

/** Extract the fallback template body from the real source. */
function extractFallbackTemplate() {
  const match = source.match(/const content = `# ([\s\S]*?)`;/);
  assert.ok(match, 'fallback template literal not found in source');
  return match[1];
}

/** Substitute the two variables the template interpolates. */
function render(template, topicTitle, locationContext) {
  return template
    .replace(/\$\{topicTitle\}/g, topicTitle)
    .replace(/\$\{locationContext\}/g, locationContext);
}

describe('fallback template is a single shared body', () => {
  it('renders byte-identical bodies for unrelated topics', () => {
    const template = extractFallbackTemplate();

    const a = render(template, 'Website Development Cost in Guntur', 'Guntur, Andhra Pradesh');
    const b = render(template, 'Rice Mill Software in Sattenapalli', 'Sattenapalli, Andhra Pradesh');
    const c = render(template, 'School Admission Portal', 'Narasaraopet, Andhra Pradesh');

    // Bodies differ only where a variable was substituted. Strip the interpolated
    // spans and the remainder must be identical.
    const strip = (s) => s.replace(/Website Development Cost in Guntur|Rice Mill Software in Sattenapalli|School Admission Portal/g, 'X').replace(/Guntur, Andhra Pradesh|Sattenapalli, Andhra Pradesh|Narasaraopet, Andhra Pradesh/g, 'L');

    assert.equal(strip(a), strip(b), 'two unrelated topics produce the same template body');
    assert.equal(strip(a), strip(c), 'and so does the third');
  });

  it('interpolates only the topic and location, nothing else', () => {
    const template = extractFallbackTemplate();
    const vars = [...template.matchAll(/\$\{(\w+)\}/g)].map((m) => m[1]);
    assert.deepEqual(
      [...new Set(vars)].sort(),
      ['locationContext', 'topicTitle'],
      'only topic and location may vary in the fallback body',
    );
  });

  it('is flagged as a fallback in both return paths', () => {
    // The LLM path must be explicitly marked NOT a fallback, and the template
    // path explicitly marked as one. Both flags exist in the source.
    assert.match(source, /isTemplateFallback:\s*false/, 'LLM path should set false');
    assert.match(source, /isTemplateFallback:\s*true/, 'template path should set true');
  });
});

describe('template output cannot auto-publish', () => {
  it('publish step honours forceDraft over the auto-publish setting', () => {
    const service = readFileSync('src/automation/blog-automation.service.ts', 'utf8');

    // The publish decision must reference forceDraft and downgrade to DRAFT.
    assert.match(
      service,
      /if \(validation\.forceDraft\)/,
      'publish step must check validation.forceDraft',
    );
    assert.match(
      service,
      /forcing DRAFT despite auto-publish/,
      'should log that auto-publish was overridden',
    );
    assert.match(
      service,
      /shouldPublish = false;[\s\S]{0,80}const publishStatus/,
      'forceDraft must set shouldPublish false before deriving publishStatus',
    );
  });

  it('raises a distinct alert so the operator knows to rewrite', () => {
    const service = readFileSync('src/automation/blog-automation.service.ts', 'utf8');
    assert.match(
      service,
      /Automated Blog Needs Rewriting \(LLM Fallback\)/,
      'template output should produce its own notification title',
    );
    assert.match(service, /templateFallback:\s*validation\.forceDraft/, 'notification should carry the flag');
  });

  it('validation treats template output as a blocking originality failure', () => {
    const rules = readFileSync('src/automation/seo-validation-rules.ts', 'utf8');
    assert.match(
      rules,
      /passed: !tooShort && !stuffed && !isTemplate/,
      'content_originality must fail for template output',
    );
  });
});