'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/**
 * Pages that rely on scroll-driven animations (video scrub, stacking cards,
 * motion useScroll) need pixel-accurate native scroll — Lenis smooth-wheel
 * easing would desync those animations. Skip Lenis on these routes.
 */
const NATIVE_SCROLL_ROUTES = ['/grow'];

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  // Reset scroll to top on every route navigation
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  // Re-run on pathname change so Lenis is destroyed/re-created per route
  useEffect(() => {
    // Scroll Reveal Intersection Observer for smooth transition effects
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      },
    );

    const observeElements = () => {
      const elements = document.querySelectorAll('.scroll-reveal:not(.is-revealed)');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-revealed');
        } else {
          observer.observe(el);
        }
      });
    };

    const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // On touch devices (smartphones/tablets), rely on native 120Hz momentum scrolling for max speed
    if (isTouchDevice) {
      observeElements();
      const timer = setTimeout(observeElements, 100);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }

    // Skip Lenis on routes that need pixel-accurate native scroll
    // (video scrub heroes, stacking card decks, motion useScroll)
    const needsNativeScroll = NATIVE_SCROLL_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    );

    if (needsNativeScroll) {
      // Destroy any existing Lenis instance from a previous route
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.overflow = '';
      }
      observeElements();
      const timer = setTimeout(observeElements, 100);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }

    // On desktop (non-native-scroll routes), initialize Lenis for smooth transitions
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: false,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Smooth anchor navigation (e.g. href="#services") - scrolls to top of target
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement as HTMLElement, {
            offset: -70,
            duration: 0.9,
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    observeElements();
    const timer = setTimeout(observeElements, 100);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
