'use client';

import { MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WhatsAppConversation } from '@palnadu/types';

interface ConversationListPanelProps {
  conversations: WhatsAppConversation[];
  selectedPhone: string | null;
  onSelectPhone: (_phone: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ConversationListPanel({
  conversations,
  selectedPhone,
  onSelectPhone,
  onRefresh,
  loading,
}: ConversationListPanelProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-palnadu-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-palnadu-teal" />
          <span className="text-xs font-bold text-palnadu-dark">Conversations ({conversations.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="h-7 w-7 p-0 cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 text-palnadu-secondary ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {conversations.length === 0 ? (
        <div className="py-8 text-center text-xs text-palnadu-secondary">No conversations yet.</div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {conversations.map((conv) => {
            const isSelected = conv.customerPhone === selectedPhone;
            const isTakeover = Boolean(conv.humanTakeover || conv.mode === 'HUMAN_TAKEOVER');

            return (
              <div
                key={conv.id}
                onClick={() => onSelectPhone(conv.customerPhone)}
                className={`flex cursor-pointer flex-col gap-1 rounded-md border p-2.5 transition-colors ${
                  isSelected
                    ? 'border-palnadu-teal bg-palnadu-off-white'
                    : 'border-palnadu-border hover:bg-palnadu-off-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-palnadu-dark">
                    {conv.customerName || conv.customerPhone}
                  </span>
                  {isTakeover ? (
                    <span className="inline-flex items-center rounded-full bg-palnadu-off-white border border-palnadu-border px-2 py-0.5 text-xs font-medium text-palnadu-secondary">
                      Human Takeover
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-palnadu-light-blue px-2 py-0.5 text-xs font-medium text-palnadu-teal">
                      Automated Assistance
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-palnadu-secondary">
                  <span>Phone: {conv.customerPhone}</span>
                  <span>State: {conv.state}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
