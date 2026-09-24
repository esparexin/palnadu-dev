"use client"

import React, { useEffect, useRef, useState } from "react"

// ─────────────────────────────────────────────────────────────
// THE CITY OPENS — locked scroll-scrub video hero
// The page cannot move while this is active — body is pinned
// with position:fixed (the same bulletproof technique modal
// libraries use; plain overflow:hidden alone isn't reliable
// across browsers). Wheel/touch input is captured and used
// purely to drive video.currentTime, forward and backward. Once
// the video reaches the end and the user keeps pushing forward,
// the page unlocks and continues normally — and re-locks if they
// scroll back up into it. No dependencies, system fonts only.
// ─────────────────────────────────────────────────────────────

export interface MetroHeroProps {
  videoSrc?: string
  title?: string
  scrollHint?: string
  tagline?: string
  signature?: { name: string; url: string } | false
  /** Total input distance (px) needed to scrub the full video. Tune to taste. */
  scrubDistance?: number
  className?: string
  style?: React.CSSProperties
  /** When true, releases the body lock when the user finishes scrubbing forward so they can scroll down into subsequent sections */
  unlockOnEnd?: boolean
  children?: React.ReactNode
}

const DEFAULT_VIDEO = "/videos/metro-hero.mp4"
const DEFAULT_SIGNATURE = {
  name: "Palnadu.dev",
  url: "https://www.palnadu.dev",
}
const SANS =
  "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const COL_BG = "#05070d"
const COL_TEXT = "#f2f4f8"

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default function MetroHero({
  videoSrc = DEFAULT_VIDEO,
  title = "THE CITY OPENS",
  scrollHint = "SCROLL",
  tagline = "Every door in the city is already open.",
  signature = DEFAULT_SIGNATURE,
  scrubDistance = 2800,
  className,
  style,
  unlockOnEnd = true,
  children,
}: MetroHeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    if (!video || !section) return

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    let duration = 0
    let rafId = 0
    let targetProgress = 0
    let currentProgress = 0
    let hasStartedScrolling = false
    let isSeeking = false
    let pendingTime: number | null = null
    let locked = false
    let lockedScrollY = 0
    let touchStartY = 0
    let unlockCooldown = false
    let hasScrolledDown = false

    const isMobile =
      typeof window !== "undefined" && window.innerWidth < 768
    const effectiveScrubDistance = isMobile
      ? Math.min(scrubDistance, 1400)
      : scrubDistance

    const onLoadedData = () => {
      duration = video.duration || 0
      setReady(true)
      if (reduceMotion && duration > 0) {
        video.currentTime = duration * 0.92
      }
      requestFrame()
    }

    if (video.readyState >= 1) {
      onLoadedData()
    }

    video.addEventListener("loadedmetadata", onLoadedData)
    video.addEventListener("loadeddata", onLoadedData)
    video.addEventListener("canplay", onLoadedData)

    // Ensure muted is explicitly set on DOM element for mobile/Brave browsers
    video.muted = true

    // iOS Safari often won't buffer any video data — even with
    // preload="auto" — until playback actually starts, to save mobile
    // data. Force a silent play-then-immediately-pause on mount.
    const kickstartLoad = () => {
      const p = video.play()
      if (p && typeof p.then === "function") {
        p.then(() => {
          video.pause()
          onLoadedData()
        }).catch(() => {
          onLoadedData()
        })
      } else {
        video.pause()
        onLoadedData()
      }
    }
    kickstartLoad()

    const onSeeked = () => {
      isSeeking = false
      if (pendingTime !== null) {
        const t = pendingTime
        pendingTime = null
        isSeeking = true
        video.currentTime = t
      }
    }
    video.addEventListener("seeked", onSeeked)

    function seekTo(t: number) {
      if (!video) return
      if (Math.abs(video.currentTime - t) < 0.01) return
      if (isSeeking) {
        pendingTime = t
        return
      }
      isSeeking = true
      video.currentTime = t
    }

    let isRunning = false
    function requestFrame() {
      if (!isRunning && !reduceMotion) {
        isRunning = true
        rafId = requestAnimationFrame(frame)
      }
    }

    // Locked scroll scrub mode: pins body so wheel/touch drives the video
    function engageLock() {
      if (locked || typeof document === "undefined") return
      locked = true
      lockedScrollY = window.scrollY
      const b = document.body.style
      b.position = "fixed"
      b.top = `-${lockedScrollY}px`
      b.left = "0"
      b.right = "0"
      b.width = "100%"
      b.height = "100%"
      b.overscrollBehavior = "none"
    }

    function releaseLock() {
      if (!locked || typeof document === "undefined") return
      locked = false
      unlockCooldown = true
      setTimeout(() => {
        unlockCooldown = false
      }, 1400)
      const y = lockedScrollY
      const b = document.body.style
      b.position = ""
      b.top = ""
      b.left = ""
      b.right = ""
      b.width = ""
      b.height = ""
      b.overscrollBehavior = ""
      window.scrollTo(0, y)
    }

    const scrollToJourney = () => {
      targetProgress = 1
      requestFrame()
      releaseLock()
      setTimeout(() => {
        const el = document.getElementById("growth-journey")
        if (el) {
          const rect = el.getBoundingClientRect()
          const targetY = rect.top + window.scrollY
          window.scrollTo({ top: targetY, behavior: "smooth" })
        } else {
          const heroHeight = section.offsetHeight || window.innerHeight
          window.scrollTo({ top: heroHeight, behavior: "smooth" })
        }
      }, 50)
    }

    // Listen for external unlock requests (e.g. "Explore Growth Journey" button)
    const onExternalUnlock = () => {
      scrollToJourney()
    }
    window.addEventListener("unlock-video-hero", onExternalUnlock)

    // Also unlock on anchor-link or data-unlock button clicks
    const onDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.(
        'a[href^="#growth-journey"], button[data-unlock="true"]'
      )
      if (target) {
        e.preventDefault()
        scrollToJourney()
      }
    }
    document.addEventListener("click", onDocumentClick, { capture: true })

    // Engage lock when page mounts near top
    if (window.scrollY < 30) {
      engageLock()
    }

    function addDelta(deltaY: number) {
      // If unlocked and scrolling down, let normal page scroll handle it
      if (!locked && deltaY > 0) {
        return false
      }

      // If unlocked and user scrolls back up near top, lock and scrub backward
      if (!locked && !unlockCooldown && hasScrolledDown && deltaY < 0 && window.scrollY <= 50) {
        engageLock()
        targetProgress = 1.0
        hasScrolledDown = false
      }

      const next = clamp(
        targetProgress + deltaY / effectiveScrubDistance,
        0,
        1
      )

      if (unlockOnEnd && next >= 1 && deltaY > 0) {
        // User has scrolled past the entire reading plateau and wants to continue down into the cards
        targetProgress = 1
        releaseLock()
        return false
      }

      targetProgress = next
      if (targetProgress > 0.001) hasStartedScrolling = true
      requestFrame()
      return true
    }

    const onWheel = (e: WheelEvent) => {
      if (locked) {
        const consumed = addDelta(e.deltaY)
        if (consumed) e.preventDefault()
      } else if (!unlockCooldown && hasScrolledDown && window.scrollY <= 50 && e.deltaY < 0) {
        // Upward scroll approaching hero: lock into the reading plateau so user can read tagline & buttons
        engageLock()
        targetProgress = 0.92
        currentProgress = 0.92
        hasScrolledDown = false
        const consumed = addDelta(e.deltaY)
        if (consumed) e.preventDefault()
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchStartY
      const deltaY = touchStartY - y
      touchStartY = y

      if (locked) {
        const consumed = addDelta(deltaY)
        if (consumed) e.preventDefault()
      } else if (!unlockCooldown && hasScrolledDown && window.scrollY <= 50 && deltaY < 0) {
        engageLock()
        targetProgress = 0.92
        currentProgress = 0.92
        hasScrolledDown = false
        const consumed = addDelta(deltaY)
        if (consumed) e.preventDefault()
      }
    }

    // Re-lock if the user scrolls natively back to the very top
    const onWindowScroll = () => {
      if (window.scrollY > 200) {
        hasScrolledDown = true
      }
      if (
        !locked &&
        !unlockCooldown &&
        hasScrolledDown &&
        unlockOnEnd &&
        window.scrollY <= 20
      ) {
        engageLock()
        targetProgress = 0.92
        currentProgress = 0.92
        hasScrolledDown = false
        requestFrame()
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("scroll", onWindowScroll, { passive: true })
    section.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    })
    section.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    })

    function frame() {
      currentProgress += (targetProgress - currentProgress) * 0.2

      if (Math.abs(targetProgress - currentProgress) < 0.003) {
        currentProgress = targetProgress
      }

      // Video scrub maps from progress 0.10 to 0.72 (giving 0.72→1.0 as a calm reading plateau)
      if (duration > 0) {
        const videoNorm = clamp((currentProgress - 0.10) / 0.62, 0, 1)
        seekTo(videoNorm * duration)
      }

      if (videoRef.current) {
        const scaleNorm = clamp((currentProgress - 0.10) / 0.62, 0, 1)
        const scale = 1 + scaleNorm * 0.06
        videoRef.current.style.transform = `scale(${scale})`
      }

      // Title: Resting and readable from 0.0 to 0.12, then fades out smoothly
      if (titleRef.current) {
        const t = 1 - clamp((currentProgress - 0.10) / 0.24, 0, 1)
        titleRef.current.style.opacity = String(t)
        if (t >= 0.95) {
          titleRef.current.style.transform = "none"
          titleRef.current.style.filter = "none"
        } else if (t <= 0.02) {
          titleRef.current.style.opacity = "0"
          titleRef.current.style.filter = "none"
        } else {
          titleRef.current.style.transform = `translateY(${(1 - t) * -20}px)`
          titleRef.current.style.filter = `blur(${(1 - t) * 6}px)`
        }
      }

      if (hintRef.current) {
        const hintOpacity = 1 - clamp(currentProgress / 0.12, 0, 1)
        hintRef.current.style.opacity = String(hintOpacity)
      }

      // Tagline + Contact Buttons: Revealed from 0.62→0.74, then 100% solid & sharp from 0.74→1.0!
      if (taglineRef.current) {
        const t = clamp((currentProgress - 0.58) / 0.16, 0, 1)
        taglineRef.current.style.opacity = String(t)
        if (t >= 0.92) {
          // Resting Plateau: 100% sharp, zero blur, fully interactive!
          taglineRef.current.style.opacity = "1"
          taglineRef.current.style.transform = "none"
          taglineRef.current.style.filter = "none"
          taglineRef.current.style.pointerEvents = "auto"
        } else if (t <= 0.02) {
          taglineRef.current.style.opacity = "0"
          taglineRef.current.style.filter = "none"
          taglineRef.current.style.pointerEvents = "none"
        } else {
          taglineRef.current.style.transform = `translateY(${(1 - t) * 16}px)`
          taglineRef.current.style.filter = `blur(${(1 - t) * 4}px)`
          taglineRef.current.style.pointerEvents = "none"
        }
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${currentProgress})`
      }

      // Only schedule next frame if actively animating (zero CPU usage when idle!)
      if (Math.abs(targetProgress - currentProgress) > 0.0005) {
        rafId = requestAnimationFrame(frame)
      } else {
        isRunning = false
      }
    }

    if (!reduceMotion) {
      requestFrame()
    }

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedData)
      video.removeEventListener("loadeddata", onLoadedData)
      video.removeEventListener("canplay", onLoadedData)
      video.removeEventListener("seeked", onSeeked)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("scroll", onWindowScroll)
      section.removeEventListener("touchstart", onTouchStart, true)
      section.removeEventListener("touchmove", onTouchMove, true)
      window.removeEventListener("unlock-video-hero", onExternalUnlock)
      document.removeEventListener("click", onDocumentClick, true)
      cancelAnimationFrame(rafId)
      releaseLock()
    }
  }, [scrubDistance, unlockOnEnd])

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        position: "relative",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        background: COL_BG,
        touchAction: "none",
        ...style,
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: ready ? 1 : 0.85,
          transformOrigin: "center center",
          willChange: "transform",
          transition: "opacity 0.6s ease",
          touchAction: "none",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(5,7,13,0.35), rgba(5,7,13,0) 30%, rgba(5,7,13,0.15) 70%, rgba(5,7,13,0.55))",
          pointerEvents: "none",
        }}
      />

      <div
        ref={titleRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6%",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: "clamp(30px, 7vw, 96px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: COL_TEXT,
            textShadow: "0 4px 30px rgba(0,0,0,0.5)",
            display: "inline-block",
            willChange: "transform, opacity",
          }}
        >
          {title}
        </span>
      </div>

      {tagline && (
        <div
          ref={taglineRef}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 8%",
            textAlign: "center",
            gap: "1.25rem",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: "clamp(22px, 3.8vw, 42px)",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: COL_TEXT,
              textShadow: "0 4px 24px rgba(0,0,0,0.6)",
              maxWidth: "800px",
            }}
          >
            {tagline}
          </span>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              pointerEvents: "auto",
            }}
          >
            <a
              href="/contact"
              style={{
                fontFamily: SANS,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                borderRadius: "9999px",
                background: "#ffffff",
                color: "#042C53",
                fontWeight: 700,
                fontSize: "clamp(13px, 1.2vw, 15px)",
                textDecoration: "none",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e6f0fa";
                e.currentTarget.style.transform = "scale(1.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span>Contact Us</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>

            <button
              type="button"
              data-unlock="true"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("unlock-video-hero"));
                }
                const el = document.getElementById("growth-journey");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              style={{
                fontFamily: SANS,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "clamp(13px, 1.2vw, 15px)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              }}
            >
              <span>Explore Growth Journey</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div
        ref={hintRef}
        style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(20px, 6vh, 48px)",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          color: "rgba(240,244,248,0.75)",
          fontFamily: SANS,
          fontSize: "clamp(10px, 1.4vw, 12px)",
          fontWeight: 600,
          letterSpacing: "0.3em",
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      >
        <span>{scrollHint}</span>
        <svg
          width="14"
          height="18"
          viewBox="0 0 14 18"
          style={{ animation: "metro-hero-bounce 1.6s ease-in-out infinite" }}
        >
          <style>{`
            @keyframes metro-hero-bounce {
              0%, 100% { transform: translateY(0); opacity: 0.5; }
              50% { transform: translateY(5px); opacity: 1; }
            }
          `}</style>
          <path
            d="M7 1 L7 17 M2 12 L7 17 L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Thin progress line — fills as the video advances. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: "rgba(255,255,255,0.12)",
        }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: "100%",
            width: "100%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.95))",
            transform: "scaleX(0)",
            transformOrigin: "left center",
          }}
        />
      </div>

      {signature && (
        <span
          style={{
            position: "absolute",
            right: "clamp(12px, 2.5vw, 24px)",
            bottom: "clamp(10px, 2vw, 18px)",
            fontFamily: SANS,
            fontWeight: 500,
            fontSize: "clamp(11px, 1.4vw, 13px)",
            letterSpacing: "0.01em",
            color: "rgba(220,224,232,0.6)",
            zIndex: 2,
          }}
        >
          by{" "}
          <a
            href={signature.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(220,224,232,0.6)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.color = COL_TEXT
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.color = "rgba(220,224,232,0.6)"
            }}
          >
            {signature.name}
          </a>
        </span>
      )}

      {children}
    </div>
  )
}
