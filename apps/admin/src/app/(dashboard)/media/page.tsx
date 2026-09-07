'use client';

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage media files.</p>
        </div>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Upload
        </button>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          Drag and drop files here or click Upload to add media files.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Supports images, documents, and other common file types.
        </p>
      </div>
    </div>
  );
}
