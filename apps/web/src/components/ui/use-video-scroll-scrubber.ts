import { useEffect, useState } from "react";

interface UseVideoScrollScrubberParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useVideoScrollScrubber({
  containerRef,
  videoRef,
}: UseVideoScrollScrubberParams) {
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
      if (typeof (video as any).fastSeek === "function") {
        (video as any).fastSeek(targetTime);
      } else {
        video.currentTime = targetTime;
      }
    }

    const onTouchActivate = () => {
      if (video.paused && video.readyState >= 1) {
        const p = video.play();
        if (p !== undefined) {
          p.then(() => video.pause()).catch(() => {});
        }
      }
    };
    window.addEventListener("touchstart", onTouchActivate, { once: true, passive: true });

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
  }, [containerRef, videoRef, duration]);

  return { scrollProgress, duration, isReady };
}
