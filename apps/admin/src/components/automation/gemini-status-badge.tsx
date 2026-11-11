import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeminiVerificationStatus, ProjectVerificationStatus } from './types';

interface StatusBadgeProps {
  status: GeminiVerificationStatus | ProjectVerificationStatus | string;
  size?: 'sm' | 'md';
}

export function GeminiStatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  let colorCls = 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border';
  let Icon = HelpCircle;

  switch (status) {
    case 'Verified':
    case 'Active':
    case 'Granted':
      colorCls = 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30';
      Icon = CheckCircle2;
      break;
    case 'Partially Verified':
    case 'Inferred':
      colorCls = 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/30';
      Icon = AlertTriangle;
      break;
    case 'Invalid Key':
    case 'Verification Failed':
    case 'Unavailable':
      colorCls = 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/30';
      Icon = XCircle;
      break;
    case 'Permission Denied':
    case 'Quota Exceeded':
    case 'Billing Restricted':
    case 'Denied':
      colorCls = 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30';
      Icon = ShieldAlert;
      break;
    case 'Project Not Identified':
    case 'Account Identity Unavailable':
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

