import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ContactOptInStatus, type MarketingContact } from '@prisma/client';

export interface ImportContactItem {
  businessName: string;
  phone: string;
  contactName?: string;
  city?: string;
  category?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  notes?: string;
}

export interface ListContactsParams {
  page?: number;
  limit?: number;
  hasWebsite?: boolean;
  optInStatus?: ContactOptInStatus;
  city?: string;
  search?: string;
}

@Injectable()
export class WhatsAppContactService {
  private readonly logger = new Logger(WhatsAppContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  async importContacts(items: ImportContactItem[]): Promise<{
    imported: number;
    duplicates: number;
    total: number;
  }> {
    let imported = 0;
    let duplicates = 0;

    for (const item of items) {
      const cleanPhone = this.normalizePhone(item.phone);
      if (!cleanPhone || cleanPhone.length < 10) {
        duplicates++;
        continue;
      }

      const existing = await this.prisma.marketingContact.findUnique({
        where: { phone: cleanPhone },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      try {
        await this.prisma.marketingContact.create({
          data: {
            businessName: item.businessName.trim(),
            contactName: item.contactName?.trim(),
            phone: cleanPhone,
            city: item.city?.trim() || 'Palnadu',
            category: item.category?.trim(),
            hasWebsite: item.hasWebsite ?? false,
            websiteUrl: item.websiteUrl?.trim(),
            notes: item.notes?.trim(),
            optInStatus: ContactOptInStatus.UNVERIFIED,
          },
        });
        imported++;
      } catch (err: unknown) {
        this.logger.warn(`Failed to import contact ${cleanPhone}: ${err}`);
        duplicates++;
      }
    }

    return { imported, duplicates, total: items.length };
  }

  async listContacts(params: ListContactsParams = {}): Promise<{
    data: MarketingContact[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.hasWebsite !== undefined) {
      where.hasWebsite = params.hasWebsite;
    }

    if (params.optInStatus) {
      where.optInStatus = params.optInStatus;
    }

    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }

    if (params.search) {
      where.OR = [
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
        { category: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.marketingContact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketingContact.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getStats(): Promise<{
    totalContacts: number;
    withoutWebsite: number;
    optedIn: number;
    optedOut: number;
  }> {
    const [totalContacts, withoutWebsite, optedIn, optedOut] = await Promise.all([
      this.prisma.marketingContact.count(),
      this.prisma.marketingContact.count({ where: { hasWebsite: false } }),
      this.prisma.marketingContact.count({ where: { optInStatus: ContactOptInStatus.OPTED_IN } }),
      this.prisma.marketingContact.count({ where: { optInStatus: ContactOptInStatus.OPTED_OUT } }),
    ]);

    return { totalContacts, withoutWebsite, optedIn, optedOut };
  }
}
