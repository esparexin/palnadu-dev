import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');
const { WhatsAppAssistantService } = require('../dist/whatsapp/whatsapp-assistant.service.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');

export function createAssistantTestHarness(options = {}) {
  const {
    assistantFlag = 'true',
    autoReplyFlag = 'true',
    simulateInteractiveFailure = false,
  } = options;

  const leads = new Map();
  const notifications = [];
  const conversations = new Map();
  const messages = new Map();
  const interactiveDispatches = [];
  const textDispatches = [];

  const mockPrisma = {
    lead: {
      findUnique: async ({ where }) => (where.whatsappWamId ? leads.get(where.whatsappWamId) || null : null),
      create: async ({ data }) => {
        const rec = { id: `lead_${Date.now()}`, ...data };
        leads.set(data.whatsappWamId, rec);
        return rec;
      },
    },
    whatsAppConversation: {
      findUnique: async ({ where }) =>
        (where.customerPhone ? conversations.get(where.customerPhone) : null) ||
        Array.from(conversations.values()).find((c) => c.id === where.id) || null,
      create: async ({ data }) => {
        const rec = { id: `conv_${Date.now()}`, humanTakeover: false, state: 'IDLE', ...data };
        conversations.set(data.customerPhone, rec);
        return rec;
      },
      update: async ({ where, data }) => {
        const rec =
          (where.customerPhone ? conversations.get(where.customerPhone) : null) ||
          Array.from(conversations.values()).find((c) => c.id === where.id);
        if (rec) Object.assign(rec, data);
        return rec;
      },
      upsert: async ({ where, create, update }) => {
        let rec = conversations.get(where.customerPhone);
        if (!rec) {
          rec = { id: `conv_${Date.now()}`, ...create };
          conversations.set(where.customerPhone, rec);
        } else {
          Object.assign(rec, update);
        }
        return rec;
      },
    },
    whatsAppMessage: {
      findFirst: async ({ where }) => {
        for (const m of messages.values()) {
          if (where?.contextWamId && m.contextWamId !== where.contextWamId) continue;
          if (where?.direction && m.direction !== where.direction) continue;
          if (where?.status?.not && m.status === where.status.not) continue;
          return m;
        }
        return null;
      },
      create: async ({ data }) => {
        if (messages.has(data.wamId)) {
          const err = new Error('Unique constraint failed on the fields: (`wam_id`)');
          err.code = 'P2002';
          throw err;
        }
        const rec = { id: `msg_${Date.now()}_${Math.random()}`, ...data };
        messages.set(data.wamId, rec);
        return rec;
      },
      update: async ({ where, data }) => {
        const rec = Array.from(messages.values()).find((m) => m.id === where.id || m.wamId === where.wamId);
        if (rec) Object.assign(rec, data);
        return rec;
      },
      delete: async ({ where }) => {
        for (const [k, m] of messages.entries()) {
          if (m.id === where.id || m.wamId === where.wamId) {
            messages.delete(k);
            return m;
          }
        }
        return null;
      },
    },
  };

  const mockNotifications = {
    create: async (notif) => {
      notifications.push(notif);
      return { id: `notif_${Date.now()}`, ...notif };
    },
  };

  const mockConfig = {
    get: (k) => {
      if (k === 'WHATSAPP_ASSISTANT_ENABLED') return assistantFlag;
      if (k === 'WHATSAPP_AUTO_REPLY_ENABLED') return autoReplyFlag;
      return null;
    },
  };

  const mockApiClient = {
    isConfigured: () => true,
    sendTextMessage: async ({ to, text, replyToWamId }) => {
      textDispatches.push({ to, text, replyToWamId });
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: `wamid.TXT_${Date.now()}` }],
      };
    },
    sendInteractiveMessage: async ({ to, interactive, replyToWamId }) => {
      if (simulateInteractiveFailure) {
        throw new Error('Interactive message delivery failed');
      }
      interactiveDispatches.push({ to, interactive, replyToWamId });
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: `wamid.INT_${Date.now()}` }],
      };
    },
  };

  const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
  const conversationService = new WhatsAppConversationService(enquiryService);
  const assistantService = new WhatsAppAssistantService(
    mockPrisma,
    mockConfig,
    mockApiClient,
    conversationService,
  );
  const takeoverService = new WhatsAppTakeoverService(mockPrisma, mockApiClient);
  const autoReplyService = new WhatsAppAutoReplyService(mockPrisma, mockConfig, mockApiClient);

  return {
    mockPrisma,
    mockConfig,
    mockApiClient,
    enquiryService,
    conversationService,
    assistantService,
    takeoverService,
    autoReplyService,
    leads,
    notifications,
    conversations,
    messages,
    interactiveDispatches,
    textDispatches,
  };
}
