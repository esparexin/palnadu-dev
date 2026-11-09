import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight, Tag, Clock } from 'lucide-react';
import { imagePresets, blogPostPath, type BlogLocale } from '@palnadu/config';

interface BlogCardProps {
  post: any;
  locale: BlogLocale;
  dateLocale: string;
  copy: any;
}

export function BlogCard({ post, locale, dateLocale, copy }: BlogCardProps) {
  const words = post.content ? post.content.split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.ceil(words / 220));
  const isPostArchived = post.status === 'ARCHIVED';

  return (
    <Link
      href={blogPostPath({ slug: post.slug, language: post.language ?? locale })}
      className="flex flex-col justify-between rounded-xl border border-palnadu-border bg-white p-5 shadow-sm hover:border-palnadu-blue hover:shadow-md transition-all group cursor-pointer text-left relative"
    >
      <div className="space-y-3">
        {post.coverImage ? (
          <div className="rounded-lg overflow-hidden h-44 border border-palnadu-border/60 bg-palnadu-off-white relative">
            <Image
              src={imagePresets.blogCard(post.coverImage)}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {isPostArchived && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-white text-xs font-mono font-bold uppercase tracking-wider">
                {copy.archivedBadge}
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden h-44 border border-palnadu-border/60 bg-gradient-to-br from-palnadu-dark via-palnadu-dark-hover to-palnadu-blue p-5 flex flex-col justify-between text-white relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-palnadu-teal">
                {post.category?.name || 'Engineering'}
              </span>
              {isPostArchived ? (
                <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-mono font-bold uppercase">
                  {copy.archivedBadge}
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-palnadu-teal" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-palnadu-light-blue/80">Palnadu.dev Publication</p>
              <p className="text-sm font-bold text-white line-clamp-2">{post.title}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-palnadu-secondary">
          {post.category?.name ? (
            <span className="inline-flex items-center gap-1 font-semibold text-palnadu-teal">
              <Tag className="h-3 w-3" />
              <span>{post.category.name}</span>
            </span>
          ) : (
            <span className="font-mono">{copy.guideFallback}</span>
          )}

          <span className="inline-flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3 text-palnadu-secondary/80" />
            <span>{copy.minRead(readMinutes)}</span>
          </span>
        </div>

        <h2 className="text-base font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors leading-snug line-clamp-2">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-xs text-palnadu-body leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>
        )}
      </div>

      <div className="pt-3 mt-4 border-t border-palnadu-border/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-xs text-palnadu-secondary font-mono">
          <Calendar className="h-3 w-3 text-palnadu-secondary/80" />
          <time dateTime={post.publishDate || post.createdAt}>
            {new Date(post.publishDate || post.createdAt).toLocaleDateString(dateLocale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        <span className="inline-flex items-center gap-1 font-semibold text-palnadu-blue group-hover:underline text-xs">
          <span>{copy.read}</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
