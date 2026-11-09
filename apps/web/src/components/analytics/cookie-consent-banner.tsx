'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  getStoredConsentPreferences,
  applyConsentUpdate,
  GRANTED_CONSENT_SETTINGS,
  DEFAULT_CONSENT_SETTINGS,
} from '@/lib/analytics';
import { ShieldCheck } from 'lucide-react';

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getStoredConsentPreferences();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  if (!mounted || !visible) {
    return null;
  }

  const handleAcceptAll = () => {
    applyConsentUpdate(GRANTED_CONSENT_SETTINGS);
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    applyConsentUpdate(DEFAULT_CONSENT_SETTINGS);
    setVisible(false);
  };

  return (
    <aside
      aria-label="Privacy and Cookie Preferences"
      className="fixed bottom-4 inset-x-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-fade-in"
    >
      <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-lg space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-blue">
              Privacy & Measurement
            </h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              We use privacy-respecting analytics to measure traffic, understand referral sources, and optimize our digital engineering platforms.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <Link
            href="/privacy"
            className="text-palnadu-secondary hover:text-palnadu-dark underline transition-colors"
          >
            Review Privacy Policy
          </Link>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEssentialOnly}
              className="text-xs h-8 px-3 border-palnadu-border text-palnadu-dark hover:bg-palnadu-off-white"
            >
              Essential Only
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAcceptAll}
              className="text-xs h-8 px-4 bg-palnadu-blue text-white hover:bg-palnadu-dark-hover shadow-sm"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

