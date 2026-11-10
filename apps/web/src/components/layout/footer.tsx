'use client';

import Link from 'next/link';
import { siteConfig, footerNavItems } from '@palnadu/config';
import { Separator } from '@/components/ui/separator';
import { BrandLogo } from '@/components/ui/brand-logo';
import { trackContactChannelClick } from '@/lib/analytics';
import { ArrowUpRight } from 'lucide-react';

interface FooterProps {
  initialLogoUrl?: string | null;
}

export function Footer({ initialLogoUrl }: FooterProps = {}) {
  const customFooterLogoUrl = initialLogoUrl || null;

  return (
    <footer className="bg-palnadu-dark text-white" role="contentinfo">
      <div className="container pt-8 pb-20 sm:pt-10 sm:pb-10">
        {/* Responsive Grid: Balanced Multi-Column across viewports */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Brand & Identity — Spans full width on mobile/tablet, 4 cols on desktop */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4 space-y-3 mb-1 lg:mb-0">
            <Link href="/" className="inline-flex items-center group" aria-label="Palnadu.dev Home">
              <BrandLogo customLogoUrl={customFooterLogoUrl} variant="white" size="md" />
            </Link>
            <p className="text-xs sm:text-sm text-palnadu-light-blue/80 leading-relaxed max-w-sm">
              Start with the problem. We build the solution. Turning real-world problems into practical digital solutions.
            </p>
            <div className="text-xs pt-0.5 space-y-1">
              <p>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  onClick={() =>
                    trackContactChannelClick({
                      channel: 'email',
                      destination: siteConfig.contact.email,
                      source_section: 'footer',
                      source_page: typeof window !== 'undefined' ? window.location.pathname : '/',
                    })
                  }
                  className="text-palnadu-light-blue hover:text-white transition-colors font-mono inline-flex items-center gap-1 underline"
                >
                  <span>{siteConfig.contact.email}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </p>
              {siteConfig.contact.phone && (
                <p>
                  <a
                    href={`tel:${siteConfig.contact.phone}`}
                    onClick={() =>
                      trackContactChannelClick({
                        channel: 'phone',
                        destination: siteConfig.contact.phone,
                        source_section: 'footer',
                        source_page: typeof window !== 'undefined' ? window.location.pathname : '/',
                      })
                    }
                    className="text-palnadu-light-blue hover:text-white transition-colors font-mono inline-flex items-center gap-1 underline"
                  >
                    <span>{siteConfig.contact.phone}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Services — Spans 2 cols on mobile/tablet, 5 cols on desktop in a 2-column subgrid */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-5">
            <h3 className="mb-2.5 sm:mb-3 text-xs font-mono uppercase tracking-widest text-white font-bold">
              Services
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:gap-y-1.5 text-xs sm:text-sm">
              {footerNavItems.services.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-palnadu-light-blue/80 hover:text-white transition-colors block py-0.5"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company — 1 col on mobile, 1 col on tablet, 2 cols on desktop */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-2">
            <h3 className="mb-2.5 sm:mb-3 text-xs font-mono uppercase tracking-widest text-white font-bold">
              Company
            </h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              {footerNavItems.company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    {...(item.hrefLang ? { hrefLang: item.hrefLang } : {})}
                    {...(item.lang ? { lang: item.lang } : {})}
                    className="text-palnadu-light-blue/80 hover:text-white transition-colors block py-0.5"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal — 1 col on mobile, 1 col on tablet, 1 col on desktop */}
          <div className="col-span-1 sm:col-span-1 lg:col-span-1">
            <h3 className="mb-2.5 sm:mb-3 text-xs font-mono uppercase tracking-widest text-white font-bold">
              Legal
            </h3>
            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              {footerNavItems.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-palnadu-light-blue/80 hover:text-white transition-colors block py-0.5"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Regional Hubs Directory Links */}
        {footerNavItems.locations && footerNavItems.locations.length > 0 && (
          <div className="pt-5 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-palnadu-light-blue/80">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-palnadu-teal font-semibold shrink-0">
              <span>Regional Hubs:</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {footerNavItems.locations.map((loc) => (
                <Link
                  key={loc.href}
                  href={loc.href}
                  className="hover:text-white transition-colors"
                >
                  {loc.title}
                </Link>
              ))}
              <Link
                href="/locations"
                className="text-palnadu-teal hover:underline font-semibold"
              >
                All Locations →
              </Link>
            </div>
          </div>
        )}

        <Separator className="my-5 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row text-xs text-palnadu-light-blue/70">
          <p>
            &copy; {new Date().getFullYear()} Palnadu.dev. All rights reserved.
          </p>
          <div className="flex items-center gap-1 font-medium">
            <span>Built by Palnadu. Built with pride.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
