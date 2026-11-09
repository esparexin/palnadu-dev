import React from 'react';

export function Diya({
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
      <div className="absolute -top-7 w-24 h-24 rounded-full bg-palnadu-warning/25 blur-xl animate-pulse" />

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

export function AnaarCone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="absolute -top-3 w-10 h-10 rounded-full bg-palnadu-warning/35 blur-md animate-pulse" />

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

        <path
          d="M36 10 L44 10 L70 82 C70 86, 10 86, 10 82 Z"
          fill="url(#anaarBodyGrad)"
        />

        <path d="M28 32 L52 32 L56 42 L24 42 Z" fill="url(#anaarFoilGrad)" opacity="0.95" />
        <path d="M20 54 L60 54 L64 64 L16 64 Z" fill="url(#anaarFoilGrad)" opacity="0.95" />

        <ellipse cx="40" cy="10" rx="5.5" ry="2.5" fill="#FDE68A" stroke="#78350F" strokeWidth="1" />
        <ellipse cx="40" cy="82" rx="30" ry="4" fill="#451A03" />
      </svg>
    </div>
  );
}

export function RangoliPattern({ className = '' }: { className?: string }) {
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
