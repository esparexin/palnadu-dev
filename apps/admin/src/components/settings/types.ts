export interface BrandingAsset {
  url: string | null;
  publicId?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  size?: number | null;
  originalName?: string | null;
  updatedAt?: string;
}

export interface FullBrandingData {
  headerLogo: BrandingAsset;
  footerLogo: BrandingAsset;
  favicon: BrandingAsset;
  ogImage: BrandingAsset;
  updatedAt: string;
}

export type AssetType = 'header' | 'footer' | 'favicon' | 'ogImage';

export const EMPTY_ASSET: BrandingAsset = {
  url: null,
  publicId: null,
};
