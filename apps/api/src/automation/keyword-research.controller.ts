import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FreeKeywordResearchService } from './free-keyword-research.service';

@Controller('admin/automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
export class KeywordResearchController {
  constructor(private keywordService: FreeKeywordResearchService) {}

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
}
