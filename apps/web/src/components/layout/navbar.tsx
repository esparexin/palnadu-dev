'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { mainNavItems } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group" aria-label="Palnadu.dev Home">
          <span className="text-xl font-bold tracking-tight text-white transition-colors">
            Palnadu<span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">.dev</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {mainNavItems.map((item) => (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => item.children && setOpenDropdown(item.href)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium text-slate-300 transition-all hover:text-white hover:bg-slate-900/60',
                )}
              >
                {item.title}
                {item.children && <ChevronDown className="h-3 w-3 opacity-60" />}
              </Link>

              {/* Dropdown */}
              {item.children && openDropdown === item.href && (
                <div className="absolute left-0 top-full z-50 w-80 rounded-xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-in">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-lg px-3.5 py-2.5 transition-colors hover:bg-slate-900 group"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <div className="text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {child.title}
                      </div>
                      {child.description && (
                        <div className="mt-0.5 text-xs text-slate-400 leading-snug">
                          {child.description}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex">
          <Button
            asChild
            size="sm"
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-md shadow-cyan-500/20 font-medium"
          >
            <Link href="/contact" className="flex items-center gap-1.5">
              <span>Tell us your problem</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="inline-flex items-center justify-center rounded-lg p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5 text-cyan-400" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl md:hidden animate-fade-in">
          <div className="container space-y-2 py-5">
            {mainNavItems.map((item) => (
              <div key={item.href} className="border-b border-slate-900/80 pb-2">
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-200 hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    if (!item.children) setMobileOpen(false);
                    else setOpenDropdown(openDropdown === item.href ? null : item.href);
                  }}
                >
                  <span className="flex items-center justify-between">
                    {item.title}
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform text-slate-500',
                          openDropdown === item.href && 'rotate-180 text-cyan-400',
                        )}
                      />
                    )}
                  </span>
                </Link>
                {item.children && openDropdown === item.href && (
                  <div className="ml-3 mt-1 space-y-1 border-l border-cyan-500/30 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-900"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4">
              <Button asChild className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-semibold py-5">
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2">
                  <span>Tell us your problem</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
