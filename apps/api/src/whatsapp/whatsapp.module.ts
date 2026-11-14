import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppAdminController } from './whatsapp-admin.controller';
import { WhatsAppConversationController } from './whatsapp-conversation.controller';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { WhatsAppMessageService } from './whatsapp-message.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppAutoReplyService } from './whatsapp-auto-reply.service';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { WhatsAppCampaignService } from './whatsapp-campaign.service';
import { WhatsAppContactService } from './whatsapp-contact.service';
import { WhatsAppOutreachService } from './whatsapp-outreach.service';
import { WhatsAppEnquiryService } from './whatsapp-enquiry.service';
import { WhatsAppConversationService } from './whatsapp-conversation.service';
import { WhatsAppAssistantService } from './whatsapp-assistant.service';
import { WhatsAppTakeoverService } from './whatsapp-takeover.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    WhatsAppWebhookController,
    WhatsAppAdminController,
    WhatsAppConversationController,
  ],
  providers: [
    WhatsAppWebhookService,
    WhatsAppMessageService,
    WhatsAppApiClient,
    WhatsAppAutoReplyService,
    WhatsAppOptOutService,
    WhatsAppCampaignService,
    WhatsAppContactService,
    WhatsAppOutreachService,
    WhatsAppEnquiryService,
    WhatsAppConversationService,
    WhatsAppAssistantService,
    WhatsAppTakeoverService,
  ],
  exports: [
    WhatsAppWebhookService,
    WhatsAppMessageService,
    WhatsAppApiClient,
    WhatsAppAutoReplyService,
    WhatsAppOptOutService,
    WhatsAppCampaignService,
    WhatsAppContactService,
    WhatsAppOutreachService,
    WhatsAppEnquiryService,
    WhatsAppConversationService,
    WhatsAppAssistantService,
    WhatsAppTakeoverService,
  ],
})
export class WhatsAppModule {}
