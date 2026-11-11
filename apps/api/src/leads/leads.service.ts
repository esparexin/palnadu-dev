import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, LeadStatus } from '@prisma/client';
import { WHATSAPP_MARKETING_CONSENT_VERSION } from '@palnadu/validation';
import { sanitizePhoneNumber } from '../whatsapp/whatsapp-api.util';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.LeadCreateInput) {
    // Idempotency guard: prevent duplicate lead submission within a 60-second window
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const existing = await this.prisma.lead.findFirst({
      where: {
        email: data.email,
        createdAt: { gte: sixtySecondsAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    const requestedConsent = Boolean(data.whatsappMarketingConsent);
    if (
      existing &&
      existing.problemDescription === data.problemDescription &&
      Boolean(existing.whatsappMarketingConsent) === requestedConsent
    ) {
      this.logger.warn(
        `Idempotent lead submission detected for ${data.email} — returning existing record ${existing.id}`,
      );
      return existing;
    }

    const normalizedData: Prisma.LeadCreateInput = requestedConsent
      ? {
          ...data,
          whatsappMarketingConsent: true,
          whatsappConsentPhone:
            data.whatsappConsentPhone ||
            (data.phone ? sanitizePhoneNumber(data.phone) : undefined),
          whatsappConsentAt: data.whatsappConsentAt || new Date(),
          whatsappConsentSource: data.whatsappConsentSource || 'WEBSITE_LEAD_FORM',
          whatsappConsentVersion:
            data.whatsappConsentVersion || WHATSAPP_MARKETING_CONSENT_VERSION,
        }
      : data;

    // Save lead as single source of truth
    const lead = await this.prisma.lead.create({ data: normalizedData });

    // Persist notification reliably with error handling
    try {
      await this.prisma.notification.create({
        data: {
          title: 'New Lead',
          message: `New inquiry from ${data.name} (${data.email})`,
          type: 'NEW_LEAD',
          data: { leadId: lead.id } as Prisma.JsonObject,
        },
      });
    } catch (notifErr: any) {
      this.logger.error(
        `Failed to create notification for lead ${lead.id}: ${notifErr?.message || notifErr}`,
        notifErr?.stack,
      );
    }

    return lead;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: LeadStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        convertedClient: true,
      },
    });
  }

  async update(id: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({
      where: { id },
      data,
    });
  }

  async getNewLeadsCount() {
    return this.prisma.lead.count({
      where: { status: LeadStatus.NEW },
    });
  }

  async remove(id: string) {
    return this.prisma.lead.delete({
      where: { id },
    });
  }
}
