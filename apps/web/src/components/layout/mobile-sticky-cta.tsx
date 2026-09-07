'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquareCode } from 'lucide-react';

export function MobileStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down 400px on mobile
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Quick inquiry action"
      className="fixed bottom-4 inset-x-4 z-40 md:hidden animate-fade-in"
    >
      <Link
        href="/contact"
        className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl bg-cyan-400 text-slate-950 font-bold shadow-2xl shadow-cyan-500/30 border border-cyan-300/40 text-sm active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquareCode className="h-5 w-5" />
          <span>Tell us your problem</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono font-medium">
          <span>Get advice</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </aside>
  );
}
