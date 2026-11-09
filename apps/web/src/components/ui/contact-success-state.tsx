import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactSuccessStateProps {
  onReset: () => void;
}

export function ContactSuccessState({ onReset }: ContactSuccessStateProps) {
  return (
    <div className="py-10 text-center space-y-3 animate-fade-in">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-palnadu-light-blue text-palnadu-teal mx-auto">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <h3 className="text-xl font-bold text-palnadu-dark">Message Received</h3>
      <p className="text-xs text-palnadu-body max-w-xs mx-auto leading-relaxed">
        Thank you. We have received your inquiry and will reply with honest engineering advice within one business day.
      </p>
      <div className="pt-2">
        <Button
          onClick={onReset}
          variant="outline"
          className="border-palnadu-blue text-palnadu-blue hover:bg-palnadu-light-blue rounded-md text-xs px-4 h-8"
        >
          Send another message
        </Button>
      </div>
    </div>
  );
}
