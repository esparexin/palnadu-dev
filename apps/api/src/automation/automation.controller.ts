import { Controller, Get, Post, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { BlogAutomationService } from './blog-automation.service';
import { FreeKeywordResearchService } from './free-keyword-research.service';
import { PrismaService } from '../prisma.service';

@Controller('admin/automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class AutomationController {
  constructor(
    private automationService: BlogAutomationService,
    private keywordService: FreeKeywordResearchService,
    private prisma: PrismaService,
  ) {}

  @Get('keywords')
  async getKeywords(
    @Query('seed') seed?: string,
    @Query('location') location?: string,
  ) {
    const topic = seed || 'billing software for shop';
    const suggestions = await this.keywordService.discoverKeywords(topic, location);
    return {
      success: true,
      query: topic,
      location: location || 'Guntur & Palnadu',
      count: suggestions.length,
      data: suggestions,
    };
  }

  @Get('status')
  async getStatus() {
    const status = await this.automationService.getStatus();
    return { success: true, data: status };
  }

  @Post('generate')
  async triggerGenerate(
    @Body()
    body: {
      topic?: string;
      categorySlug?: string;
      targetLocation?: string;
      forcePublish?: boolean;
      batchCount?: number;
    },
  ) {
    if (body.batchCount && body.batchCount > 1) {
      const results = await this.automationService.generateBatch(body.batchCount);
      return {
        success: true,
        message: `Successfully generated ${results.length} automated articles.`,
        data: results,
      };
    }

    const pending = await this.automationService.getNextPendingTopic();
    const topic = body.topic || pending?.topic || 'How Digital Transformation and Modern Web Apps Accelerate Growth for Regional Enterprises';
    const categorySlug = body.categorySlug || pending?.categorySlug || 'website-development';
    const targetLocation = body.targetLocation || pending?.targetLocation;

    const result = await this.automationService.generateSingleArticle(
      topic,
      categorySlug,
      targetLocation,
      Boolean(body.forcePublish),
    );

    return {
      success: true,
      message: `Article generated successfully (${result.wordCount} words, ${result.imagesCount} licensed images).`,
      data: result,
    };
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateSettings(@Body() body: { autoPublish: boolean }) {
    await this.prisma.siteSetting.upsert({
      where: { key: 'auto_publish_blogs' },
      update: { value: Boolean(body.autoPublish) },
      create: {
        key: 'auto_publish_blogs',
        value: Boolean(body.autoPublish),
        description: 'Whether automated blogs publish immediately or save as DRAFT for review',
      },
    });

    return {
      success: true,
      message: `Auto-publish mode set to: ${body.autoPublish ? 'PUBLISHED (Automatic)' : 'DRAFT (Human Review Required)'}`,
    };
  }
}
