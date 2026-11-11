import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GeminiKeyVerificationService } from './gemini-verification.service';
import {
  encryptSecret,
  decryptSecret,
  validateEncryptionConfig,
} from './gemini-crypto.util';
import {
  SETTING_KEY_ENCRYPTED,
  SETTING_KEY_AUDIT_LOG,
  MAX_AUDIT_ENTRIES,
  buildAuditEntry,
  buildDatabaseKeyStatus,
  buildEnvKeyStatus,
  buildUnconfiguredKeyStatus,
  type StoredEncryptedRecord,
} from './gemini-key-store.types';
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
    const record = await this.prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY_ENCRYPTED },
    });

    if (record?.value) {
      return buildDatabaseKeyStatus(record.value as unknown as StoredEncryptedRecord);
    }

    const envKey = process.env.GEMINI_API_KEY?.trim();
    if (envKey) {
      return buildEnvKeyStatus(envKey);
    }

    return buildUnconfiguredKeyStatus();
  }

  async verifyCandidateKey(
    apiKey: string,
    actor: string = 'admin',
    primaryModel?: string,
  ): Promise<GeminiKeyVerificationResult> {
    const opts = primaryModel ? { testModels: [primaryModel] } : undefined;
    const result = await this.verificationService.verifyKey(apiKey, opts);

    await this.recordAudit({
      action: 'VERIFICATION_PROBE',
      actor,
      maskedKey: result.maskedKey,
      status: result.verificationStatus,
      projectId: result.project.id,
      reason: result.errorMessage || (result.isValid ? 'Probe successful' : 'Probe failed'),
    });

    return result;
  }

  async activateKey(
    apiKey: string,
    actor: string = 'admin',
    primaryModel?: string,
  ): Promise<ActiveGeminiKeySummary> {
    const opts = primaryModel ? { testModels: [primaryModel] } : undefined;
    const result = await this.verificationService.verifyKey(apiKey, opts);

    if (!result.isValid || !result.isUsableForGeneration) {
      await this.recordAudit({
        action: 'KEY_ACTIVATION_REJECTED',
        actor,
        maskedKey: result.maskedKey,
        status: result.verificationStatus,
        projectId: result.project.id,
        reason: result.errorMessage || `Key unusable (status: ${result.verificationStatus})`,
      });

      throw new BadRequestException(
        `Gemini API key activation rejected: ${result.verificationStatus}. ` +
          `${result.errorMessage || 'Key is not authorized or quota exceeded.'} Existing key preserved.`,
      );
    }

    const encrypted = encryptSecret(apiKey);
    const storedRecord: StoredEncryptedRecord = {
      ...encrypted,
      maskedKey: result.maskedKey,
      verificationResult: result,
      primaryModel: primaryModel || result.models.tested[0]?.model || 'gemini-3.8-flash',
      activatedAt: new Date().toISOString(),
      activatedBy: actor,
    };

    await this.prisma.siteSetting.upsert({
      where: { key: SETTING_KEY_ENCRYPTED },
      update: {
        value: storedRecord as any,
        updatedBy: actor,
        description: 'Encrypted Gemini API Key with project metadata',
      },
      create: {
        key: SETTING_KEY_ENCRYPTED,
        value: storedRecord as any,
        updatedBy: actor,
        description: 'Encrypted Gemini API Key with project metadata',
      },
    });

    await this.recordAudit({
      action: 'KEY_ACTIVATION_SUCCESS',
      actor,
      maskedKey: result.maskedKey,
      status: result.verificationStatus,
      projectId: result.project.id,
      reason: `Activated key successfully with project ${result.project.id || 'N/A'}.`,
    });

    return this.getActiveKeyStatus();
  }

  async getDecryptedActiveKey(): Promise<string | undefined> {
    try {
      const record = await this.prisma.siteSetting.findUnique({
        where: { key: SETTING_KEY_ENCRYPTED },
      });
      if (record?.value) {
        const data = record.value as unknown as StoredEncryptedRecord;
        if (data.ciphertext && data.iv && data.authTag) {
          return decryptSecret({
            ciphertext: data.ciphertext,
            iv: data.iv,
            authTag: data.authTag,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to decrypt database Gemini key: ${err?.message || err}`);
    }
    return process.env.GEMINI_API_KEY?.trim() || undefined;
  }

  async getActiveModel(): Promise<string | undefined> {
    try {
      const record = await this.prisma.siteSetting.findUnique({
        where: { key: SETTING_KEY_ENCRYPTED },
      });
      if (record?.value) {
        const data = record.value as unknown as StoredEncryptedRecord;
        if (data.primaryModel) return data.primaryModel;
      }
    } catch {
      // non-fatal
    }
    return process.env.GEMINI_MODEL?.trim() || undefined;
  }

  async getAuditLog(limit: number = 20): Promise<GeminiKeyAuditEntry[]> {
    const record = await this.prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY_AUDIT_LOG },
    });
    if (!record?.value || !Array.isArray(record.value)) return [];
    return (record.value as unknown as GeminiKeyAuditEntry[]).slice(0, limit);
  }

  private async recordAudit(entry: Omit<GeminiKeyAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullEntry = buildAuditEntry(entry);
      const existing = await this.getAuditLog(MAX_AUDIT_ENTRIES);
      const updated = [fullEntry, ...existing].slice(0, MAX_AUDIT_ENTRIES);

      await this.prisma.siteSetting.upsert({
        where: { key: SETTING_KEY_AUDIT_LOG },
        update: { value: updated as any },
        create: {
          key: SETTING_KEY_AUDIT_LOG,
          value: updated as any,
          description: 'Audit history of Gemini API key verifications and activations',
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not persist Gemini key audit log: ${err?.message || err}`);
    }
  }
}
