export type WhatsAppConversationMode =
  | 'AWAITING_CUSTOMER_CHOICE'
  | 'AUTOMATED_ASSISTANCE'
  | 'HUMAN_TAKEOVER';

export type WhatsAppConversationState =
  | 'IDLE'
  | 'AWAITING_CUSTOMER_CHOICE'
  | 'AWAITING_CATEGORY'
  | 'AWAITING_SUBMENU'
  | 'AWAITING_REQUIREMENT';

export interface WhatsAppConversation {
  id: string;
  customerPhone: string;
  customerName?: string;
  state: WhatsAppConversationState;
  mode: WhatsAppConversationMode;
  selectedCategory?: string;
  selectedSubmenu?: string;
  enquiryDraft?: string;
  humanTakeover: boolean;
  takenOverAt?: string;
  takenOverById?: string;
  takenOverByName?: string;
  lastInitiatorId?: string;
  lastInitiatorName?: string;
  modeUpdatedAt?: string;
  lastInboundWamId?: string;
  lastEnquiryWamId?: string;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMenuCategoryOption {
  id: string;
  titleEn: string;
  titleTe: string;
  hasSubmenu: boolean;
  directContact?: boolean;
}

export interface WhatsAppSubmenuOption {
  id: string;
  titleEn: string;
  titleTe: string;
  isSupport: boolean;
}

export interface WhatsAppConversationFilterParams {
  page?: number;
  limit?: number;
  humanTakeover?: boolean;
  mode?: WhatsAppConversationMode;
  search?: string;
}

export interface WhatsAppTakeoverParams {
  enabled: boolean;
}

export interface WhatsAppManualReplyParams {
  text: string;
}
