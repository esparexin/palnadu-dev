'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Lead } from '@palnadu/types';
import { Mail, Phone, MessageSquare, ArrowRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DISCOVERY: 'bg-purple-100 text-purple-800 border-purple-200',
  PROPOSAL: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  NEGOTIATION: 'bg-orange-100 text-orange-800 border-orange-200',
  WON: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LOST: 'bg-red-100 text-red-800 border-red-200',
  NOT_QUALIFIED: 'bg-gray-100 text-gray-800 border-gray-200',
  ON_HOLD: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    api.leads
      .list(params)
      .then((res: any) => setLeads(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
  const inPipelineCount = leads.filter((l) => ['CONTACTED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION'].includes(l.status)).length;
  const wonCount = leads.filter((l) => l.status === 'WON').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Leads & Inquiries</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Manage inbound project inquiries, client pipelines, and contact submissions.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-palnadu-secondary uppercase tracking-wider">Total Leads</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading ? '—' : totalLeads}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">New / Unread</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{loading ? '—' : newLeadsCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">In Pipeline</p>
          <p className="text-xl font-bold text-purple-700 mt-1">{loading ? '—' : inPipelineCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Won / Converted</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{loading ? '—' : wonCount}</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-palnadu-secondary" />
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-palnadu-border bg-white pl-9 pr-3 py-1.5 text-xs text-palnadu-dark placeholder:text-palnadu-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusColors).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="text-xs text-palnadu-secondary hover:text-palnadu-dark font-medium px-2 py-1 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Detailed Leads Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
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
                    <tr key={lead.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors">
                      {/* Name & Company */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-palnadu-dark hover:text-palnadu-blue transition-colors text-xs flex items-center gap-1.5"
                        >
                          <span>{lead.name}</span>
                        </Link>
                        {lead.company ? (
                          <span className="inline-block mt-0.5 text-[10px] text-palnadu-secondary font-medium">
                            {lead.company}
                          </span>
                        ) : (
                          <span className="text-[10px] text-palnadu-secondary/60 italic">Individual</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3 space-y-1">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-palnadu-body hover:text-palnadu-blue flex items-center gap-1 font-mono text-[11px]"
                          title="Click to email"
                        >
                          <Mail className="h-3 w-3 text-palnadu-secondary shrink-0" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </a>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-[11px]">
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
                                className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium text-[10px]"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="h-2.5 w-2.5" />
                                <span>WA</span>
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Requirement & Stage */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-palnadu-dark">
                          {lead.requiredHelp ? lead.requiredHelp.replace(/_/g, ' ') : 'General'}
                        </div>
                        <span className="text-[10px] text-palnadu-secondary">
                          Stage: {lead.projectStage ? lead.projectStage.replace(/_/g, ' ') : 'Just an idea'}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3">
                        {lead.budget ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-[10px] font-semibold text-palnadu-dark">
                            {lead.budget}
                          </span>
                        ) : (
                          <span className="text-palnadu-secondary/60 italic text-[11px]">Not specified</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            statusColors[lead.status] || 'bg-gray-100 text-gray-800 border-gray-200',
                          )}
                        >
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-palnadu-secondary">
                        <div>{new Date(lead.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-palnadu-secondary/70">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
