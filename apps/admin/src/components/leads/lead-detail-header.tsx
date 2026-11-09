import type { Lead } from '@palnadu/types';
import { Mail, Phone, MessageSquare, Building, UserCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { statusColors } from './types';

interface LeadDetailHeaderProps {
  lead: Lead;
  convertedSuccess: boolean;
  converting: boolean;
  onConvertToClient: () => void;
}

export function LeadDetailHeader({
  lead,
  convertedSuccess,
  converting,
  onConvertToClient,
}: LeadDetailHeaderProps) {
  const rawPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-palnadu-border bg-white shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-palnadu-dark">{lead.name}</h1>
            <span
              className={cn(
                'rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                statusColors[lead.status],
              )}
            >
              {lead.status.replace(/_/g, ' ')}
            </span>
          </div>
          {lead.company && (
            <p className="text-xs text-palnadu-secondary font-medium flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span>{lead.company}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 font-semibold text-xs h-8">
            <a
              href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: Your Project Inquiry - Palnadu.dev`)}`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Reply via Email</span>
            </a>
          </Button>

          {rawPhone && (
            <Button asChild variant="secondary" size="sm" className="gap-1.5 font-semibold text-xs h-8">
              <a href={`https://wa.me/${rawPhone}`} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </Button>
          )}

          {lead.phone && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 font-semibold text-xs h-8">
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-3.5 w-3.5" />
                <span>Call</span>
              </a>
            </Button>
          )}

          {!convertedSuccess && lead.status !== 'WON' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConvertToClient}
              disabled={converting}
              className="gap-1.5 font-semibold text-xs h-8 border-palnadu-blue/30 text-palnadu-blue hover:bg-palnadu-light-blue"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{converting ? 'Converting...' : 'Convert to Client'}</span>
            </Button>
          )}
        </div>
      </div>

      {convertedSuccess && (
        <div className="p-3.5 rounded-lg bg-palnadu-teal/10 border border-palnadu-teal/20 text-palnadu-teal text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-palnadu-teal shrink-0" />
          <span>Lead successfully converted into an active Client record in the database!</span>
        </div>
      )}
    </div>
  );
}
