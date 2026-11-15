'use client';

import { useState } from 'react';
import { Phone, Bot, UserCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { WhatsAppConversation, WhatsAppMessage } from '@palnadu/types';

interface ConversationChatPanelProps {
  activeConv: WhatsAppConversation;
  selectedPhone: string;
  messages: WhatsAppMessage[];
  chatLoading: boolean;
  onToggleTakeover: (_conv: WhatsAppConversation, _nextState: boolean) => Promise<void>;
  onSendReply: (_text: string) => Promise<void>;
  isTogglingTakeover: boolean;
  sendingReply: boolean;
}

export function ConversationChatPanel({
  activeConv,
  selectedPhone,
  messages,
  chatLoading,
  onToggleTakeover,
  onSendReply,
  isTogglingTakeover,
  sendingReply,
}: ConversationChatPanelProps) {
  const [replyText, setReplyText] = useState('');
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);

  const isTakeover = Boolean(activeConv.humanTakeover || activeConv.mode === 'HUMAN_TAKEOVER');

  const handleSubmitReply = async () => {
    if (!replyText.trim() || sendingReply) return;
    const textToSend = replyText.trim();
    setReplyText('');
    await onSendReply(textToSend);
  };

  return (
    <div className="flex flex-col rounded-lg border border-palnadu-border bg-palnadu-white p-4 lg:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-palnadu-border pb-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-palnadu-teal" />
          <span className="text-xs font-bold text-palnadu-dark">{selectedPhone}</span>
          {activeConv.customerName && (
            <span className="text-xs text-palnadu-secondary">({activeConv.customerName})</span>
          )}
        </div>
        {isTakeover ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResumeConfirm(true)}
            disabled={isTogglingTakeover}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5 text-palnadu-teal" />
            <span>{isTogglingTakeover ? 'Updating...' : 'Resume Automated Assistance'}</span>
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onToggleTakeover(activeConv, true)}
            disabled={isTogglingTakeover}
            className="h-8 gap-1.5 bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>{isTogglingTakeover ? 'Updating...' : 'Take Over Chat'}</span>
          </Button>
        )}
      </div>

      {/* Message thread */}
      <div className="mb-3 flex-1 space-y-2 overflow-y-auto max-h-72 p-2">
        {chatLoading ? (
          <div className="py-8 text-center text-xs text-palnadu-secondary">Loading chat history...</div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-xs text-palnadu-secondary">No message history available.</div>
        ) : (
          messages.map((m) => {
            const isInbound = m.direction === 'INBOUND';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-md rounded-lg p-2.5 text-xs ${
                    isInbound
                      ? 'bg-palnadu-off-white text-palnadu-dark border border-palnadu-border'
                      : 'bg-palnadu-teal text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body || `[${m.type}]`}</p>
                </div>
                <span className="mt-0.5 text-xs text-palnadu-secondary">
                  {isInbound ? 'Customer' : 'Team / Bot'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Manual reply input */}
      <div className="flex items-center gap-2 border-t border-palnadu-border pt-3">
        <Input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
          placeholder="Type manual reply (activates human takeover)..."
          disabled={sendingReply}
          className="h-9 text-xs"
        />
        <Button
          size="sm"
          onClick={handleSubmitReply}
          disabled={!replyText.trim() || sendingReply}
          className="h-9 gap-1.5 bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{sendingReply ? 'Sending...' : 'Send'}</span>
        </Button>
      </div>

      <ConfirmDialog
        open={showResumeConfirm}
        onCancel={() => setShowResumeConfirm(false)}
        onConfirm={async () => {
          setShowResumeConfirm(false);
          await onToggleTakeover(activeConv, false);
        }}
        title="Resume Automated Assistance"
        message="Are you sure you want to resume automated assistance for this conversation? The automated bot will resume responding to customer messages."
        confirmLabel="Resume Assistance"
        cancelLabel="Cancel"
        variant="default"
        loading={isTogglingTakeover}
      />
    </div>
  );
}
