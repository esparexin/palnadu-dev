import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Public endpoint to fetch active branding
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
   * Admin endpoint to inspect current branding and upload requirements
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
   * Admin endpoint to upload/replace brand logo
   */
  @Post('admin/settings/branding/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('Please select a logo file to upload.');
    }
    const userEmail = req.user?.email || 'admin';
    const updated = await this.settingsService.uploadLogo(file, userEmail);
    return {
      success: true,
      message: 'Logo uploaded and applied successfully.',
      data: updated,
    };
  }

  /**
   * Admin endpoint to remove custom logo and revert to default brandmark
   */
  @Delete('admin/settings/branding/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async removeLogo(@Request() req: any) {
    const userEmail = req.user?.email || 'admin';
    const updated = await this.settingsService.removeLogo(userEmail);
    return {
      success: true,
      message: 'Custom logo removed. Default typographic brandmark restored.',
      data: updated,
    };
  }
}
