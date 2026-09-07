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
    <div
      className="absolute inset-0 pointer-events-none opacity-40"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]" />
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
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [prefersReducedMotion]);

  if (!canRender3D) {
    return <FallbackVisual />;
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-80 transition-opacity duration-1000">
      <Suspense fallback={<FallbackVisual />}>
        <DynamicHeroScene />
      </Suspense>
    </div>
  );
}
