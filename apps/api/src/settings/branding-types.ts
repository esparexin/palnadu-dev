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

export const EMPTY_ASSET: BrandingAsset = {
  url: null,
  publicId: null,
  width: null,
  height: null,
  format: null,
  size: null,
  originalName: null,
};

export const DEFAULT_BRANDING: FullBrandingConfig = {
  headerLogo: { ...EMPTY_ASSET },
  footerLogo: { ...EMPTY_ASSET },
  favicon: { ...EMPTY_ASSET },
  ogImage: { ...EMPTY_ASSET },
  updatedAt: new Date().toISOString(),
  updatedBy: null,
};

export const ALLOWED_MIME_TYPES: Record<AssetType, string[]> = {
  header: ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'],
  footer: ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'],
  favicon: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp'],
  ogImage: ['image/png', 'image/jpeg', 'image/webp'],
};
