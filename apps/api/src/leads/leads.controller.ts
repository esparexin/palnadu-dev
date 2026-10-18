import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createLeadSchema, updateLeadSchema, type CreateLeadInput } from '@palnadu/validation';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LeadStatus } from '@prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller()
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  // Public endpoint — submit a lead
  @Post('leads')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async createLead(@Body(new ZodValidationPipe(createLeadSchema)) validData: CreateLeadInput) {
    const lead = await this.leadsService.create({
      name: validData.name,
      email: validData.email,
      phone: validData.phone || undefined,
      company: validData.company || undefined,
      problemDescription: validData.problemDescription,
      currentSituation: validData.currentSituation || undefined,
      projectStage: validData.projectStage,
      requiredHelp: validData.requiredHelp,
      budget: validData.budget || undefined,
      additionalInfo: validData.additionalInfo || undefined,
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
    @Body() body: { status?: string; assignedToId?: string; assignedTo?: string; notes?: string },
  ) {
    // Normalize legacy `assignedToId` to schema field `assignedTo`
    const normalized = {
      status: body.status,
      assignedTo: body.assignedTo ?? body.assignedToId,
      notes: body.notes,
    };
    const parseResult = updateLeadSchema.safeParse(normalized);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const { status, assignedTo, notes } = parseResult.data;
    const lead = await this.leadsService.update(id, {
      ...(status ? { status: status as LeadStatus } : {}),
      ...(assignedTo !== undefined
        ? assignedTo === null
          ? { assignedTo: { disconnect: true } }
          : { assignedTo: { connect: { id: assignedTo } } }
        : {}),
      ...(notes !== undefined ? { notes } : {}),
    });
    return { success: true, data: lead };
  }

  @Delete('admin/leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeLead(@Param('id') id: string) {
    await this.leadsService.remove(id);
    return { success: true, message: 'Lead deleted successfully' };
  }
}
