'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, UserCheck, Bot, Send, RefreshCw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { whatsappApi } from '@/lib/api/whatsapp';
import type { WhatsAppConversation, WhatsAppMessage } from '@palnadu/types';

export function ConversationManager() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await whatsappApi.conversations.list({ limit: 50 });
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch {
      // Handled gracefully in UI
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChat = useCallback(async (phone: string) => {
    setChatLoading(true);
    try {
      const res = await whatsappApi.conversations.get(phone);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
      }
    } catch {
      // Handled gracefully in UI
    } finally {
      setChatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedPhone) {
      fetchChat(selectedPhone);
    }
  }, [selectedPhone, fetchChat]);

  const handleToggleTakeover = async (conv: WhatsAppConversation) => {
    try {
      const nextState = !conv.humanTakeover;
      const res = await whatsappApi.conversations.toggleTakeover(conv.customerPhone, nextState);
      if (res.success && res.data) {
        setConversations((prev) =>
          prev.map((c) => (c.customerPhone === conv.customerPhone ? res.data : c)),
        );
      }
    } catch {
      // Fallback
    }
  };

  const handleSendReply = async () => {
    if (!selectedPhone || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await whatsappApi.conversations.reply(selectedPhone, replyText.trim());
      if (res.success && res.data) {
        setReplyText('');
        setMessages((prev) => [...prev, res.data]);
        // Update local conversation list to reflect takeover
        setConversations((prev) =>
          prev.map((c) => (c.customerPhone === selectedPhone ? { ...c, humanTakeover: true } : c)),
        );
      }
    } catch {
      // Fallback
    } finally {
      setSendingReply(false);
    }
  };

  const activeConv = conversations.find((c) => c.customerPhone === selectedPhone);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Conversations List */}
      <div className="rounded-lg border border-palnadu-border bg-palnadu-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-palnadu-teal" />
            <span className="text-xs font-bold text-palnadu-dark">Conversations ({conversations.length})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchConversations} className="h-7 w-7 p-0 cursor-pointer">
            <RefreshCw className={`h-3.5 w-3.5 text-palnadu-secondary ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {conversations.length === 0 ? (
          <div className="py-8 text-center text-xs text-palnadu-secondary">No conversations yet.</div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {conversations.map((conv) => {
              const isSelected = conv.customerPhone === selectedPhone;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedPhone(conv.customerPhone)}
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
                    {conv.humanTakeover ? (
                      <span className="inline-flex items-center rounded-full bg-palnadu-off-white border border-palnadu-border px-2 py-0.5 text-xs font-medium text-palnadu-secondary">
                        Human Takeover
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-palnadu-light-blue px-2 py-0.5 text-xs font-medium text-palnadu-teal">
                        Bot Active
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

      {/* Chat History & Takeover Control */}
      <div className="flex flex-col rounded-lg border border-palnadu-border bg-palnadu-white p-4 lg:col-span-2">
        {selectedPhone && activeConv ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-palnadu-border pb-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-palnadu-teal" />
                <span className="text-xs font-bold text-palnadu-dark">{selectedPhone}</span>
                {activeConv.customerName && (
                  <span className="text-xs text-palnadu-secondary">({activeConv.customerName})</span>
                )}
              </div>
              <Button
                variant={activeConv.humanTakeover ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleToggleTakeover(activeConv)}
                className="h-8 gap-1.5 text-xs cursor-pointer"
              >
                {activeConv.humanTakeover ? (
                  <>
                    <Bot className="h-3.5 w-3.5 text-palnadu-teal" />
                    <span>Resume Bot</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Take Over Chat</span>
                  </>
                )}
              </Button>
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
                        {isInbound ? 'Customer' : 'Bot / Agent'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Type manual reply (takes over chat)..."
                className="h-9 text-xs"
              />
              <Button
                size="sm"
                onClick={handleSendReply}
                disabled={!replyText.trim() || sendingReply}
                className="h-9 gap-1.5 bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center py-16 text-center text-xs text-palnadu-secondary">
            Select a conversation on the left to view messages and manage takeover.
          </div>
        )}
      </div>
    </div>
  );
}
