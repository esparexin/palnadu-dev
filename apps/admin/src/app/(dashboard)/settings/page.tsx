'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Check,
  LayoutTemplate,
  Bookmark,
} from 'lucide-react';

interface BrandingAsset {
  url: string | null;
  publicId?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  size?: number | null;
  originalName?: string | null;
  updatedAt?: string;
}

interface FullBrandingData {
  headerLogo: BrandingAsset;
  footerLogo: BrandingAsset;
  favicon: BrandingAsset;
  ogImage: BrandingAsset;
  updatedAt: string;
}

const EMPTY_ASSET: BrandingAsset = {
  url: null,
  publicId: null,
};

export default function SettingsPage() {
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
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'header' | 'footer' | 'favicon' | 'ogImage'; label: string } | null>(null);

  // Staged files for Apply / Discard flow
  const [stagedFiles, setStagedFiles] = useState<{
    header?: File;
    footer?: File;
    favicon?: File;
    ogImage?: File;
  }>({});

  // Local object URLs for instant live preview
  const [previewUrls, setPreviewUrls] = useState<{
    header?: string;
    footer?: string;
    favicon?: string;
    ogImage?: string;
  }>({});

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hidden file input references
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedChanges = Object.keys(stagedFiles).length > 0;

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const res = await api.settings.branding.get();
      if (res.success && res.data) {
        setBranding(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  // Stage a file for upload
  const handleStageFile = (
    type: 'header' | 'footer' | 'favicon' | 'ogImage',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Size validation
    const maxSize = type === 'favicon' ? 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage(
        `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed is ${
          maxSize / 1024 / 1024
        } MB.`,
      );
      e.target.value = '';
      return;
    }

    // Format validation (mirrors backend allowlist in settings.service.ts)
    const allowed =
      type === 'favicon'
        ? ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp']
        : type === 'ogImage'
        ? ['image/png', 'image/jpeg', 'image/webp']
        : ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];

    if (!allowed.includes(file.type) && !file.name.endsWith('.ico') && !file.name.endsWith('.svg')) {
      setErrorMessage(
        type === 'favicon'
          ? 'Unsupported favicon format. Please upload a square PNG, ICO, or SVG.'
          : type === 'ogImage'
          ? 'Unsupported OG image format. Please upload PNG, JPEG, or WebP (no SVG).'
          : 'Unsupported format. Please upload a transparent PNG or clean SVG logo.',
      );
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setStagedFiles((prev) => ({ ...prev, [type]: file }));
    setPreviewUrls((prev) => ({ ...prev, [type]: objectUrl }));
  };

  // Discard all staged changes
  const handleDiscardAll = () => {
    Object.values(previewUrls).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setStagedFiles({});
    setPreviewUrls({});
    setErrorMessage(null);
    if (headerInputRef.current) headerInputRef.current.value = '';
    if (footerInputRef.current) footerInputRef.current.value = '';
    if (faviconInputRef.current) faviconInputRef.current.value = '';
    if (ogImageInputRef.current) ogImageInputRef.current.value = '';
  };

  // Apply & Save all staged changes to Cloudinary + DB
  const handleApplyChanges = async () => {
    if (!hasUnsavedChanges) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const uploadPromises: Promise<any>[] = [];

      if (stagedFiles.header) {
        uploadPromises.push(api.settings.branding.uploadAsset('header', stagedFiles.header));
      }
      if (stagedFiles.footer) {
        uploadPromises.push(api.settings.branding.uploadAsset('footer', stagedFiles.footer));
      }
      if (stagedFiles.favicon) {
        uploadPromises.push(api.settings.branding.uploadAsset('favicon', stagedFiles.favicon));
      }
      if (stagedFiles.ogImage) {
        uploadPromises.push(api.settings.branding.uploadAsset('ogImage', stagedFiles.ogImage));
      }

      await Promise.all(uploadPromises);

      // Clean up local preview object URLs
      Object.values(previewUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      setStagedFiles({});
      setPreviewUrls({});

      // Refresh database config
      await fetchBranding();
      setSuccessMessage('All branding assets uploaded and applied successfully across all platforms.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to apply branding changes.');
    } finally {
      setSaving(false);
    }
  };

  // Immediate remove of an active asset
  const handleConfirmRemove = async () => {
    if (!deleteTarget) return;
    const { type, label } = deleteTarget;

    setRemovingType(type);
    setErrorMessage(null);
    setSuccessMessage(null);

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

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Brand & Logo Settings</h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">
          Dedicated asset fields for Header Logo, Footer Logo, Favicon, and OG Image with live preview and instant application.
        </p>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-xs text-red-800 font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={headerInputRef}
        onChange={(e) => handleStageFile('header', e)}
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        className="hidden"
      />
      <input
        type="file"
        ref={footerInputRef}
        onChange={(e) => handleStageFile('footer', e)}
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        className="hidden"
      />
      <input
        type="file"
        ref={faviconInputRef}
        onChange={(e) => handleStageFile('favicon', e)}
        accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={ogImageInputRef}
        onChange={(e) => handleStageFile('ogImage', e)}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* ── SEPARATE UPLOAD FIELDS GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* ── CARD 1: HEADER LOGO ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-palnadu-dark">Header Logo</h2>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  stagedFiles.header
                    ? 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/30'
                    : branding.headerLogo?.url
                    ? 'bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/30'
                    : 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20'
                }`}
              >
                {stagedFiles.header ? 'Staged (Unsaved)' : branding.headerLogo?.url ? 'Custom Active' : 'Default Brandmark'}
              </span>
            </div>

            <p className="text-xs text-palnadu-secondary leading-relaxed">
              Displayed in Desktop Header, Mobile Navigation drawer, and Admin Portal.
            </p>

            {/* Light Background Preview */}
            <div className="p-3.5 rounded-lg border border-palnadu-border bg-white flex flex-col justify-center items-center h-20 relative">
              <BrandLogo
                customLogoUrl={previewUrls.header || branding.headerLogo?.url}
                variant="default"
                size="md"
              />
            </div>

            {/* Specifications Help */}
            <div className="text-xs text-palnadu-secondary space-y-0.5 font-mono pt-1">
              <p>• Format: Transparent PNG or SVG</p>
              <p>• Size: 240 × 60 px (max 2 MB)</p>
              <p>• Tone: Dark text on transparent</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-palnadu-border/60">
            <Button
              onClick={() => headerInputRef.current?.click()}
              disabled={saving}
              className="flex-1 gap-1.5 h-9 text-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{branding.headerLogo?.url ? 'Replace' : 'Upload'}</span>
            </Button>

            {branding.headerLogo?.url && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteTarget({ type: 'header', label: 'Header Logo' })}
                disabled={saving || removingType === 'header'}
                className="h-9 w-9 border-palnadu-error/30 text-palnadu-error hover:bg-palnadu-error/10 shrink-0"
                title="Remove custom header logo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── CARD 2: FOOTER LOGO ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-palnadu-dark text-white flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-palnadu-dark">Footer Logo</h2>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  stagedFiles.footer
                    ? 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/30'
                    : branding.footerLogo?.url
                    ? 'bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/30'
                    : 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20'
                }`}
              >
                {stagedFiles.footer ? 'Staged (Unsaved)' : branding.footerLogo?.url ? 'Custom Active' : 'Default Brandmark'}
              </span>
            </div>

            <p className="text-xs text-palnadu-secondary leading-relaxed">
              Displayed on the dark footer surface (#042C53) across all public pages.
            </p>

            {/* Dark Background Preview */}
            <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-dark flex flex-col justify-center items-center h-20 relative">
              <BrandLogo
                customLogoUrl={previewUrls.footer || branding.footerLogo?.url}
                variant="white"
                size="md"
              />
            </div>

            {/* Specifications Help */}
            <div className="text-xs text-palnadu-secondary space-y-0.5 font-mono pt-1">
              <p>• Format: Transparent PNG or SVG</p>
              <p>• Size: 240 × 60 px (max 2 MB)</p>
              <p>• Tone: White / light logo on dark</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-palnadu-border/60">
            <Button
              onClick={() => footerInputRef.current?.click()}
              disabled={saving}
              className="flex-1 gap-1.5 h-9 text-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{branding.footerLogo?.url ? 'Replace' : 'Upload'}</span>
            </Button>

            {branding.footerLogo?.url && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteTarget({ type: 'footer', label: 'Footer Logo' })}
                disabled={saving || removingType === 'footer'}
                className="h-9 w-9 border-palnadu-error/30 text-palnadu-error hover:bg-palnadu-error/10 shrink-0"
                title="Remove custom footer logo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── CARD 3: FAVICON ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-palnadu-teal/10 text-palnadu-teal flex items-center justify-center">
                  <Bookmark className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-palnadu-dark">Favicon</h2>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  stagedFiles.favicon
                    ? 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/30'
                    : branding.favicon?.url
                    ? 'bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/30'
                    : 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20'
                }`}
              >
                {stagedFiles.favicon ? 'Staged (Unsaved)' : branding.favicon?.url ? 'Custom Active' : 'Default (/favicon.png)'}
              </span>
            </div>

            <p className="text-xs text-palnadu-secondary leading-relaxed">
              Displayed in browser tabs, mobile bookmarks, and progressive web app icons.
            </p>

            {/* Favicon Browser Tab Simulation Preview */}
            <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 flex flex-col justify-center items-center h-20">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-palnadu-border shadow-sm">
                {previewUrls.favicon || branding.favicon?.url ? (
                  <img
                    src={previewUrls.favicon || branding.favicon?.url || ''}
                    alt="Favicon"
                    className="h-4 w-4 object-contain rounded-sm"
                  />
                ) : (
                  <img src="/favicon.png" alt="Favicon" className="h-4 w-4 object-contain" />
                )}
                <span className="text-xs font-medium text-palnadu-dark truncate max-w-[120px]">
                  Palnadu.dev — Home
                </span>
              </div>
            </div>

            {/* Specifications Help */}
            <div className="text-xs text-palnadu-secondary space-y-0.5 font-mono pt-1">
              <p>• Format: Square PNG, ICO, SVG</p>
              <p>• Size: 32 × 32 px to 512 × 512 px</p>
              <p>• Maximum: 1 MB</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pt-2 border-t border-palnadu-border/60">
            <Button
              onClick={() => faviconInputRef.current?.click()}
              disabled={saving}
              className="flex-1 gap-1.5 h-9 text-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{branding.favicon?.url ? 'Replace' : 'Upload'}</span>
            </Button>

            {branding.favicon?.url && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteTarget({ type: 'favicon', label: 'Favicon' })}
                disabled={saving || removingType === 'favicon'}
                className="h-9 w-9 border-palnadu-error/30 text-palnadu-error hover:bg-palnadu-error/10 shrink-0"
                title="Remove custom favicon"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── CARD 4: OG IMAGE ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-palnadu-dark">OG Image</h2>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  stagedFiles.ogImage
                    ? 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/30'
                    : branding.ogImage?.url
                    ? 'bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/30'
                    : 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20'
                }`}
              >
                {stagedFiles.ogImage ? 'Staged (Unsaved)' : branding.ogImage?.url ? 'Custom Active' : 'Default'}
              </span>
            </div>

            <p className="text-xs text-palnadu-secondary leading-relaxed">
              Social share image for Open Graph / Twitter cards (no SVG).
            </p>

            <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 flex flex-col justify-center items-center h-20 overflow-hidden">
              {previewUrls.ogImage || branding.ogImage?.url ? (
                <img
                  src={previewUrls.ogImage || branding.ogImage?.url || ''}
                  alt="OG Image"
                  className="h-full w-full object-cover rounded-md"
                />
              ) : (
                <span className="text-xs text-palnadu-secondary">1200 × 630 recommended</span>
              )}
            </div>

            <div className="text-xs text-palnadu-secondary space-y-0.5 font-mono pt-1">
              <p>• Format: PNG, JPEG, WebP</p>
              <p>• Size: 1200 × 630 px (max 2 MB)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-palnadu-border/60">
            <Button
              onClick={() => ogImageInputRef.current?.click()}
              disabled={saving}
              className="flex-1 gap-1.5 h-9 text-xs"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{branding.ogImage?.url ? 'Replace' : 'Upload'}</span>
            </Button>

            {branding.ogImage?.url && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteTarget({ type: 'ogImage', label: 'OG Image' })}
                disabled={saving || removingType === 'ogImage'}
                className="h-9 w-9 border-palnadu-error/30 text-palnadu-error hover:bg-palnadu-error/10 shrink-0"
                title="Remove custom OG image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* ── FLOATING "APPLY & DISCARD" POPUP BAR (Appears whenever changes are staged) ── */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-50 animate-slide-up">
          <div className="bg-palnadu-dark text-white p-4 rounded-xl shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-palnadu-warning animate-pulse shrink-0" />
              <div>
                <p className="font-bold text-white">Unsaved Branding Changes</p>
                <p className="text-xs text-palnadu-off-white">
                  {Object.keys(stagedFiles).length} asset(s) staged. Apply to update Cloudinary & live channels.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleDiscardAll}
                disabled={saving}
                className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Discard
              </Button>
              <Button
                onClick={handleApplyChanges}
                disabled={saving}
                className="flex-1 sm:flex-none gap-1.5 bg-palnadu-teal text-white hover:bg-palnadu-teal-dark shadow-md"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{saving ? 'Applying...' : 'Apply Changes'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Web Modal Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        loading={Boolean(removingType)}
        title="Remove Custom Asset?"
        message={deleteTarget ? `Are you sure you want to remove the custom ${deleteTarget.label}? It will immediately revert to the default brandmark.` : ''}
        confirmLabel="Remove Asset"
      />
    </div>
  );
}
