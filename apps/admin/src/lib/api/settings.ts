import { adminApi, getToken, API_URL } from './client';

export type BrandingAssetType = 'header' | 'footer' | 'favicon' | 'ogImage';

export const settingsApi = {
  branding: {
    get: () => adminApi<{ success: boolean; data: any }>('/api/settings/branding'),
    uploadAsset: async (type: BrandingAssetType, file: File) => {
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
    removeAsset: (type: BrandingAssetType) =>
      adminApi<{ success: boolean; message: string; data: any }>(
        `/api/admin/settings/branding/asset/${type}`,
        { method: 'DELETE' },
      ),
    uploadLogo: async (file: File) => {
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
    removeLogo: () =>
      adminApi<{ success: boolean; message: string; data: any }>('/api/admin/settings/branding/logo', {
        method: 'DELETE',
      }),
  },
};
