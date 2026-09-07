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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = slides.length;

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      const target = Math.max(0, Math.min(index, totalSlides - 1));
      if (target === currentSlide) return;

      setIsTransitioning(true);
      setCurrentSlide(target);

      // Transition cooldown (matches PPT slide animation duration)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 650);
    },
    [currentSlide, isTransitioning, totalSlides],
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // ─── Mouse Wheel / Trackpad PPT Transition ──────────────────
  useEffect(() => {
    let accumulatedDelta = 0;
    let wheelTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      // Don't trigger if user is scrolling inside a nested scrollable element
      const target = e.target as HTMLElement;
      if (target && target.closest('.slide-scrollable')) {
        const scrollable = target.closest('.slide-scrollable') as HTMLElement;
        const atTop = scrollable.scrollTop <= 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;

        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
          return; // Let nested element scroll
        }
      }

      e.preventDefault();

      accumulatedDelta += e.deltaY;
      clearTimeout(wheelTimeout);

      wheelTimeout = setTimeout(() => {
        accumulatedDelta = 0;
      }, 200);

      // Threshold to trigger slide transition
      const threshold = 35;
      if (accumulatedDelta > threshold) {
        nextSlide();
        accumulatedDelta = 0;
      } else if (accumulatedDelta < -threshold) {
        prevSlide();
        accumulatedDelta = 0;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [nextSlide, prevSlide]);

  // ─── Keyboard Presentation Controls ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
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
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(totalSlides - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSlide, nextSlide, prevSlide, totalSlides]);

  // ─── Touch / Swipe Support for Mobile ────────────────────────
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      // 45px swipe threshold
      if (diff > 45) {
        nextSlide();
      } else if (diff < -45) {
        prevSlide();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden select-none"
    >
      {/* ─── Top Presentation Deck Progress Bar ─────────────── */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-900/60 z-30">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
        />
      </div>

      {/* ─── Slides Container with PPT Slide Transition ─────── */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          const isPrev = index < currentSlide;

          // PowerPoint / Keynote slide transition calculation
          let transformStyle = 'translate3d(0, 0, 0)';
          let opacityStyle = 1;
          let zIndexStyle = 10;

          if (!isActive) {
            transformStyle = isPrev ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 100%, 0)';
            opacityStyle = 0;
            zIndexStyle = 0;
          }

          return (
            <div
              key={slide.id}
              id={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 w-full h-full overflow-y-auto slide-scrollable transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
              style={{
                transform: transformStyle,
                opacity: opacityStyle,
                zIndex: zIndexStyle,
              }}
            >
              <div className="min-h-full w-full flex flex-col justify-center py-12 sm:py-16">
                {slide.component}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Right Side PPT Slide Indicator Dots ────────────── */}
      <nav
        aria-label="Slide Deck Navigation"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3"
      >
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className="group relative flex items-center justify-end p-1.5 focus:outline-none"
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
                    ? 'w-2 h-6 bg-cyan-400 shadow-lg shadow-cyan-400/50'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* ─── Bottom Presentation Deck HUD ───────────────────── */}
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
            {slides[currentSlide].title}
          </span>
        </div>

        {/* Next / Previous slide arrow buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full border border-slate-800/90 bg-slate-950/80 backdrop-blur-xl shadow-xl">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Previous slide"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Next slide"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
