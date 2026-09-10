import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface BrandingConfig {
  hasCustomLogo: boolean;
  logoUrl: string | null;
  logoPublicId: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  size?: number | null;
  originalName?: string | null;
  altText: string;
  updatedAt?: string;
  updatedBy?: string | null;
  defaultBrandmark: {
    symbol: string;
    text: string;
    tagline: string;
  };
  locations: string[];
}

const DEFAULT_BRANDING: BrandingConfig = {
  hasCustomLogo: false,
  logoUrl: null,
  logoPublicId: null,
  width: null,
  height: null,
  format: null,
  size: null,
  originalName: null,
  altText: 'Palnadu.dev',
  defaultBrandmark: {
    symbol: 'P.',
    text: 'Palnadu.dev',
    tagline: 'Start With The Problem. We Build The Solution.',
  },
  locations: [
    'Desktop Header',
    'Mobile Navigation',
    'Footer',
    'Admin Portal',
    'Social Metadata',
  ],
};

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

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
   * Get active branding settings (Public & Admin)
   */
  async getBranding(): Promise<BrandingConfig> {
    try {
      const record = await this.prisma.siteSetting.findUnique({
        where: { key: 'branding' },
      });

      if (!record || !record.value) {
        return DEFAULT_BRANDING;
      }

      const val = record.value as unknown as Partial<BrandingConfig>;
      return {
        ...DEFAULT_BRANDING,
        ...val,
        hasCustomLogo: Boolean(val.hasCustomLogo && val.logoUrl),
      };
    } catch (err) {
      this.logger.error('Failed to retrieve branding settings', err);
      return DEFAULT_BRANDING;
    }
  }

  /**
   * Upload, validate, and apply a new brand logo (Admin only)
   */
  async uploadLogo(file: Express.Multer.File, userEmail?: string): Promise<BrandingConfig> {
    if (!file) {
      throw new BadRequestException('No file selected for upload.');
    }

    // 1. Validate File Size (< 2MB)
    if (file.size > MAX_LOGO_SIZE) {
      throw new BadRequestException(
        `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 2MB.`,
      );
    }
    if (file.size < 100) {
      throw new BadRequestException('File is empty or corrupted.');
    }

    // 2. Validate MIME Type & Extension
    const mimeType = (file.mimetype || '').toLowerCase();
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    const isSvg = mimeType === 'image/svg+xml' || ext === 'svg';
    const isPng = mimeType === 'image/png' || ext === 'png';
    const isJpg = mimeType === 'image/jpeg' || mimeType === 'image/jpg' || ext === 'jpg' || ext === 'jpeg';
    const isWebp = mimeType === 'image/webp' || ext === 'webp';

    if (!isSvg && !isPng && !isJpg && !isWebp) {
      throw new BadRequestException(
        'Unsupported file format. Please upload a PNG with transparent background or a clean SVG.',
      );
    }

    // 3. SVG Security Sanitization Check (Prevent Stored XSS)
    if (isSvg) {
      const svgText = file.buffer.toString('utf-8');
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // onload, onerror, onclick, etc.
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

    // 4. Verify Cloudinary Configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new BadRequestException('Cloudinary credentials are not configured on the backend server.');
    }

    // 5. Fetch previous branding to delete old Cloudinary asset after successful upload
    const currentBranding = await this.getBranding();
    const oldPublicId = currentBranding.logoPublicId;

    // 6. Upload Stream to Dedicated Branding Folder
    const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'palnadu/branding/logo',
          resource_type: isSvg ? 'raw' : 'image',
          public_id: `logo_${Date.now()}`,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary logo upload failed', error);
            return reject(new BadRequestException(error?.message || 'Failed to upload logo to Cloudinary.'));
          }
          resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });

    // 7. Cleanup previous Cloudinary asset (if it exists)
    if (oldPublicId && oldPublicId !== uploadResult.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        this.logger.log(`Deleted previous logo asset: ${oldPublicId}`);
      } catch (cleanupErr) {
        this.logger.warn(`Failed to delete previous logo asset ${oldPublicId}:`, cleanupErr);
      }
    }

    // 8. Construct Updated Branding Config
    const updatedConfig: BrandingConfig = {
      ...DEFAULT_BRANDING,
      hasCustomLogo: true,
      logoUrl: uploadResult.secure_url,
      logoPublicId: uploadResult.public_id,
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      format: uploadResult.format || ext,
      size: file.size,
      originalName: file.originalname,
      altText: 'Palnadu.dev Logo',
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    };

    // 9. Persist into MongoDB Atlas (SiteSettings)
    await this.prisma.siteSetting.upsert({
      where: { key: 'branding' },
      update: {
        value: updatedConfig as unknown as Prisma.JsonObject,
        updatedBy: userEmail || 'admin',
      },
      create: {
        key: 'branding',
        value: updatedConfig as unknown as Prisma.JsonObject,
        description: 'Active site branding and brandmark assets',
        updatedBy: userEmail || 'admin',
      },
    });

    this.logger.log(`Active logo updated successfully by ${userEmail || 'admin'}`);
    return updatedConfig;
  }

  /**
   * Remove custom logo and revert to default typographic brandmark
   */
  async removeLogo(userEmail?: string): Promise<BrandingConfig> {
    const currentBranding = await this.getBranding();
    const oldPublicId = currentBranding.logoPublicId;

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        this.logger.log(`Deleted logo asset on removal: ${oldPublicId}`);
      } catch (err) {
        this.logger.warn(`Failed to destroy Cloudinary asset on removal: ${oldPublicId}`, err);
      }
    }

    const resetConfig: BrandingConfig = {
      ...DEFAULT_BRANDING,
      hasCustomLogo: false,
      logoUrl: null,
      logoPublicId: null,
      width: null,
      height: null,
      format: null,
      size: null,
      originalName: null,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    };

    await this.prisma.siteSetting.upsert({
      where: { key: 'branding' },
      update: {
        value: resetConfig as unknown as Prisma.JsonObject,
        updatedBy: userEmail || 'admin',
      },
      create: {
        key: 'branding',
        value: resetConfig as unknown as Prisma.JsonObject,
        description: 'Active site branding and brandmark assets',
        updatedBy: userEmail || 'admin',
      },
    });

    this.logger.log(`Custom logo removed. Reverted to default typographic brandmark.`);
    return resetConfig;
  }
}
