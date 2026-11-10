import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactSuccessStateProps {
  onReset: () => void;
}

export function ContactSuccessState({ onReset }: ContactSuccessStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="py-12 sm:py-16 text-center space-y-4 animate-fade-in motion-reduce:animate-none"
    >
      <div className="relative inline-flex items-center justify-center mx-auto">
        {/* One-time expanding ripple ring */}
        <span
          className="absolute inset-0 rounded-full bg-palnadu-teal/30 animate-success-ring motion-reduce:hidden"
          aria-hidden="true"
        />
        {/* Badge with one-time scale pop */}
        <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/30 shadow-sm animate-success-pop motion-reduce:animate-none">
          <CheckCircle2 className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-xl sm:text-2xl font-extrabold text-palnadu-dark tracking-tight">
          Message Received
        </h3>
        <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
          Thank you. We have received your inquiry and will reply with honest engineering advice within one business day.
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          onClick={onReset}
          variant="outline"
          className="border-palnadu-blue text-palnadu-blue hover:bg-palnadu-light-blue rounded-md text-xs px-5 h-9 font-medium"
        >
          Send another message
        </Button>
      </div>
    </div>
  );
}

