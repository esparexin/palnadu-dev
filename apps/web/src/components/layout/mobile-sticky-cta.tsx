'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function MobileStickyCta() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Never display the sticky contact CTA when user is already on /contact
  if (pathname === '/contact' || !visible) return null;

  return (
    <aside
      aria-label="Quick action"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-4 z-40 md:hidden animate-fade-in"
    >
      <Link
        href="/contact"
        className="flex items-center justify-between w-full max-w-sm mx-auto px-4 py-2.5 rounded-md bg-palnadu-blue text-white font-semibold shadow-md text-xs active:scale-95 transition-transform"
      >
        <span>Discuss your idea or process</span>
        <span className="font-mono text-xs">→</span>
      </Link>
    </aside>
  );
}
