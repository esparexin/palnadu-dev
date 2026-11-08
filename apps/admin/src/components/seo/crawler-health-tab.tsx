'use client';

import { AlertTriangle, Lightbulb } from 'lucide-react';
import { AuditData } from './types';

interface CrawlerHealthTabProps {
  audit: AuditData | null;
}

export function CrawlerHealthTab({ audit }: CrawlerHealthTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-palnadu-dark">Internal Technical Audit Results</h2>
            <p className="text-xs text-palnadu-secondary">
              Automated weekly audit replacing Screaming Frog. Evaluates canonicals, metadata, and routing.
            </p>
          </div>
          {audit?.createdAt && (
            <span className="text-xs text-palnadu-secondary">
              Last Crawled: {new Date(audit.createdAt).toLocaleString()}
            </span>
          )}
        </div>

        {audit?.issues && audit.issues.length > 0 ? (
          <div className="space-y-2.5">
            {audit.issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 flex items-start gap-3"
              >
                {issue.severity === 'CRITICAL' ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                ) : issue.severity === 'WARNING' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-palnadu-dark">{issue.message}</span>
                    <span className="text-xs font-mono text-palnadu-secondary">{issue.url}</span>
                  </div>
                  <p className="text-xs text-palnadu-body">{issue.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-palnadu-secondary">
            No critical issues detected. All audited pages conform to technical SEO and canonical routing standards.
          </div>
        )}
      </div>
    </div>
  );
}
