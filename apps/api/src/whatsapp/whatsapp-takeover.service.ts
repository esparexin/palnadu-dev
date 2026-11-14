import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { sanitizePhoneNumber } from './whatsapp-api.util';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  type WhatsAppConversation,
  type WhatsAppMessage,
} from '@prisma/client';
import type { WhatsAppConversationFilterParams } from '@palnadu/types';

export interface AdminActor {
  id: string;
  name?: string;
  email?: string;
}

@Injectable()
export class WhatsAppTakeoverService {
  private readonly logger = new Logger(WhatsAppTakeoverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiClient: WhatsAppApiClient,
  ) {}

  async setHumanTakeover(
    phone: string,
    enabled: boolean,
    admin: AdminActor,
  ): Promise<WhatsAppConversation> {
    const cleanPhone = sanitizePhoneNumber(phone) || phone;
    const actorLabel = admin.name || admin.email || admin.id;

    const conv = await this.prisma.whatsAppConversation.upsert({
      where: { customerPhone: cleanPhone },
      create: {
        customerPhone: cleanPhone,
        humanTakeover: enabled,
        takenOverAt: enabled ? new Date() : null,
        takenOverById: enabled ? admin.id : null,
        takenOverByName: enabled ? actorLabel : null,
      },
      update: {
        humanTakeover: enabled,
        takenOverAt: enabled ? new Date() : null,
        takenOverById: enabled ? admin.id : null,
        takenOverByName: enabled ? actorLabel : null,
      },
    });

    this.logger.log(
      `Human takeover ${enabled ? 'ENABLED' : 'RESUMED'} for ${cleanPhone} by ${actorLabel}`,
    );
    return conv;
  }

  async sendManualReply(
    phone: string,
    text: string,
    admin: AdminActor,
  ): Promise<WhatsAppMessage> {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone) throw new Error('Invalid recipient phone number');

    const sendResult = await this.apiClient.sendTextMessage({
      to: cleanPhone,
      text: text.trim(),
    });
    const assignedWamId = sendResult.messages?.[0]?.id || `wamid.manual.${Date.now()}`;

    const saved = await this.prisma.whatsAppMessage.create({
      data: {
        wamId: assignedWamId,
        direction: WhatsAppMessageDirection.OUTBOUND,
        from: 'palnadu_business',
        to: cleanPhone,
        type: 'text',
        body: text.trim(),
        status: WhatsAppDeliveryStatus.SENT,
        rawPayload: sendResult as unknown as Prisma.InputJsonValue,
      },
    });

    await this.setHumanTakeover(cleanPhone, true, admin);

    await this.prisma.whatsAppConversation.update({
      where: { customerPhone: cleanPhone },
      data: { lastOutboundAt: new Date() },
    }).catch(() => null);

    return saved;
  }

  async listConversations(params: WhatsAppConversationFilterParams) {
    const { page = 1, limit = 20, humanTakeover, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.WhatsAppConversationWhereInput = {};

    if (humanTakeover !== undefined) where.humanTakeover = humanTakeover;
    if (search) {
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.whatsAppConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.whatsAppConversation.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getConversation(phone: string) {
    const cleanPhone = sanitizePhoneNumber(phone) || phone;
    const [conversation, messages] = await Promise.all([
      this.prisma.whatsAppConversation.findUnique({ where: { customerPhone: cleanPhone } }),
      this.prisma.whatsAppMessage.findMany({
        where: { OR: [{ from: cleanPhone }, { to: cleanPhone }] },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
    ]);
    return { conversation, messages };
  }
}
