import { BrandLogo } from '@/components/ui/brand-logo';
import { Button } from '@/components/ui/button';
import { UploadCloud, Trash2 } from 'lucide-react';
import type { BrandingAsset, AssetType } from './types';

interface BrandingAssetCardProps {
  type: AssetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  specs: string[];
  asset: BrandingAsset;
  previewUrl?: string;
  isStaged: boolean;
  saving: boolean;
  removing: boolean;
  onUploadClick: () => void;
  onRemoveClick: () => void;
}

export function BrandingAssetCard({
  type,
  title,
  description,
  icon,
  specs,
  asset,
  previewUrl,
  isStaged,
  saving,
  removing,
  onUploadClick,
  onRemoveClick,
}: BrandingAssetCardProps) {
  const activeUrl = previewUrl || asset.url;
  const statusLabel = isStaged
    ? 'Staged (Unsaved)'
    : asset.url
    ? 'Custom Active'
    : type === 'header'
    ? 'Default Logo'
    : type === 'footer'
    ? 'Default Brandmark'
    : type === 'favicon'
    ? 'Default (/favicon.png)'
    : 'Default';

  const badgeClass = isStaged
    ? 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/30'
    : asset.url
    ? 'bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/30'
    : 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20';

  return (
    <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center">
              {icon}
            </div>
            <h2 className="text-sm font-bold text-palnadu-dark">{title}</h2>
          </div>
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
            {statusLabel}
          </span>
        </div>

        <p className="text-xs text-palnadu-secondary leading-relaxed">{description}</p>

        {type === 'header' && (
          <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 flex flex-col justify-center items-center h-20 relative">
            <BrandLogo customLogoUrl={activeUrl} variant="default" size="md" />
          </div>
        )}

        {type === 'footer' && (
          <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-dark flex flex-col justify-center items-center h-20 relative">
            <BrandLogo customLogoUrl={activeUrl} variant="white" size="md" />
          </div>
        )}

        {type === 'favicon' && (
          <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 flex flex-col justify-center items-center h-20">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-palnadu-border shadow-sm">
              <img
                src={activeUrl || '/favicon.png'}
                alt="Favicon"
                className="h-4 w-4 object-contain rounded-sm"
              />
              <span className="text-xs font-medium text-palnadu-dark truncate max-w-[120px]">
                Palnadu.dev — Home
              </span>
            </div>
          </div>
        )}

        {type === 'ogImage' && (
          <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 flex flex-col justify-center items-center h-20 overflow-hidden">
            {activeUrl ? (
              <img src={activeUrl} alt="OG Image" className="h-full w-full object-cover rounded-md" />
            ) : (
              <span className="text-xs text-palnadu-secondary">1200 × 630 recommended</span>
            )}
          </div>
        )}

        <div className="text-xs text-palnadu-secondary space-y-0.5 font-mono pt-1">
          {specs.map((spec, i) => (
            <p key={i}>• {spec}</p>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-palnadu-border/60">
        <Button onClick={onUploadClick} disabled={saving} className="flex-1 gap-1.5 h-9 text-xs">
          <UploadCloud className="h-3.5 w-3.5" />
          <span>{asset.url ? 'Replace' : 'Upload'}</span>
        </Button>

        {asset.url && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRemoveClick}
            disabled={saving || removing}
            className="h-9 w-9 border-palnadu-error/30 text-palnadu-error hover:bg-palnadu-error/10 shrink-0"
            title={`Remove custom ${title.toLowerCase()}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
