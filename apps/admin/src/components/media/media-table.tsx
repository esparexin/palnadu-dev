import { Image as ImageIcon, ExternalLink, Trash2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MediaItem } from './types';
import { formatMediaSize } from './types';

interface MediaTableProps {
  mediaItems: MediaItem[];
  loading: boolean;
  copiedId: string | null;
  onCopyUrl: (_id: string, _url: string) => void;
  onDelete: (_target: { id: string; name?: string }) => void;
}

export function MediaTable({
  mediaItems,
  loading,
  copiedId,
  onCopyUrl,
  onDelete,
}: MediaTableProps) {
  if (loading) {
    return <div className="p-10 text-center text-xs text-palnadu-secondary">Loading media assets...</div>;
  }

  if (mediaItems.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-palnadu-light-blue text-palnadu-blue mx-auto">
          <ImageIcon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-palnadu-dark text-sm">No Media Assets Uploaded Yet</p>
          <p className="text-xs text-palnadu-secondary max-w-sm mx-auto">
            Click &ldquo;Upload Image&rdquo; above to upload your first image to Cloudinary.
          </p>
        </div>
      </div>
    );
  }

  return (
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
            <tr
              key={item.id}
              className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
            >
              <td className="px-4 py-2.5">
                <div className="h-10 w-10 rounded-md border border-palnadu-border overflow-hidden bg-palnadu-off-white flex items-center justify-center shrink-0">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-palnadu-secondary" />
                  )}
                </div>
              </td>
              <td className="px-4 py-2.5 font-bold text-palnadu-dark max-w-[200px] truncate">
                {item.originalName || item.filename}
              </td>
              <td className="px-4 py-2.5 text-palnadu-secondary font-mono text-xs">{item.mimeType}</td>
              <td className="px-4 py-2.5 text-palnadu-body font-mono">{formatMediaSize(item.size)}</td>
              <td className="px-4 py-2.5 text-palnadu-secondary">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-2.5 text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyUrl(item.id, item.url)}
                  title="Copy CDN URL"
                  className="h-7 px-2 text-xs font-semibold text-palnadu-blue hover:bg-palnadu-light-blue"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="h-3 w-3 text-palnadu-teal" />
                      <span className="text-palnadu-teal">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-7 w-7 text-palnadu-secondary hover:text-palnadu-dark"
                  title="Open in new tab"
                >
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete({ id: item.id, name: item.originalName || item.filename })}
                  title="Delete asset"
                  className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
