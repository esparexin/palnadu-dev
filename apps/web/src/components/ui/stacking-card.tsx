'use client';

import { useTransform, motion, useScroll, MotionValue } from 'motion/react';
import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// StackingDeck & StackingSection
// Used by /grow and interactive journey pages for card decks
//
// How it works:
// • StackingDeck creates a tall container (numCards × 100vh) so
//   the browser has real scroll distance to traverse.
// • Each StackingSection is position:sticky so it pins to the
//   viewport while the user scrolls through the tall container.
// • useScroll tracks the deck container's progress from 0→1;
//   each card uses useTransform to shrink slightly as later
//   cards scroll in, creating the stacking illusion.
// ─────────────────────────────────────────────────────────────

export interface StackingDeckProps {
  children: ((_deckProgress: MotionValue<number>) => React.ReactNode) | React.ReactNode;
  className?: string;
  /** How many cards are in the deck — used to calculate container height */
  cardCount?: number;
}

export const StackingDeck = ({ children, className, cardCount = 8 }: StackingDeckProps) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <div
      ref={container}
      className={cn('relative w-full', className)}
      // Each card needs ~100vh of scroll room so sticky children
      // actually traverse through the container.
      style={{ height: `${cardCount * 100}vh` }}
    >
      {typeof children === 'function' ? children(scrollYProgress) : children}
    </div>
  );
};

export interface StackingSectionProps {
  i: number;
  total: number;
  progress: MotionValue<number>;
  id?: string;
  cardClassName?: string;
  children: React.ReactNode;
}

export const StackingSection = ({
  i,
  total,
  progress,
  id,
  cardClassName,
  children,
}: StackingSectionProps) => {
  const targetScale = 1 - (total - i) * 0.035;
  const step = total > 1 ? 1 / total : 0.125;
  const startRange = i * step * 0.75;
  const scale = useTransform(progress, [startRange, 1], [1, targetScale]);

  return (
    <div
      id={id}
      className='h-screen flex items-center justify-center sticky top-0'
    >
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${i * 25}px)`,
        }}
        className={cn(
          'w-[95%] sm:w-[90%] lg:w-[86%] max-w-6xl rounded-2xl origin-top shadow-2xl border transition-shadow duration-300 relative max-h-[85vh] overflow-y-auto',
          cardClassName
        )}
      >
        {children}
      </motion.div>
    </div>
  );
};
