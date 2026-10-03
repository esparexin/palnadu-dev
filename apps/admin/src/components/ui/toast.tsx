'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast],
  );

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-up ${
              t.type === 'error'
                ? 'bg-white border-palnadu-error/30 text-palnadu-error'
                : t.type === 'success'
                ? 'bg-white border-palnadu-teal/30 text-palnadu-dark'
                : 'bg-white border-palnadu-blue/30 text-palnadu-dark'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'error' && <AlertCircle className="h-4 w-4 text-palnadu-error" />}
              {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-palnadu-teal" />}
              {t.type === 'info' && <Info className="h-4 w-4 text-palnadu-blue" />}
            </div>
            <p className="flex-1 text-xs font-medium leading-relaxed min-w-0 break-words">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-md p-0.5 text-palnadu-secondary hover:text-palnadu-dark transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
