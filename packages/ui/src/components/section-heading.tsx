import * as React from 'react';
import { cn } from '../lib/utils';

export interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  label,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl space-y-2',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {label && (
        <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
          {label}
        </p>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-palnadu-dark text-balance leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-palnadu-body leading-relaxed text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
