"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

export interface MetroHeroProps {
  videoSrc?: string;
  title?: string;
  scrollHint?: string;
  tagline?: string;
  signature?: { name: string; url: string } | false;
  scrubDistance?: number;
  className?: string;
  style?: React.CSSProperties;
  unlockOnEnd?: boolean;
  children?: React.ReactNode;
}

const DEFAULT_VIDEO = "/videos/metro-hero.mp4";
const DEFAULT_SIGNATURE = {
  name: "Palnadu.dev",
  url: "https://www.palnadu.dev",
};

export default function MetroHero({
  videoSrc = DEFAULT_VIDEO,
  title = "Digital Marketing",
  scrollHint = "SCROLL TO EXPLORE GROWTH",
  tagline = "Grow With Us. Let Your Business Growth Show.",
  signature = DEFAULT_SIGNATURE,
  className,
  style,
  children,
}: MetroHeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly set muted & attempt autoplay
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setVideoLoaded(true))
        .catch(() => {
          // Autoplay policy fallback: video remains ready for user interaction
          setVideoLoaded(true);
        });
    }

    const handleLoadedData = () => setVideoLoaded(true);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleLoadedData);

    // Natural parallax scroll listener (throttled via RAF)
    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleLoadedData);
    };
  }, []);

  const scrollToJourney = () => {
    const el = document.getElementById("growth-journey");
    if (el) {
      const navOffset = 64;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  // Parallax calculations (clean, bounds-checked)
  const heroHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const progress = Math.min(Math.max(scrollY / (heroHeight || 1), 0), 1);
  const videoScale = 1 + progress * 0.08;
  const contentOpacity = Math.max(1 - progress * 1.4, 0);
  const contentTranslateY = progress * 60;

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        position: "relative",
        height: "100dvh",
        minHeight: "600px",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#030814",
        ...style,
      }}
    >
      {/* Background Video with subtle parallax zoom */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${videoScale})`,
          transition: "transform 0.1s linear, opacity 0.6s ease",
          opacity: videoLoaded ? 1 : 0.85,
          pointerEvents: "none",
        }}
      />

      {/* Cinematic Lighting & Contrast Overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(3,8,20,0.3) 0%, rgba(3,8,20,0.7) 100%), linear-gradient(180deg, rgba(3,8,20,0.5) 0%, rgba(3,8,20,0.2) 40%, rgba(3,8,20,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Hero Foreground Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 1.5rem",
          textAlign: "center",
          opacity: contentOpacity,
          transform: `translateY(${contentTranslateY}px)`,
          transition: "transform 0.1s linear",
          zIndex: 10,
        }}
      >
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-widest shadow-sm">
            <span>Palnadu.dev</span>
            <span className="text-palnadu-teal">•</span>
            <span>Digital Growth Engine</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              textShadow: "0 4px 30px rgba(0, 0, 0, 0.7)",
            }}
          >
            {title}
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: "clamp(1rem, 2.2vw, 1.35rem)",
              fontWeight: 500,
              lineHeight: 1.4,
              color: "rgba(235, 242, 255, 0.9)",
              maxWidth: "680px",
              margin: "0 auto",
              textShadow: "0 2px 16px rgba(0, 0, 0, 0.6)",
            }}
          >
            {tagline}
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-palnadu-blue hover:bg-[#12487e] text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
            >
              <span>Discuss Your Growth</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={scrollToJourney}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold text-sm transition-all w-full sm:w-auto cursor-pointer"
            >
              <span>Explore Growth Journey</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Hint Indicator */}
      <div
        onClick={scrollToJourney}
        style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(20px, 4vh, 36px)",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          color: "rgba(255, 255, 255, 0.75)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.2em",
          cursor: "pointer",
          zIndex: 10,
          opacity: contentOpacity,
          transition: "opacity 0.2s ease",
        }}
      >
        <span>{scrollHint}</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </div>

      {/* Optional Signature */}
      {signature && (
        <span
          style={{
            position: "absolute",
            right: "1.5rem",
            bottom: "1rem",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.4)",
            zIndex: 10,
          }}
        >
          by{" "}
          <a
            href={signature.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(255, 255, 255, 0.6)", textDecoration: "none" }}
          >
            {signature.name}
          </a>
        </span>
      )}

      {children}
    </div>
  );
}
