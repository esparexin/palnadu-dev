import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DEFAULT_GEMINI_MODELS } from '@palnadu/types';
import { PrismaService } from '../../prisma.service';
import { GeminiKeyVerificationService } from './gemini-verification.service';
import { encryptSecret, decryptSecret, validateEncryptionConfig } from './gemini-crypto.util';
import {
  SETTING_KEY_ENCRYPTED,
  buildDatabaseKeyStatus,
  buildEnvKeyStatus,
  buildUnconfiguredKeyStatus,
  type StoredEncryptedRecord,
} from './gemini-key-store.types';
import {
  clearPendingCandidate,
  decryptPendingRecord,
  readPendingCandidateRecord,
  savePendingCandidate,
  toPendingCandidateSummary,
} from './gemini-pending-store.util';
import { appendGeminiAuditEntry, readGeminiAuditLog } from './gemini-audit-store.util';
import type {
  ActiveGeminiKeySummary,
  GeminiKeyAuditEntry,
  GeminiKeyVerificationResult,
} from './gemini-verification.types';

@Injectable()
export class GeminiKeyStoreService implements OnModuleInit {
  private readonly logger = new Logger(GeminiKeyStoreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: GeminiKeyVerificationService,
  ) {}

  onModuleInit() {
    const config = validateEncryptionConfig();
    this.logger.log(`Gemini encryption key initialized (source: ${config.keySource})`);
  }

  async getActiveKeyStatus(): Promise<ActiveGeminiKeySummary> {
    const [record, pendingRaw] = await Promise.all([
      this.prisma.siteSetting.findUnique({ where: { key: SETTING_KEY_ENCRYPTED } }),
      readPendingCandidateRecord(this.prisma),
    ]);
    const pending = toPendingCandidateSummary(pendingRaw);
    if (record?.value) {
      return buildDatabaseKeyStatus(record.value as unknown as StoredEncryptedRecord, pending);
    }
    const envKey = process.env.GEMINI_API_KEY?.trim();
    if (envKey) return buildEnvKeyStatus(envKey, pending);
    return buildUnconfiguredKeyStatus(pending);
  }

  async verifyCandidateKey(
    apiKey: string,
    actor: string = 'admin',
    primaryModel?: string,
  ): Promise<GeminiKeyVerificationResult> {
    const result = await this.verificationService.verifyKey(apiKey, {
      primaryModel: primaryModel?.trim() || undefined,
    });
    if (!result.isUsableForGeneration && result.isTemporary && result.isValid) {
      await this.preserveTemporaryCandidate(apiKey, actor, result, primaryModel);
    }
    await appendGeminiAuditEntry(this.prisma, {
      action: 'VERIFICATION_PROBE',
      actor,
      maskedKey: result.maskedKey,
      status: result.verificationStatus,
      verificationCode: result.verificationCode,
      isTemporary: result.isTemporary,
      projectId: result.project.id,
      reason: result.errorMessage || (result.isValid ? 'Probe successful' : 'Probe failed'),
    }, this.logger);
    return result;
  }

  async activateKey(
    apiKey: string,
    actor: string = 'admin',
    primaryModel?: string,
  ): Promise<ActiveGeminiKeySummary> {
    const result = await this.verificationService.verifyKey(apiKey, {
      primaryModel: primaryModel?.trim() || undefined,
    });
    if (!result.isValid || !result.isUsableForGeneration) {
      if (result.isTemporary && result.isValid) {
        await this.preserveTemporaryCandidate(apiKey, actor, result, primaryModel);
      }
      await appendGeminiAuditEntry(this.prisma, {
        action: 'KEY_ACTIVATION_REJECTED',
        actor,
        maskedKey: result.maskedKey,
        status: result.verificationStatus,
        verificationCode: result.verificationCode,
        isTemporary: result.isTemporary,
        projectId: result.project.id,
        reason: result.errorMessage || `Key unusable (status: ${result.verificationStatus})`,
      }, this.logger);
      const pendingNote = result.isTemporary && result.isValid
        ? ' Candidate preserved securely as PENDING_VERIFICATION.' : '';
      throw new BadRequestException(
        `Gemini API key activation rejected: ${result.verificationStatus} (${result.verificationCode}). ` +
          `${result.errorMessage || 'Key is not authorized or quota exceeded.'}${pendingNote} Existing key preserved.`,
      );
    }
    return this.persistActivatedKey(apiKey, result, actor, primaryModel);
  }

  async retryPendingVerification(
    actor: string = 'admin',
    primaryModelOverride?: string,
    activateOnSuccess: boolean = false,
  ): Promise<{ verification: GeminiKeyVerificationResult; activated?: ActiveGeminiKeySummary }> {
    const pending = await readPendingCandidateRecord(this.prisma);
    if (!pending) throw new BadRequestException('No pending Gemini API candidate key is stored for retry.');
    const decryptedKey = decryptPendingRecord(pending);
    if (!decryptedKey) throw new BadRequestException('Stored pending Gemini candidate could not be decrypted.');

    const targetModel = primaryModelOverride?.trim() || pending.primaryModel;
    const result = await this.verificationService.verifyKey(decryptedKey, { primaryModel: targetModel });
    await appendGeminiAuditEntry(this.prisma, {
      action: 'PENDING_VERIFICATION_RETRIED',
      actor,
      maskedKey: result.maskedKey,
      status: result.verificationStatus,
      verificationCode: result.verificationCode,
      isTemporary: result.isTemporary,
      projectId: result.project.id,
      reason: result.errorMessage || 'Pending candidate retry completed.',
    }, this.logger);

    if (result.isValid && result.isUsableForGeneration) {
      if (activateOnSuccess) {
        return { verification: result, activated: await this.persistActivatedKey(decryptedKey, result, actor, targetModel) };
      }
      await clearPendingCandidate(this.prisma, actor);
      return { verification: result };
    }
    if (result.isTemporary && result.isValid) {
      await savePendingCandidate({
        prisma: this.prisma,
        apiKey: decryptedKey,
        actor,
        primaryModel: targetModel,
        result,
        previousAttempts: pending.attemptCount || 1,
        previousSubmittedAt: pending.submittedAt,
      });
      result.pendingPreserved = true;
    } else {
      await clearPendingCandidate(this.prisma, actor);
    }
    return { verification: result };
  }

  private async preserveTemporaryCandidate(
    apiKey: string,
    actor: string,
    result: GeminiKeyVerificationResult,
    primaryModel?: string,
  ): Promise<void> {
    await savePendingCandidate({ prisma: this.prisma, apiKey, actor, primaryModel, result });
    result.pendingPreserved = true;
    await appendGeminiAuditEntry(this.prisma, {
      action: 'KEY_PENDING_VERIFICATION',
      actor,
      maskedKey: result.maskedKey,
      status: 'Pending Verification',
      verificationCode: 'PENDING_VERIFICATION',
      isTemporary: true,
      projectId: result.project.id,
      reason: result.errorMessage || 'Temporary model capacity error; candidate preserved.',
    }, this.logger);
  }

  private async persistActivatedKey(
    apiKey: string,
    result: GeminiKeyVerificationResult,
    actor: string,
    requestedModel?: string,
  ): Promise<ActiveGeminiKeySummary> {
    const encrypted = encryptSecret(apiKey);
    const selectedModel =
      result.activeUsableModel || requestedModel?.trim() || result.models.tested[0]?.model || DEFAULT_GEMINI_MODELS[0];
    const storedRecord: StoredEncryptedRecord = {
      ...encrypted,
      maskedKey: result.maskedKey,
      verificationResult: result,
      primaryModel: selectedModel,
      activatedAt: new Date().toISOString(),
      activatedBy: actor,
    };
    await this.prisma.siteSetting.upsert({
      where: { key: SETTING_KEY_ENCRYPTED },
      update: { value: storedRecord as any, updatedBy: actor, description: 'Encrypted Gemini API Key with project metadata' },
      create: { key: SETTING_KEY_ENCRYPTED, value: storedRecord as any, updatedBy: actor, description: 'Encrypted Gemini API Key with project metadata' },
    });
    await clearPendingCandidate(this.prisma, actor).catch(() => undefined);
    await appendGeminiAuditEntry(this.prisma, {
      action: 'KEY_ACTIVATION_SUCCESS',
      actor,
      maskedKey: result.maskedKey,
      status: result.verificationStatus,
      verificationCode: result.verificationCode,
      isTemporary: false,
      projectId: result.project.id,
      reason: `Activated key successfully (model: ${selectedModel}, fallbackUsed: ${result.fallbackUsed}, project: ${result.project.id || 'N/A'}).`,
    }, this.logger);
    return this.getActiveKeyStatus();
  }

  async getDecryptedActiveKey(): Promise<string | undefined> {
    try {
      const record = await this.prisma.siteSetting.findUnique({ where: { key: SETTING_KEY_ENCRYPTED } });
      if (record?.value) {
        const data = record.value as unknown as StoredEncryptedRecord;
        if (data.ciphertext && data.iv && data.authTag) {
          return decryptSecret({ ciphertext: data.ciphertext, iv: data.iv, authTag: data.authTag });
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to decrypt database Gemini key: ${err?.message || err}`);
    }
    return process.env.GEMINI_API_KEY?.trim() || undefined;
  }

  async getActiveModel(): Promise<string | undefined> {
    try {
      const record = await this.prisma.siteSetting.findUnique({ where: { key: SETTING_KEY_ENCRYPTED } });
      if (record?.value) {
        const data = record.value as unknown as StoredEncryptedRecord;
        if (data.primaryModel) return data.primaryModel;
      }
    } catch { /* non-fatal */ }
    return process.env.GEMINI_MODEL?.trim() || undefined;
  }

  async getAuditLog(limit: number = 20): Promise<GeminiKeyAuditEntry[]> {
    return readGeminiAuditLog(this.prisma, limit);
  }
}
