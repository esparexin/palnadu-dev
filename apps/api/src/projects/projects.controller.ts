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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProjectStatus } from '@prisma/client';

@Controller('admin/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  async create(@Body() body: any) {
    const project = await this.projectsService.create(body);
    return { success: true, data: project };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.projectsService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status as ProjectStatus | undefined,
      search,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(id);
    if (!project) throw new NotFoundException('Project not found');
    return { success: true, data: project };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const project = await this.projectsService.update(id, body);
    return { success: true, data: project };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return { success: true, message: 'Project deleted successfully' };
  }
}
