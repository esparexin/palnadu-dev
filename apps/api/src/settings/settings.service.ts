import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export type AssetType = 'header' | 'footer' | 'favicon' | 'ogImage';

export interface BrandingAsset {
  url: string | null;
  publicId: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  size?: number | null;
  originalName?: string | null;
  updatedAt?: string;
}

export interface FullBrandingConfig {
  headerLogo: BrandingAsset;
  footerLogo: BrandingAsset;
  favicon: BrandingAsset;
  ogImage: BrandingAsset;
  updatedAt: string;
  updatedBy?: string | null;
}

const EMPTY_ASSET: BrandingAsset = {
  url: null,
  publicId: null,
  width: null,
  height: null,
  format: null,
  size: null,
  originalName: null,
};

const DEFAULT_BRANDING: FullBrandingConfig = {
  headerLogo: { ...EMPTY_ASSET },
  footerLogo: { ...EMPTY_ASSET },
  favicon: { ...EMPTY_ASSET },
  ogImage: { ...EMPTY_ASSET },
  updatedAt: new Date().toISOString(),
  updatedBy: null,
};

const ALLOWED_MIME_TYPES: Record<AssetType, string[]> = {
  header: ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'],
  footer: ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'],
  favicon: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp'],
  ogImage: ['image/png', 'image/jpeg', 'image/webp'],
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

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

  /**
   * Get complete branding configuration (Header, Footer, Favicon, Social)
   */
  async getBranding(): Promise<FullBrandingConfig> {
    try {
      const record = await this.prisma.siteSetting.findUnique({
        where: { key: 'branding' },
      });

      if (!record || !record.value) {
        return DEFAULT_BRANDING;
      }

      const val = record.value as unknown as Partial<FullBrandingConfig>;

      // Migrate older single-logo format seamlessly if present
      const rawOld = record.value as any;
      const legacyLogoUrl = rawOld?.logoUrl || null;
      const legacyLogoPublicId = rawOld?.logoPublicId || null;

      const headerLogo = val.headerLogo || {
        ...EMPTY_ASSET,
        url: legacyLogoUrl,
        publicId: legacyLogoPublicId,
        width: rawOld?.width || null,
        height: rawOld?.height || null,
        format: rawOld?.format || null,
        size: rawOld?.size || null,
        originalName: rawOld?.originalName || null,
      };

      const footerLogo = val.footerLogo || { ...EMPTY_ASSET };
      const favicon = val.favicon || { ...EMPTY_ASSET };
      const ogImage = val.ogImage || { ...EMPTY_ASSET };

      return {
        headerLogo,
        footerLogo,
        favicon,
        ogImage,
        updatedAt: val.updatedAt || new Date().toISOString(),
        updatedBy: val.updatedBy || null,
      };
    } catch (err) {
      this.logger.error('Failed to retrieve branding settings', err);
      return DEFAULT_BRANDING;
    }
  }

  private getPropertyKey(type: AssetType): 'headerLogo' | 'footerLogo' | 'favicon' | 'ogImage' {
    if (type === 'header') return 'headerLogo';
    if (type === 'footer') return 'footerLogo';
    if (type === 'favicon') return 'favicon';
    return 'ogImage';
  }

  /**
   * Upload & apply a specific branding asset (header, footer, favicon, ogImage)
   */
  async uploadAsset(
    type: AssetType,
    file: Express.Multer.File,
    userEmail?: string,
  ): Promise<FullBrandingConfig> {
    if (!file) {
      throw new BadRequestException('No file selected for upload.');
    }

    // 1. Validate File Size
    const maxSize = type === 'favicon' ? 1024 * 1024 : 2 * 1024 * 1024; // 1MB for favicon, 2MB for others
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${
          maxSize / 1024 / 1024
        }MB.`,
      );
    }
    if (file.size < 50) {
      throw new BadRequestException('File is empty or corrupted.');
    }

    // 2. Validate MIME Type & Extension
    const mimeType = (file.mimetype || '').toLowerCase();
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    const allowedMimes = ALLOWED_MIME_TYPES[type];

    const isMatch =
      allowedMimes.includes(mimeType) ||
      (ext === 'svg' && allowedMimes.includes('image/svg+xml')) ||
      (ext === 'png' && allowedMimes.includes('image/png')) ||
      (ext === 'ico' && allowedMimes.includes('image/x-icon'));

    if (!isMatch) {
      throw new BadRequestException(
        `Unsupported file format for ${type}. Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    // 3. SVG Security Sanitization Check
    const isSvg = mimeType === 'image/svg+xml' || ext === 'svg';
    if (isSvg) {
      const svgText = file.buffer.toString('utf-8');
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<embed/i,
        /<object/i,
        /xlink:href=["']data:/i,
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(svgText)) {
          throw new BadRequestException(
            'Security violation: The uploaded SVG file contains dangerous scripts or embedded executable content.',
          );
        }
      }
    }

    // 4. Verify Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new BadRequestException('Cloudinary credentials are not configured on the backend server.');
    }

    // 5. Fetch current config to locate old asset for cleanup
    const propKey = this.getPropertyKey(type);
    const currentBranding = await this.getBranding();
    const oldPublicId = currentBranding[propKey]?.publicId;

    // 6. Upload Stream to Dedicated Folder
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

    // 7. Cleanup old asset if replaced
    if (oldPublicId && oldPublicId !== uploadResult.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        this.logger.log(`Deleted previous ${type} asset: ${oldPublicId}`);
      } catch (cleanupErr) {
        this.logger.warn(`Failed to delete previous asset ${oldPublicId}:`, cleanupErr);
      }
    }

    // 8. Update Config
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

    // 9. Persist to MongoDB
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
    return newConfig;
  }

  /**
   * Remove a specific branding asset and revert to default fallback
   */
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
    return newConfig;
  }
}
