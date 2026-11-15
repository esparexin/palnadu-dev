'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { whatsappApi } from '@/lib/api/whatsapp';
import { ConversationListPanel } from './conversation-list-panel';
import { ConversationChatPanel } from './conversation-chat-panel';
import type { WhatsAppConversation, WhatsAppMessage } from '@palnadu/types';

export function ConversationManager() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [isTogglingTakeover, setIsTogglingTakeover] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await whatsappApi.conversations.list({ limit: 50 });
      if (res.success && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load conversations';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchChat = useCallback(async (phone: string) => {
    setChatLoading(true);
    try {
      const res = await whatsappApi.conversations.get(phone);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load message history';
      toast.error(msg);
    } finally {
      setChatLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedPhone) {
      fetchChat(selectedPhone);
    }
  }, [selectedPhone, fetchChat]);

  const handleToggleTakeover = async (conv: WhatsAppConversation, nextState: boolean) => {
    if (isTogglingTakeover) return;
    setIsTogglingTakeover(true);
    try {
      const res = await whatsappApi.conversations.toggleTakeover(conv.customerPhone, nextState);
      if (res.success && res.data) {
        setConversations((prev) =>
          prev.map((c) => (c.customerPhone === conv.customerPhone ? res.data : c)),
        );
        toast.success(
          nextState
            ? 'Human takeover activated.'
            : 'Automated assistance resumed.',
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update takeover state';
      toast.error(msg);
    } finally {
      setIsTogglingTakeover(false);
    }
  };

  const handleSendReply = async (text: string) => {
    if (!selectedPhone || !text || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await whatsappApi.conversations.reply(selectedPhone, text);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        // Update local conversation list to reflect takeover immediately
        setConversations((prev) =>
          prev.map((c) => (c.customerPhone === selectedPhone ? { ...c, humanTakeover: true, mode: 'HUMAN_TAKEOVER' } : c)),
        );
        toast.success('Message sent and human takeover activated.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch manual message';
      toast.error(msg);
    } finally {
      setSendingReply(false);
    }
  };

  const activeConv = conversations.find((c) => c.customerPhone === selectedPhone);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ConversationListPanel
        conversations={conversations}
        selectedPhone={selectedPhone}
        onSelectPhone={setSelectedPhone}
        onRefresh={fetchConversations}
        loading={loading}
      />

      {selectedPhone && activeConv ? (
        <ConversationChatPanel
          activeConv={activeConv}
          selectedPhone={selectedPhone}
          messages={messages}
          chatLoading={chatLoading}
          onToggleTakeover={handleToggleTakeover}
          onSendReply={handleSendReply}
          isTogglingTakeover={isTogglingTakeover}
          sendingReply={sendingReply}
        />
      ) : (
        <div className="flex flex-col rounded-lg border border-palnadu-border bg-palnadu-white p-4 lg:col-span-2">
          <div className="flex flex-1 items-center justify-center py-16 text-center text-xs text-palnadu-secondary">
            Select a conversation on the left to view messages and manage takeover.
          </div>
        </div>
      )}
    </div>
  );
}
