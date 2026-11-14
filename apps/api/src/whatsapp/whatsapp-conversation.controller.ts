import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { WhatsAppTakeoverService } from './whatsapp-takeover.service';
import {
  whatsAppConversationQuerySchema,
  whatsAppTakeoverSchema,
  whatsAppManualReplySchema,
  type WhatsAppConversationQueryInput,
  type WhatsAppTakeoverInput,
  type WhatsAppManualReplyInput,
} from '@palnadu/validation';

@Controller('admin/whatsapp/conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
export class WhatsAppConversationController {
  private readonly logger = new Logger(WhatsAppConversationController.name);

  constructor(private readonly takeoverService: WhatsAppTakeoverService) {}

  @Get()
  async listConversations(
    @Query(new ZodValidationPipe(whatsAppConversationQuerySchema))
    query: WhatsAppConversationQueryInput,
  ) {
    const result = await this.takeoverService.listConversations(query);
    return { success: true, ...result };
  }

  @Get(':phone')
  async getConversation(@Param('phone') phone: string) {
    const result = await this.takeoverService.getConversation(phone);
    if (!result.conversation && result.messages.length === 0) {
      throw new NotFoundException(`Conversation for ${phone} not found`);
    }
    return { success: true, data: result };
  }

  @Post(':phone/takeover')
  @HttpCode(HttpStatus.OK)
  async toggleTakeover(
    @Param('phone') phone: string,
    @Body(new ZodValidationPipe(whatsAppTakeoverSchema))
    body: WhatsAppTakeoverInput,
    @Req() req?: { user?: { id?: string; sub?: string; name?: string; email?: string } },
  ) {
    const admin = {
      id: req?.user?.sub || req?.user?.id || 'admin',
      name: req?.user?.name,
      email: req?.user?.email,
    };
    const conversation = await this.takeoverService.setHumanTakeover(
      phone,
      body.enabled,
      admin,
    );
    return { success: true, data: conversation };
  }

  @Post(':phone/reply')
  @HttpCode(HttpStatus.OK)
  async sendManualReply(
    @Param('phone') phone: string,
    @Body(new ZodValidationPipe(whatsAppManualReplySchema))
    body: WhatsAppManualReplyInput,
    @Req() req?: { user?: { id?: string; sub?: string; name?: string; email?: string } },
  ) {
    const admin = {
      id: req?.user?.sub || req?.user?.id || 'admin',
      name: req?.user?.name,
      email: req?.user?.email,
    };
    const message = await this.takeoverService.sendManualReply(
      phone,
      body.text,
      admin,
    );
    return { success: true, data: message };
  }
}
