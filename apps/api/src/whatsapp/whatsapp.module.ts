import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { WhatsAppMessageService } from './whatsapp-message.service';
import { WhatsAppApiClient } from './whatsapp-api.client';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppWebhookService, WhatsAppMessageService, WhatsAppApiClient],
  exports: [WhatsAppWebhookService, WhatsAppMessageService, WhatsAppApiClient],
})
export class WhatsAppModule {}


