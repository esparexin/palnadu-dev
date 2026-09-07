'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useReducedMotion } from '@/hooks/use-media-query';

// Dynamically import the 3D scene with no SSR
const DynamicHeroScene = dynamic(
  () => import('./hero-scene').then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => <FallbackVisual />,
  },
);

function FallbackVisual() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px]" />
    </div>
  );
}

function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function Hero3DWrapper() {
  const [canRender3D, setCanRender3D] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Only initialize 3D if WebGL is supported and user hasn't requested reduced motion
    if (!prefersReducedMotion && isWebGLAvailable()) {
      // Defer 3D loading slightly so critical DOM content paints first (LCP optimization)
      const timer = setTimeout(() => {
        setCanRender3D(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [prefersReducedMotion]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
      {/* Ambient background glows for technical depth */}
      <div className="ambient-glow-cyan top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] opacity-25" />
      <div className="ambient-glow-amber -top-20 -left-20 w-[400px] h-[400px] opacity-15" />

      {canRender3D ? (
        <Suspense fallback={<FallbackVisual />}>
          <DynamicHeroScene />
        </Suspense>
      ) : (
        <FallbackVisual />
      )}
    </div>
  );
}
