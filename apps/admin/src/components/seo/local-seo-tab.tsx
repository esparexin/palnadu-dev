'use client';

import { MapPin } from 'lucide-react';
import { LOCAL_CITATIONS, LOCAL_TARGETS } from './types';

export function LocalSeoTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-palnadu-dark flex items-center gap-2">
              <MapPin className="h-4 w-4 text-palnadu-teal" />
              <span>Macherla & Regional Andhra Pradesh Target Keywords</span>
            </h2>
            <p className="text-xs text-palnadu-secondary">Priority search terms targeted in local landing pages and structured data.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-palnadu-off-white text-palnadu-secondary uppercase text-xs">
              <tr>
                <th className="px-4 py-2.5">Target Keyword</th>
                <th className="px-4 py-2.5">Location Hub</th>
                <th className="px-4 py-2.5">Search Intent</th>
                <th className="px-4 py-2.5">Target Page</th>
                <th className="px-4 py-2.5">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-palnadu-border">
              {LOCAL_TARGETS.map((target, idx) => (
                <tr key={idx} className="hover:bg-palnadu-off-white/50">
                  <td className="px-4 py-3 font-semibold text-palnadu-dark">{target.keyword}</td>
                  <td className="px-4 py-3 text-palnadu-secondary">{target.location}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-palnadu-light-blue text-palnadu-blue font-medium">
                      {target.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-palnadu-blue">{target.targetUrl}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-palnadu-teal/10 text-palnadu-teal-dark">
                      {target.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citations Tracker */}
      <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
        <h2 className="text-sm font-bold text-palnadu-dark">Local Citation & Business Directory Consistency</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LOCAL_CITATIONS.map((cit, idx) => (
            <div key={idx} className="rounded-md border border-palnadu-border p-3.5 space-y-1.5 bg-palnadu-off-white/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-palnadu-dark">{cit.directory}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                  {cit.status}
                </span>
              </div>
              <p className="text-xs text-palnadu-secondary">Scope: {cit.location}</p>
              <p className="text-xs text-palnadu-body font-mono text-xs">{cit.target}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
