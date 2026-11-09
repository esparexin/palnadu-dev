import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface BrandingActionBarProps {
  stagedCount: number;
  saving: boolean;
  onDiscard: () => void;
  onApply: () => void;
}

export function BrandingActionBar({
  stagedCount,
  saving,
  onDiscard,
  onApply,
}: BrandingActionBarProps) {
  if (stagedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-50 animate-slide-up">
      <div className="bg-palnadu-dark text-white p-4 rounded-xl shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-palnadu-warning animate-pulse shrink-0" />
          <div>
            <p className="font-bold text-white">Unsaved Branding Changes</p>
            <p className="text-xs text-palnadu-off-white">
              {stagedCount} asset(s) staged. Apply to update Cloudinary & live channels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={saving}
            className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Discard
          </Button>
          <Button
            onClick={onApply}
            disabled={saving}
            className="flex-1 sm:flex-none gap-1.5 bg-palnadu-teal text-white hover:bg-palnadu-teal-dark shadow-md"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{saving ? 'Applying...' : 'Apply Changes'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
