'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UserPlus, Users, FolderKanban, FileText } from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeProjects: number;
  totalClients: number;
  publishedArticles: number;
}

const defaultStats: DashboardStats = {
  totalLeads: 0,
  newLeads: 0,
  activeProjects: 0,
  totalClients: 0,
  publishedArticles: 0,
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
    { title: 'Total Leads', value: stats.totalLeads, icon: UserPlus, color: 'text-blue-600' },
    { title: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-green-600' },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderKanban,
      color: 'text-purple-600',
    },
    { title: 'Clients', value: stats.totalClients, icon: Users, color: 'text-orange-600' },
    {
      title: 'Published Articles',
      value: stats.publishedArticles,
      icon: FileText,
      color: 'text-teal-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {loading ? '—' : card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">
          Recent leads and activity will appear here once the system is connected.
        </p>
      </div>
    </div>
  );
}
