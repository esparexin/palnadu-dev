'use client';

import React from 'react';
import { imagePresets } from '@palnadu/config';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  customLogoUrl?: string | null;
  variant?: 'default' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export function BrandLogo({
  customLogoUrl,
  variant = 'default',
  className,
  size = 'md',
  subtitle,
}: BrandLogoProps) {
  const isWhite = variant === 'white';

  const sizeClasses = {
    sm: { icon: 'h-7 w-7 text-xs', text: 'text-base', imgHeight: 32 },
    md: { icon: 'h-8 w-8 text-sm', text: 'text-lg', imgHeight: 46 },
    lg: { icon: 'h-10 w-10 text-base', text: 'text-2xl', imgHeight: 56 },
  }[size];

  // 1. If custom logo is configured and active, render optimized image
  if (customLogoUrl) {
    const optimizedLogo = customLogoUrl.includes('res.cloudinary.com')
      ? imagePresets.logo(customLogoUrl)
      : customLogoUrl;

    return (
      <div className={cn('flex items-center gap-2.5', className)}>
        <div className="relative flex items-center">
          <img
            src={optimizedLogo}
            alt="Palnadu.dev Logo"
            className="h-9 sm:h-11 w-auto object-contain transition-all"
            style={{ maxHeight: `${sizeClasses.imgHeight}px` }}
          />
        </div>
        {subtitle && (
          <span className="text-[10px] font-mono text-palnadu-secondary uppercase tracking-widest">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // 2. Default Fallback: Pure Typographic Brandmark (Zero layout shift, 100% vector crispness)
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'rounded-lg flex items-center justify-center font-black shadow-xs shrink-0 select-none transition-colors',
          sizeClasses.icon,
          isWhite
            ? 'bg-white/10 border border-white/20 text-white'
            : 'bg-palnadu-dark text-white'
        )}
      >
        P<span className="text-palnadu-teal">.</span>
      </div>

      <div className="flex flex-col">
        <span
          className={cn(
            'font-extrabold tracking-tight leading-none',
            sizeClasses.text,
            isWhite ? 'text-white' : 'text-palnadu-dark'
          )}
        >
          Palnadu
          <span className={isWhite ? 'text-palnadu-teal font-bold' : 'text-palnadu-blue font-bold'}>
            .dev
          </span>
        </span>
        {subtitle && (
          <span className="text-[10px] font-mono text-palnadu-secondary uppercase tracking-widest mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
