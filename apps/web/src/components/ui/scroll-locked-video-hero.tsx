"use client";

import React, { useRef } from "react";
import { useVideoScrollScrubber } from "./use-video-scroll-scrubber";
import { VideoHeroOverlays } from "./video-hero-overlays";

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

  const { scrollProgress, isReady } = useVideoScrollScrubber({
    containerRef,
    videoRef,
  });

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

  const videoScale = 1 + scrollProgress * 0.06;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "260vh",
        ...style,
      }}
    >
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

        <VideoHeroOverlays
          title={title}
          scrollHint={scrollHint}
          tagline={tagline}
          scrollProgress={scrollProgress}
          onScrollToJourney={scrollToJourney}
        />
      </div>
    </div>
  );
}
