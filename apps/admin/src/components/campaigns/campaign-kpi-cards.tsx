'use client';

import { MessageSquare, Send, CheckCircle2, Eye, Building2, UserX } from 'lucide-react';
import type { WhatsAppStats } from './types';

interface CampaignKpiCardsProps {
  stats: WhatsAppStats | null;
}

export function CampaignKpiCards({ stats }: CampaignKpiCardsProps) {
  const cards = [
    {
      title: 'Total Campaigns',
      value: stats ? stats.totalCampaigns.toLocaleString() : '0',
      icon: MessageSquare,
      subtitle: 'Active & Completed',
    },
    {
      title: 'Messages Sent',
      value: stats ? stats.totalSent.toLocaleString() : '0',
      icon: Send,
      subtitle: 'Outbound Templates',
    },
    {
      title: 'Delivered',
      value: stats ? stats.totalDelivered.toLocaleString() : '0',
      icon: CheckCircle2,
      subtitle: stats && stats.totalSent > 0 ? `${Math.round((stats.totalDelivered / stats.totalSent) * 100)}% delivery rate` : '0% delivery rate',
    },
    {
      title: 'Read Rate',
      value: stats ? stats.totalRead.toLocaleString() : '0',
      icon: Eye,
      subtitle: stats && stats.totalDelivered > 0 ? `${Math.round((stats.totalRead / stats.totalDelivered) * 100)}% read rate` : '0% read rate',
    },
    {
      title: 'No Website Contacts',
      value: stats ? stats.withoutWebsite.toLocaleString() : '0',
      icon: Building2,
      subtitle: stats ? `of ${stats.totalContacts} total contacts` : '0 total contacts',
    },
    {
      title: 'Opt-Outs Suppressed',
      value: stats ? stats.optedOut.toLocaleString() : '0',
      icon: UserX,
      subtitle: 'Permanently suppressed',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-lg border border-palnadu-border bg-palnadu-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-palnadu-secondary">{card.title}</span>
              <Icon className="h-4 w-4 text-palnadu-teal" />
            </div>
            <div className="mt-2 text-xl font-bold text-palnadu-dark">{card.value}</div>
            <div className="mt-1 text-xs text-palnadu-body">{card.subtitle}</div>
          </div>
        );
      })}
    </div>
  );
}
