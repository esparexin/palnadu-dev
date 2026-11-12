import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveActivationTarget,
  resolvePreferredActivationModel,
  validateCandidateGeminiInput,
} from './gemini-settings.util.ts';

describe('Admin Gemini Settings Helpers', () => {
  it('accepts valid AIza and AQ keys via shared SSOT validation schema', () => {
    const aiza = validateCandidateGeminiInput(
      '  AIzaSyValidKey1234567890abcdefghij  ',
      '  gemini-3.8-flash  ',
    );
    assert.equal(aiza.ok, true);
    if (aiza.ok) {
      assert.equal(aiza.data.apiKey, 'AIzaSyValidKey1234567890abcdefghij');
      assert.equal(aiza.data.primaryModel, 'gemini-3.8-flash');
    }

    const aq = validateCandidateGeminiInput(
      'AQ.SyntheticTestKeyForValidation1234567890abcdef',
    );
    assert.equal(aq.ok, true);
    if (aq.ok) {
      assert.equal(aq.data.primaryModel, undefined);
    }
  });

  it('rejects empty, malformed, and too-short keys client-side before network calls', () => {
    const empty = validateCandidateGeminiInput('   ');
    assert.equal(empty.ok, false);

    const wrongPrefix = validateCandidateGeminiInput('sk-proj-invalid12345678901234567890');
    assert.equal(wrongPrefix.ok, false);

    const tooShortAq = validateCandidateGeminiInput('AQ.short');
    assert.equal(tooShortAq.ok, false);
  });

  it('resolves activation target cleanly between candidate input and preserved pending key', () => {
    assert.equal(resolveActivationTarget('  AQ.CandidateKey123  ', false), 'candidate');
    assert.equal(resolveActivationTarget('  AQ.CandidateKey123  ', true), 'candidate');
    assert.equal(resolveActivationTarget('   ', true), 'pending');
    assert.equal(resolveActivationTarget('', false), 'none');
  });

  it('prefers verified fallback model for activation when Step 1 proved it usable', () => {
    assert.equal(
      resolvePreferredActivationModel('gemini-3.8-flash', {
        isValid: true,
        isUsableForGeneration: true,
        activeUsableModel: 'gemini-3.1-flash-lite',
      }),
      'gemini-3.1-flash-lite',
    );
    assert.equal(
      resolvePreferredActivationModel('gemini-3.8-flash', {
        isValid: true,
        isUsableForGeneration: false,
        activeUsableModel: null,
      }),
      'gemini-3.8-flash',
    );
    assert.equal(resolvePreferredActivationModel('  gemini-3.6-flash  ', null), 'gemini-3.6-flash');
  });
});
