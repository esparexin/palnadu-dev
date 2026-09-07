'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { mainNavItems } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2" aria-label="Palnadu.dev Home">
          <span className="text-xl font-bold tracking-tight">
            Palnadu<span className="text-muted-foreground">.dev</span>
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
                  'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                )}
              >
                {item.title}
                {item.children && <ChevronDown className="h-3 w-3" />}
              </Link>

              {/* Dropdown */}
              {item.children && openDropdown === item.href && (
                <div className="absolute left-0 top-full z-50 w-72 rounded-md border bg-popover p-2 shadow-lg">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block rounded-md px-3 py-2.5 transition-colors hover:bg-accent"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <div className="text-sm font-medium">{child.title}</div>
                      {child.description && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
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
          <Button asChild size="sm">
            <Link href="/contact">Tell us your problem</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="border-t md:hidden">
          <div className="container space-y-1 py-4">
            {mainNavItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
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
                          'h-4 w-4 transition-transform',
                          openDropdown === item.href && 'rotate-180',
                        )}
                      />
                    )}
                  </span>
                </Link>
                {item.children && openDropdown === item.href && (
                  <div className="ml-4 space-y-1 border-l pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
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
              <Button asChild className="w-full" size="sm">
                <Link href="/contact" onClick={() => setMobileOpen(false)}>
                  Tell us your problem
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
