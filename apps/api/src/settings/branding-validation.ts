import { BadRequestException } from '@nestjs/common';
import type { AssetType } from './branding-types';
import { ALLOWED_MIME_TYPES } from './branding-types';

export function validateBrandingFile(type: AssetType, file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('No file selected for upload.');
  }

  // 1. Validate File Size
  const maxSize = type === 'favicon' ? 1024 * 1024 : 2 * 1024 * 1024;
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
      /\bon[a-zA-Z]{1,30}\s*=/i,
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
}
