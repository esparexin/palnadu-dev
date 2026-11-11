import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ContactOptInStatus } from '@prisma/client';
import {
  MARKETING_OPT_OUT_KEYWORDS,
  OPT_OUT_REASON_INBOUND_STOP,
} from './whatsapp.constants';

@Injectable()
export class WhatsAppOptOutService {
  private readonly logger = new Logger(WhatsAppOptOutService.name);
  private readonly optOutKeywordsSet = new Set<string>(
    MARKETING_OPT_OUT_KEYWORDS.map((k) => k.toLowerCase()),
  );

  constructor(private readonly prisma: PrismaService) {}

  normalizePhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly;
  }

  isOptOutKeyword(text?: string): boolean {
    if (!text) return false;
    const trimmed = text.trim().toLowerCase();
    if (!trimmed) return false;

    if (this.optOutKeywordsSet.has(trimmed)) {
      return true;
    }

    const firstWord = trimmed.split(/\s+/)[0];
    return this.optOutKeywordsSet.has(firstWord);
  }

  async handleInboundOptOut(fromPhone: string, text?: string): Promise<boolean> {
    if (!this.isOptOutKeyword(text)) {
      return false;
    }

    const normalized = this.normalizePhone(fromPhone);
    const variants = [fromPhone, normalized, `+${normalized}`];

    try {
      const contacts = await this.prisma.marketingContact.findMany({
        where: {
          phone: { in: variants },
          optInStatus: { not: ContactOptInStatus.OPTED_OUT },
        },
      });

      if (contacts.length === 0) {
        this.logger.log(
          `Opt-out keyword received from ${fromPhone}, but no non-opted-out contact found`,
        );
        return true;
      }

      await this.prisma.marketingContact.updateMany({
        where: {
          id: { in: contacts.map((c) => c.id) },
        },
        data: {
          optInStatus: ContactOptInStatus.OPTED_OUT,
          optOutReason: OPT_OUT_REASON_INBOUND_STOP,
          optOutTimestamp: new Date(),
        },
      });

      this.logger.log(`Contact ${fromPhone} successfully opted out via inbound keyword`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to record opt-out for ${fromPhone}: ${msg}`);
      return false;
    }
  }

  async isSuppressed(phone: string): Promise<boolean> {
    const normalized = this.normalizePhone(phone);
    const variants = [phone, normalized, `+${normalized}`];

    const contact = await this.prisma.marketingContact.findFirst({
      where: {
        phone: { in: variants },
        optInStatus: ContactOptInStatus.OPTED_OUT,
      },
      select: { id: true },
    });

    return contact !== null;
  }

  async optOutContact(phone: string, reason = 'MANUAL_OPT_OUT'): Promise<boolean> {
    const normalized = this.normalizePhone(phone);
    const variants = [phone, normalized, `+${normalized}`];

    const res = await this.prisma.marketingContact.updateMany({
      where: {
        phone: { in: variants },
        optInStatus: { not: ContactOptInStatus.OPTED_OUT },
      },
      data: {
        optInStatus: ContactOptInStatus.OPTED_OUT,
        optOutReason: reason,
        optOutTimestamp: new Date(),
      },
    });

    return res.count > 0;
  }
}
