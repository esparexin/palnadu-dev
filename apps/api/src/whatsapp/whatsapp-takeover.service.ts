import { Injectable, Logger, Optional, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { sanitizePhoneNumber } from './whatsapp-api.util';
import { waitForDispatchDrain } from './whatsapp-dispatch-lock.util';
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
    @Optional() private readonly optOutService?: WhatsAppOptOutService,
  ) {}

  async setHumanTakeover(
    phone: string,
    enabled: boolean,
    admin: AdminActor,
  ): Promise<WhatsAppConversation> {
    const cleanPhone = sanitizePhoneNumber(phone) || phone;
    const actorLabel = admin.name || admin.email || admin.id;

    if (!enabled && this.optOutService) {
      const isOptedOut = await this.optOutService.isSuppressed(cleanPhone);
      if (isOptedOut) {
        throw new BadRequestException(
          'Cannot resume automated assistance for an opted-out contact',
        );
      }
    }

    const targetMode = enabled ? 'HUMAN_TAKEOVER' : 'AUTOMATED_ASSISTANCE';

    const conv = await this.prisma.whatsAppConversation.upsert({
      where: { customerPhone: cleanPhone },
      create: {
        customerPhone: cleanPhone,
        mode: targetMode,
        humanTakeover: enabled,
        takenOverAt: enabled ? new Date() : null,
        takenOverById: enabled ? admin.id : null,
        takenOverByName: enabled ? actorLabel : null,
        lastInitiatorId: admin.id,
        lastInitiatorName: actorLabel,
        modeUpdatedAt: new Date(),
      },
      update: {
        mode: targetMode,
        humanTakeover: enabled,
        takenOverAt: enabled ? new Date() : null,
        takenOverById: enabled ? admin.id : null,
        takenOverByName: enabled ? actorLabel : null,
        lastInitiatorId: admin.id,
        lastInitiatorName: actorLabel,
        modeUpdatedAt: new Date(),
      },
    });

    if (enabled) {
      await waitForDispatchDrain(this.prisma, cleanPhone);
    }

    this.logger.log(
      `Human takeover ${enabled ? 'ENABLED' : 'RESUMED'} for ${cleanPhone} by ${actorLabel}`,
    );

    const fresh = await this.prisma.whatsAppConversation.findUnique({
      where: { customerPhone: cleanPhone },
    });
    return fresh || conv;
  }

  async sendManualReply(
    phone: string,
    text: string,
    admin: AdminActor,
  ): Promise<WhatsAppMessage> {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone) throw new Error('Invalid recipient phone number');
    const actorLabel = admin.name || admin.email || admin.id;

    // 1. Manually sent outbound messages IMMEDIATELY activate durable human takeover
    await this.setHumanTakeover(cleanPhone, true, admin);

    // 2. Dispatch outbound text message via WhatsApp Cloud API
    const sendResult = await this.apiClient.sendTextMessage({
      to: cleanPhone,
      text: text.trim(),
    });
    const assignedWamId = sendResult.messages?.[0]?.id || `wamid.manual.${Date.now()}`;

    // 3. Persist outbound message with trusted origin and admin metadata
    const auditPayload: Record<string, unknown> = {
      origin: 'MANUAL_ADMIN',
      adminId: admin.id,
      adminName: admin.name,
      adminEmail: admin.email,
      metaResponse: sendResult,
    };

    const saved = await this.prisma.whatsAppMessage.create({
      data: {
        wamId: assignedWamId,
        direction: WhatsAppMessageDirection.OUTBOUND,
        from: 'palnadu_business',
        to: cleanPhone,
        type: 'text',
        body: text.trim(),
        status: WhatsAppDeliveryStatus.SENT,
        rawPayload: auditPayload as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.whatsAppConversation.update({
      where: { customerPhone: cleanPhone },
      data: {
        lastOutboundAt: new Date(),
        lastInitiatorId: admin.id,
        lastInitiatorName: actorLabel,
      },
    }).catch(() => null);

    return saved;
  }

  async listConversations(params: WhatsAppConversationFilterParams) {
    const { page = 1, limit = 20, humanTakeover, mode, search } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.WhatsAppConversationWhereInput = {};

    if (humanTakeover !== undefined) where.humanTakeover = humanTakeover;
    if (mode !== undefined) where.mode = mode;
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
