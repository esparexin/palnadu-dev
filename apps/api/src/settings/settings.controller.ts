import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService, AssetType } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Public endpoint to fetch active branding (Header, Footer, Favicon)
   */
  @Get('settings/branding')
  async getPublicBranding() {
    const branding = await this.settingsService.getBranding();
    return {
      success: true,
      data: branding,
    };
  }

  /**
   * Admin endpoint to inspect current branding
   */
  @Get('admin/settings/branding')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async getAdminBranding() {
    const branding = await this.settingsService.getBranding();
    return {
      success: true,
      data: branding,
    };
  }

  /**
   * Admin endpoint to upload/replace a specific branding asset
   * Supported types: 'header' | 'footer' | 'favicon' | 'ogImage'
   */
  @Post('admin/settings/branding/asset/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!['header', 'footer', 'favicon', 'ogImage'].includes(type)) {
      throw new BadRequestException(`Invalid asset type '${type}'. Must be header, footer, favicon, or ogImage.`);
    }

    if (!file) {
      throw new BadRequestException('Please select a file to upload.');
    }

    const userEmail = req.user?.email || 'admin';
    const updated = await this.settingsService.uploadAsset(type as AssetType, file, userEmail);
    return {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} asset updated successfully.`,
      data: updated,
    };
  }

  /**
   * Admin endpoint to remove a specific branding asset
   */
  @Delete('admin/settings/branding/asset/:type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeAsset(@Param('type') type: string, @Request() req: any) {
    if (!['header', 'footer', 'favicon', 'ogImage'].includes(type)) {
      throw new BadRequestException(`Invalid asset type '${type}'. Must be header, footer, favicon, or ogImage.`);
    }

    const userEmail = req.user?.email || 'admin';
    const updated = await this.settingsService.removeAsset(type as AssetType, userEmail);
    return {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} asset removed. Default fallback restored.`,
      data: updated,
    };
  }

  /**
   * Legacy alias: POST /api/admin/settings/branding/logo -> header
   */
  @Post('admin/settings/branding/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLegacyLogo(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('Please select a logo file to upload.');
    }
    const userEmail = req.user?.email || 'admin';
    const updated = await this.settingsService.uploadAsset('header', file, userEmail);
    return {
      success: true,
      message: 'Header logo uploaded and applied successfully.',
      data: updated,
    };
  }

  /**
   * Legacy alias: DELETE /api/admin/settings/branding/logo -> header
   */
  @Delete('admin/settings/branding/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeLegacyLogo(@Request() req: any) {
    const userEmail = req.user?.email || 'admin';
    const updated = await this.settingsService.removeAsset('header', userEmail);
    return {
      success: true,
      message: 'Header logo removed. Default fallback restored.',
      data: updated,
    };
  }
}
