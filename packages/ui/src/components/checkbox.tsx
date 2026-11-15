import * as React from 'react';
import { cn } from '../lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        disabled={disabled}
        className={cn(
          'h-4 w-4 rounded border border-palnadu-border bg-palnadu-white text-palnadu-teal focus:ring-2 focus:ring-palnadu-teal focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer accent-palnadu-teal transition-colors',
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = 'Checkbox';
