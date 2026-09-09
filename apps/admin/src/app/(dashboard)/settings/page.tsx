'use client';

import { siteConfig } from '@palnadu/config';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Settings</h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">Platform configuration and system parameters.</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {/* General Identity Card */}
        <div className="rounded-lg border border-palnadu-border bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-palnadu-dark mb-1">Company Identity</h2>
          <p className="text-xs text-palnadu-secondary mb-4">
            System identification parameters configured in the centralized monorepo config.
          </p>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Company Name:</span>
              <span className="font-bold text-palnadu-dark">{siteConfig.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Public Contact Email:</span>
              <span className="font-mono text-palnadu-blue font-semibold">{siteConfig.contact.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Production Website:</span>
              <a href={siteConfig.url} target="_blank" rel="noopener noreferrer" className="text-palnadu-blue hover:underline font-mono">
                {siteConfig.url}
              </a>
            </div>
          </div>
        </div>

        {/* System & Architecture */}
        <div className="rounded-lg border border-palnadu-border bg-white p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-palnadu-dark mb-1">Architecture & Infrastructure</h2>
          <p className="text-xs text-palnadu-secondary mb-4">
            Runtime configurations and database connection state.
          </p>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">Database:</span>
              <span className="font-mono text-palnadu-dark font-semibold">MongoDB Atlas (Prisma ORM)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-palnadu-border/60">
              <span className="text-palnadu-secondary font-medium">REST API Endpoint:</span>
              <span className="font-mono text-palnadu-blue font-semibold">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-palnadu-secondary font-medium">Security Guard:</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                JWT Auth + Helmet Protection Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
