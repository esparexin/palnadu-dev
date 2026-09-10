import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Home, Compass, MessageSquare, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page Not Found (404)',
  description: 'The requested page could not be found on Palnadu.dev.',
};

export default function NotFound() {
  const quickLinks = [
    {
      title: 'Our Services',
      description: 'Web applications, mobile apps, MVP builds, and automation.',
      href: '/services',
      icon: Layers,
    },
    {
      title: 'Our Work',
      description: 'See practical applications and systems built by our engineers.',
      href: '/work',
      icon: Compass,
    },
    {
      title: 'Engineering Blog',
      description: 'Practical guides on tech stacks, SEO, and software decisions.',
      href: '/blog',
      icon: BookOpen,
    },
    {
      title: 'Contact Engineering',
      description: 'Discuss your project idea or operational bottleneck directly.',
      href: '/contact',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20 text-xs font-mono font-semibold">
          <span>Error 404</span>
          <span>•</span>
          <span>Page Not Found</span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-palnadu-dark tracking-tight">
            We couldn&apos;t find that page
          </h1>
          <p className="text-sm sm:text-base text-palnadu-body max-w-md mx-auto leading-relaxed">
            The link may be outdated, the URL mistyped, or the page may have been moved.
          </p>
        </div>

        {/* Main Home CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="w-full sm:w-auto bg-palnadu-blue text-white hover:bg-[#12487e] shadow-xs font-semibold text-xs sm:text-sm h-10 px-5">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              <span>Back to Homepage</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto border-palnadu-border text-palnadu-dark hover:bg-palnadu-off-white text-xs sm:text-sm h-10 px-5">
            <Link href="/contact" className="flex items-center justify-center gap-2">
              <span>Tell us what you need</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Quick Recovery Directory */}
        <div className="pt-8 border-t border-palnadu-border/60">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-secondary font-semibold mb-4 text-left sm:text-center">
            Or explore popular sections:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 hover:bg-white hover:border-palnadu-blue hover:shadow-xs transition-all flex items-start gap-3"
                >
                  <div className="h-8 w-8 rounded-md bg-white border border-palnadu-border text-palnadu-blue group-hover:bg-palnadu-light-blue transition-colors flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xs sm:text-sm font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors flex items-center gap-1">
                      <span>{item.title}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </h2>
                    <p className="text-[11px] sm:text-xs text-palnadu-body line-clamp-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
