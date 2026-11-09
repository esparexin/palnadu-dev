"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  MAX_CARDS,
  FUSE,
  type MoltenRingItem,
  type MoltenRingCarouselProps,
} from "./molten-ring-constants";
import { MoltenRingFallback } from "./molten-ring-fallback";
import { useMoltenRingGl } from "./use-molten-ring-gl";

export type { MoltenRingItem, MoltenRingCarouselProps };

export function MoltenRingCarousel({
  items,
  brand,
  arc = 1,
  cardSize = 0.265,
  cardRatio = 1.5,
  fuse = FUSE,
  threads = true,
  glass = true,
  scrollLinked = true,
  scrollProgress,
  className,
  ...props
}: MoltenRingCarouselProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [active, setActive] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);
  const [supported, setSupported] = React.useState(true);

  const scrollProgressRef = React.useRef(scrollProgress);
  scrollProgressRef.current = scrollProgress;
  const scrollLinkedRef = React.useRef(scrollLinked);
  scrollLinkedRef.current = scrollLinked;

  const settings = React.useRef({ arc, cardSize, cardRatio, fuse, threads, glass });
  settings.current = { arc, cardSize, cardRatio, fuse, threads, glass };
  const step = React.useRef<(_by: number) => void>(() => {});

  const count = Math.min(items.length, MAX_CARDS);
  const sources = items.map((item) => item.image).join(" ");

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  useMoltenRingGl({
    canvasRef,
    items,
    count,
    sources,
    reduced,
    settings,
    scrollLinkedRef,
    scrollProgressRef,
    step,
    setActive,
    setSupported,
  });

  const item = items[active];

  if (!supported) {
    return <MoltenRingFallback items={items} brand={brand} className={className} {...props} />;
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={brand ?? "Gallery"}
      className={cn("bg-palnadu-dark text-white relative h-full min-h-[24rem] w-full overflow-hidden select-none", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="listbox"
        aria-label={brand ?? "Gallery"}
        aria-activedescendant={`molten-ring-${active}`}
        className="text-white focus-visible:outline-palnadu-teal absolute inset-0 h-full w-full cursor-grab touch-pan-y outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") step.current(1);
          else if (event.key === "ArrowUp") step.current(-1);
          else return;
          event.preventDefault();
        }}
      />
      <ul className="sr-only">
        {items.map((entry, i) => (
          <li key={entry.image} id={`molten-ring-${i}`} role="option" aria-selected={i === active}>
            {entry.title}
            {entry.meta ? `. ${entry.meta}` : ""}
          </li>
        ))}
      </ul>
      {brand && (
        <div className="pointer-events-none absolute top-[6%] left-[5%] text-xs font-mono font-bold tracking-widest uppercase text-palnadu-teal">
          {brand}
        </div>
      )}
      <div className="pointer-events-none absolute top-1/2 left-[5%] -translate-y-1/2">
        <div className="text-palnadu-light-blue/70 text-xs font-mono tabular-nums">
          {String(active + 1).padStart(2, "0")}
        </div>
        <div className="mt-1 text-lg sm:text-xl leading-none font-bold tracking-tight text-white">
          {item?.title}
        </div>
      </div>
      {item?.meta && (
        <div className="text-palnadu-light-blue/70 pointer-events-none absolute top-1/2 right-[5%] -translate-y-1/2 text-right text-xs font-mono">
          {item.meta}
        </div>
      )}
    </section>
  );
}

export default MoltenRingCarousel;
