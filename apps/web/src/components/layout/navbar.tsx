'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { mainNavItems } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close menu automatically on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle Escape key and body scroll lock
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-palnadu-border bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
        {/* Accent top line */}
        <div className="h-0.5 w-full bg-palnadu-blue" />
        <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
          {/* Brand Typographic Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Palnadu.dev Home">
            <div className="h-8 w-8 rounded-lg bg-palnadu-dark flex items-center justify-center font-black text-sm text-white shadow-xs group-hover:bg-palnadu-blue transition-colors">
              P<span className="text-palnadu-teal">.</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-palnadu-dark">
              Palnadu<span className="text-palnadu-blue font-bold">.dev</span>
            </span>
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

          {/* Mobile menu button */}
          <button
            className="inline-flex items-center justify-center rounded-lg p-2.5 text-palnadu-dark hover:text-palnadu-blue hover:bg-palnadu-light-blue md:hidden cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5 text-palnadu-blue" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile Navigation Drawer — Direct links, no dropdown */}
        {mobileOpen && (
          <div className="relative z-50 border-t border-palnadu-border bg-white shadow-xl md:hidden animate-fade-in">
            <div className="container space-y-1.5 py-4">
              {mainNavItems.map((item) => (
                <div key={item.href} className="border-b border-palnadu-border/50 pb-1.5">
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-semibold text-palnadu-dark hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.title}
                  </Link>
                </div>
              ))}
              <div className="pt-2">
                <Button asChild className="w-full bg-palnadu-blue text-white hover:bg-[#12487e] h-10">
                  <Link
                    href="/contact"
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
      </header>

      {/* Backdrop Overlay for outside tap to close */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[66px] z-40 bg-black/40 backdrop-blur-xs md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
