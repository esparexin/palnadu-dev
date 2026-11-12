import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAutomationErrorMessage,
  formatQueueTopicError,
} from './blog-queue.util.ts';

describe('Blog Queue Diagnostic Helpers', () => {
  it('normalizes persisted lastError strings and ignores blank values', () => {
    assert.equal(formatQueueTopicError(null), null);
    assert.equal(formatQueueTopicError(undefined), null);
    assert.equal(formatQueueTopicError('   \n\t  '), null);
    assert.equal(
      formatQueueTopicError('  LLM generation failed [QUOTA_EXCEEDED]:\n  quota exhausted  '),
      'LLM generation failed [QUOTA_EXCEEDED]: quota exhausted',
    );
  });

  it('extracts Error and string messages with safe fallback', () => {
    assert.equal(
      extractAutomationErrorMessage(
        new Error('  LLM generation failed [MODEL_ACCESS_DENIED]: 404  '),
        'Fallback error',
      ),
      'LLM generation failed [MODEL_ACCESS_DENIED]: 404',
    );
    assert.equal(
      extractAutomationErrorMessage('  validation: content_similarity  ', 'Fallback error'),
      'validation: content_similarity',
    );
    assert.equal(extractAutomationErrorMessage(new Error('   '), 'Fallback error'), 'Fallback error');
    assert.equal(extractAutomationErrorMessage(null, 'Fallback error'), 'Fallback error');
  });
});

