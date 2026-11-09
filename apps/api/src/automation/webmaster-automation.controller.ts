import { Controller, Get, Post, Body, Query, UseGuards, Optional } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TechnicalSeoCrawlerService } from './technical-seo-crawler.service';
import {
  GoogleSearchConsoleSource,
  BingWebmasterSource,
  IndexNowSource,
  PageSpeedInsightsSource,
} from './seo-sources';

@Controller('admin/automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class WebmasterAutomationController {
  constructor(
    @Optional() private gscSource?: GoogleSearchConsoleSource,
    @Optional() private bingSource?: BingWebmasterSource,
    @Optional() private indexNowSource?: IndexNowSource,
    @Optional() private pageSpeedSource?: PageSpeedInsightsSource,
    @Optional() private crawlerService?: TechnicalSeoCrawlerService,
  ) {}

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

  /** Trigger on-demand technical SEO crawl (Replaces Screaming Frog) */
  @Post('crawler/run')
  async runCrawler(@Body('url') url?: string) {
    if (!this.crawlerService) {
      return { success: false, message: 'Crawler service not initialized' };
    }
    const report = await this.crawlerService.runAudit(url || 'https://www.palnadu.dev');
    return {
      success: true,
      message: `Audit completed: ${report.summary}`,
      data: report,
    };
  }

  /** Get latest completed technical SEO audit */
  @Get('crawler/latest')
  async getLatestAudit() {
    if (!this.crawlerService) {
      return { success: false, message: 'Crawler service not initialized', data: null };
    }
    const audit = await this.crawlerService.getLatestAudit();
    return {
      success: true,
      data: audit,
    };
  }

  /** Get historical technical SEO audits */
  @Get('crawler/history')
  async getAuditHistory(@Query('limit') limit?: string) {
    if (!this.crawlerService) {
      return { success: false, message: 'Crawler service not initialized', data: [] };
    }
    const take = Math.min(Number(limit || 10), 50);
    const history = await this.crawlerService.listAudits(take);
    return {
      success: true,
      count: history.length,
      data: history,
    };
  }
}
