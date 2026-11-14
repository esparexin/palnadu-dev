import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeadStatus, ProjectStage, RequiredHelp, type Lead } from '@prisma/client';
import { sanitizePhoneNumber } from './whatsapp-api.util';

export interface CreateWhatsAppEnquiryParams {
  phone: string;
  name?: string | null;
  categoryTitle: string;
  categoryId: string;
  suboptionName: string;
  suboptionId: string;
  requirementText: string;
  inboundWamId: string;
}

@Injectable()
export class WhatsAppEnquiryService {
  private readonly logger = new Logger(WhatsAppEnquiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createEnquiryFromWhatsApp(params: CreateWhatsAppEnquiryParams): Promise<Lead> {
    const cleanPhone = sanitizePhoneNumber(params.phone) || params.phone;

    // 1. Durable idempotency check by inbound WhatsApp message ID (wamId)
    const existing = await this.prisma.lead.findUnique({
      where: { whatsappWamId: params.inboundWamId },
    });

    if (existing) {
      this.logger.log(
        `Idempotent WhatsApp enquiry intercepted for wamId ${params.inboundWamId}: returning existing lead ${existing.id}`,
      );
      return existing;
    }

    const stage = this.mapCategoryToProjectStage(params.categoryId);
    const help = this.mapCategoryToRequiredHelp(params.categoryId);
    const contactName = params.name?.trim() || cleanPhone;
    const syntheticEmail = `${cleanPhone}@whatsapp.palnadu.dev`;

    const additionalMeta = JSON.stringify({
      source: 'WHATSAPP_CONVERSATIONAL_ASSISTANT',
      categoryId: params.categoryId,
      categoryTitle: params.categoryTitle,
      suboptionId: params.suboptionId,
      suboptionName: params.suboptionName,
      inboundWamId: params.inboundWamId,
      submittedAt: new Date().toISOString(),
    });

    let lead: Lead;
    try {
      lead = await this.prisma.lead.create({
        data: {
          name: contactName,
          email: syntheticEmail,
          phone: cleanPhone,
          problemDescription: params.requirementText.trim(),
          projectStage: stage,
          requiredHelp: help,
          additionalInfo: additionalMeta,
          whatsappWamId: params.inboundWamId,
          status: LeadStatus.NEW,
        },
      });
    } catch (createErr: unknown) {
      if (
        createErr &&
        typeof createErr === 'object' &&
        'code' in createErr &&
        (createErr as { code: string }).code === 'P2002'
      ) {
        const concurrent = await this.prisma.lead.findUnique({
          where: { whatsappWamId: params.inboundWamId },
        });
        if (concurrent) return concurrent;
      }
      throw createErr;
    }

    // 2. Dispatch notification to Palnadu team
    try {
      await this.notifications.create({
        title: 'New WhatsApp Enquiry',
        message: `New requirement from ${contactName} (${cleanPhone}) for "${params.categoryTitle} - ${params.suboptionName}"`,
        type: 'NEW_LEAD',
        data: {
          leadId: lead.id,
          phone: cleanPhone,
          category: params.categoryTitle,
          suboption: params.suboptionName,
          inboundWamId: params.inboundWamId,
        },
      });
    } catch (notifErr: unknown) {
      const msg = notifErr instanceof Error ? notifErr.message : String(notifErr);
      this.logger.error(`Failed to dispatch notification for WhatsApp lead ${lead.id}: ${msg}`);
    }

    this.logger.log(
      `Persisted new WhatsApp lead ${lead.id} from ${cleanPhone} (category: ${params.categoryId}, wamId: ${params.inboundWamId})`,
    );
    return lead;
  }

  private mapCategoryToProjectStage(categoryId: string): ProjectStage {
    switch (categoryId) {
      case '1':
      case '2':
      case '3':
      case '4':
        return ProjectStage.EXISTING_BUSINESS;
      case '5':
        return ProjectStage.JUST_AN_IDEA;
      default:
        return ProjectStage.OTHER;
    }
  }

  private mapCategoryToRequiredHelp(categoryId: string): RequiredHelp {
    switch (categoryId) {
      case '1':
        return RequiredHelp.WEB_APPLICATION;
      case '2':
        return RequiredHelp.MOBILE_APPLICATION;
      case '3':
        return RequiredHelp.AUTOMATION;
      case '4':
        return RequiredHelp.IDEA_VALIDATION;
      case '5':
        return RequiredHelp.TECHNICAL_CONSULTING;
      default:
        return RequiredHelp.NOT_SURE;
    }
  }
}
