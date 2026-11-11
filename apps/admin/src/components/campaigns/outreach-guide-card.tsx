'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OutreachGuideCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-palnadu-border bg-palnadu-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-palnadu-light-blue text-palnadu-blue">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-palnadu-dark">
              How WhatsApp Outreach Generates Local B2B Leads for Palnadu.dev
            </h2>
            <p className="text-xs text-palnadu-secondary">
              Direct connection with regional businesses in Narasaraopet, Chilakaluripet, Macherla, and Guntur without websites.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-9 gap-1.5 text-xs text-palnadu-dark"
        >
          <span>{expanded ? 'Hide Guide' : 'How it works'}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-palnadu-border pt-4 sm:grid-cols-3">
          <div className="space-y-2 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-palnadu-dark">
              <MessageSquare className="h-4 w-4 text-palnadu-teal" />
              <span>1. Why WhatsApp for Palnadu</span>
            </div>
            <p className="text-xs leading-relaxed text-palnadu-body">
              Over 90% of local retailers, mills, and traders in Palnadu check WhatsApp daily, while cold emails have less than 15% open rates. Reaching them directly on WhatsApp bridges the digital gap for businesses with no web footprint.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-palnadu-dark">
              <Send className="h-4 w-4 text-palnadu-blue" />
              <span>2. Individual vs. Bulk</span>
            </div>
            <p className="text-xs leading-relaxed text-palnadu-body">
              <strong className="text-palnadu-dark">Individual:</strong> High-touch 1:1 outreach for meetings, referrals, and warm leads with verifiable consent.
              <br />
              <strong className="text-palnadu-dark">Bulk Campaigns:</strong> Segmented, rate-limited outreach for batch directories without websites.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-palnadu-dark">
              <ShieldCheck className="h-4 w-4 text-palnadu-teal" />
              <span>3. Compliance & Opt-Outs</span>
            </div>
            <p className="text-xs leading-relaxed text-palnadu-body">
              Uses Meta-approved Business Templates only. Inbound keywords in English (<code className="font-mono text-palnadu-dark">STOP</code>) and Telugu (<code className="font-mono text-palnadu-dark">వద్దు</code>, <code className="font-mono text-palnadu-dark">ఆపండి</code>) instantly suppress the contact permanently to protect sender quality.
            </p>
          </div>

          <div className="col-span-1 rounded-lg border border-palnadu-border bg-palnadu-light-blue/40 p-3 sm:col-span-3">
            <div className="flex items-center gap-2 text-xs font-medium text-palnadu-blue">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <strong>Inbound Lead Conversion & Human Handover:</strong> When a business owner replies, an instant notification is dispatched to the Palnadu.dev team, and an automated polite response acknowledges their inquiry (24-hour cooldown per sender). Live two-way conversations are handled directly in Meta Business Suite or WhatsApp Web, while the Palnadu dashboard handles campaigns, verified 1:1 template outreach, and directory contacts.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

