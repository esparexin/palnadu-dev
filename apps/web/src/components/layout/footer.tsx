'use client';

import Link from 'next/link';
import Image from 'next/image';
import { siteConfig, footerNavItems } from '@palnadu/config';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-palnadu-dark text-white" role="contentinfo">
      <div className="container pt-10 pb-24 sm:py-14">
        {/* Mobile: 2-Column Grid | Tablet: 3-Column | Desktop: 4-Column */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand & Identity — Spans 2 cols on mobile, 3 on tablet, 1 on desktop */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-3 mb-1 lg:mb-0">
            <Link href="/" aria-label="Palnadu.dev Home">
              <Image
                src="/palnadu-logo-white.png"
                alt="Palnadu.dev"
                width={150}
                height={32}
                className="h-7 w-auto"
              />
            </Link>
            <p className="text-xs sm:text-sm text-palnadu-light-blue/80 leading-relaxed max-w-sm">
              Start with the problem. We build the solution. Turning real-world problems into practical digital solutions.
            </p>
            <p className="text-xs pt-0.5">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="text-palnadu-light-blue hover:text-white transition-colors font-mono inline-flex items-center gap-1 underline"
              >
                <span>{siteConfig.contact.email}</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Column 1: Services */}
          <div className="col-span-1">
            <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-white font-bold">
              Services
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm">
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

          {/* Column 2: Company & Legal (On mobile, grouped in 2nd column) */}
          <div className="col-span-1">
            <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-white font-bold">
              Company
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {footerNavItems.company.map((item) => (
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

            {/* Legal Links for Mobile 2-column view */}
            <div className="mt-5 sm:hidden">
              <h3 className="mb-2 text-xs font-mono uppercase tracking-widest text-white font-bold">
                Legal
              </h3>
              <ul className="space-y-1.5 text-xs">
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

          {/* Legal Column (Tablet & Desktop) */}
          <div className="hidden sm:block col-span-1">
            <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-white font-bold">
              Legal
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm">
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

        <Separator className="my-6 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row text-xs text-palnadu-light-blue/70">
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
