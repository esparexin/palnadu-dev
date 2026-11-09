'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CheckCircle2, AlertCircle, LayoutTemplate, Bookmark } from 'lucide-react';
import type { AssetType } from '@/components/settings/types';
import { BrandingAssetCard } from '@/components/settings/branding-asset-card';
import { BrandingActionBar } from '@/components/settings/branding-action-bar';
import { useBrandingSettings } from '@/components/settings/use-branding-settings';

export default function SettingsPage() {
  const {
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
  } = useBrandingSettings();

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Brand & Logo Settings</h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">
          Dedicated asset fields for Header Logo, Footer Logo, Favicon, and OG Image with live preview.
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-palnadu-teal/10 border border-palnadu-teal/30 text-xs text-palnadu-teal-dark font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-palnadu-teal shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-palnadu-error/10 border border-palnadu-error/30 text-xs text-palnadu-error font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-palnadu-error shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {(['header', 'footer', 'favicon', 'ogImage'] as AssetType[]).map((type) => (
        <input
          key={type}
          ref={fileInputRefs[type]}
          type="file"
          accept={type === 'favicon' ? '.png,.ico,.svg,.webp' : type === 'ogImage' ? '.png,.jpg,.jpeg,.webp' : '.png,.svg,.webp,.jpg,.jpeg'}
          className="hidden"
          onChange={(e) => handleStageFile(type, e)}
        />
      ))}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrandingAssetCard
          type="header"
          title="Header Logo"
          description="Displayed on light surfaces in the primary navigation header across all public pages."
          icon={<LayoutTemplate className="h-4 w-4" />}
          specs={['Format: Transparent PNG or SVG', 'Size: 240 × 60 px (max 2 MB)', 'Tone: Dark blue primary palette']}
          asset={branding.headerLogo}
          previewUrl={previewUrls.header}
          isStaged={Boolean(stagedFiles.header)}
          saving={saving}
          removing={removingType === 'header'}
          onUploadClick={() => fileInputRefs.header.current?.click()}
          onRemoveClick={() => setDeleteTarget({ type: 'header', label: 'Header Logo' })}
        />

        <BrandingAssetCard
          type="footer"
          title="Footer Logo"
          description="Displayed on the dark footer surface (#042C53) across all public pages."
          icon={<LayoutTemplate className="h-4 w-4" />}
          specs={['Format: Transparent PNG or SVG', 'Size: 240 × 60 px (max 2 MB)', 'Tone: White / light logo on dark']}
          asset={branding.footerLogo}
          previewUrl={previewUrls.footer}
          isStaged={Boolean(stagedFiles.footer)}
          saving={saving}
          removing={removingType === 'footer'}
          onUploadClick={() => fileInputRefs.footer.current?.click()}
          onRemoveClick={() => setDeleteTarget({ type: 'footer', label: 'Footer Logo' })}
        />

        <BrandingAssetCard
          type="favicon"
          title="Favicon"
          description="Displayed in browser tabs, mobile bookmarks, and progressive web app icons."
          icon={<Bookmark className="h-4 w-4" />}
          specs={['Format: Square PNG, ICO, SVG', 'Size: 32 × 32 px to 512 × 512 px', 'Maximum: 1 MB']}
          asset={branding.favicon}
          previewUrl={previewUrls.favicon}
          isStaged={Boolean(stagedFiles.favicon)}
          saving={saving}
          removing={removingType === 'favicon'}
          onUploadClick={() => fileInputRefs.favicon.current?.click()}
          onRemoveClick={() => setDeleteTarget({ type: 'favicon', label: 'Favicon' })}
        />

        <BrandingAssetCard
          type="ogImage"
          title="OG Image"
          description="Social share image for Open Graph / Twitter cards (no SVG)."
          icon={<LayoutTemplate className="h-4 w-4" />}
          specs={['Format: PNG, JPEG, WebP', 'Size: 1200 × 630 px (max 2 MB)']}
          asset={branding.ogImage}
          previewUrl={previewUrls.ogImage}
          isStaged={Boolean(stagedFiles.ogImage)}
          saving={saving}
          removing={removingType === 'ogImage'}
          onUploadClick={() => fileInputRefs.ogImage.current?.click()}
          onRemoveClick={() => setDeleteTarget({ type: 'ogImage', label: 'OG Image' })}
        />
      </div>

      <BrandingActionBar
        stagedCount={Object.keys(stagedFiles).length}
        saving={saving}
        onDiscard={handleDiscardAll}
        onApply={handleApplyChanges}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        loading={Boolean(removingType)}
        title="Remove Custom Asset?"
        message={deleteTarget ? `Are you sure you want to remove the custom ${deleteTarget.label}?` : ''}
        confirmLabel="Remove Asset"
      />
    </div>
  );
}
