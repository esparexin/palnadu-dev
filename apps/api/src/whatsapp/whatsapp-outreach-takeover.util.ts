import { Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import type { WhatsAppTakeoverService, AdminActor } from './whatsapp-takeover.service';
import type { SendIndividualOutreachInput } from '@palnadu/types';
import { waitForDispatchDrain } from './whatsapp-dispatch-lock.util';

const logger = new Logger('WhatsAppOutreachTakeover');

const HUMAN_SALES_PURPOSES = new Set([
  'SALES_OUTREACH',
  'QUOTATION',
  'PROPOSAL',
  'FOLLOW_UP',
  'SALES_FOLLOW_UP',
  'LEAD_GENERATION',
  'SALES',
]);

/**
 * Determines whether an outreach request represents a human-managed sales interaction
 * that must trigger immediate, durable HUMAN_TAKEOVER.
 */
export function isHumanSalesOutreach(
  input: {
    outreachPurpose?: string;
    origin?: string;
  },
  admin?: { id: string; email?: string } | null,
): boolean {
  // 1. Authenticated human admin identity ALWAYS triggers human sales takeover
  const isSystemWorker =
    Boolean(admin?.id) &&
    (['system', 'cron', 'automated'].includes(admin!.id.toLowerCase()) ||
      admin!.id.toLowerCase().startsWith('system_') ||
      admin!.id.toLowerCase().startsWith('cron_'));

  if (admin && admin.id && !isSystemWorker) {
    return true;
  }
  // 2. Explicit server-side origin bindings
  if (input.origin === 'HUMAN_SALES') return true;
  if (input.origin === 'AUTOMATED_NOTIFICATION') return false;
  // 3. Programmatic fallback for internal tasks
  if (input.outreachPurpose === 'NOTIFICATION') return false;
  if (!input.outreachPurpose) return true; // Default individual outreach is human sales
  return HUMAN_SALES_PURPOSES.has(input.outreachPurpose.toUpperCase().trim());
}

/**
 * Activates durable human takeover before outbound outreach dispatch.
 * Guarantees that even if customer replies immediately or dispatch fails,
 * no automated bot responses can be triggered.
 */
export async function activateOutreachTakeover(
  prisma: PrismaService,
  cleanPhone: string,
  admin: { id: string; email: string; name?: string },
  input: SendIndividualOutreachInput,
  takeoverService?: WhatsAppTakeoverService,
): Promise<void> {
  const actor: AdminActor = {
    id: admin.id,
    email: admin.email,
    name: admin.name || admin.email || admin.id,
  };

  // If WhatsAppTakeoverService instance is available, use its authoritative method
  if (takeoverService && typeof takeoverService.setHumanTakeover === 'function') {
    await takeoverService.setHumanTakeover(cleanPhone, true, actor);
    return;
  }

  // Fallback to direct Prisma atomic upsert if takeoverService is not wired
  if (prisma?.whatsAppConversation && typeof prisma.whatsAppConversation.upsert === 'function') {
    const actorLabel = actor.name || actor.email || actor.id;
    await prisma.whatsAppConversation.upsert({
      where: { customerPhone: cleanPhone },
      create: {
        customerPhone: cleanPhone,
        customerName: input.contactName || input.businessName,
        mode: 'HUMAN_TAKEOVER',
        humanTakeover: true,
        takenOverAt: new Date(),
        takenOverById: admin.id,
        takenOverByName: actorLabel,
        lastInitiatorId: admin.id,
        lastInitiatorName: actorLabel,
        modeUpdatedAt: new Date(),
      },
      update: {
        mode: 'HUMAN_TAKEOVER',
        humanTakeover: true,
        takenOverAt: new Date(),
        takenOverById: admin.id,
        takenOverByName: actorLabel,
        lastInitiatorId: admin.id,
        lastInitiatorName: actorLabel,
        modeUpdatedAt: new Date(),
      },
    });

    await waitForDispatchDrain(prisma, cleanPhone);
    logger.log(`Outreach takeover enabled for ${cleanPhone} by ${actorLabel}`);
  }
}

/**
 * Updates conversation timestamps after successful outreach dispatch.
 */
export async function updateOutreachConversation(
  prisma: PrismaService,
  cleanPhone: string,
  admin: { id: string; email: string; name?: string },
): Promise<void> {
  if (prisma?.whatsAppConversation && typeof prisma.whatsAppConversation.update === 'function') {
    const actorLabel = admin.name || admin.email || admin.id;
    await prisma.whatsAppConversation.update({
      where: { customerPhone: cleanPhone },
      data: {
        lastOutboundAt: new Date(),
        lastInitiatorId: admin.id,
        lastInitiatorName: actorLabel,
      },
    }).catch(() => null);
  }
}
