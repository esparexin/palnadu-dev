'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  DIWALI_2026_CAMPAIGN,
  isDiwaliCampaignActive,
} from '@/config/campaign';

type IntroState = 'intro' | 'transitioning' | 'website';

interface Particle {
  active: boolean;
  type: 'anaar' | 'rocket_tail' | 'rocket_burst' | 'ember';
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  prevX2: number;
  prevY2: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface SkyRocket {
  active: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  targetY: number;
  burstScale: number;
  color: string;
  palette: string[];
}

interface LightFlash {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

// Traditional Clay Diya with realistic multi-layer glowing flickering flame
function Diya({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.2 : 1;

  return (
    <div
      className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}
      style={{ transform: `scale(${scale})` }}
      aria-hidden="true"
    >
      {/* Radiant ambient glow halo */}
      <div className="absolute -top-7 w-24 h-24 rounded-full bg-palnadu-warning/25 blur-xl animate-pulse" />

      {/* Layered realistic animated flame */}
      <div className="relative z-10 flex flex-col items-center">
        <svg
          viewBox="0 0 60 100"
          className="w-8 h-14 overflow-visible filter drop-shadow-[0_0_14px_rgba(245,158,11,0.9)]"
          style={{
            animation: 'diwaliFlameFlicker 1.8s ease-in-out infinite alternate',
            transformOrigin: 'bottom center',
          }}
        >
          <defs>
            <radialGradient id="diwaliFlameCore" cx="50%" cy="75%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#FEF08A" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
            <radialGradient id="diwaliFlameOuter" cx="50%" cy="80%" r="60%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#D97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path
            d="M30 4 C16 35 6 62 14 82 C22 100 38 100 46 82 C54 62 44 35 30 4 Z"
            fill="url(#diwaliFlameOuter)"
          />
          <path
            d="M30 18 C22 42 16 65 21 80 C26 94 34 94 39 80 C44 65 38 42 30 18 Z"
            fill="url(#diwaliFlameCore)"
          />
          <ellipse cx="30" cy="74" rx="3.5" ry="8" fill="#FFFFFF" opacity="0.95" />
          <line
            x1="30"
            y1="82"
            x2="30"
            y2="92"
            stroke="#451A03"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Traditional Clay & Brass Vessel */}
      <svg
        viewBox="0 0 120 50"
        className="w-20 h-9 -mt-2.5 z-20 overflow-visible filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient id="diwaliBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="35%" stopColor="#D97706" />
            <stop offset="70%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="diwaliRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path
          d="M10 14 C18 36, 102 36, 110 14 C98 44, 22 44, 10 14 Z"
          fill="url(#diwaliBaseGrad)"
        />
        <ellipse
          cx="60"
          cy="14"
          rx="50"
          ry="8"
          fill="url(#diwaliRimGrad)"
          stroke="#FDE68A"
          strokeWidth="0.8"
        />
        <ellipse cx="60" cy="14" rx="42" ry="5.5" fill="#92400E" opacity="0.85" />
        <path d="M55 12 C58 9, 62 9, 65 12 Z" fill="#FBBF24" />
        <ellipse cx="60" cy="40" rx="20" ry="3.5" fill="#78350F" opacity="0.8" />
      </svg>
    </div>
  );
}

// Traditional Indian Anaar (Flower-Pot) Cracker Base with Festive Gold Foil Trim
function AnaarCone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Radiant nozzle glow */}
      <div className="absolute -top-3 w-10 h-10 rounded-full bg-palnadu-warning/35 blur-md animate-pulse" />

      {/* Conical flower-pot vessel */}
      <svg
        viewBox="0 0 80 90"
        className="w-14 sm:w-16 h-16 sm:h-20 overflow-visible filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]"
      >
        <defs>
          <linearGradient id="anaarBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="25%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
          <linearGradient id="anaarFoilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Conical Pot */}
        <path
          d="M36 10 L44 10 L70 82 C70 86, 10 86, 10 82 Z"
          fill="url(#anaarBodyGrad)"
        />

        {/* Festive Golden Foil Trim Bands */}
        <path d="M28 32 L52 32 L56 42 L24 42 Z" fill="url(#anaarFoilGrad)" opacity="0.95" />
        <path d="M20 54 L60 54 L64 64 L16 64 Z" fill="url(#anaarFoilGrad)" opacity="0.95" />

        {/* Nozzle Mouth */}
        <ellipse cx="40" cy="10" rx="5.5" ry="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="1" />
        {/* Clay Rim Base */}
        <ellipse cx="40" cy="82" rx="30" ry="4" fill="#451A03" />
      </svg>
    </div>
  );
}

// Subtle Rangoli Corner Accent
function RangoliPattern({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`text-palnadu-warning/20 pointer-events-none select-none stroke-current fill-none ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="100" cy="100" r="72" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="52" strokeWidth="0.8" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="28" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="8" fill="currentColor" fillOpacity="0.25" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100 30 Q115 65 100 100 Q85 65 100 30 Z"
            strokeWidth="1"
            fill="currentColor"
            fillOpacity="0.05"
          />
          <circle cx="100" cy="40" r="2.5" fill="currentColor" />
          <path d="M100 70 L108 85 L100 100 L92 85 Z" strokeWidth="0.8" />
        </g>
      ))}
    </svg>
  );
}

export function DiwaliIntro() {
  const [shouldRender, setShouldRender] = useState(false);
  const [state, setState] = useState<IntroState>('intro');
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlePoolRef = useRef<Particle[]>([]);
  const rocketsRef = useRef<SkyRocket[]>([]);
  const flashesRef = useRef<LightFlash[]>([]);
  const isRunningRef = useRef(false);

  // Check campaign eligibility on client mount
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

      // Only skip if the visitor explicitly clicked "Enter Website" earlier in this session
      if (hasDismissedInSession) {
        return;
      }

      setShouldRender(true);
    } catch {
      setShouldRender(false);
    }
  }, []);

  // Lock body scroll while full-screen festive experience is active
  useEffect(() => {
    if (!shouldRender || state === 'website') return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [shouldRender, state]);

  // Event-Driven Transition: Only visitor action dismisses the introduction (no auto-dismissal)
  const handleEnterWebsite = useCallback(() => {
    if (state !== 'intro') return;

    setState('transitioning');
    setOverlayOpacity(0);

    try {
      sessionStorage.setItem('palnadu_diwali_2026_dismissed', 'true');
    } catch {}

    // Stop canvas loops immediately
    isRunningRef.current = false;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Smooth fade-out, then clean unmount and resource release
    setTimeout(() => {
      setState('website');
      setShouldRender(false);
      // Clean all pooled particle memory
      particlePoolRef.current.length = 0;
      rocketsRef.current.length = 0;
      flashesRef.current.length = 0;
    }, 450);
  }, [state]);

  // Keyboard accessibility: Enter or Escape triggers Enter Website
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

  // High-Performance Large-Scale Diwali Rocket & Anaar Fireworks Simulation
  useEffect(() => {
    if (!shouldRender || state !== 'intro') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Detect high-DPI retina display (capped at 2x for smooth 60fps mobile GPU rendering)
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

    // ── Pre-allocated Particle Pool (ZERO runtime GC allocation) ──
    const POOL_SIZE = 480;
    const pool: Particle[] = new Array(POOL_SIZE).fill(null).map(() => ({
      active: false,
      type: 'anaar',
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      prevX2: 0,
      prevY2: 0,
      vx: 0,
      vy: 0,
      gravity: 0.24,
      drag: 0.988,
      life: 0,
      maxLife: 1,
      size: 1.5,
      color: '#F59E0B',
    }));
    particlePoolRef.current = pool;

    // ── Pre-allocated Sky Rockets Pool ──
    const ROCKET_POOL_SIZE = 5;
    const rockets: SkyRocket[] = new Array(ROCKET_POOL_SIZE).fill(null).map(() => ({
      active: false,
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vx: 0,
      vy: 0,
      targetY: 0,
      burstScale: 1,
      color: '#FFFBEB',
      palette: ['#FFFFFF', '#FEF08A', '#FDE68A', '#F59E0B', '#D97706'],
    }));
    rocketsRef.current = rockets;

    // ── Pre-allocated Atmospheric Light Flashes Pool ──
    const flashes: LightFlash[] = new Array(4).fill(null).map(() => ({
      active: false,
      x: 0,
      y: 0,
      radius: 80,
      maxRadius: 280,
      alpha: 0,
    }));
    flashesRef.current = flashes;

    const anaarColors = [
      '#FFFFFF', // White-hot core
      '#FEF08A', // Light golden flash
      '#FDE68A', // Brilliant gold
      '#F59E0B', // Warm Palnadu gold
      '#D97706', // Rich amber
      '#EA580C', // Incandescent orange
    ];

    const rocketPalettes = [
      ['#FFFFFF', '#FEF08A', '#FDE68A', '#F59E0B', '#D97706'], // Grand Golden Willow
      ['#FFFFFF', '#FDE68A', '#1D9E75', '#157C5C', '#F59E0B'], // Palnadu Emerald & Gold
      ['#FFFFFF', '#FEF08A', '#EA580C', '#D97706', '#F59E0B'], // Radiant Amber Gold
      ['#FFFFFF', '#FFFBEB', '#FDE68A', '#F59E0B', '#B45309'], // Imperial Champagne Gold
    ];

    const spawnParticle = (
      type: 'anaar' | 'rocket_tail' | 'rocket_burst' | 'ember',
      x: number,
      y: number,
      vx: number,
      vy: number,
      gravity: number,
      drag: number,
      life: number,
      size: number,
      color: string
    ) => {
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
          const p = pool[i];
          p.active = true;
          p.type = type;
          p.x = x;
          p.y = y;
          p.prevX = x;
          p.prevY = y;
          p.prevX2 = x;
          p.prevY2 = y;
          p.vx = vx;
          p.vy = vy;
          p.gravity = gravity;
          p.drag = drag;
          p.life = life;
          p.maxLife = life;
          p.size = size;
          p.color = color;
          return;
        }
      }
    };

    const triggerLightFlash = (x: number, y: number, radius = 280) => {
      for (let i = 0; i < flashes.length; i++) {
        if (!flashes[i].active) {
          flashes[i].active = true;
          flashes[i].x = x;
          flashes[i].y = y;
          flashes[i].radius = 40;
          flashes[i].maxRadius = radius;
          flashes[i].alpha = 0.7;
          return;
        }
      }
    };

    // Pre-seed ambient gentle floating embers
    for (let i = 0; i < 18; i++) {
      spawnParticle(
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

    let lastRocketLaunch = performance.now() - 1200;
    let rocketLaunchCount = 0;
    let lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      if (!isRunningRef.current || !ctx) return;

      const delta = Math.min(currentTime - lastFrameTime, 64);
      lastFrameTime = currentTime;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      const isMobile = displayWidth < 640;
      // Real-device responsive Anaar nozzle positions
      const leftNozzleX = displayWidth * (isMobile ? 0.13 : 0.15);
      const rightNozzleX = displayWidth * (isMobile ? 0.87 : 0.85);
      const nozzleY = displayHeight - (isMobile ? 54 : 68);

      // ── Alternating Firing Cycle Between Left & Right Anaars ──
      const cycleTime = (currentTime % 7000) / 7000;
      let leftIntensity = 0.5;
      let rightIntensity = 0.5;

      if (cycleTime < 0.45) {
        leftIntensity = 1.6;
        rightIntensity = 0.5;
      } else if (cycleTime < 0.5) {
        leftIntensity = 1.0;
        rightIntensity = 1.0;
      } else if (cycleTime < 0.95) {
        leftIntensity = 0.5;
        rightIntensity = 1.6;
      } else {
        leftIntensity = 1.7;
        rightIntensity = 1.7;
      }

      if (Math.random() > 0.88) {
        leftIntensity *= 1.25;
        rightIntensity *= 1.25;
      }

      // ── Emit Left Anaar Sparks (Thick, prominent golden fountains) ──
      const leftSparksToEmit = Math.floor(leftIntensity * (isMobile ? 2.5 : 2.8));
      for (let i = 0; i < leftSparksToEmit; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.44;
        const speed = (Math.random() * 8.5 + 6.5) * (isMobile ? 0.88 : 1) * (0.8 + 0.35 * leftIntensity);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = Math.floor(Math.random() * 25 + 35);
        const size = isMobile ? Math.random() * 1.8 + 1.8 : Math.random() * 1.6 + 1.2;
        const color = anaarColors[Math.floor(Math.random() * anaarColors.length)];

        spawnParticle('anaar', leftNozzleX, nozzleY, vx, vy, 0.25, 0.988, life, size, color);
      }

      // ── Emit Right Anaar Sparks ──
      const rightSparksToEmit = Math.floor(rightIntensity * (isMobile ? 2.5 : 2.8));
      for (let i = 0; i < rightSparksToEmit; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.44;
        const speed = (Math.random() * 8.5 + 6.5) * (isMobile ? 0.88 : 1) * (0.8 + 0.35 * rightIntensity);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = Math.floor(Math.random() * 25 + 35);
        const size = isMobile ? Math.random() * 1.8 + 1.8 : Math.random() * 1.6 + 1.2;
        const color = anaarColors[Math.floor(Math.random() * anaarColors.length)];

        spawnParticle('anaar', rightNozzleX, nozzleY, vx, vy, 0.25, 0.988, life, size, color);
      }

      // ── Sky Rockets Launching from Bottom Corners (Every 2.4 - 3.2s) ──
      if (currentTime - lastRocketLaunch > 2600) {
        lastRocketLaunch = currentTime;
        rocketLaunchCount++;

        for (let i = 0; i < rockets.length; i++) {
          if (!rockets[i].active) {
            const r = rockets[i];
            r.active = true;

            const slot = rocketLaunchCount % 3;
            if (slot === 0) {
              // Left corner launch arching toward upper-left / center
              r.x = displayWidth * (0.12 + Math.random() * 0.10);
              r.vx = (Math.random() * 2.2 + 1.0) * (isMobile ? 0.75 : 1);
              r.targetY = displayHeight * (isMobile ? 0.22 + Math.random() * 0.14 : 0.14 + Math.random() * 0.14);
              r.burstScale = isMobile ? 1.15 : 1.35;
            } else if (slot === 1) {
              // Right corner launch arching toward upper-right / center
              r.x = displayWidth * (0.78 + Math.random() * 0.10);
              r.vx = -(Math.random() * 2.2 + 1.0) * (isMobile ? 0.75 : 1);
              r.targetY = displayHeight * (isMobile ? 0.22 + Math.random() * 0.14 : 0.14 + Math.random() * 0.14);
              r.burstScale = isMobile ? 1.15 : 1.35;
            } else {
              // High aerial background salute
              r.x = displayWidth * (0.35 + Math.random() * 0.30);
              r.vx = (Math.random() - 0.5) * (isMobile ? 1.0 : 1.5);
              r.targetY = displayHeight * (isMobile ? 0.18 + Math.random() * 0.12 : 0.11 + Math.random() * 0.14);
              r.burstScale = isMobile ? 1.25 : 1.5;
            }

            r.y = displayHeight + 10;
            r.prevX = r.x;
            r.prevY = r.y;
            // Calibrated launch velocity for phone and desktop viewports
            r.vy = -(Math.random() * 2.5 + (isMobile ? 13.5 : 18.0));
            r.palette = rocketPalettes[rocketLaunchCount % rocketPalettes.length];
            r.color = '#FFFFFF';
            break;
          }
        }
      }

      // ── Update & Render Active Sky Rockets with Roaring Spark Trails ──
      for (let i = 0; i < rockets.length; i++) {
        const r = rockets[i];
        if (!r.active) continue;

        r.prevX = r.x;
        r.prevY = r.y;
        r.x += r.vx;
        r.y += r.vy;
        r.vy += isMobile ? 0.13 : 0.11;

        // Dense, glowing propellant tail
        for (let t = 0; t < 3; t++) {
          const tailVx = -r.vx * 0.2 + (Math.random() - 0.5) * 2.0;
          const tailVy = -r.vy * 0.14 + Math.random() * 3.0;
          spawnParticle(
            'rocket_tail',
            r.x + (Math.random() - 0.5) * 2.5,
            r.y + 3,
            tailVx,
            tailVy,
            0.15,
            0.96,
            Math.floor(Math.random() * 12 + 12),
            isMobile ? Math.random() * 2.4 + 1.6 : Math.random() * 2.0 + 1.2,
            Math.random() > 0.35 ? '#FFFFFF' : '#FEF08A'
          );
        }

        // Render intense glowing rocket head streak
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(r.prevX, r.prevY);
        ctx.lineTo(r.x, r.y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = isMobile ? 3.0 : 3.5;
        ctx.stroke();

        // Brilliant head flare
        ctx.beginPath();
        ctx.arc(r.x, r.y, isMobile ? 3.8 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FEF08A';
        ctx.fill();
        ctx.restore();

        // ── Apex Detonation: Massive Radial Explosion with Atmospheric Light Flash ──
        if (r.y <= r.targetY || r.vy >= -1.0) {
          r.active = false;

          // Atmospheric night-sky lighting flash
          const flashRadius = (isMobile ? 180 : 300) * r.burstScale;
          triggerLightFlash(r.x, r.y, flashRadius);

          // Starburst particles
          const starCount = Math.floor((isMobile ? 34 : 46) * r.burstScale);
          for (let s = 0; s < starCount; s++) {
            const angle = (s / starCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.32;
            const speed = (Math.random() * 5.5 + 4.0) * (isMobile ? 0.85 : 1.15) * r.burstScale;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = Math.floor(Math.random() * 30 + 38);
            const size = isMobile ? Math.random() * 2.6 + 2.4 : Math.random() * 2.4 + 1.8;
            const color = r.palette[s % r.palette.length];

            spawnParticle('rocket_burst', r.x, r.y, vx, vy, 0.12, 0.962, life, size, color);
          }
        }
      }

      // ── Render Atmospheric Night-Sky Lighting Flashes ──
      for (let i = 0; i < flashes.length; i++) {
        const f = flashes[i];
        if (!f.active) continue;

        f.radius += (f.maxRadius - f.radius) * 0.35;

        ctx.save();
        const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${f.alpha})`);
        flashGrad.addColorStop(0.25, `rgba(254, 240, 138, ${f.alpha * 0.65})`);
        flashGrad.addColorStop(0.65, `rgba(245, 158, 11, ${f.alpha * 0.25})`);
        flashGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        f.alpha -= 0.07;
        if (f.alpha <= 0) {
          f.active = false;
        }
      }

      // ── Update & Render All Active Particles with Long Falling Trails ──
      ctx.save();

      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;

        const step = delta / 16.6;
        p.prevX2 = p.prevX;
        p.prevY2 = p.prevY;
        p.prevX = p.x;
        p.prevY = p.y;
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.vx *= p.drag;
        p.vy += p.gravity * step;
        p.life -= step;

        if (p.life <= 0 || p.y > displayHeight + 25 || p.x < -30 || p.x > displayWidth + 30) {
          if (p.type === 'ember') {
            p.active = true;
            p.x = Math.random() * displayWidth;
            p.y = displayHeight + 10;
            p.prevX = p.x;
            p.prevY = p.y;
            p.prevX2 = p.x;
            p.prevY2 = p.y;
            p.vx = (Math.random() - 0.5) * 0.4;
            p.vy = -(Math.random() * 0.6 + 0.3);
            p.life = Math.floor(Math.random() * 120 + 80);
            p.maxLife = p.life;
          } else {
            p.active = false;
            continue;
          }
        }

        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;

        // Long sparkling streak rendering through historical trajectory
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.prevX, p.prevY);
        if (p.type === 'rocket_burst') {
          ctx.lineTo(p.prevX2, p.prevY2);
        }
        ctx.stroke();

        // Glowing starhead bead on rocket starbursts
        if (p.type === 'rocket_burst' && alpha > 0.35) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

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
      if (document.hidden) {
        stopAnimation();
      } else if (state === 'intro') {
        startAnimation();
      }
    };

    // Robust multi-event mobile lifecycle listeners
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // Initial loop ignition
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

  if (!shouldRender || state === 'website' || typeof document === 'undefined') {
    return null;
  }

  const content = (
    <>
      <style>{`
        @keyframes diwaliFlameFlicker {
          0% { transform: scale(1) rotate(-1.5deg); opacity: 0.95; }
          25% { transform: scale(1.04, 0.96) rotate(1.5deg); opacity: 1; }
          50% { transform: scale(0.97, 1.03) rotate(-0.5deg); opacity: 0.92; }
          75% { transform: scale(1.02, 0.98) rotate(1deg); opacity: 0.98; }
          100% { transform: scale(1) rotate(-1.2deg); opacity: 0.96; }
        }
      `}</style>

      {/* Full-Screen Overlay Portalled directly to document.body (Guaranteed above all navbars & stacking contexts) */}
      <aside
        aria-label="Palnadu.dev Happy Diwali Special Experience"
        role="region"
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black text-palnadu-off-white overflow-hidden transition-opacity duration-500 ease-in-out select-none will-change-[opacity]"
        style={{
          opacity: overlayOpacity,
          pointerEvents: overlayOpacity > 0.2 ? 'auto' : 'none',
        }}
      >
        {/* Full-Screen Deep Midnight Gradient with Warm Center Aura */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-95"
          style={{
            background:
              'radial-gradient(circle at 50% 38%, rgba(4, 44, 83, 0.88) 0%, rgba(2, 12, 24, 0.98) 65%, rgba(0, 0, 0, 1) 100%)',
          }}
        />

        {/* Ambient Center Warmth Halo */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] rounded-full bg-palnadu-warning/10 blur-3xl pointer-events-none z-0" />

        {/* High-Performance Full-Screen Fireworks Canvas (Always active on mobile & desktop) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 block"
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {/* Corner Rangoli Flourishes */}
        <div className="absolute top-0 left-0 w-48 sm:w-56 h-48 sm:h-56 -translate-x-10 -translate-y-10 pointer-events-none opacity-25 z-20">
          <RangoliPattern className="w-full h-full" />
        </div>
        <div className="absolute top-0 right-0 w-48 sm:w-56 h-48 sm:h-56 translate-x-10 -translate-y-10 pointer-events-none opacity-25 z-20">
          <RangoliPattern className="w-full h-full" />
        </div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-56 h-48 sm:h-56 -translate-x-10 translate-y-10 pointer-events-none opacity-25 z-20">
          <RangoliPattern className="w-full h-full" />
        </div>
        <div className="absolute bottom-0 right-0 w-48 sm:w-56 h-48 sm:h-56 translate-x-10 translate-y-10 pointer-events-none opacity-25 z-20">
          <RangoliPattern className="w-full h-full" />
        </div>

        {/* Top Header Bar: Clean single logo & branding */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/palnadu-logo-white.svg"
              alt="Palnadu.dev Logo"
              width={120}
              height={32}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline-block text-xs font-mono uppercase tracking-widest text-palnadu-warning/90">
              Diwali Special
            </span>
          </div>
        </header>

        {/* Main Centerpiece Typography (Crisp, High Contrast Festive Presentation) */}
        <main className="relative z-20 flex-1 w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center text-center my-auto">
          {/* Brand: Palnadu.dev */}
          <div className="flex flex-col items-center">
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight select-none">
              <span className="text-palnadu-warning">Palnadu</span>
              <span className="text-white">.dev</span>
            </h2>

            {/* Brand Attribution: by Kalyan V Medaboina */}
            <p className="mt-2 text-xs sm:text-sm font-mono uppercase tracking-widest text-palnadu-warning/90 font-medium">
              {DIWALI_2026_CAMPAIGN.attribution}
            </p>
          </div>

          {/* Grand Festive Greeting & Message */}
          <div className="mt-5 sm:mt-7 flex flex-col items-center max-w-xl mx-auto">
            {/* Radiant Happy Diwali Greeting */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center">
              <span className="text-palnadu-warning">
                {DIWALI_2026_CAMPAIGN.greeting}
              </span>
            </h1>

            {/* Inspiring Festive Message */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-base text-palnadu-off-white max-w-lg mx-auto leading-relaxed font-normal">
              {DIWALI_2026_CAMPAIGN.supportingMessage}
            </p>

            {/* Brand Signature */}
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-palnadu-warning font-semibold uppercase">
              {DIWALI_2026_CAMPAIGN.brandSignature}
            </p>

            {/* Single Prominent Enter Website Golden Button (Primary CTA) */}
            <button
              type="button"
              onClick={handleEnterWebsite}
              className="mt-6 sm:mt-8 px-7 sm:px-9 py-3 sm:py-3.5 text-sm sm:text-base font-bold tracking-wide rounded-md bg-palnadu-warning hover:bg-palnadu-warning/90 text-palnadu-dark shadow-lg shadow-palnadu-warning/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-white/20 select-none"
              aria-label="Enter Palnadu.dev website"
            >
              <span>Enter Website</span>
              <span aria-hidden="true" className="text-base sm:text-lg">→</span>
            </button>
          </div>
        </main>

        {/* Footer Area with Anaar Flower-Pot Crackers & Glowing Clay Diyas */}
        <footer className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-4 sm:pb-6 flex items-end justify-between">
          {/* Bottom-Left: Anaar Cracker Base + Diya */}
          <div className="flex items-end gap-3 sm:gap-6">
            <AnaarCone className="-mb-1 sm:mb-0" />
            <div className="hidden sm:block">
              <Diya size="md" />
            </div>
          </div>

          {/* Center Brand Note */}
          <div className="text-center px-2 pb-2 flex flex-col items-center">
            <div className="block sm:hidden mb-2">
              <Diya size="sm" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-palnadu-off-white/70">
              Happy Diwali 2026
            </span>
            <span className="text-xs font-mono text-palnadu-warning/80 mt-0.5">
              Palnadu.dev Special
            </span>
          </div>

          {/* Bottom-Right: Diya + Anaar Cracker Base */}
          <div className="flex items-end gap-3 sm:gap-6">
            <div className="hidden sm:block">
              <Diya size="md" />
            </div>
            <AnaarCone className="-mb-1 sm:mb-0" />
          </div>
        </footer>
      </aside>
    </>
  );

  return createPortal(content, document.body);
}

export default DiwaliIntro;
