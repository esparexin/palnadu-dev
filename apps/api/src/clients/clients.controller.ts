import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  async create(@Body() body: any) {
    const client = await this.clientsService.create(body);
    return { success: true, data: client };
  }

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    const result = await this.clientsService.findAll({ page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20, search });
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const client = await this.clientsService.findOne(id);
    if (!client) throw new NotFoundException('Client not found');
    return { success: true, data: client };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const client = await this.clientsService.update(id, body);
    return { success: true, data: client };
  }
}
