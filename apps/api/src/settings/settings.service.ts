import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import type { AssetType, BrandingAsset, FullBrandingConfig } from './branding-types';
import { EMPTY_ASSET, DEFAULT_BRANDING } from './branding-types';
import { validateBrandingFile } from './branding-validation';

export type { AssetType, BrandingAsset, FullBrandingConfig };

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private brandingCache: FullBrandingConfig | null = null;
  private brandingCacheExpiry: number = 0;
  private static readonly CACHE_TTL_MS = 60_000;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      this.logger.log('Cloudinary initialized for branding assets.');
    }
  }

  async getBranding(): Promise<FullBrandingConfig> {
    const now = Date.now();
    if (this.brandingCache && now < this.brandingCacheExpiry) {
      return this.brandingCache;
    }

    try {
      const record = await this.prisma.siteSetting.findUnique({
        where: { key: 'branding' },
      });

      if (!record || !record.value) {
        return DEFAULT_BRANDING;
      }

      const val = record.value as unknown as Partial<FullBrandingConfig>;
      const rawOld = record.value as any;

      const headerLogo = val.headerLogo || {
        ...EMPTY_ASSET,
        url: rawOld?.logoUrl || null,
        publicId: rawOld?.logoPublicId || null,
        width: rawOld?.width || null,
        height: rawOld?.height || null,
        format: rawOld?.format || null,
        size: rawOld?.size || null,
        originalName: rawOld?.originalName || null,
      };

      const result: FullBrandingConfig = {
        headerLogo,
        footerLogo: val.footerLogo || { ...EMPTY_ASSET },
        favicon: val.favicon || { ...EMPTY_ASSET },
        ogImage: val.ogImage || { ...EMPTY_ASSET },
        updatedAt: val.updatedAt || new Date().toISOString(),
        updatedBy: val.updatedBy || null,
      };

      this.brandingCache = result;
      this.brandingCacheExpiry = Date.now() + SettingsService.CACHE_TTL_MS;
      return result;
    } catch (err) {
      this.logger.error('Failed to retrieve branding settings', err);
      return DEFAULT_BRANDING;
    }
  }

  private invalidateBrandingCache() {
    this.brandingCache = null;
    this.brandingCacheExpiry = 0;
  }

  private getPropertyKey(type: AssetType): 'headerLogo' | 'footerLogo' | 'favicon' | 'ogImage' {
    if (type === 'header') return 'headerLogo';
    if (type === 'footer') return 'footerLogo';
    if (type === 'favicon') return 'favicon';
    return 'ogImage';
  }

  async uploadAsset(
    type: AssetType,
    file: Express.Multer.File,
    userEmail?: string,
  ): Promise<FullBrandingConfig> {
    validateBrandingFile(type, file);

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new BadRequestException('Cloudinary credentials are not configured on the backend server.');
    }

    const propKey = this.getPropertyKey(type);
    const currentBranding = await this.getBranding();
    const oldPublicId = currentBranding[propKey]?.publicId;
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();

    const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `palnadu/branding/${type}`,
          resource_type: 'image',
          public_id: `${type}_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Cloudinary ${type} upload failed`, error);
            return reject(new BadRequestException(error?.message || `Failed to upload ${type} to Cloudinary.`));
          }
          resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });

    if (oldPublicId && oldPublicId !== uploadResult.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        this.logger.log(`Deleted previous ${type} asset: ${oldPublicId}`);
      } catch (cleanupErr) {
        this.logger.warn(`Failed to delete previous asset ${oldPublicId}:`, cleanupErr);
      }
    }

    const updatedAsset: BrandingAsset = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      format: uploadResult.format || ext,
      size: file.size,
      originalName: file.originalname,
      updatedAt: new Date().toISOString(),
    };

    const newConfig: FullBrandingConfig = {
      ...currentBranding,
      [propKey]: updatedAsset,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    };

    await this.prisma.siteSetting.upsert({
      where: { key: 'branding' },
      update: {
        value: newConfig as unknown as Prisma.JsonObject,
        updatedBy: userEmail || 'admin',
      },
      create: {
        key: 'branding',
        value: newConfig as unknown as Prisma.JsonObject,
        description: 'Active site branding and brandmark assets',
        updatedBy: userEmail || 'admin',
      },
    });

    this.logger.log(`Branding ${type} asset updated by ${userEmail || 'admin'}`);
    this.invalidateBrandingCache();
    return newConfig;
  }

  async removeAsset(type: AssetType, userEmail?: string): Promise<FullBrandingConfig> {
    const propKey = this.getPropertyKey(type);
    const currentBranding = await this.getBranding();
    const oldPublicId = currentBranding[propKey]?.publicId;

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        this.logger.log(`Deleted ${type} asset from Cloudinary: ${oldPublicId}`);
      } catch (err) {
        this.logger.warn(`Failed to destroy Cloudinary asset: ${oldPublicId}`, err);
      }
    }

    const newConfig: FullBrandingConfig = {
      ...currentBranding,
      [propKey]: { ...EMPTY_ASSET },
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    };

    await this.prisma.siteSetting.upsert({
      where: { key: 'branding' },
      update: {
        value: newConfig as unknown as Prisma.JsonObject,
        updatedBy: userEmail || 'admin',
      },
      create: {
        key: 'branding',
        value: newConfig as unknown as Prisma.JsonObject,
        description: 'Active site branding and brandmark assets',
        updatedBy: userEmail || 'admin',
      },
    });

    this.logger.log(`Branding ${type} asset removed by ${userEmail || 'admin'}`);
    this.invalidateBrandingCache();
    return newConfig;
  }
}
