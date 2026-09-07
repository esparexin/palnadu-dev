"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"; 
import Link from "next/link";
import Globe from "@/components/ui/globe";
import { cn } from "@/lib/utils";

// Reusable ScrollGlobe component following shadcn/ui patterns
export interface ScrollGlobeProps {
  sections: {
    id: string;
    badge?: string;
    title: string;
    subtitle?: string;
    description: string;
    align?: 'left' | 'center' | 'right';
    features?: { title: string; description: string }[];
    actions?: { label: string; variant: 'primary' | 'secondary'; href?: string; onClick?: () => void }[];
  }[];
  globeConfig?: {
    positions: {
      top: string;
      left: string;
      scale: number;
    }[];
  };
  className?: string;
}

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },  // Hero: Right side, balanced
    { top: "25%", left: "50%", scale: 0.9 },  // Innovation: Top side, subtle
    { top: "15%", left: "85%", scale: 1.8 },  // Discovery: Right side, medium
    { top: "50%", left: "50%", scale: 1.6 },  // Future: Center, large backdrop
  ]
};

// Parse percentage string to number
const parsePercent = (str: string): number => parseFloat(str.replace('%', ''));

export function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const animationFrameId = useRef<number | undefined>(undefined);
  
  // Pre-calculate positions for performance
  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  // Direct scroll tracking
  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
    
    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    const currentPos = calculatedPositions[newActiveSection] || calculatedPositions[0];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    
    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  // Throttled scroll handler with RAF
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  // Initial globe position
  useEffect(() => {
    const initialPos = calculatedPositions[0];
    const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    setGlobeTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full max-w-screen overflow-x-hidden min-h-screen bg-white text-palnadu-dark",
        className
      )}
    >
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-palnadu-border/40 z-50">
        <div 
          className="h-full bg-gradient-to-r from-palnadu-blue via-palnadu-blue to-palnadu-teal will-change-transform shadow-xs"
          style={{ 
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center',
            transition: 'transform 0.15s ease-out',
          }}
        />
      </div>

      {/* Enhanced Navigation with active label */}
      <div className="hidden sm:flex fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="relative group">
              <div
                className={cn(
                  "nav-label absolute right-6 top-1/2 -translate-y-1/2",
                  "px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap",
                  "bg-white/95 backdrop-blur-md border border-palnadu-border shadow-md z-50 text-palnadu-dark",
                  activeSection === index ? "animate-fadeOut" : "opacity-0 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-palnadu-blue" />
                  <span>
                    {section.badge || `Part ${index + 1}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className={cn(
                  "relative w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 hover:scale-125 cursor-pointer",
                  activeSection === index 
                    ? "bg-palnadu-blue border-palnadu-blue shadow-sm" 
                    : "bg-transparent border-palnadu-border hover:border-palnadu-blue"
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>
        
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-palnadu-border -translate-x-1/2 -z-10" />
      </div>

      {/* Ultra-smooth Globe */}
      <div
        className="fixed z-10 pointer-events-none will-change-transform transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: globeTransform,
          filter: `opacity(${activeSection === 3 ? 0.35 : 0.9})`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <Globe />
        </div>
      </div>

      {/* Dynamic Sections */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 z-20 py-16 lg:py-24",
            "w-full max-w-full overflow-hidden",
            section.align === 'center' && "items-center text-center",
            section.align === 'right' && "items-end text-right",
            section.align !== 'center' && section.align !== 'right' && "items-start text-left"
          )}
        >
          <div className={cn(
            "w-full max-w-xl md:max-w-2xl lg:max-w-3xl will-change-transform transition-all duration-700",
            "opacity-100 translate-y-0"
          )}>
            
            {section.badge && (
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                {section.badge}
              </p>
            )}

            <h1 className={cn(
              "font-extrabold mb-4 sm:mb-6 leading-[1.1] tracking-tight text-palnadu-dark",
              index === 0 
                ? "text-3xl sm:text-5xl md:text-6xl" 
                : "text-2xl sm:text-4xl md:text-5xl"
            )}>
              {section.subtitle ? (
                <div className="space-y-1">
                  <div>{section.title}</div>
                  <div className="text-palnadu-blue font-bold">
                    {section.subtitle}
                  </div>
                </div>
              ) : (
                <div>{section.title}</div>
              )}
            </h1>
            
            <div className={cn(
              "text-palnadu-body leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base md:text-lg font-normal",
              section.align === 'center' ? "max-w-xl mx-auto text-center" : "max-w-xl"
            )}>
              <p>{section.description}</p>
            </div>

            {/* Features list */}
            {section.features && (
              <div className="grid gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                {section.features.map((feature) => (
                  <div 
                    key={feature.title}
                    className="p-3.5 rounded-lg border border-palnadu-border bg-white/80 backdrop-blur-xs shadow-2xs hover:border-palnadu-blue transition-colors text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-palnadu-blue font-bold text-xs shrink-0 mt-0.5">▪</span>
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-palnadu-dark text-xs sm:text-sm">{feature.title}</h3>
                        <p className="text-palnadu-body text-xs leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {section.actions && (
              <div className={cn(
                "flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3",
                section.align === 'center' && "justify-center",
                section.align === 'right' && "justify-end",
                (!section.align || section.align === 'left') && "justify-start"
              )}>
                {section.actions.map((action) => {
                  const btnClass = cn(
                    "px-6 py-2.5 rounded-md font-semibold transition-all duration-200 text-xs sm:text-sm text-center inline-flex items-center justify-center shadow-xs",
                    action.variant === 'primary' 
                      ? "bg-palnadu-blue text-white hover:bg-[#12487e]" 
                      : "border border-palnadu-blue bg-white text-palnadu-blue hover:bg-palnadu-light-blue"
                  );

                  if (action.href) {
                    return (
                      <Link key={action.label} href={action.href} className={btnClass}>
                        {action.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={btnClass}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default ScrollGlobe;
