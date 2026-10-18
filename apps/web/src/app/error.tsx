'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime client/server errors for observability
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="bg-white min-h-[65vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        {/* Error Icon */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 border border-red-200 mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>

        {/* Messaging */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while loading this view. We have been notified and are looking into it.
          </p>
        </div>

        {/* Digest reference if available */}
        {error.digest && (
          <div className="p-2 rounded-md bg-palnadu-off-white border border-palnadu-border text-[10px] font-mono text-palnadu-secondary">
            <span>Reference ID: {error.digest}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-palnadu-blue text-white hover:bg-palnadu-dark-hover font-semibold text-xs h-9 px-4 gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-palnadu-border text-palnadu-dark hover:bg-palnadu-off-white font-semibold text-xs h-9 px-4 gap-2"
          >
            <Link href="/">
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
