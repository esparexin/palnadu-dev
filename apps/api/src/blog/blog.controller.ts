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
  BadRequestException,
} from '@nestjs/common';
import { createBlogPostSchema, createBlogCategorySchema } from '@palnadu/validation';
import { BlogService, parseLanguage } from './blog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PublishStatus, BlogLanguage } from '@prisma/client';
import { toTopicKey } from '../automation/topic-identity';

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
    @Query('status') status?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('language') language?: string,
  ) {
    const result = await this.blogService.findPublished({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      categorySlug: category,
      search,
      status: status as PublishStatus | undefined,
      includeArchived: includeArchived === 'true' || includeArchived === '1',
      language: parseLanguage(language),
    });
    return { success: true, ...result };
  }

  @Get('blog/categories')
  async getCategories() {
    const categories = await this.blogService.getCategories();
    return { success: true, data: categories };
  }

  @Get('blog/:slug')
  async getBySlug(@Param('slug') slug: string, @Query('language') language?: string) {
    // Defaults to English: existing callers (and `/blog/<slug>` URLs) keep
    // resolving exactly as before. Telugu pages pass `language=te`.
    const post = await this.blogService.findBySlug(slug, parseLanguage(language) ?? BlogLanguage.en);
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
    @Query('language') language?: string,
  ) {
    const result = await this.blogService.findAllAdmin({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status: status as PublishStatus | undefined,
      categorySlug: category,
      search,
      language: parseLanguage(language),
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
  async create(@Body() body: unknown, @Request() req: any) {
    const parseResult = createBlogPostSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const valid = parseResult.data;
    const post = await this.blogService.create({
      topicKey: toTopicKey(valid.title),
      topic: valid.title,
      title: valid.title,
      slug: valid.slug,
      language: (body as any).language !== undefined ? parseLanguage((body as any).language) : undefined,
      translationGroupId: (body as any).translationGroupId || undefined,
      excerpt: valid.excerpt || undefined,
      content: valid.content,
      coverImage: valid.coverImage || undefined,
      seoTitle: valid.seoTitle || undefined,
      seoDescription: valid.seoDescription || undefined,
      canonicalUrl: valid.canonicalUrl || undefined,
      ogImage: valid.ogImage || undefined,
      status: valid.status || PublishStatus.DRAFT,
      publishDate: valid.status === PublishStatus.PUBLISHED ? (valid.publishDate || new Date()) : undefined,
      author: { connect: { id: req.user.sub } },
      ...(valid.categoryId && { category: { connect: { id: valid.categoryId } } }),
    });
    return { success: true, data: post };
  }

  @Post('admin/blog/link-translations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async linkTranslations(@Body() body: { postIds: string[]; translationGroupId?: string }) {
    if (!Array.isArray(body?.postIds)) {
      throw new BadRequestException('postIds must be an array of post ids');
    }
    const result = await this.blogService.linkTranslations(body.postIds, body.translationGroupId);
    return { success: true, data: result };
  }

  @Patch('admin/blog/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const parseResult = createBlogPostSchema.partial().safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const { categoryId, ...rest } = parseResult.data as any;
    const updateData: any = { ...rest };

    const typedBody = body as any;
    // Auto-populate publishDate if transitioning from DRAFT to PUBLISHED
    if (typedBody?.status === PublishStatus.PUBLISHED && !typedBody?.publishDate) {
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
  async createCategory(@Body() body: unknown) {
    const parseResult = createBlogCategorySchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }
    const category = await this.blogService.createCategory(parseResult.data as any);
    return { success: true, data: category };
  }
}
