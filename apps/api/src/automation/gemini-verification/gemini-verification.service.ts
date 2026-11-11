import { Injectable, Logger } from '@nestjs/common';
import {
  GeminiKeyVerificationResult,
  ModelAccessStatus,
  VerifyKeyOptions,
} from './gemini-verification.types';
import {
  maskApiKey,
  sanitizeErrorMessage,
  parseGoogleError,
  extractProjectIdentity,
  extractAccountIdentity,
} from './gemini-verification.util';
import { DEFAULT_GEMINI_MODELS } from '../content-research/llm-provider';

@Injectable()
export class GeminiKeyVerificationService {
  private readonly logger = new Logger(GeminiKeyVerificationService.name);

  async verifyKey(
    apiKey: string,
    options: VerifyKeyOptions = {},
  ): Promise<GeminiKeyVerificationResult> {
    const fetchImpl = options.fetchFn ?? globalThis.fetch;
    const timeoutMs = options.timeoutMs ?? 30000;
    const trimmedKey = (apiKey || '').trim();
    const masked = maskApiKey(trimmedKey);
    const verifiedAt = new Date().toISOString();

    if (!trimmedKey) {
      return {
        isValid: false,
        isUsableForGeneration: false,
        verificationStatus: 'Invalid Key',
        maskedKey: '',
        project: { id: null, name: null, status: 'Unavailable' },
        account: { email: null, status: 'Account Identity Unavailable' },
        models: { tested: [], supportedCount: 0 },
        quota: { status: 'Unknown', detail: 'Empty API key provided' },
        permissions: { status: 'Denied', detail: 'No key provided' },
        verifiedAt,
        errorMessage: 'API key cannot be empty',
      };
    }

    try {
      // 1. Probe ModelService to check key validity and model listings
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`;
      const listRes = await fetchImpl(listUrl, {
        signal: AbortSignal.timeout(timeoutMs),
      });

      const listHeaders = listRes.headers;
      let listJson: any = null;
      try {
        listJson = await listRes.json();
      } catch {
        listJson = null;
      }

      if (!listRes.ok) {
        const parsed = parseGoogleError(listRes.status, listJson);
        const project = extractProjectIdentity(listHeaders, listJson);
        const account = extractAccountIdentity(trimmedKey);

        this.logger.warn(`Gemini verification for key ${masked} returned ${listRes.status}: ${parsed.status}`);
        return {
          isValid: false,
          isUsableForGeneration: false,
          verificationStatus: parsed.status,
          maskedKey: masked,
          project,
          account,
          models: { tested: [], supportedCount: 0 },
          quota: { status: parsed.quotaStatus, detail: parsed.detail },
          permissions: { status: parsed.permissionStatus, detail: parsed.detail },
          verifiedAt,
          errorMessage: parsed.detail,
        };
      }

      // 2. Discover supported models
      const modelsList: any[] = Array.isArray(listJson?.models) ? listJson.models : [];
      const supportedModelNames = new Set(
        modelsList
          .filter((m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map((m) => (m.name || '').replace('models/', '')),
      );

      // 3. Test generation capability on primary and fallback models
      const modelsToTest = options.testModels && options.testModels.length > 0
        ? options.testModels
        : [DEFAULT_GEMINI_MODELS[0], DEFAULT_GEMINI_MODELS[DEFAULT_GEMINI_MODELS.length - 1]];

      const testedResults: ModelAccessStatus[] = [];
      let atLeastOneModelUsable = false;
      let lastHeaders = listHeaders;
      let quotaStatus: 'Active' | 'Quota Exceeded' | 'Billing Restricted' | 'Unknown' = 'Active';
      let permissionStatus: 'Granted' | 'Restricted' | 'Denied' = 'Granted';
      let genErrorMessage: string | undefined;

      for (const model of modelsToTest) {
        const start = Date.now();
        const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(trimmedKey)}`;

        try {
          const genRes = await fetchImpl(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
            signal: AbortSignal.timeout(timeoutMs),
          });
          lastHeaders = genRes.headers;
          let genJson: any = null;
          try {
            genJson = await genRes.json();
          } catch {
            genJson = null;
          }

          if (genRes.ok) {
            atLeastOneModelUsable = true;
            testedResults.push({
              model,
              accessible: true,
              latencyMs: Date.now() - start,
            });
          } else {
            const parsed = parseGoogleError(genRes.status, genJson);
            if (parsed.quotaStatus === 'Quota Exceeded') quotaStatus = 'Quota Exceeded';
            if (parsed.quotaStatus === 'Billing Restricted') quotaStatus = 'Billing Restricted';
            if (parsed.permissionStatus === 'Denied') permissionStatus = 'Denied';
            genErrorMessage = parsed.detail;
            testedResults.push({
              model,
              accessible: false,
              latencyMs: Date.now() - start,
              error: parsed.detail,
            });
          }
        } catch (err) {
          testedResults.push({
            model,
            accessible: false,
            latencyMs: Date.now() - start,
            error: sanitizeErrorMessage(err, trimmedKey),
          });
        }
      }

      const project = extractProjectIdentity(lastHeaders, listJson);
      const account = extractAccountIdentity(trimmedKey);

      let verificationStatus: GeminiKeyVerificationResult['verificationStatus'] = 'Verified';
      if (!atLeastOneModelUsable) {
        if (quotaStatus === 'Quota Exceeded') verificationStatus = 'Quota Exceeded';
        else if (permissionStatus === 'Denied') verificationStatus = 'Permission Denied';
        else verificationStatus = 'Verification Failed';
      } else if (project.status === 'Project Not Identified') {
        verificationStatus = 'Partially Verified';
      }

      return {
        isValid: true,
        isUsableForGeneration: atLeastOneModelUsable,
        verificationStatus,
        maskedKey: masked,
        project,
        account,
        models: {
          tested: testedResults,
          supportedCount: supportedModelNames.size,
        },
        quota: {
          status: quotaStatus,
          detail: quotaStatus === 'Active' ? 'Standard API quotas active' : genErrorMessage,
        },
        permissions: {
          status: permissionStatus,
          detail: permissionStatus === 'Granted' ? 'API access confirmed' : genErrorMessage,
        },
        verifiedAt,
        errorMessage: atLeastOneModelUsable ? undefined : genErrorMessage,
      };
    } catch (err) {
      const sanitized = sanitizeErrorMessage(err, trimmedKey);
      this.logger.error(`Network or execution error verifying key ${masked}: ${sanitized}`);
      return {
        isValid: false,
        isUsableForGeneration: false,
        verificationStatus: 'Verification Failed',
        maskedKey: masked,
        project: { id: null, name: null, status: 'Unavailable' },
        account: { email: null, status: 'Account Identity Unavailable' },
        models: { tested: [], supportedCount: 0 },
        quota: { status: 'Unknown' },
        permissions: { status: 'Denied', detail: sanitized },
        verifiedAt,
        errorMessage: sanitized,
      };
    }
  }
}

