import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LeadStatus } from '@prisma/client';

@Controller()
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Public endpoint — submit a lead
  @Post('leads')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async createLead(
    @Body()
    body: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
      problemDescription: string;
      currentSituation?: string;
      projectStage: string;
      requiredHelp: string;
      budget?: string;
      additionalInfo?: string;
    },
  ) {
    const lead = await this.leadsService.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      problemDescription: body.problemDescription,
      currentSituation: body.currentSituation,
      projectStage: body.projectStage as any,
      requiredHelp: body.requiredHelp as any,
      budget: body.budget,
      additionalInfo: body.additionalInfo,
    });

    return {
      success: true,
      message: 'Thank you for reaching out. We will get back to you soon.',
      data: { id: lead.id },
    };
  }

  // Admin endpoints
  @Get('admin/leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
  async getLeads(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.leadsService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status as LeadStatus | undefined,
      search,
    });

    return { success: true, ...result };
  }

  @Get('admin/leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
  async getLead(@Param('id') id: string) {
    const lead = await this.leadsService.findOne(id);
    if (!lead) throw new NotFoundException('Lead not found');
    return { success: true, data: lead };
  }

  @Patch('admin/leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
  async updateLead(
    @Param('id') id: string,
    @Body() body: { status?: string; assignedToId?: string; notes?: string },
  ) {
    const lead = await this.leadsService.update(id, body as any);
    return { success: true, data: lead };
  }
}
