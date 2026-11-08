'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { UploadCloud } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import type { MediaItem } from '@/components/media/types';
import { MediaTable } from '@/components/media/media-table';

export default function MediaPage() {
  const { toast } = useToast();
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
      toast.success('Media asset uploaded successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrorNotice(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info('Direct URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.media.delete(deleteTarget.id);
      toast.success('Media asset deleted successfully');
      setDeleteTarget(null);
      fetchMedia();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Media Library</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Upload, optimize, and manage Cloudinary media assets.</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf"
          className="hidden"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2 shrink-0"
        >
          <UploadCloud className="h-4 w-4" />
          <span>{uploading ? 'Uploading to Cloudinary...' : 'Upload Image'}</span>
        </Button>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-lg bg-palnadu-error/10 border border-palnadu-error/20 text-xs text-palnadu-error font-medium">
          {errorNotice}
        </div>
      )}

      <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
        <MediaTable
          mediaItems={mediaItems}
          loading={loading}
          copiedId={copiedId}
          onCopyUrl={copyToClipboard}
          onDelete={setDeleteTarget}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Media Asset?"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name || 'this media file'}"?` : ''}
        confirmLabel="Delete Asset"
      />
    </div>
  );
}
