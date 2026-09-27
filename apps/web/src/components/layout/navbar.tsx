'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { mainNavItems } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/brand-logo';
import { cn } from '@/lib/utils';

interface NavbarProps {
  initialLogoUrl?: string | null;
}

export function Navbar({ initialLogoUrl }: NavbarProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const customLogoUrl = initialLogoUrl || null;
  const pathname = usePathname();

  // Close menu automatically on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle Escape key and body scroll lock (iOS-compatible)
  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* 1. Header — fixed on mobile for reliable positioning, sticky on desktop */}
      <header
        className="sticky top-0 z-50 w-full border-b border-palnadu-border bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 md:sticky"
        style={{ height: 'var(--header-height)' }}
      >
        {/* Accent top line */}
        <div className="h-0.5 w-full bg-palnadu-blue" />
        <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
          {/* Brand Logo (SSOT with Fallback) */}
          <Link href="/" className="flex items-center group" aria-label="Palnadu.dev Home">
            <BrandLogo customLogoUrl={customLogoUrl} variant="default" size="md" />
          </Link>

          {/* Desktop Navigation — Direct links, no dropdown */}
          <div className="hidden items-center gap-1 md:flex">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center rounded-md px-3.5 py-2 text-sm font-semibold text-palnadu-dark transition-all hover:text-palnadu-blue hover:bg-palnadu-light-blue',
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <Button
              asChild
              size="sm"
              className="bg-palnadu-blue text-white hover:bg-[#12487e] shadow-sm font-medium"
            >
              <Link href="/contact" className="flex items-center gap-1.5">
                <span>Discuss your idea</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile menu button — zero tap delay with touch-manipulation */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2.5 text-palnadu-dark hover:text-palnadu-blue hover:bg-palnadu-light-blue md:hidden cursor-pointer touch-manipulation active:scale-90 transition-transform select-none"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5 text-palnadu-blue" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {/* 2. Backdrop Overlay — Full viewport, below header z-index */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 md:hidden transition-opacity duration-150 ease-out"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Menu — Fixed below header, content height (not forced full viewport) */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="fixed left-0 right-0 z-50 bg-white border-b border-palnadu-border shadow-xl md:hidden overflow-hidden transition-all duration-150 ease-out animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ top: 'var(--header-height)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-label"
        >
          <div className="container space-y-1.5 py-4">
            {mainNavItems.map((item) => (
              <div key={item.href} className="border-b border-palnadu-border/50 pb-1.5">
                <Link
                  href={item.href}
                  prefetch={true}
                  className="block rounded-md px-3 py-2 text-base font-semibold text-palnadu-dark hover:text-palnadu-blue hover:bg-palnadu-light-blue active:bg-palnadu-light-blue transition-colors touch-manipulation"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.title}
                </Link>
              </div>
            ))}
            <div className="pt-2">
              <Button asChild className="w-full bg-palnadu-blue text-white hover:bg-[#12487e] h-10 touch-manipulation">
                <Link
                  href="/contact"
                  prefetch={true}
                  className="flex items-center justify-center gap-1.5"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Discuss your idea</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}