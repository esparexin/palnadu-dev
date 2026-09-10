'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Called when the user confirms or cancels */
  onConfirm: () => void;
  onCancel: () => void;
  /** Dialog title */
  title?: string;
  /** Main descriptive message */
  message: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Visual variant — 'danger' shows red confirm button */
  variant?: 'danger' | 'default';
  /** Whether the confirm action is in progress */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus cancel on open, trap Escape key
  useEffect(() => {
    if (!open) return;

    // Focus confirm button when dialog opens
    confirmRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog Panel */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-sm rounded-xl border border-palnadu-border bg-white shadow-2xl overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          <div
            className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-50 text-red-600'
                : 'bg-palnadu-light-blue text-palnadu-blue'
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>

          <div className="flex-1 min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-sm font-bold text-palnadu-dark leading-tight"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-1 text-xs text-palnadu-secondary leading-relaxed"
            >
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="rounded-md p-1 text-palnadu-secondary hover:text-palnadu-dark transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-palnadu-border/60 bg-palnadu-off-white/40">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-2 rounded-md text-xs font-semibold text-palnadu-dark bg-white border border-palnadu-border hover:bg-palnadu-off-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-palnadu-blue hover:bg-[#12487e]'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
