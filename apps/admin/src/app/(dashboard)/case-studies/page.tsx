'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CaseStudy } from '@palnadu/types';
import { cn } from '@/lib/utils';

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.caseStudies
      .list()
      .then((res: any) => setStudies(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Case Studies</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Manage portfolio projects and verified case studies.</p>
        </div>
      </div>

      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-palnadu-secondary">
                    Loading case studies...
                  </td>
                </tr>
              ) : studies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-palnadu-secondary">
                    No case studies yet. Verified client results will appear here once added.
                  </td>
                </tr>
              ) : (
                studies.map((study) => (
                  <tr key={study.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-palnadu-dark">{study.title}</td>
                    <td className="px-4 py-3 text-palnadu-secondary font-mono text-[11px]">/{study.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          study.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {study.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-palnadu-secondary">
                      {new Date(study.updatedAt).toLocaleDateString()}
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
