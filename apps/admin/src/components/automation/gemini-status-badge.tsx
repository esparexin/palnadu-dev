import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function GeminiStatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  let colorCls = 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border';
  let Icon = HelpCircle;

  switch (status) {
    case 'Verified':
    case 'VERIFIED':
    case 'Active':
    case 'Granted':
    case 'AUTHENTICATED':
      colorCls = 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30';
      Icon = CheckCircle2;
      break;
    case 'Partially Verified':
    case 'PARTIALLY_VERIFIED':
    case 'Inferred':
    case 'Fallback Succeeded':
      colorCls = 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/30';
      Icon = AlertTriangle;
      break;
    case 'Model Overloaded':
    case 'MODEL_OVERLOADED':
    case 'Temporary Provider Error':
    case 'TEMPORARY_PROVIDER_ERROR':
    case 'TEMPORARY_ERROR':
    case 'Pending Verification':
    case 'PENDING_VERIFICATION':
    case 'Quota Exceeded':
    case 'QUOTA_EXCEEDED':
      colorCls = 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30';
      Icon = Clock;
      break;
    case 'Invalid Key':
    case 'INVALID_API_KEY':
    case 'INVALID_KEY':
    case 'Verification Failed':
    case 'Unavailable':
    case 'Model Access Denied':
    case 'MODEL_ACCESS_DENIED':
      colorCls = 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/30';
      Icon = XCircle;
      break;
    case 'Permission Denied':
    case 'PERMISSION_DENIED':
    case 'Billing Restricted':
    case 'Denied':
    case 'Restricted':
      colorCls = 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30';
      Icon = ShieldAlert;
      break;
    case 'Project Not Identified':
    case 'Account Identity Unavailable':
    case 'UNVERIFIED':
    case 'Not Configured':
      colorCls = 'bg-palnadu-off-white text-palnadu-body border-palnadu-border';
      Icon = HelpCircle;
      break;
  }

  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium border tracking-wide',
        colorCls,
        sizeCls,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}
