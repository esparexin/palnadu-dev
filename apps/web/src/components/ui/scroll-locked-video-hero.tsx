"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

export interface MetroHeroProps {
  videoSrc?: string;
  title?: string;
  scrollHint?: string;
  tagline?: string;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_VIDEO = "/videos/metro-hero.mp4";

export default function MetroHero({
  videoSrc = DEFAULT_VIDEO,
  title = "Digital Marketing",
  scrollHint = "SCROLL TO EXPLORE GROWTH",
  tagline = "Grow With Us. Let Your Business Growth Show.",
  className,
  style,
}: MetroHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.muted = true;
    let isSeeking = false;
    let pendingTime: number | null = null;

    const onLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        setIsReady(true);
      }
    };

    if (video.readyState >= 1 && video.duration) {
      onLoadedMetadata();
    }

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("canplay", onLoadedMetadata);

    // Warm up the video decoder silently so seeks work immediately across all browsers
    const warmUpVideo = () => {
      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          video.pause();
          onLoadedMetadata();
        }).catch(() => {
          onLoadedMetadata();
        });
      }
    };
    warmUpVideo();

    const onSeeked = () => {
      isSeeking = false;
      if (pendingTime !== null) {
        const nextTime = pendingTime;
        pendingTime = null;
        seekTo(nextTime);
      }
    };
    video.addEventListener("seeked", onSeeked);

    function seekTo(targetTime: number) {
      if (!video) return;
      if (Math.abs(video.currentTime - targetTime) < 0.03) return;
      if (isSeeking) {
        pendingTime = targetTime;
        return;
      }
      isSeeking = true;
      // Use native fastSeek on WebKit (iOS Safari) if available for instant hardware-accelerated scrubbing
      if (typeof (video as any).fastSeek === "function") {
        (video as any).fastSeek(targetTime);
      } else {
        video.currentTime = targetTime;
      }
    }

    // Touch gesture activation for mobile video decoding permissions
    const onTouchActivate = () => {
      if (video.paused && video.readyState >= 1) {
        const p = video.play();
        if (p !== undefined) {
          p.then(() => video.pause()).catch(() => {});
        }
      }
    };
    window.addEventListener("touchstart", onTouchActivate, { once: true, passive: true });

    // Passive, non-blocking sticky scroll progress calculation
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
          1
        );
        setScrollProgress(currentProgress);

        // Map scroll progress to video time (scrubs from 0% to 75% scroll, holds at end from 75% to 100%)
        const videoDuration = video.duration || duration;
        if (videoDuration > 0) {
          const videoProgress = Math.min(currentProgress / 0.75, 1);
          seekTo(videoProgress * videoDuration);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
      window.removeEventListener("touchstart", onTouchActivate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("canplay", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [duration]);

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
        top: window.innerHeight * 2,
        behavior: "smooth",
      });
    }
  };

  // Content visibility transitions based on scroll progress
  // Phase 1: Title is visible from 0.0 to 0.35, then fades out
  const titleOpacity = Math.max(1 - scrollProgress * 3.2, 0);
  const titleTranslateY = scrollProgress * -40;

  // Phase 2: Tagline and action buttons fade in from 0.35 to 0.65, stay solid to 1.0
  const ctaOpacity = Math.min(Math.max((scrollProgress - 0.32) / 0.28, 0), 1);
  const ctaTranslateY = Math.max((1 - ctaOpacity) * 24, 0);

  // Subtle video scale as user scrolls down
  const videoScale = 1 + scrollProgress * 0.06;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        // 260vh gives ample scroll room to scrub the video naturally without body locking
        height: "260vh",
        ...style,
      }}
    >
      {/* Sticky Viewport Container: pins smoothly while scrolling through the 260vh */}
      <div
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          height: "100dvh",
          minHeight: "600px",
          overflow: "hidden",
          backgroundColor: "#030814",
        }}
      >
        {/* Scroll-scrubbed Video Element */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          {...({
            "webkit-playsinline": "true",
            "x5-playsinline": "true",
          } as any)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${videoScale})`,
            transition: "transform 0.05s linear",
            opacity: isReady ? 1 : 0.85,
            pointerEvents: "none",
          }}
        />

        {/* Ambient Darkening Gradient Overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(3,8,20,0.2) 0%, rgba(3,8,20,0.65) 100%), linear-gradient(180deg, rgba(3,8,20,0.45) 0%, rgba(3,8,20,0.15) 40%, rgba(3,8,20,0.8) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Phase 1: Title Screen (Visible at top, fades on scroll) */}
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
            opacity: titleOpacity,
            transform: `translateY(${titleTranslateY}px)`,
            pointerEvents: titleOpacity > 0.1 ? "auto" : "none",
            zIndex: 10,
          }}
        >
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-cyan-300">
              {scrollHint}
            </p>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#ffffff",
                textShadow: "0 4px 30px rgba(0, 0, 0, 0.7)",
              }}
            >
              {title}
            </h1>
          </div>
        </div>

        {/* Phase 2: Tagline and CTAs (Revealed as video finishes scrubbing) */}
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
            opacity: ctaOpacity,
            transform: `translateY(${ctaTranslateY}px)`,
            pointerEvents: ctaOpacity > 0.2 ? "auto" : "none",
            zIndex: 10,
          }}
        >
          <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
            <p
              style={{
                fontSize: "clamp(1.2rem, 3.2vw, 2rem)",
                fontWeight: 700,
                lineHeight: 1.25,
                color: "#ffffff",
                textShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
              }}
            >
              {tagline}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-palnadu-blue hover:bg-palnadu-dark-hover text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
              >
                <span>Contact Us</span>
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

        {/* Scroll Progress Indicator Line at the very bottom */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            zIndex: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(scrollProgress * 100, 100)}%`,
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              transition: "width 0.05s linear",
            }}
          />
        </div>

        {/* Bottom Scroll Chevron: Visible at start, fades smoothly as user scrolls */}
        <div
          onClick={scrollToJourney}
          aria-label="Scroll to content"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "clamp(20px, 4vh, 32px)",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "rgba(255, 255, 255, 0.7)",
            cursor: "pointer",
            zIndex: 20,
            opacity: titleOpacity,
            transition: "opacity 0.2s ease",
          }}
        >
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
