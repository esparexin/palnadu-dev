import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { mapAutomationGenerationError } from '../src/automation/automation-error.util.ts';

describe('Blog Automation Error Mapping (HTTP 400, 409, 503, 500)', () => {
  it('maps in-flight topic claim concurrency collisions to 409 ConflictException', () => {
    assert.throws(
      () =>
        mapAutomationGenerationError(
          new Error('Topic subject-school-mgmt (te) is already claimed by another worker.'),
        ),
      (err) => err instanceof ConflictException && err.getStatus() === 409,
    );
  });

  it('maps unique constraint race collisions (P2002) to 409 ConflictException', () => {
    assert.throws(
      () => mapAutomationGenerationError(new Error('P2002 Unique constraint failed on topicKey')),
      (err) => err instanceof ConflictException && err.getStatus() === 409,
    );
  });

  it('maps Gemini quota exhaustion (429 / RESOURCE_EXHAUSTED) to 503 ServiceUnavailableException', () => {
    assert.throws(
      () =>
        mapAutomationGenerationError(
          new Error('LLM generation failed [429]: Gemini quota exhausted for primary model; topic remains retryable.'),
        ),
      (err) => err instanceof ServiceUnavailableException && err.getStatus() === 503,
    );
  });

  it('maps temporary Gemini model high demand (503) to 503 ServiceUnavailableException', () => {
    assert.throws(
      () =>
        mapAutomationGenerationError(
          new Error('LLM generation failed [503]: The model is overloaded. Please try again later.'),
        ),
      (err) => err instanceof ServiceUnavailableException && err.getStatus() === 503,
    );
  });

  it('maps unconfigured LLM provider to 503 ServiceUnavailableException', () => {
    assert.throws(
      () =>
        mapAutomationGenerationError(
          new Error('LLM generation failed [UNCONFIGURED]: No configured LLM provider produced a valid article draft.'),
        ),
      (err) => err instanceof ServiceUnavailableException && err.getStatus() === 503,
    );
  });

  it('maps genuine content validation failure to 400 BadRequestException', () => {
    assert.throws(
      () =>
        mapAutomationGenerationError(
          new Error('validation: word_count (expected >= 800, got 520); primary_keyword_density'),
        ),
      (err) => err instanceof BadRequestException && err.getStatus() === 400,
    );
  });

  it('maps missing category slug failure to 400 BadRequestException', () => {
    assert.throws(
      () => mapAutomationGenerationError(new Error('no_category: no blog category "non-existent-cat".')),
      (err) => err instanceof BadRequestException && err.getStatus() === 400,
    );
  });

  it('redacts sensitive Google API keys from error messages before throwing', () => {
    const rawKey = 'AIzaSyD-fakeKeyForTestingOnly123456';
    try {
      mapAutomationGenerationError(new Error(`Failed to call Gemini using key ${rawKey}`));
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(!err.message.includes(rawKey), 'API key must be redacted from message');
      assert.ok(err.message.includes('[REDACTED_KEY]'), 'Message should indicate key was redacted');
    }
  });

  it('maps unexpected internal errors to 500 InternalServerErrorException', () => {
    assert.throws(
      () => mapAutomationGenerationError(new Error('Database disk I/O fault while writing chunks')),
      (err) => err instanceof InternalServerErrorException && err.getStatus() === 500,
    );
  });

  it('re-throws existing HttpExceptions without alteration', () => {
    const custom = new BadRequestException('Custom validation message');
    assert.throws(
      () => mapAutomationGenerationError(custom),
      (err) => err === custom,
    );
  });
});
