import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { WhatsAppMessageService } from './whatsapp-message.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppAutoReplyService } from './whatsapp-auto-reply.service';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { WhatsAppCampaignService } from './whatsapp-campaign.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WhatsAppWebhookController],
  providers: [
    WhatsAppWebhookService,
    WhatsAppMessageService,
    WhatsAppApiClient,
    WhatsAppAutoReplyService,
    WhatsAppOptOutService,
    WhatsAppCampaignService,
  ],
  exports: [
    WhatsAppWebhookService,
    WhatsAppMessageService,
    WhatsAppApiClient,
    WhatsAppAutoReplyService,
    WhatsAppOptOutService,
    WhatsAppCampaignService,
  ],
})
export class WhatsAppModule {}
