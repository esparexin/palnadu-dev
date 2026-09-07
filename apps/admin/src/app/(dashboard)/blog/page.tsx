'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { BlogPost } from '@palnadu/types';
import { cn } from '@/lib/utils';

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.blog
      .list()
      .then((res: any) => setPosts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Manage blog articles and content.</p>
        </div>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New Article
        </button>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No articles yet. Write your first blog post.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{post.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          post.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800',
                        )}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.publishDate
                        ? new Date(post.publishDate).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/blog/${post.id}`} className="text-sm text-primary hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
