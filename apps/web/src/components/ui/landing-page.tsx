"use client";

import React, { useEffect, useRef, useState, useMemo } from "react"; 
import Link from "next/link";
import Globe from "@/components/ui/globe";
import { cn } from "@/lib/utils";

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
    { top: "50%", left: "75%", scale: 1.35 },  // Hero: Right side, balanced
    { top: "30%", left: "50%", scale: 0.85 },  // Methodology: Subtle center top
    { top: "25%", left: "80%", scale: 1.4 },   // Capabilities: Right side
    { top: "50%", left: "50%", scale: 1.3 },   // CTA: Center backdrop
  ]
};

// Parse percentage string to number
const parsePercent = (str: string): number => parseFloat(str.replace('%', ''));

export function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
          
          // 1. Direct hardware-accelerated progress bar update (Zero React re-render)
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress})`;
          }

          // 2. Identify active section
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

          // 3. Direct hardware-accelerated globe transform update (Zero React re-render)
          if (globeRef.current) {
            const currentPos = calculatedPositions[newActiveSection] || calculatedPositions[0];
            const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
            globeRef.current.style.transform = transform;
            globeRef.current.style.opacity = newActiveSection === 3 ? "0.3" : "0.9";
          }

          // 4. Update state ONLY when section changes
          if (newActiveSection !== activeSectionRef.current) {
            activeSectionRef.current = newActiveSection;
            setActiveSection(newActiveSection);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    
    // Initial placement
    if (globeRef.current) {
      const initialPos = calculatedPositions[0];
      globeRef.current.style.transform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    }
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
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
      <div className="fixed top-0 left-0 w-full h-0.5 bg-palnadu-border/40 z-50 pointer-events-none">
        <div 
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-palnadu-blue via-palnadu-blue to-palnadu-teal will-change-transform shadow-xs"
          style={{ 
            transform: 'scaleX(0)',
            transformOrigin: 'left center',
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

      {/* Hardware-Accelerated Globe Layer */}
      <div
        ref={globeRef}
        className="fixed z-10 pointer-events-none will-change-transform transition-transform duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ opacity: 0.9 }}
      >
        <div className="scale-60 sm:scale-80 lg:scale-100">
          <Globe />
        </div>
      </div>

      {/* Dynamic Sections with Natural Responsive Vertical Rhythm */}
      {sections.map((section, index) => {
        // Calibrate height based on section content weight to prevent empty voids
        const sectionHeight = 
          index === 0 ? "min-h-[75vh] sm:min-h-[85vh] py-16 sm:py-20 lg:py-24" :
          index === 1 ? "min-h-[45vh] sm:min-h-[55vh] py-12 sm:py-16" :
          index === 2 ? "min-h-[55vh] sm:min-h-[65vh] py-12 sm:py-16" :
          "min-h-[60vh] sm:min-h-[70vh] py-14 sm:py-20";

        return (
          <section
            key={section.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            className={cn(
              "relative flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-16 z-20",
              "w-full max-w-full overflow-hidden",
              sectionHeight,
              section.align === 'center' && "items-center text-center",
              section.align === 'right' && "items-end text-right",
              section.align !== 'center' && section.align !== 'right' && "items-start text-left"
            )}
          >
            <div className={cn(
              "w-full max-w-xl md:max-w-2xl lg:max-w-3xl will-change-transform",
              "opacity-100 translate-y-0"
            )}>
              
              {section.badge && (
                <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                  {section.badge}
                </p>
              )}

              <h1 className={cn(
                "font-extrabold mb-4 sm:mb-6 leading-[1.15] tracking-tight text-palnadu-dark",
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
                "text-palnadu-body leading-relaxed mb-6 sm:mb-8 text-[15px] sm:text-base md:text-lg font-normal",
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
                      className="p-3.5 rounded-lg border border-palnadu-border bg-white/90 backdrop-blur-xs shadow-2xs hover:border-palnadu-blue transition-colors text-left"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-palnadu-blue font-bold text-xs shrink-0 mt-0.5">▪</span>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-palnadu-dark text-sm">{feature.title}</h3>
                          <p className="text-palnadu-body text-[13px] leading-relaxed">{feature.description}</p>
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
                      "px-7 py-3 sm:py-2.5 rounded-md font-semibold transition-all duration-200 text-sm text-center inline-flex items-center justify-center shadow-xs min-h-[44px] sm:min-h-0",
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
        );
      })}
    </div>
  );
}

export default ScrollGlobe;
