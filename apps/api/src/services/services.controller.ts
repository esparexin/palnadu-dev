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
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PublishStatus } from '@prisma/client';

@Controller()
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // ─── Public Endpoints ──────────────────────────────────────────

  @Get('services')
  async getPublishedServices() {
    const services = await this.servicesService.findPublished();
    return { success: true, data: services };
  }

  @Get('services/:slug')
  async getServiceBySlug(@Param('slug') slug: string) {
    const service = await this.servicesService.findBySlug(slug);
    if (!service) throw new NotFoundException(`Service '${slug}' not found`);
    return { success: true, data: service };
  }

  // ─── Admin Endpoints ───────────────────────────────────────────

  @Get('admin/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.servicesService.findAllAdmin({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      status: status as PublishStatus | undefined,
      search,
    });
    return { success: true, ...result };
  }

  @Get('admin/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async findOneAdmin(@Param('id') id: string) {
    const service = await this.servicesService.findOneAdmin(id);
    if (!service) throw new NotFoundException('Service not found');
    return { success: true, data: service };
  }

  @Post('admin/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async create(@Body() body: any) {
    const service = await this.servicesService.create(body);
    return { success: true, data: service };
  }

  @Patch('admin/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async update(@Param('id') id: string, @Body() body: any) {
    const service = await this.servicesService.update(id, body);
    return { success: true, data: service };
  }

  @Delete('admin/services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async delete(@Param('id') id: string) {
    await this.servicesService.delete(id);
    return { success: true, message: 'Service deleted' };
  }
}
