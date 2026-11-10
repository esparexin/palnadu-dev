import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { WhatsAppMessageService } from './whatsapp-message.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WhatsAppWebhookController],
  providers: [WhatsAppWebhookService, WhatsAppMessageService],
  exports: [WhatsAppWebhookService, WhatsAppMessageService],
})
export class WhatsAppModule {}

