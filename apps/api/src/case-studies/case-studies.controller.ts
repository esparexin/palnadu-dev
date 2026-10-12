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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createCaseStudySchema } from '@palnadu/validation';
import { CaseStudiesService } from './case-studies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PublishStatus } from '@prisma/client';

@Controller()
export class CaseStudiesController {
  constructor(private caseStudiesService: CaseStudiesService) {}

  // ─── Public Endpoints ──────────────────────────────────────────

  @Get('case-studies')
  async getPublished() {
    const caseStudies = await this.caseStudiesService.findPublished();
    return { success: true, data: caseStudies };
  }

  @Get('case-studies/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const study = await this.caseStudiesService.findBySlug(slug);
    if (!study) throw new NotFoundException(`Case study '${slug}' not found`);
    return { success: true, data: study };
  }

  // ─── Admin Endpoints ───────────────────────────────────────────

  @Get('admin/case-studies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.caseStudiesService.findAllAdmin({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status as PublishStatus | undefined,
      search,
    });
    return { success: true, ...result };
  }

  @Get('admin/case-studies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async findOneAdmin(@Param('id') id: string) {
    const study = await this.caseStudiesService.findOneAdmin(id);
    if (!study) throw new NotFoundException('Case study not found');
    return { success: true, data: study };
  }

  @Post('admin/case-studies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async create(@Body() body: unknown) {
    const parseResult = createCaseStudySchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const study = await this.caseStudiesService.create(parseResult.data as any);
    return { success: true, data: study };
  }

  @Patch('admin/case-studies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parseResult = createCaseStudySchema.partial().safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const study = await this.caseStudiesService.update(id, parseResult.data as any);
    return { success: true, data: study };
  }

  @Delete('admin/case-studies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async delete(@Param('id') id: string) {
    await this.caseStudiesService.delete(id);
    return { success: true, message: 'Case study deleted' };
  }
}
