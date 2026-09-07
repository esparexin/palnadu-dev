'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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

  useEffect(() => {
    api.media
      .list()
      .then((res: any) => setMediaItems(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Media Library</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Asset storage and CDN uploads.</p>
        </div>
      </div>

      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-palnadu-secondary">Loading media...</div>
        ) : mediaItems.length === 0 ? (
          <div className="p-10 text-center space-y-1">
            <p className="text-xs font-semibold text-palnadu-dark">No Media Assets Stored</p>
            <p className="text-xs text-palnadu-secondary">
              Images and assets uploaded to cloud storage will appear in this registry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">URL</th>
                </tr>
              </thead>
              <tbody>
                {mediaItems.map((item) => (
                  <tr key={item.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-palnadu-dark">{item.originalName || item.filename}</td>
                    <td className="px-4 py-3 text-palnadu-secondary font-mono text-[11px]">{item.mimeType}</td>
                    <td className="px-4 py-3 text-palnadu-body">{formatSize(item.size)}</td>
                    <td className="px-4 py-3 text-palnadu-secondary">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-palnadu-blue font-semibold hover:underline">
                        Open ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
