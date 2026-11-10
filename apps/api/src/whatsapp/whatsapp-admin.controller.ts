import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { WhatsAppCampaignService } from './whatsapp-campaign.service';
import { WhatsAppContactService, type ImportContactItem } from './whatsapp-contact.service';
import {
  createMarketingCampaignSchema,
  type CreateMarketingCampaignInput,
} from '@palnadu/validation';
import { CampaignStatus, ContactOptInStatus } from '@prisma/client';
import {
  MIN_CAMPAIGN_BATCH_SIZE,
  MAX_CAMPAIGN_BATCH_SIZE,
} from './whatsapp.constants';

@Controller('admin/whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
export class WhatsAppAdminController {
  constructor(
    private readonly campaignService: WhatsAppCampaignService,
    private readonly contactService: WhatsAppContactService,
  ) {}

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(
    @Body(new ZodValidationPipe(createMarketingCampaignSchema))
    data: CreateMarketingCampaignInput,
  ) {
    const campaign = await this.campaignService.createCampaign(data);
    return { success: true, data: campaign };
  }

  @Get('campaigns')
  async listCampaigns(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.campaignService.listCampaigns({
      page: page ? Number.parseInt(page, 10) : 1,
      limit: limit ? Number.parseInt(limit, 10) : 20,
      status: status as CampaignStatus | undefined,
    });
    return { success: true, ...result };
  }

  @Get('campaigns/:id')
  async getCampaign(@Param('id') id: string) {
    const campaign = await this.campaignService.getCampaign(id);
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return { success: true, data: campaign };
  }

  @Post('campaigns/:id/dispatch')
  async dispatchCampaign(
    @Param('id') id: string,
    @Body() body?: { batchSize?: number },
  ) {
    const safeBatchSize =
      typeof body?.batchSize === 'number' && Number.isFinite(body.batchSize)
        ? Math.max(MIN_CAMPAIGN_BATCH_SIZE, Math.min(MAX_CAMPAIGN_BATCH_SIZE, Math.trunc(body.batchSize)))
        : undefined;

    const result = await this.campaignService.dispatchCampaign(id, {
      batchSize: safeBatchSize,
    });
    return { success: true, data: result };
  }

  @Post('campaigns/:id/pause')
  async pauseCampaign(@Param('id') id: string) {
    const campaign = await this.campaignService.pauseCampaign(id);
    return { success: true, data: campaign };
  }

  @Post('contacts/import')
  async importContacts(@Body() body: { contacts: ImportContactItem[] }) {
    const contacts = Array.isArray(body?.contacts) ? body.contacts : [];
    const result = await this.contactService.importContacts(contacts);
    return { success: true, data: result };
  }

  @Get('contacts')
  async listContacts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('hasWebsite') hasWebsite?: string,
    @Query('optInStatus') optInStatus?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.contactService.listContacts({
      page: page ? Number.parseInt(page, 10) : 1,
      limit: limit ? Number.parseInt(limit, 10) : 20,
      hasWebsite: hasWebsite !== undefined ? hasWebsite === 'true' : undefined,
      optInStatus: optInStatus as ContactOptInStatus | undefined,
      city,
      search,
    });
    return { success: true, ...result };
  }

  @Get('stats')
  async getStats() {
    const contactStats = await this.contactService.getStats();
    const campaignsResult = await this.campaignService.listCampaigns({ limit: 100 });
    const campaigns = campaignsResult.data;

    let totalSent = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalFailed = 0;

    for (const c of campaigns) {
      totalSent += c.sentCount;
      totalDelivered += c.deliveredCount;
      totalRead += c.readCount;
      totalFailed += c.failedCount;
    }

    return {
      success: true,
      data: {
        totalCampaigns: campaignsResult.total,
        totalContacts: contactStats.totalContacts,
        withoutWebsite: contactStats.withoutWebsite,
        optedIn: contactStats.optedIn,
        optedOut: contactStats.optedOut,
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
      },
    };
  }
}

