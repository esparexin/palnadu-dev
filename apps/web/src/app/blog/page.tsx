import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';
import { api } from '@/lib/api';
import { Calendar, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog & Engineering Insights',
  description:
    'Practical software engineering guides, startup MVP breakdowns, and business automation insights by Palnadu.dev.',
};

export default async function BlogPage() {
  let posts: any[] = [];

  try {
    const res: any = await api.blog.list({ page: '1', limit: '12' });
    posts = res?.data || [];
  } catch {
    posts = [];
  }

  return (
    <div className="bg-white">
      <section className="py-16 sm:py-20">
        <div className="container max-w-4xl">
          <SectionHeading
            label="Articles"
            title="Insights & Engineering Truths"
            description="Practical articles on technology, system architecture, startup MVP validation, and operations automation."
          />

          {posts.length === 0 ? (
            <div className="mx-auto mt-10 max-w-xl text-center">
              <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white p-6 sm:p-8 shadow-2xs">
                <h3 className="text-base font-bold text-palnadu-dark mb-1.5">Articles In Preparation</h3>
                <p className="text-sm text-palnadu-body leading-relaxed">
                  We are preparing practical engineering breakdowns, tech stack audits, and startup validation guides.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {posts.map((post: any) => (
                <article
                  key={post.id}
                  className="flex flex-col justify-between rounded-xl border border-palnadu-border bg-white p-5 shadow-2xs hover:border-palnadu-blue transition-colors group"
                >
                  <div className="space-y-2.5">
                    {post.coverImage && (
                      <div className="rounded-lg overflow-hidden h-44 mb-3 border border-palnadu-border/60 bg-palnadu-off-white">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-palnadu-secondary font-mono">
                      <Calendar className="h-3 w-3 text-palnadu-secondary/80" />
                      <time dateTime={post.publishDate || post.createdAt}>
                        {new Date(post.publishDate || post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </div>

                    <h2 className="text-lg font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors leading-snug">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-xs text-palnadu-body leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-2 border-t border-palnadu-border/40">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-palnadu-blue group-hover:underline"
                    >
                      <span>Read Full Article</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaSection />
    </div>
  );
}
