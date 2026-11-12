import { Injectable, Logger } from '@nestjs/common';
import {
  GeminiAuthenticationStatus,
  GeminiKeyVerificationResult,
  ModelAccessStatus,
  VerifyKeyOptions,
} from './gemini-verification.types';
import {
  buildOrderedGeminiModels,
  computeModelProbeDeadline,
  executeWithGeminiRetry,
} from './gemini-retry.util';
import type { ParsedGoogleFailure } from './gemini-error-classifier.util';
import {
  buildEmptyKeyResult,
  buildVerificationResult,
  mergeProjectIdentity,
  resolveOverallFailureCode,
} from './gemini-verification-summary.util';
import { maskApiKey, sanitizeErrorMessage } from './gemini-verification.util';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

@Injectable()
export class GeminiKeyVerificationService {
  private readonly logger = new Logger(GeminiKeyVerificationService.name);

  async verifyKey(
    rawKey: string,
    options: VerifyKeyOptions = {},
  ): Promise<GeminiKeyVerificationResult> {
    const trimmedKey = (rawKey || '').trim();
    if (!trimmedKey) return buildEmptyKeyResult();

    const fetchFn = options.fetchFn || globalThis.fetch;
    const nowFn = options.retry?.nowFn ?? Date.now;
    const deadlineAt =
      options.retry?.deadlineAt ??
      (options.overallTimeoutMs && options.overallTimeoutMs > 0 ? nowFn() + options.overallTimeoutMs : undefined);
    const retryWithDeadline = deadlineAt !== undefined ? { ...options.retry, deadlineAt, nowFn } : options.retry;
    const identityCandidates: Array<{ headers?: Headers; body?: any }> = [];
    let authenticationStatus: GeminiAuthenticationStatus = 'UNVERIFIED';
    let isValid = false;
    let supportedModelsCount = 0;
    let listFailure: ParsedGoogleFailure | null = null;

    const listOutcome = await executeWithGeminiRetry<any>({
      fetchFn,
      url: `${GEMINI_BASE_URL}/models?key=${encodeURIComponent(trimmedKey)}`,
      init: { method: 'GET' },
      stage: 'list_models',
      rawSecretToRedact: trimmedKey,
      retry: retryWithDeadline,
    });
    identityCandidates.push({ headers: listOutcome.headers, body: listOutcome.body });

    if (listOutcome.ok) {
      authenticationStatus = 'AUTHENTICATED';
      isValid = true;
      const models = Array.isArray(listOutcome.body?.models) ? listOutcome.body.models : [];
      supportedModelsCount = models.filter((m: any) =>
        m.supportedGenerationMethods?.includes('generateContent'),
      ).length;
    } else if (listOutcome.failure) {
      listFailure = listOutcome.failure;
      if (listFailure.code === 'INVALID_API_KEY') {
        authenticationStatus = 'INVALID_KEY';
        isValid = false;
      } else if (listFailure.code === 'PERMISSION_DENIED') {
        authenticationStatus = 'PERMISSION_DENIED';
        isValid = true;
      } else {
        authenticationStatus = 'TEMPORARY_ERROR';
        isValid = true;
      }

      if (listFailure.stopAllModels) {
        return buildVerificationResult({
          trimmedKey,
          atLeastOneModelUsable: false,
          authenticationStatus,
          isValid,
          project: mergeProjectIdentity(identityCandidates),
          testedModels: [],
          supportedModelsCount: 0,
          fallbackUsed: false,
          activeUsableModel: null,
          dominantFailure: listFailure,
        });
      }
    }

    const modelsToTest =
      options.testModels && options.testModels.length > 0
        ? options.testModels
        : buildOrderedGeminiModels(options.primaryModel);

    const testedModels: ModelAccessStatus[] = [];
    const modelFailures: ParsedGoogleFailure[] = [];
    let atLeastOneModelUsable = false;
    let activeUsableModel: string | null = null;
    let fallbackUsed = false;

    for (let i = 0; i < modelsToTest.length; i++) {
      if (deadlineAt !== undefined && nowFn() >= deadlineAt - 200) break;
      const model = modelsToTest[i];
      const modelDeadlineAt = computeModelProbeDeadline({
        deadlineAt,
        nowMs: nowFn(),
        remainingModels: modelsToTest.length - i,
      });
      const modelRetry =
        modelDeadlineAt !== undefined
          ? { ...(retryWithDeadline ?? {}), deadlineAt: modelDeadlineAt, nowFn }
          : retryWithDeadline;
      const genOutcome = await executeWithGeminiRetry<any>({
        fetchFn,
        url: `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Reply with OK.' }] }],
            generationConfig: { maxOutputTokens: 8, temperature: 0 },
          }),
        },
        stage: 'generate',
        rawSecretToRedact: trimmedKey,
        retry: modelRetry,
      });

      identityCandidates.push({ headers: genOutcome.headers, body: genOutcome.body });

      if (genOutcome.ok) {
        const text = genOutcome.body?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === 'string' && text.trim().length > 0) {
          testedModels.push({
            model,
            accessible: true,
            latencyMs: genOutcome.latencyMs,
            attempts: genOutcome.attempts,
            statusCode: 'VERIFIED',
            isTemporary: false,
          });
          atLeastOneModelUsable = true;
          activeUsableModel = model;
          fallbackUsed = i > 0;
          authenticationStatus = 'AUTHENTICATED';
          isValid = true;
          break;
        }

        const emptyErr: ParsedGoogleFailure = {
          code: 'TEMPORARY_PROVIDER_ERROR',
          status: 'Temporary Provider Error',
          quotaStatus: 'Active',
          permissionStatus: 'Granted',
          isTemporary: true,
          retryable: false,
          modelSpecific: true,
          stopAllModels: false,
          detail: 'Model returned an empty generation payload.',
        };
        modelFailures.push(emptyErr);
        testedModels.push({
          model,
          accessible: false,
          latencyMs: genOutcome.latencyMs,
          attempts: genOutcome.attempts,
          statusCode: emptyErr.code,
          failureCategory: emptyErr.code,
          isTemporary: true,
          error: emptyErr.detail,
        });
        continue;
      }

      const failure = genOutcome.failure!;
      modelFailures.push(failure);
      testedModels.push({
        model,
        accessible: false,
        latencyMs: genOutcome.latencyMs,
        attempts: genOutcome.attempts,
        statusCode: failure.code,
        failureCategory: failure.code,
        isTemporary: failure.isTemporary,
        error: sanitizeErrorMessage(failure.detail, trimmedKey),
      });

      if (failure.stopAllModels) {
        if (failure.code === 'INVALID_API_KEY') {
          authenticationStatus = 'INVALID_KEY';
          isValid = false;
        } else if (failure.code === 'PERMISSION_DENIED') {
          authenticationStatus = 'PERMISSION_DENIED';
        }
        break;
      }
    }

    const project = mergeProjectIdentity(identityCandidates);
    const dominantFailure = resolveOverallFailureCode(
      modelFailures.length > 0 ? modelFailures : listFailure ? [listFailure] : [],
    );

    const finalResult = buildVerificationResult({
      trimmedKey,
      atLeastOneModelUsable,
      authenticationStatus,
      isValid,
      project,
      testedModels,
      supportedModelsCount,
      fallbackUsed,
      activeUsableModel,
      dominantFailure,
    });

    this.logger.log(
      `Verification key=${maskApiKey(trimmedKey)} code=${finalResult.verificationCode} usable=${finalResult.isUsableForGeneration} model=${activeUsableModel ?? 'none'} fallback=${fallbackUsed}`,
    );
    return finalResult;
  }
}
