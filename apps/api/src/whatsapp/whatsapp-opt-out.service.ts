import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ContactOptInStatus } from '@prisma/client';
import {
  OPT_OUT_REASON_INBOUND_STOP,
} from './whatsapp.constants';
import { buildPhoneVariants, sanitizePhoneNumber } from './whatsapp-api.util';
import { isOptOutKeywordText } from './whatsapp-opt-out.util';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';

@Injectable()
export class WhatsAppOptOutService {
  private readonly logger = new Logger(WhatsAppOptOutService.name);

  constructor(private readonly prisma: PrismaService) {}

  normalizePhone(phone: string): string {
    return sanitizePhoneNumber(phone);
  }

  isOptOutKeyword(text?: string): boolean {
    return isOptOutKeywordText(text);
  }

  async handleInboundOptOut(fromPhone: string, text?: string): Promise<boolean> {
    if (!this.isOptOutKeyword(text)) {
      return false;
    }

    const normalized = this.normalizePhone(fromPhone) || fromPhone.trim();
    const variants = buildPhoneVariants(fromPhone);
    const now = new Date();

    try {
      const contacts = await this.prisma.marketingContact.findMany({
        where: {
          phone: { in: variants },
        },
      });

      const nonOptedOut = contacts.filter(
        (c) => c.optInStatus !== ContactOptInStatus.OPTED_OUT,
      );

      if (nonOptedOut.length > 0) {
        await this.prisma.marketingContact.updateMany({
          where: {
            id: { in: nonOptedOut.map((c) => c.id) },
          },
          data: {
            optInStatus: ContactOptInStatus.OPTED_OUT,
            optOutReason: OPT_OUT_REASON_INBOUND_STOP,
            optOutTimestamp: now,
          },
        });
      } else if (
        contacts.length === 0 &&
        typeof this.prisma.marketingContact?.create === 'function'
      ) {
        try {
          await this.prisma.marketingContact.create({
            data: {
              businessName: 'WhatsApp Opt-Out Contact',
              phone: normalized,
              optInStatus: ContactOptInStatus.OPTED_OUT,
              optOutReason: OPT_OUT_REASON_INBOUND_STOP,
              optOutTimestamp: now,
              source: 'inbound_opt_out',
            },
          });
        } catch (createErr: unknown) {
          if (!isPrismaP2002(createErr)) throw createErr;
          await this.prisma.marketingContact.updateMany({
            where: {
              phone: { in: variants },
              optInStatus: { not: ContactOptInStatus.OPTED_OUT },
            },
            data: {
              optInStatus: ContactOptInStatus.OPTED_OUT,
              optOutReason: OPT_OUT_REASON_INBOUND_STOP,
              optOutTimestamp: now,
            },
          });
        }
      }

      this.logger.log(`Contact ${fromPhone} opted out via inbound keyword`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to record opt-out for ${fromPhone}: ${msg}`);
      return false;
    }
  }

  async isSuppressed(phone: string): Promise<boolean> {
    const variants = buildPhoneVariants(phone);
    if (variants.length === 0) return false;

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
    const variants = buildPhoneVariants(phone);
    if (variants.length === 0) return false;

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
