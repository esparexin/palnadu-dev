import React from 'react';
import Image from 'next/image';
import { DIWALI_2026_CAMPAIGN } from '@/config/campaign';
import { Diya, AnaarCone, RangoliPattern } from './diwali-decorations';

interface DiwaliModalProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  overlayOpacity: number;
  onEnterWebsite: () => void;
}

export function DiwaliModal({
  canvasRef,
  overlayOpacity,
  onEnterWebsite,
}: DiwaliModalProps) {
  return (
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

      <aside
        aria-label="Palnadu.dev Happy Diwali Special Experience"
        role="region"
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black text-palnadu-off-white overflow-hidden transition-opacity duration-500 ease-in-out select-none will-change-[opacity]"
        style={{
          opacity: overlayOpacity,
          pointerEvents: overlayOpacity > 0.2 ? 'auto' : 'none',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-95"
          style={{
            background:
              'radial-gradient(circle at 50% 38%, rgba(4, 44, 83, 0.88) 0%, rgba(2, 12, 24, 0.98) 65%, rgba(0, 0, 0, 1) 100%)',
          }}
        />

        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] rounded-full bg-palnadu-warning/10 blur-3xl pointer-events-none z-0" />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 block"
          style={{
            width: '100%',
            height: '100%',
          }}
        />

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

        <main className="relative z-20 flex-1 w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center text-center my-auto">
          <div className="flex flex-col items-center">
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight select-none">
              <span className="text-palnadu-warning">Palnadu</span>
              <span className="text-white">.dev</span>
            </h2>

            <p className="mt-2 text-xs sm:text-sm font-mono uppercase tracking-widest text-palnadu-warning/90 font-medium">
              {DIWALI_2026_CAMPAIGN.attribution}
            </p>
          </div>

          <div className="mt-5 sm:mt-7 flex flex-col items-center max-w-xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center">
              <span className="text-palnadu-warning">
                {DIWALI_2026_CAMPAIGN.greeting}
              </span>
            </h1>

            <p className="mt-3 sm:mt-4 text-xs sm:text-base text-palnadu-off-white max-w-lg mx-auto leading-relaxed font-normal">
              {DIWALI_2026_CAMPAIGN.supportingMessage}
            </p>

            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-palnadu-warning font-semibold uppercase">
              {DIWALI_2026_CAMPAIGN.brandSignature}
            </p>

            <button
              type="button"
              onClick={onEnterWebsite}
              className="mt-6 sm:mt-8 px-7 sm:px-9 py-3 sm:py-3.5 text-sm sm:text-base font-bold tracking-wide rounded-md bg-palnadu-warning hover:bg-palnadu-warning/90 text-palnadu-dark shadow-lg shadow-palnadu-warning/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-white/20 select-none"
              aria-label="Enter Palnadu.dev website"
            >
              <span>Enter Website</span>
              <span aria-hidden="true" className="text-base sm:text-lg">→</span>
            </button>
          </div>
        </main>

        <footer className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-8 pb-4 sm:pb-6 flex items-end justify-between">
          <div className="flex items-end gap-3 sm:gap-6">
            <AnaarCone className="-mb-1 sm:mb-0" />
            <div className="hidden sm:block">
              <Diya size="md" />
            </div>
          </div>

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
}
