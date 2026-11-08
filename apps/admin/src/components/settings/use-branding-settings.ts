import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { FullBrandingData, AssetType } from './types';
import { EMPTY_ASSET } from './types';

export function useBrandingSettings() {
  const [branding, setBranding] = useState<FullBrandingData>({
    headerLogo: { ...EMPTY_ASSET },
    footerLogo: { ...EMPTY_ASSET },
    favicon: { ...EMPTY_ASSET },
    ogImage: { ...EMPTY_ASSET },
    updatedAt: '',
  });

  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingType, setRemovingType] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: AssetType; label: string } | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Partial<Record<AssetType, File>>>({});
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<AssetType, string>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRefs = {
    header: useRef<HTMLInputElement>(null),
    footer: useRef<HTMLInputElement>(null),
    favicon: useRef<HTMLInputElement>(null),
    ogImage: useRef<HTMLInputElement>(null),
  };

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const res = await api.settings.branding.get();
      if (res.success && res.data) setBranding(res.data);
    } catch (err) {
      console.error('Failed to fetch branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const handleStageFile = (type: AssetType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const maxSize = type === 'favicon' ? 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(`File is too large. Maximum allowed is ${maxSize / 1024 / 1024} MB.`);
      e.target.value = '';
      return;
    }

    const allowed =
      type === 'favicon'
        ? ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp']
        : type === 'ogImage'
        ? ['image/png', 'image/jpeg', 'image/webp']
        : ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];

    if (!allowed.includes(file.type) && !file.name.endsWith('.ico') && !file.name.endsWith('.svg')) {
      setErrorMessage('Unsupported format. Please upload an accepted image file.');
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setStagedFiles((prev) => ({ ...prev, [type]: file }));
    setPreviewUrls((prev) => ({ ...prev, [type]: objectUrl }));
  };

  const handleDiscardAll = () => {
    Object.values(previewUrls).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setStagedFiles({});
    setPreviewUrls({});
    setErrorMessage(null);
    Object.values(fileInputRefs).forEach((ref) => {
      if (ref.current) ref.current.value = '';
    });
  };

  const handleApplyChanges = async () => {
    if (Object.keys(stagedFiles).length === 0) return;
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const uploadPromises: Promise<any>[] = [];
      (Object.keys(stagedFiles) as AssetType[]).forEach((type) => {
        const file = stagedFiles[type];
        if (file) uploadPromises.push(api.settings.branding.uploadAsset(type, file));
      });

      await Promise.all(uploadPromises);
      handleDiscardAll();
      await fetchBranding();
      setSuccessMessage('All branding assets uploaded and applied successfully.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to apply branding changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;
    const { type, label } = deleteTarget;
    setRemovingType(type);
    try {
      await api.settings.branding.removeAsset(type);
      await fetchBranding();
      setSuccessMessage(`${label} removed. Default fallback restored.`);
      setDeleteTarget(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : `Failed to remove ${label}.`);
    } finally {
      setRemovingType(null);
    }
  };

  return {
    branding,
    saving,
    removingType,
    deleteTarget,
    setDeleteTarget,
    stagedFiles,
    previewUrls,
    errorMessage,
    successMessage,
    fileInputRefs,
    handleStageFile,
    handleDiscardAll,
    handleApplyChanges,
    handleConfirmRemove,
  };
}
