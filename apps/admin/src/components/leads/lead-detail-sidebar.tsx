import type { Lead } from '@palnadu/types';
import { Layers, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { allLeadStatuses } from './types';

interface LeadDetailSidebarProps {
  lead: Lead;
  saving: boolean;
  onUpdateStatus: (_status: string) => void;
  onDeleteClick: () => void;
}

export function LeadDetailSidebar({
  lead,
  saving,
  onUpdateStatus,
  onDeleteClick,
}: LeadDetailSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-dark mb-4">
          Lead Parameters
        </h3>
        <dl className="space-y-3.5 text-xs">
          <div>
            <dt className="text-palnadu-secondary font-medium">Email Address</dt>
            <dd className="mt-0.5">
              <a
                href={`mailto:${lead.email}`}
                className="text-palnadu-blue font-mono font-semibold hover:underline"
              >
                {lead.email}
              </a>
            </dd>
          </div>

          {lead.phone && (
            <div>
              <dt className="text-palnadu-secondary font-medium">Phone / WhatsApp</dt>
              <dd className="mt-0.5 font-mono text-palnadu-dark font-semibold">{lead.phone}</dd>
            </div>
          )}

          <div>
            <dt className="text-palnadu-secondary font-medium">Required Service</dt>
            <dd className="mt-0.5 font-semibold text-palnadu-dark flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-palnadu-blue" />
              <span>{lead.requiredHelp ? lead.requiredHelp.replace(/_/g, ' ') : 'General'}</span>
            </dd>
          </div>

          <div>
            <dt className="text-palnadu-secondary font-medium">Project Stage</dt>
            <dd className="mt-0.5 font-semibold text-palnadu-dark">
              {lead.projectStage ? lead.projectStage.replace(/_/g, ' ') : 'Just an idea'}
            </dd>
          </div>

          {lead.budget && (
            <div>
              <dt className="text-palnadu-secondary font-medium">Budget Estimate</dt>
              <dd className="mt-0.5 font-semibold text-palnadu-dark flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-palnadu-teal" />
                <span>{lead.budget}</span>
              </dd>
            </div>
          )}

          <div>
            <dt className="text-palnadu-secondary font-medium">Submission Timestamp</dt>
            <dd className="mt-0.5 text-palnadu-body flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-palnadu-secondary" />
              <span>{new Date(lead.createdAt).toLocaleString()}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-dark mb-3">
          Update Pipeline Status
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {allLeadStatuses.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={lead.status === status ? 'default' : 'outline'}
              onClick={() => onUpdateStatus(status)}
              disabled={saving}
              className="h-7 px-2.5 text-xs font-semibold"
            >
              {status.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-palnadu-error/20 bg-palnadu-error/5 p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-error mb-1">
          Delete Lead
        </h3>
        <p className="text-xs text-palnadu-secondary mb-3">
          Permanently purge spam or duplicate inquiries from the database.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteClick}
          className="gap-1.5 text-xs h-8"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Inquiry</span>
        </Button>
      </div>
    </div>
  );
}
