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
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.mediaService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 24,
      search,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.mediaService.findOne(id);
    if (!item) throw new NotFoundException('Media not found');
    return { success: true, data: item };
  }

  @Post()
  async createRecord(
    @Body()
    body: {
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      alt?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const media = await this.mediaService.create(body);
    return { success: true, data: media };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { alt?: string; metadata?: Record<string, unknown> },
  ) {
    const media = await this.mediaService.update(id, body);
    return { success: true, data: media };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  async delete(@Param('id') id: string) {
    await this.mediaService.delete(id);
    return { success: true, message: 'Media deleted' };
  }
}
