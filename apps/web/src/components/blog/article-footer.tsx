import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { blogPostPath, type BlogLocale } from '@palnadu/config';

interface ArticleFooterProps {
  post: any;
  locale: BlogLocale;
}

export function ArticleFooter({ post, locale }: ArticleFooterProps) {
  return (
    <>
      {/* Author Bio Card */}
      <div className="mt-12 rounded-xl border border-palnadu-border bg-palnadu-off-white/60 p-5 sm:p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-palnadu-blue/20 text-palnadu-blue flex items-center justify-center font-bold text-xs shrink-0">
          PD
        </div>
        <div className="space-y-1.5">
          <h4 className="font-bold text-sm text-palnadu-dark">Palnadu.dev Engineering Team</h4>
          <p className="text-xs text-palnadu-secondary leading-relaxed">
            Problem-first software developers based in Palnadu, Andhra Pradesh. We engineer{' '}
            <Link href="/services/web-development" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
              web applications
            </Link>
            ,{' '}
            <Link href="/services/android-app-development" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
              mobile apps
            </Link>
            , and{' '}
            <Link href="/services/business-automation" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
              business automation
            </Link>{' '}
            systems with 100% code ownership. Serving enterprises across{' '}
            <Link href="/locations/guntur" className="text-palnadu-blue hover:underline">
              Guntur
            </Link>
            ,{' '}
            <Link href="/locations/palnadu" className="text-palnadu-blue hover:underline">
              Palnadu
            </Link>
            , and{' '}
            <Link href="/locations/narasaraopet" className="text-palnadu-blue hover:underline">
              Narasaraopet
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Target Internal Links & Resources */}
      {Array.isArray(post.internalLinks) && post.internalLinks.length > 0 && (
        <div className="mt-10 rounded-xl border border-palnadu-border/80 bg-palnadu-off-white/40 p-5 sm:p-6">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-palnadu-teal mb-3.5">
            {locale === 'te' ? 'సంబంధిత సేవలు & వనరులు' : 'Related Services & Resources'}
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {post.internalLinks
              .filter((link: any) => link && typeof link.url === 'string' && typeof link.anchor === 'string')
              .map((link: { anchor: string; url: string }, idx: number) => (
                <Link
                  key={idx}
                  href={link.url}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-palnadu-border bg-white text-xs font-medium text-palnadu-dark hover:border-palnadu-blue hover:text-palnadu-blue transition-colors shadow-sm"
                >
                  <span>{link.anchor}</span>
                  <ArrowRight className="h-3 w-3 text-palnadu-secondary" />
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {post.relatedPosts && post.relatedPosts.length > 0 && (
        <div className="mt-14 pt-10 border-t border-palnadu-border">
          <h3 className="text-xl font-bold text-palnadu-dark mb-5">Related Articles</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {post.relatedPosts.map((rel: any) => (
              <Link
                key={rel.id}
                href={blogPostPath({ slug: rel.slug, language: rel.language ?? locale })}
                className="group rounded-lg border border-palnadu-border bg-white p-4 hover:border-palnadu-blue transition-colors flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <p className="text-xs font-mono uppercase text-palnadu-teal font-semibold">
                    {rel.category?.name || 'Guide'}
                  </p>
                  <h4 className="text-sm font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  {rel.excerpt && (
                    <p className="text-xs text-palnadu-secondary line-clamp-2 leading-relaxed">
                      {rel.excerpt}
                    </p>
                  )}
                </div>
                <div className="pt-3 mt-2 border-t border-palnadu-border/40 flex items-center justify-between text-xs text-palnadu-blue font-semibold">
                  <span>Read Article</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
