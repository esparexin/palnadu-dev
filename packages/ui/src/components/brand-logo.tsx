'use client';

import React from 'react';
import { imagePresets, isCloudinaryUrl } from '@palnadu/config';
import { cn } from '../lib/utils';

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
    md: { icon: 'h-8 w-8 text-sm', text: 'text-xl', imgHeight: 46 },
    lg: { icon: 'h-10 w-10 text-base', text: 'text-2xl', imgHeight: 56 },
  }[size];

  // 1. Determine active logo (custom configured or official first-party asset)
  const fallbackLogo = isWhite ? '/palnadu-logo-white.png' : '/palnadu-logo-horizontal.png';
  const effectiveLogoUrl = customLogoUrl || fallbackLogo;
  const optimizedLogo = isCloudinaryUrl(effectiveLogoUrl)
    ? imagePresets.logo(effectiveLogoUrl)
    : effectiveLogoUrl;

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
        <span className="text-xs font-mono text-palnadu-secondary uppercase tracking-widest">
          {subtitle}
        </span>
      )}
    </div>
  );
}
