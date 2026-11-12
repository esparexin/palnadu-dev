import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  buildAuditEntry,
  MAX_AUDIT_ENTRIES,
  SETTING_KEY_AUDIT_LOG,
} from './gemini-key-store.types';
import type { GeminiKeyAuditEntry } from './gemini-verification.types';

export async function readGeminiAuditLog(
  prisma: PrismaService,
  limit: number = 20,
): Promise<GeminiKeyAuditEntry[]> {
  const record = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEY_AUDIT_LOG },
  });
  if (!record?.value || !Array.isArray(record.value)) return [];
  return (record.value as unknown as GeminiKeyAuditEntry[]).slice(0, limit);
}

export async function appendGeminiAuditEntry(
  prisma: PrismaService,
  entry: Omit<GeminiKeyAuditEntry, 'id' | 'timestamp'>,
  logger?: Logger,
): Promise<void> {
  try {
    const fullEntry = buildAuditEntry(entry);
    const existing = await readGeminiAuditLog(prisma, MAX_AUDIT_ENTRIES);
    const updated = [fullEntry, ...existing].slice(0, MAX_AUDIT_ENTRIES);

    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY_AUDIT_LOG },
      update: { value: updated as any },
      create: {
        key: SETTING_KEY_AUDIT_LOG,
        value: updated as any,
        description: 'Audit history of Gemini API key verifications and activations',
      },
    });
  } catch (err: any) {
    logger?.warn(`Could not persist Gemini key audit log: ${err?.message || err}`);
  }
}

