import { adminApi, getToken, API_URL } from './client';

export type BrandingAssetType = 'header' | 'footer' | 'favicon' | 'ogImage';

let brandingCache: { data: any; expiry: number } | null = null;
let pendingBrandingPromise: Promise<{ success: boolean; data: any }> | null = null;
const BRANDING_CACHE_TTL_MS = 60_000;

export function invalidateBrandingClientCache(): void {
  brandingCache = null;
  pendingBrandingPromise = null;
}

export const settingsApi = {
  branding: {
    get: async () => {
      const now = Date.now();
      if (brandingCache && now < brandingCache.expiry) {
        return { success: true, data: brandingCache.data };
      }
      if (pendingBrandingPromise) {
        return pendingBrandingPromise;
      }
      pendingBrandingPromise = adminApi<{ success: boolean; data: any }>('/api/settings/branding')
        .then((res) => {
          if (res.success && res.data) {
            brandingCache = { data: res.data, expiry: Date.now() + BRANDING_CACHE_TTL_MS };
          }
          return res;
        })
        .finally(() => {
          pendingBrandingPromise = null;
        });
      return pendingBrandingPromise;
    },
    uploadAsset: async (type: BrandingAssetType, file: File) => {
      invalidateBrandingClientCache();
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/api/admin/settings/branding/asset/${type}`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `${type} upload failed`);
      }
      return response.json();
    },
    removeAsset: async (type: BrandingAssetType) => {
      invalidateBrandingClientCache();
      return adminApi<{ success: boolean; message: string; data: any }>(
        `/api/admin/settings/branding/asset/${type}`,
        { method: 'DELETE' },
      );
    },
    uploadLogo: async (file: File) => {
      invalidateBrandingClientCache();
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/api/admin/settings/branding/logo`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Logo upload failed');
      }
      return response.json();
    },
    removeLogo: async () => {
      invalidateBrandingClientCache();
      return adminApi<{ success: boolean; message: string; data: any }>('/api/admin/settings/branding/logo', {
        method: 'DELETE',
      });
    },
  },
};
