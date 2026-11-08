import Link from 'next/link';
import type { Lead } from '@palnadu/types';
import { Mail, Phone, MessageSquare, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { statusColors } from './types';

interface LeadsTableProps {
  leads: Lead[];
  loading: boolean;
  onDeleteClick: (_target: { id: string; name: string }) => void;
}

export function LeadsTable({ leads, loading, onDeleteClick }: LeadsTableProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
              <th className="px-4 py-3">Lead / Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Requirement & Stage</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-palnadu-secondary">
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-palnadu-secondary">
                  No inquiries found matching current filters.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const rawPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-bold text-palnadu-dark hover:text-palnadu-blue transition-colors text-xs flex items-center gap-1.5"
                      >
                        <span>{lead.name}</span>
                      </Link>
                      {lead.company ? (
                        <span className="inline-block mt-0.5 text-xs text-palnadu-secondary font-medium">
                          {lead.company}
                        </span>
                      ) : (
                        <span className="text-xs text-palnadu-secondary/60 italic">Individual</span>
                      )}
                    </td>

                    <td className="px-4 py-3 space-y-1">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-palnadu-body hover:text-palnadu-blue flex items-center gap-1 font-mono text-xs"
                        title="Click to email"
                      >
                        <Mail className="h-3 w-3 text-palnadu-secondary shrink-0" />
                        <span className="truncate max-w-[150px]">{lead.email}</span>
                      </a>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-palnadu-body hover:text-palnadu-blue flex items-center gap-1 font-mono"
                            title="Call phone"
                          >
                            <Phone className="h-3 w-3 text-palnadu-secondary shrink-0" />
                            <span>{lead.phone}</span>
                          </a>
                          {rawPhone && (
                            <a
                              href={`https://wa.me/${rawPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-palnadu-teal hover:text-palnadu-teal-dark flex items-center gap-0.5 font-medium text-xs"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="h-2.5 w-2.5" />
                              <span>WA</span>
                            </a>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-palnadu-dark">
                        {lead.requiredHelp ? lead.requiredHelp.replace(/_/g, ' ') : 'General'}
                      </div>
                      <span className="text-xs text-palnadu-secondary">
                        Stage: {lead.projectStage ? lead.projectStage.replace(/_/g, ' ') : 'Just an idea'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {lead.budget ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-xs font-semibold text-palnadu-dark">
                          {lead.budget}
                        </span>
                      ) : (
                        <span className="text-palnadu-secondary/60 italic text-xs">Not specified</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                          statusColors[lead.status] ||
                            'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
                        )}
                      >
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-palnadu-secondary">
                      <div>{new Date(lead.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-palnadu-secondary/70">
                        {new Date(lead.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right space-x-1">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                      >
                        <span>Review</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteClick({ id: lead.id, name: lead.name })}
                        className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10 hover:text-palnadu-error"
                        title="Delete Lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
