import { useEffect, useRef } from 'react';
import type { IntroState } from './diwali-types';
import { anaarColors } from './diwali-types';
import {
  createParticlePool,
  createRocketPool,
  createFlashPool,
  spawnParticle,
} from './diwali-particles';
import { launchSkyRocket, updateAndRenderRockets, type RocketLaunchTracker } from './diwali-rocket-sim';
import { emitAnaarSparks, renderLightFlashes, updateAndRenderParticles } from './diwali-spark-renderer';

interface UseDiwaliFireworksParams {
  shouldRender: boolean;
  state: IntroState;
}

export function useDiwaliFireworks({ shouldRender, state }: UseDiwaliFireworksParams) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!shouldRender || state !== 'intro') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let displayWidth = window.innerWidth || document.documentElement.clientWidth || 390;
    let displayHeight = window.innerHeight || document.documentElement.clientHeight || 844;

    const resizeCanvas = () => {
      if (!canvas || !ctx) return;
      displayWidth = window.innerWidth || document.documentElement.clientWidth;
      displayHeight = window.innerHeight || document.documentElement.clientHeight;
      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const pool = createParticlePool(480);
    const rockets = createRocketPool(5);
    const flashes = createFlashPool(4);

    for (let i = 0; i < 18; i++) {
      spawnParticle(
        pool,
        'ember',
        Math.random() * displayWidth,
        Math.random() * displayHeight,
        (Math.random() - 0.5) * 0.4,
        -(Math.random() * 0.6 + 0.3),
        0,
        1,
        Math.floor(Math.random() * 120 + 80),
        Math.random() * 2 + 1,
        anaarColors[i % anaarColors.length]
      );
    }

    const tracker: RocketLaunchTracker = {
      lastLaunchTime: performance.now() - 1200,
      launchCount: 0,
    };
    let lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      if (!isRunningRef.current || !ctx) return;
      const delta = Math.min(currentTime - lastFrameTime, 64);
      lastFrameTime = currentTime;

      ctx.clearRect(0, 0, displayWidth, displayHeight);
      const isMobile = displayWidth < 640;

      emitAnaarSparks(pool, currentTime, displayWidth, displayHeight, isMobile);
      launchSkyRocket(rockets, currentTime, tracker, displayWidth, displayHeight, isMobile);
      updateAndRenderRockets(rockets, pool, flashes, ctx, isMobile);
      renderLightFlashes(flashes, ctx);
      updateAndRenderParticles(pool, ctx, delta, displayWidth, displayHeight);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    const startAnimation = () => {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        lastFrameTime = performance.now();
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    const stopAnimation = () => {
      isRunningRef.current = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) stopAnimation();
      else if (state === 'intro') startAnimation();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    isRunningRef.current = true;
    lastFrameTime = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      stopAnimation();
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      pool.length = 0;
      rockets.length = 0;
      flashes.length = 0;
    };
  }, [shouldRender, state]);

  return { canvasRef, isRunningRef, animFrameRef };
}
