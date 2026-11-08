import { Controller, Get, Post, Patch, Body, Query, UseGuards, Optional } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, BlogLanguage } from '@prisma/client';
import { BlogAutomationService } from './blog-automation.service';
import { FreeKeywordResearchService } from './free-keyword-research.service';
import { TopicDiscoveryService } from './topic-discovery.service';
import {
  GoogleSearchConsoleSource,
  BingWebmasterSource,
  IndexNowSource,
  PageSpeedInsightsSource,
} from './seo-sources';
import { PrismaService } from '../prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  automationGenerateSchema,
  automationSettingsSchema,
  automationDiscoverSchema,
  automationBilingualSchema,
  type AutomationGenerateInput,
  type AutomationSettingsInput,
  type AutomationDiscoverInput,
  type AutomationBilingualInput,
} from '@palnadu/validation';

@Controller('admin/automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class AutomationController {
  constructor(
    private automationService: BlogAutomationService,
    private keywordService: FreeKeywordResearchService,
    private discoveryService: TopicDiscoveryService,
    private prisma: PrismaService,
    @Optional() private gscSource?: GoogleSearchConsoleSource,
    @Optional() private bingSource?: BingWebmasterSource,
    @Optional() private indexNowSource?: IndexNowSource,
    @Optional() private pageSpeedSource?: PageSpeedInsightsSource,
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
      confidence: 'verified_google',
      count: suggestions.length,
      data: suggestions,
    };
  }

  /** Customer questions & FAQ discovery (Replaces AnswerThePublic) */
  @Get('questions')
  async getQuestions(
    @Query('seed') seed?: string,
    @Query('location') location?: string,
  ) {
    const topic = seed || 'billing software for retail';
    const questions = await this.keywordService.discoverCustomerQuestions(topic, location);
    return {
      success: true,
      query: topic,
      location: location || 'Palnadu and Guntur',
      count: questions.length,
      data: questions,
    };
  }

  /** Competitor comparison & gap discovery (Replaces SEMrush) */
  @Get('competitor-gaps')
  async getCompetitorGaps(
    @Query('seed') seed?: string,
    @Query('location') location?: string,
  ) {
    const topic = seed || 'website development';
    const gaps = await this.keywordService.discoverCompetitorQueries(topic, location);
    return {
      success: true,
      query: topic,
      location: location || 'Guntur',
      count: gaps.length,
      data: gaps,
    };
  }

  /** AI-assisted directory & backlink outreach opportunities (Replaces Ahrefs) */
  @Get('backlinks')
  async getBacklinks(
    @Query('topic') topic?: string,
    @Query('location') location?: string,
  ) {
    const term = topic || 'software development';
    const opportunities = await this.keywordService.discoverBacklinkOpportunities(term, location);
    return {
      success: true,
      topic: term,
      location: location || 'Palnadu and Guntur, Andhra Pradesh',
      count: opportunities.length,
      data: opportunities,
    };
  }

  @Get('status')
  async getStatus() {
    const status = await this.automationService.getStatus();
    return { success: true, data: status };
  }

  /**
   * Availability, confidence tier, and capabilities of every reference source.
   */
  @Get('sources')
  async getSources() {
    const sources = await this.discoveryService.sourceStatuses();
    return {
      success: true,
      data: sources.map((s) => ({
        ...s,
        note:
          s.availability === 'unconfigured'
            ? 'Optional Google OAuth/Developer credential not configured. Not required for auto-blogging.'
            : s.confidence === 'verified_google'
              ? 'Active: Verified Google search endpoint (zero credentials required).'
              : s.confidence === 'ai_suggestion'
                ? 'Active: AI-assisted research powered by Gemini & Google query patterns (zero paid subscriptions required).'
                : 'Active: Verified external research endpoint.',
      })),
    };
  }

  /** What the site already covers: topics, keywords, intents. */
  @Get('coverage')
  async getCoverage() {
    return { success: true, data: await this.discoveryService.coverageReport() };
  }

  /** Pull new search opportunities into the queue through the dedup gate. */
  @Post('discover')
  async discover(
    @Body(new ZodValidationPipe(automationDiscoverSchema))
    body: AutomationDiscoverInput = { limit: 40 },
  ) {
    const result = await this.automationService.discoverAndEnqueue(body.limit ?? 40);
    return {
      success: true,
      message:
        `Discovered ${result.discovered} candidate topic(s); ${result.enqueued} enqueued, ` +
        `${result.rejected.length} rejected as duplicates.`,
      data: result,
    };
  }

  /** Recent generation attempts, for auditing why a post exists. */
  @Get('audit-log')
  async auditLog(@Query('limit') limit?: string) {
    const take = Math.min(Number(limit ?? 50) || 50, 200);
    const logs = await this.prisma.blogGenerationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { success: true, data: logs };
  }

  @Post('generate')
  async triggerGenerate(
    @Body(new ZodValidationPipe(automationGenerateSchema))
    body: AutomationGenerateInput,
  ) {
    const language =
      body.language === 'te' ? BlogLanguage.te : BlogLanguage.en;

    if (body.batchCount && body.batchCount > 1) {
      const { results, rejected } = await this.automationService.generateBatch(
        body.batchCount,
        body.forcePublish ?? false,
      );
      return {
        success: true,
        message:
          `Generated ${results.length} article(s); ` +
          `${rejected.length} topic(s) rejected as duplicates or failed validation.`,
        data: { results, rejected },
      };
    }

    // No explicit topic: take the next pending item from the durable queue.
    const queue = await this.automationService.getPendingQueueItems();
    const pending = queue.find((i) => !i.isGenerated && i.status === 'PENDING');
    const topic = body.topic || pending?.topic || 'How Digital Transformation and Modern Web Apps Accelerate Growth for Regional Enterprises';
    const categorySlug = body.categorySlug || pending?.categorySlug || 'website-development';
    const targetLocation = body.targetLocation || pending?.targetLocation || undefined;

    const result = await this.automationService.generateSingleArticle(
      topic,
      categorySlug,
      targetLocation,
      Boolean(body.forcePublish),
      language,
    );

    return {
      success: true,
      message: `Article generated successfully (${result.wordCount} words, ${result.imagesCount} licensed images).`,
      data: result,
    };
  }

  /**
   * Inspect bilingual mode without changing anything: switch state, effective
   * quota, and per-language pending backlog (i.e. what the next cycle would
   * claim if the switch were on).
   */
  @Get('bilingual')
  async getBilingual() {
    return { success: true, data: await this.automationService.getBilingualStatus() };
  }

  /**
   * Toggle bilingual mode and/or quotas. Changing the switch is restricted
   * like auto-publish: it alters what the scheduled cron produces.
   * Everything defaults to off — this endpoint only arms what it is told to.
   */
  @Patch('bilingual')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateBilingual(
    @Body(new ZodValidationPipe(automationBilingualSchema))
    body: AutomationBilingualInput,
  ) {
    const data = await this.automationService.setBilingualConfig(body);
    return {
      success: true,
      message: data.enabled
        ? `Bilingual mode ON: ${data.quota.te} Telugu + ${data.quota.en} English per cycle.`
        : 'Bilingual mode OFF: scheduled runs stay English-only.',
      data,
    };
  }

  @Patch('settings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async updateSettings(
    @Body(new ZodValidationPipe(automationSettingsSchema))
    body: AutomationSettingsInput,
  ) {
    await this.prisma.siteSetting.upsert({
      where: { key: 'auto_publish_blogs' },
      update: { value: body.autoPublish },
      create: {
        key: 'auto_publish_blogs',
        value: body.autoPublish,
        description: 'Whether automated blogs publish immediately or save as DRAFT for review',
      },
    });

    return {
      success: true,
      message: `Auto-publish mode set to: ${body.autoPublish ? 'PUBLISHED (Automatic)' : 'DRAFT (Human Review Required)'}`,
    };
  }

  /** Immediate IndexNow URL dispatch for Bing & participating search engines */
  @Post('indexnow/submit')
  async submitIndexNow(@Body() body: { urls?: string[]; host?: string }) {
    const urls = body?.urls || ['https://www.palnadu.dev/'];
    const host = body?.host || 'www.palnadu.dev';
    if (!this.indexNowSource) {
      return { success: false, message: 'IndexNow source not initialized', submitted: 0 };
    }
    const res = await this.indexNowSource.submitUrls(host, urls);
    return {
      success: res.success,
      message: res.success ? `Submitted ${res.submitted} URL(s) to IndexNow` : 'IndexNow submission failed',
      data: res,
    };
  }

  /** Google Search Console URL inspection */
  @Get('gsc/inspect')
  async inspectGscUrl(@Query('url') url?: string) {
    const targetUrl = url || 'https://www.palnadu.dev/';
    if (!this.gscSource || !this.gscSource.isConfigured()) {
      return {
        success: false,
        message: 'Google Search Console credentials (GSC_ACCESS_TOKEN, GSC_SITE_URL) not configured',
        data: null,
      };
    }
    const result = await this.gscSource.inspectUrl(targetUrl);
    return {
      success: !!result,
      data: result,
    };
  }

  /** Google Search Console sitemap submission */
  @Post('gsc/sitemap')
  async submitGscSitemap(@Body('sitemapUrl') sitemapUrl?: string) {
    const url = sitemapUrl || 'https://www.palnadu.dev/sitemap.xml';
    if (!this.gscSource || !this.gscSource.isConfigured()) {
      return {
        success: false,
        message: 'Google Search Console credentials not configured',
      };
    }
    const ok = await this.gscSource.submitSitemap(url);
    return {
      success: ok,
      message: ok ? `Sitemap submitted to Google Search Console: ${url}` : 'Failed to submit sitemap to GSC',
    };
  }

  /** Bing Webmaster Tools URL submission */
  @Post('bing/submit')
  async submitBingUrl(@Body('url') url?: string) {
    const targetUrl = url || 'https://www.palnadu.dev/';
    if (!this.bingSource || !this.bingSource.isConfigured()) {
      return {
        success: false,
        message: 'Bing Webmaster API credentials (BING_WEBMASTER_API_KEY, BING_SITE_URL) not configured',
      };
    }
    const ok = await this.bingSource.submitUrl(targetUrl);
    return {
      success: ok,
      message: ok ? `URL submitted to Bing Webmaster Tools: ${targetUrl}` : 'Failed to submit URL to Bing',
    };
  }

  /** Google PageSpeed Insights live audit */
  @Get('pagespeed')
  async runPageSpeed(@Query('url') url?: string) {
    const targetUrl = url || 'https://www.palnadu.dev/';
    if (!this.pageSpeedSource) {
      return { success: false, message: 'PageSpeed Insights source not initialized' };
    }
    const result = await this.pageSpeedSource.analyseUrl(targetUrl);
    return {
      success: !!result,
      data: result,
    };
  }
}
