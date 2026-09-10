'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { UploadCloud, Image as ImageIcon, ExternalLink, Trash2, Check, Copy } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = () => {
    setLoading(true);
    api.media
      .list()
      .then((res: any) => setMediaItems(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorNotice(null);

    try {
      await api.media.upload(file);
      fetchMedia();
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.media.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchMedia();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Media Library</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Upload, optimize, and manage Cloudinary media assets.</p>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 h-9 rounded-md bg-palnadu-blue px-4 text-xs font-semibold text-white hover:bg-[#12487e] shadow-xs cursor-pointer transition-colors disabled:opacity-50 shrink-0"
        >
          <UploadCloud className="h-4 w-4" />
          <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload Image'}</span>
        </button>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-palnadu-error/40 text-xs text-palnadu-error font-medium">
          {errorNotice}
        </div>
      )}

      {/* Cloudinary Info Banner if no media */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-palnadu-secondary">Loading media assets...</div>
        ) : mediaItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-palnadu-light-blue text-palnadu-blue mx-auto">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-palnadu-dark text-sm">No Media Assets Uploaded Yet</p>
              <p className="text-xs text-palnadu-secondary max-w-sm mx-auto">
                Click &ldquo;Upload Image&rdquo; above to upload your first image to Cloudinary. It will be automatically optimized and served via CDN.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mediaItems.map((item) => (
                  <tr key={item.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors">
                    {/* Image Thumbnail */}
                    <td className="px-4 py-2.5">
                      <div className="h-10 w-10 rounded-md border border-palnadu-border overflow-hidden bg-palnadu-off-white flex items-center justify-center shrink-0">
                        {item.mimeType.startsWith('image/') ? (
                          <img
                            src={item.url}
                            alt={item.originalName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-palnadu-secondary" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-2.5 font-bold text-palnadu-dark max-w-[200px] truncate">
                      {item.originalName || item.filename}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-2.5 text-palnadu-secondary font-mono text-[11px]">
                      {item.mimeType}
                    </td>

                    {/* Size */}
                    <td className="px-4 py-2.5 text-palnadu-body font-mono">
                      {formatSize(item.size)}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-2.5 text-palnadu-secondary">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right space-x-2">
                      <button
                        onClick={() => copyToClipboard(item.id, item.url)}
                        title="Copy CDN URL"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-palnadu-blue hover:underline cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in new tab"
                        className="inline-flex items-center text-palnadu-secondary hover:text-palnadu-dark p-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        onClick={() => setDeleteTarget({ id: item.id, name: item.originalName || item.filename })}
                        title="Delete asset"
                        className="inline-flex items-center text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Delete Media Web Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Media Asset?"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name || 'this media file'}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Asset"
      />
    </div>
  );
}
