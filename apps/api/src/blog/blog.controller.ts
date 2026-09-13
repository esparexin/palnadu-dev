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
  Request,
  NotFoundException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PublishStatus } from '@prisma/client';

@Controller()
export class BlogController {
  constructor(private blogService: BlogService) {}

  // ─── Public Endpoints ──────────────────────────────────────────

  @Get('blog')
  async getPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.blogService.findPublished({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      categorySlug: category,
      search,
    });
    return { success: true, ...result };
  }

  @Get('blog/categories')
  async getCategories() {
    const categories = await this.blogService.getCategories();
    return { success: true, data: categories };
  }

  @Get('blog/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const post = await this.blogService.findBySlug(slug);
    if (!post) throw new NotFoundException(`Article '${slug}' not found`);
    return { success: true, data: post };
  }

  // ─── Admin Endpoints ───────────────────────────────────────────

  @Get('admin/blog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const result = await this.blogService.findAllAdmin({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status as PublishStatus | undefined,
      categorySlug: category,
      search,
    });
    return { success: true, ...result };
  }

  @Get('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async findOneAdmin(@Param('id') id: string) {
    const post = await this.blogService.findOneAdmin(id);
    if (!post) throw new NotFoundException('Article not found');
    return { success: true, data: post };
  }

  @Post('admin/blog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async create(@Body() body: any, @Request() req: any) {
    const post = await this.blogService.create({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || undefined,
      content: body.content,
      coverImage: body.coverImage || undefined,
      seoTitle: body.seoTitle || undefined,
      seoDescription: body.seoDescription || undefined,
      canonicalUrl: body.canonicalUrl || undefined,
      ogImage: body.ogImage || undefined,
      status: body.status || PublishStatus.DRAFT,
      publishDate: body.status === PublishStatus.PUBLISHED ? (body.publishDate || new Date()) : undefined,
      author: { connect: { id: req.user.sub } },
      ...(body.categoryId && { category: { connect: { id: body.categoryId } } }),
    });
    return { success: true, data: post };
  }

  @Patch('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async update(@Param('id') id: string, @Body() body: any) {
    const { categoryId, ...rest } = body;
    const updateData: any = { ...rest };

    // Auto-populate publishDate if transitioning from DRAFT to PUBLISHED
    if (body.status === PublishStatus.PUBLISHED && !body.publishDate) {
      const existing = await this.blogService.findOneAdmin(id);
      if (!existing?.publishDate) {
        updateData.publishDate = new Date();
      }
    }

    if (categoryId) {
      updateData.category = { connect: { id: categoryId } };
    } else if (categoryId === null) {
      updateData.category = { disconnect: true };
    }
    const post = await this.blogService.update(id, updateData);
    return { success: true, data: post };
  }

  @Delete('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async delete(@Param('id') id: string) {
    await this.blogService.delete(id);
    return { success: true, message: 'Article deleted' };
  }

  @Post('admin/blog/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async createCategory(@Body() body: { name: string; slug: string; description?: string }) {
    const category = await this.blogService.createCategory(body);
    return { success: true, data: category };
  }
}
