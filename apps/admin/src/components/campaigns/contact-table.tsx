'use client';

import { Globe, Building } from 'lucide-react';
import type { MarketingContactItem } from './types';

interface ContactTableProps {
  contacts: MarketingContactItem[];
  loading: boolean;
}

export function ContactTable({ contacts, loading }: ContactTableProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-palnadu-border bg-palnadu-white">
        <span className="text-xs text-palnadu-secondary">Loading business contacts...</span>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-palnadu-border bg-palnadu-white">
        <p className="text-xs font-medium text-palnadu-dark">No contacts found</p>
        <p className="mt-1 text-xs text-palnadu-secondary">Import regional business contacts to target with campaigns.</p>
      </div>
    );
  }

  const getOptInBadge = (status: MarketingContactItem['optInStatus']) => {
    switch (status) {
      case 'OPTED_IN':
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-teal">Opted In</span>;
      case 'OPTED_OUT':
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-error">Opted Out</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-secondary">Unverified</span>;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-palnadu-border bg-palnadu-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-palnadu-border bg-palnadu-off-white text-palnadu-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Business Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Web Presence</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palnadu-border">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-palnadu-off-white/40">
                <td className="px-4 py-3 font-medium text-palnadu-dark">
                  <div>{c.businessName}</div>
                  {c.contactName && <div className="text-xs text-palnadu-secondary">{c.contactName}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-palnadu-body">{c.phone}</td>
                <td className="px-4 py-3 text-palnadu-body">{c.city || 'Palnadu'}</td>
                <td className="px-4 py-3 text-palnadu-secondary">{c.category || 'Retail/Business'}</td>
                <td className="px-4 py-3">
                  {c.hasWebsite ? (
                    <span className="inline-flex items-center gap-1 text-palnadu-secondary">
                      <Globe className="h-3.5 w-3.5" />
                      <span>Has Website</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-palnadu-light-blue px-2 py-0.5 font-medium text-palnadu-blue">
                      <Building className="h-3.5 w-3.5" />
                      <span>No Website</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{getOptInBadge(c.optInStatus)}</div>
                  {c.optOutReason && (
                    <div className="mt-0.5 text-xs text-palnadu-secondary">{c.optOutReason}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
