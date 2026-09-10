'use client';

import { useState, useEffect, useRef } from 'react';
import { siteConfig } from '@palnadu/config';
import { api } from '@/lib/api';
import { BrandLogo } from '@/components/ui/brand-logo';
import {
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Info,
} from 'lucide-react';

interface BrandingData {
  hasCustomLogo: boolean;
  logoUrl: string | null;
  logoPublicId?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  size?: number | null;
  originalName?: string | null;
  updatedAt?: string;
  locations?: string[];
}

export default function SettingsPage() {
  const [branding, setBranding] = useState<BrandingData>({
    hasCustomLogo: false,
    logoUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle client-side file selection & validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validate File Size (Max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(
        `File is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed size is 2 MB.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate File Type
    const allowedTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Unsupported format. Please upload a transparent PNG or clean SVG logo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Generate Local Instant Preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setSelectedFile(file);
  };

  // Upload and Apply Logo to Cloudinary + DB
  const handleUploadAndSave = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.settings.branding.uploadLogo(selectedFile);
      if (res.success) {
        setSuccessMessage('Logo uploaded and applied successfully across all channels.');
        setBranding(res.data);
        setSelectedFile(null);
        setLocalPreviewUrl(null);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload logo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Custom Logo and Revert to Typographic Brandmark
  const handleRemoveLogo = async () => {
    if (
      !confirm(
        'Are you sure you want to remove the custom logo? The platform will revert to the default vector brandmark [ P. ] Palnadu.dev.',
      )
    ) {
      return;
    }

    setRemoving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.settings.branding.removeLogo();
      if (res.success) {
        setSuccessMessage('Custom logo removed. Default typographic brandmark restored.');
        setBranding(res.data);
        setSelectedFile(null);
        setLocalPreviewUrl(null);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to remove logo.');
    } finally {
      setRemoving(false);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Settings</h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">
          Platform configuration, logo branding, and system parameters.
        </p>
      </div>

      {/* Notifications */}
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

      <div className="grid gap-6 max-w-3xl">
        {/* ── 1. LOGO & BRAND IDENTITY CARD ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-palnadu-border/60 pb-4">
            <div>
              <h2 className="text-base font-bold text-palnadu-dark">Logo & Brand Identity</h2>
              <p className="text-xs text-palnadu-secondary mt-0.5">
                Manage the authoritative brand logo displayed across the public website, mobile menu, and admin portal.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold self-start sm:self-auto ${
                branding.hasCustomLogo
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {branding.hasCustomLogo ? 'Custom Logo Active' : 'Default Brandmark Active'}
            </span>
          </div>

          {/* Current Active Logo Preview */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-palnadu-secondary">
              Current Active Logo
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Light Background Preview */}
              <div className="p-4 rounded-xl border border-palnadu-border bg-white flex flex-col justify-between space-y-3">
                <span className="text-[10px] font-mono text-palnadu-secondary uppercase font-semibold">
                  Light Theme (Header & Navigation)
                </span>
                <div className="h-14 flex items-center justify-center p-2">
                  <BrandLogo customLogoUrl={localPreviewUrl || branding.logoUrl} variant="default" size="md" />
                </div>
              </div>

              {/* Dark Background Preview (Checkerboard for transparency) */}
              <div className="p-4 rounded-xl border border-palnadu-border bg-palnadu-dark flex flex-col justify-between space-y-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase font-semibold">
                  Dark Theme (Footer & Contrast)
                </span>
                <div className="h-14 flex items-center justify-center p-2">
                  <BrandLogo customLogoUrl={localPreviewUrl || branding.logoUrl} variant="white" size="md" />
                </div>
              </div>
            </div>

            {/* Asset Metadata if Custom Logo is Active */}
            {branding.hasCustomLogo && branding.logoUrl && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-palnadu-secondary">
                {branding.format && (
                  <span className="bg-palnadu-off-white px-2 py-0.5 rounded border border-palnadu-border/60">
                    Format: {branding.format.toUpperCase()}
                  </span>
                )}
                {branding.width && branding.height && (
                  <span className="bg-palnadu-off-white px-2 py-0.5 rounded border border-palnadu-border/60">
                    Dimensions: {branding.width} × {branding.height} px
                  </span>
                )}
                {branding.size && (
                  <span className="bg-palnadu-off-white px-2 py-0.5 rounded border border-palnadu-border/60">
                    Size: {(branding.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <a
                  href={branding.logoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-palnadu-blue hover:underline ml-auto"
                >
                  View Cloudinary Asset ↗
                </a>
              </div>
            )}
          </div>

          {/* Action Controls: Upload / Replace / Remove */}
          <div className="space-y-4 pt-2 border-t border-palnadu-border/60">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/svg+xml,image/webp,image/jpeg"
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3">
              {!selectedFile ? (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || removing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-xs bg-palnadu-blue text-white hover:bg-[#12487e] shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>{branding.hasCustomLogo ? 'Replace Logo' : 'Upload New Logo'}</span>
                  </button>

                  {branding.hasCustomLogo && (
                    <button
                      onClick={handleRemoveLogo}
                      disabled={uploading || removing}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs border border-red-300 text-red-600 bg-white hover:bg-red-50 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{removing ? 'Removing...' : 'Remove Logo'}</span>
                    </button>
                  )}
                </>
              ) : (
                /* Staged Upload Ready to Save */
                <div className="flex flex-wrap items-center gap-2.5 w-full bg-palnadu-light-blue/40 border border-palnadu-blue/30 p-3 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs font-bold text-palnadu-dark truncate">
                      Selected: {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-palnadu-secondary">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready to apply
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUploadAndSave}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold text-xs bg-palnadu-teal text-white hover:bg-[#157c5c] shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>{uploading ? 'Applying to Cloudinary...' : 'Save & Apply Logo'}</span>
                    </button>
                    <button
                      onClick={cancelSelection}
                      disabled={uploading}
                      className="px-3 py-2 rounded-md font-semibold text-xs border border-palnadu-border text-palnadu-secondary bg-white hover:bg-palnadu-off-white cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Help Text & Guidelines */}
            <div className="rounded-lg bg-palnadu-off-white/60 border border-palnadu-border/60 p-4 space-y-2 text-xs text-palnadu-body">
              <div className="flex items-center gap-1.5 font-bold text-palnadu-dark">
                <Info className="h-3.5 w-3.5 text-palnadu-blue" />
                <span>Logo Upload Guidelines & Requirements</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-palnadu-secondary pl-1 leading-relaxed">
                <li>
                  <strong className="text-palnadu-dark">Recommended Format:</strong> High-resolution{' '}
                  <strong className="text-palnadu-blue">PNG with transparent background</strong> or clean scalable{' '}
                  <strong className="text-palnadu-blue">SVG</strong>.
                </li>
                <li>
                  <strong className="text-palnadu-dark">Recommended Dimensions:</strong> Horizontal layout with aspect
                  ratio around <strong>4:1</strong> (e.g. <code>240 × 60 px</code> up to <code>800 × 200 px</code>).
                </li>
                <li>
                  <strong className="text-palnadu-dark">Maximum File Size:</strong> <strong>2 MB</strong> (automatically
                  optimized via Cloudinary <code>f_auto, q_auto</code>).
                </li>
                <li>
                  <strong className="text-palnadu-dark">Transparent Background:</strong> Preserves seamless blending
                  across both light and dark headers without white container boxes.
                </li>
                <li>
                  <strong className="text-palnadu-dark">Automatic Fallback:</strong> If no custom logo is uploaded, the
                  system automatically displays the vector typographic brandmark <code>[ P. ] Palnadu.dev</code> with zero
                  layout shift.
                </li>
              </ul>
            </div>

            {/* Display Locations */}
            <div className="pt-2">
              <span className="text-[11px] font-mono text-palnadu-secondary font-semibold uppercase tracking-wider block mb-2">
                Active Display Channels:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Desktop Header',
                  'Mobile Navigation',
                  'Footer',
                  'Admin Portal Sidebar',
                  'Admin Login Box',
                  'Social Share Metadata',
                ].map((channel) => (
                  <span
                    key={channel}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-palnadu-border text-[11px] font-medium text-palnadu-dark shadow-2xs"
                  >
                    <CheckCircle2 className="h-3 w-3 text-palnadu-teal" />
                    <span>{channel}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. GENERAL COMPANY IDENTITY CARD ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-palnadu-dark mb-1">Company Identity</h2>
          <p className="text-xs text-palnadu-secondary mb-4">
            System identification parameters configured in the centralized monorepo config.
          </p>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Company Name:</span>
              <span className="font-bold text-palnadu-dark">{siteConfig.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Public Contact Email:</span>
              <span className="font-mono text-palnadu-blue font-semibold">{siteConfig.contact.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Production Website:</span>
              <a
                href={siteConfig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-palnadu-blue hover:underline font-mono"
              >
                {siteConfig.url}
              </a>
            </div>
          </div>
        </div>

        {/* ── 3. SYSTEM & ARCHITECTURE CARD ── */}
        <div className="rounded-xl border border-palnadu-border bg-white p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-palnadu-dark mb-1">Architecture & Infrastructure</h2>
          <p className="text-xs text-palnadu-secondary mb-4">
            Runtime configurations, asset CDN pipelines, and database state.
          </p>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Database:</span>
              <span className="font-mono text-palnadu-dark font-semibold">MongoDB Atlas (Prisma ORM)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Cloudinary CDN Pipeline:</span>
              <span className="font-mono text-palnadu-teal font-semibold">Connected (palnadu/branding/logo)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">REST API Endpoint:</span>
              <span className="font-mono text-palnadu-blue font-semibold">
                {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-palnadu-secondary font-medium">Security Guard:</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                JWT Auth + Helmet Protection Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
