'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { isDiwaliCampaignActive } from '@/config/campaign';
import type { IntroState } from './diwali-types';
import { useDiwaliFireworks } from './use-diwali-fireworks';
import { DiwaliModal } from './diwali-modal';

export function DiwaliIntro() {
  const [shouldRender, setShouldRender] = useState(false);
  const [state, setState] = useState<IntroState>('intro');
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  const { canvasRef, isRunningRef, animFrameRef } = useDiwaliFireworks({
    shouldRender,
    state,
  });

  useEffect(() => {
    try {
      if (!isDiwaliCampaignActive()) {
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const forcePlay =
        urlParams.get('diwali') === 'true' || urlParams.get('preview') === 'diwali';
      const isDev = process.env.NODE_ENV === 'development';
      const hasDismissedInSession =
        !isDev && !forcePlay && sessionStorage.getItem('palnadu_diwali_2026_dismissed');

      if (hasDismissedInSession) {
        return;
      }

      setShouldRender(true);
    } catch {
      setShouldRender(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldRender || state === 'website') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [shouldRender, state]);

  const handleEnterWebsite = useCallback(() => {
    if (state !== 'intro') return;

    setState('transitioning');
    setOverlayOpacity(0);

    try {
      sessionStorage.setItem('palnadu_diwali_2026_dismissed', 'true');
    } catch {}

    isRunningRef.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setTimeout(() => {
      setState('website');
      setShouldRender(false);
    }, 450);
  }, [state, isRunningRef, animFrameRef]);

  useEffect(() => {
    if (!shouldRender || state !== 'intro') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleEnterWebsite();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, state, handleEnterWebsite]);

  if (!shouldRender || state === 'website' || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <DiwaliModal
      canvasRef={canvasRef}
      overlayOpacity={overlayOpacity}
      onEnterWebsite={handleEnterWebsite}
    />,
    document.body
  );
}

export default DiwaliIntro;
