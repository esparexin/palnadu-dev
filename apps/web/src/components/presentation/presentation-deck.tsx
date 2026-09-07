'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  shortName: string;
  component: React.ReactNode;
}

interface PresentationDeckProps {
  slides: Slide[];
}

export function PresentationDeck({ slides }: PresentationDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const totalSlides = slides.length;

  const scrollToSlide = useCallback((index: number) => {
    const targetIndex = Math.max(0, Math.min(index, totalSlides - 1));
    const targetEl = slideRefs.current[targetIndex];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    scrollToSlide(currentSlide + 1);
  }, [currentSlide, scrollToSlide]);

  const prevSlide = useCallback(() => {
    scrollToSlide(currentSlide - 1);
  }, [currentSlide, scrollToSlide]);

  // ─── IntersectionObserver to track active slide cleanly ──────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) {
              setCurrentSlide(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.55,
      },
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [slides]);

  // ─── Keyboard Presentation Navigation ────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToSlide(totalSlides - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, scrollToSlide, totalSlides]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      {/* ─── GPU-Accelerated Scroll-Snap Container (Never hangs) ── */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto overscroll-contain snap-y snap-mandatory scroll-smooth scrollbar-none"
        style={{
          scrollSnapType: 'y mandatory',
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            id={slide.id}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="w-full min-h-[calc(100vh-4rem)] snap-start snap-always flex flex-col justify-center relative py-10 sm:py-16"
          >
            {slide.component}
          </div>
        ))}
      </div>

      {/* ─── Right Side PPT Slide Indicator Dots ────────────── */}
      <nav
        aria-label="Slide Deck Navigation"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3 pointer-events-auto"
      >
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => scrollToSlide(index)}
              className="group relative flex items-center justify-end p-1.5 focus:outline-none cursor-pointer"
              aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            >
              {/* Tooltip on hover */}
              <span className="absolute right-7 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
                {slide.shortName}
              </span>

              {/* Dot pill */}
              <div
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-2.5 h-7 bg-cyan-400 shadow-lg shadow-cyan-400/50'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-400'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* ─── Bottom Presentation Deck HUD (Clean, no progress bar) ── */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-8 sm:right-8 z-30 pointer-events-none flex items-center justify-between">
        {/* Current slide tag */}
        <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-800/90 bg-slate-950/80 backdrop-blur-xl shadow-xl text-xs font-mono text-slate-300">
          <span className="text-cyan-400 font-bold">
            0{currentSlide + 1}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">0{totalSlides}</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline font-sans text-slate-300 font-medium">
            {slides[currentSlide]?.title}
          </span>
        </div>

        {/* Next / Previous slide arrow buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full border border-slate-800/90 bg-slate-950/80 backdrop-blur-xl shadow-xl">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
