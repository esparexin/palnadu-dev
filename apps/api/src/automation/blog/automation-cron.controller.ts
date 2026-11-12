import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BlogAutomationService } from '../blog-automation.service';
import { DailyCronTriggerSource } from './blog-cron-lock.util';
import { CronOrAdminGuard } from './cron-or-admin.guard';

interface TriggerDailyCronBody {
  force?: boolean;
  background?: boolean;
}

@Controller('admin/automation/cron')
@UseGuards(CronOrAdminGuard)
export class AutomationCronController {
  constructor(private readonly automationService: BlogAutomationService) {}

  @Get('status')
  async getCronStatus() {
    const data = await this.automationService.getDailyCronStatus();
    return { success: true, data };
  }

  @Post('daily')
  @HttpCode(HttpStatus.OK)
  async triggerDailyCron(
    @Body() body: TriggerDailyCronBody | undefined,
    @Query('force') forceQuery: string | undefined,
    @Query('background') backgroundQuery: string | undefined,
    @Req() req: any,
  ) {
    const source: DailyCronTriggerSource = req?.cronAuthorized ? 'external' : 'manual';
    const force = body?.force === true || forceQuery === 'true';
    const background = body?.background === true || backgroundQuery === 'true';

    if (background) {
      const data = await this.automationService.startDailyAutomationInBackground(source, force);
      return { success: true, data };
    }

    const result = await this.automationService.runDailyAutomation(source, force);
    return {
      success: result.status !== 'FAILED',
      data: result,
    };
  }
}

