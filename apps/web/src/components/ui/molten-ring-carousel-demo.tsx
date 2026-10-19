"use client";

import React from "react";
import {
  MoltenRingCarousel,
  type MoltenRingItem,
} from "@/components/ui/molten-ring-carousel";

// Verified Unsplash engineering and digital solutions imagery
const PALNADU_WORK: MoltenRingItem[] = [
  {
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    title: "Web Platforms & Architecture",
    meta: "Full Stack · Next.js · Node",
  },
  {
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    title: "Mobile App Ecosystems",
    meta: "iOS & Android · Cross-Platform",
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    title: "Business Automation & ERP",
    meta: "Regional Workflow · Cloud Database",
  },
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    title: "Cloud Infrastructure & DevOps",
    meta: "High Availability · Docker & CI/CD",
  },
  {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    title: "Conversion UX & Strategy",
    meta: "Performance · SEO · Analytics",
  },
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    title: "Startup MVP Engineering",
    meta: "Rapid Delivery · Truth Before Code",
  },
];

export interface MoltenRingCarouselDemoProps {
  sticky?: boolean;
  title?: string;
  subtitle?: string;
  description?: string;
}

export function MoltenRingCarouselDemo({
  sticky = true,
  title = "Engineering Disciplines in Motion",
  subtitle = "Interactive Showcase",
  description = "Scroll to explore the platforms and digital solutions built by our engineers.",
}: MoltenRingCarouselDemoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    if (!sticky) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const scrollableDistance = rect.height - window.innerHeight;
        if (scrollableDistance <= 0) return;

        const currentProgress = Math.min(
          Math.max(-rect.top / scrollableDistance, 0),
          1,
        );
        setScrollProgress(currentProgress);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [sticky]);

  if (!sticky) {
    return (
      <div className="h-[480px] sm:h-[540px] w-full rounded-2xl overflow-hidden border border-palnadu-border/60 shadow-xl bg-palnadu-dark">
        <MoltenRingCarousel
          items={PALNADU_WORK}
          brand="PALNADU.DEV CRAFT"
          arc={1.05}
          cardSize={0.24}
          cardRatio={0.7}
          fuse={0.09}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-[220vh]">
      <div className="sticky top-16 sm:top-20 h-[calc(100vh-5rem)] max-h-[720px] flex flex-col justify-center space-y-4 py-4">
        <div className="text-center space-y-1.5 shrink-0">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-palnadu-teal">
            {subtitle}
          </p>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-palnadu-light-blue/80 max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="h-[440px] sm:h-[520px] w-full rounded-2xl overflow-hidden border border-palnadu-border/60 shadow-xl bg-palnadu-dark relative">
          <MoltenRingCarousel
            items={PALNADU_WORK}
            brand="PALNADU.DEV CRAFT"
            arc={1.05}
            cardSize={0.24}
            cardRatio={0.7}
            fuse={0.09}
            scrollProgress={scrollProgress}
          />

          {/* Interactive Scroll Progress Indicator */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-palnadu-dark/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-palnadu-light-blue/80 shadow-md">
            <span>SCROLL PROGRESS</span>
            <div className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-palnadu-teal transition-all duration-75 rounded-full"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />
            </div>
            <span className="tabular-nums font-semibold text-white">
              {Math.min(
                Math.floor(scrollProgress * PALNADU_WORK.length) + 1,
                PALNADU_WORK.length,
              )}
              /{PALNADU_WORK.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoltenRingCarouselDemo;
