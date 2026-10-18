'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { UserPlus, Users, FolderKanban, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentLead {
  id: string;
  name: string;
  email: string;
  company?: string;
  requiredHelp: string;
  status: string;
  createdAt: string;
}

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeProjects: number;
  totalClients: number;
  publishedArticles: number;
  recentLeads?: RecentLead[];
}

const defaultStats: DashboardStats = {
  totalLeads: 0,
  newLeads: 0,
  activeProjects: 0,
  totalClients: 0,
  publishedArticles: 0,
  recentLeads: [],
};

const statusColors: Record<string, string> = {
  NEW: 'bg-palnadu-blue/10 text-palnadu-blue border border-palnadu-blue/20',
  CONTACTED: 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/20',
  DISCOVERY: 'bg-palnadu-light-blue text-palnadu-blue border border-palnadu-blue/20',
  PROPOSAL: 'bg-palnadu-teal/10 text-palnadu-teal border border-palnadu-teal/20',
  NEGOTIATION: 'bg-palnadu-warning/10 text-palnadu-warning border border-palnadu-warning/20',
  WON: 'bg-palnadu-teal/15 text-palnadu-teal border border-palnadu-teal/30',
  LOST: 'bg-palnadu-error/10 text-palnadu-error border border-palnadu-error/20',
  NOT_QUALIFIED: 'bg-palnadu-off-white text-palnadu-secondary border border-palnadu-border',
  ON_HOLD: 'bg-palnadu-off-white text-palnadu-secondary border border-palnadu-border',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard
      .stats()
      .then((res: any) => setStats(res.data || defaultStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total Leads', value: stats.totalLeads, icon: UserPlus, color: 'text-palnadu-blue' },
    { title: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-palnadu-teal' },
    { title: 'Active Projects', value: stats.activeProjects, icon: FolderKanban, color: 'text-palnadu-teal' },
    { title: 'Clients', value: stats.totalClients, icon: Users, color: 'text-palnadu-warning' },
    { title: 'Published Articles', value: stats.publishedArticles, icon: FileText, color: 'text-palnadu-blue' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Dashboard</h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">Overview of active business metrics and pipeline.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-lg border border-palnadu-border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">{card.title}</p>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-palnadu-dark">
                {loading ? '—' : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Recent Inquiries / Leads */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-palnadu-border bg-palnadu-off-white/40">
          <div>
            <h2 className="text-sm font-bold text-palnadu-dark">Recent Inquiries</h2>
            <p className="text-xs text-palnadu-secondary">Latest leads submitted via website.</p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-semibold text-palnadu-blue hover:underline inline-flex items-center gap-1"
          >
            <span>View all leads</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Service Interest</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-palnadu-secondary">
                    Loading inquiries...
                  </td>
                </tr>
              ) : !stats.recentLeads || stats.recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-palnadu-secondary">
                    No leads received yet.
                  </td>
                </tr>
              ) : (
                stats.recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-palnadu-dark">
                      {lead.name}
                      {lead.company && (
                        <span className="block text-xs font-normal text-palnadu-secondary">
                          {lead.company}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-palnadu-body font-mono text-xs">{lead.email}</td>
                    <td className="px-4 py-3 text-palnadu-body">
                      {lead.requiredHelp.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                          statusColors[lead.status] || 'bg-palnadu-off-white text-palnadu-secondary border border-palnadu-border'
                        )}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-palnadu-secondary">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-palnadu-blue font-semibold hover:underline text-xs"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
