import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppEnquiryService } from './whatsapp-enquiry.service';
import {
  APPROVED_MAIN_MENU,
  DIRECT_CONTACT_SUPPORT_MESSAGE,
  ENQUIRY_PROMPT_MESSAGE,
  ENQUIRY_CONFIRMATION_MESSAGE,
  INVALID_MENU_CHOICE_MESSAGE,
  INVALID_SUBMENU_CHOICE_MESSAGE,
  type MainMenuCategory,
} from './whatsapp-menu.constants';
import {
  formatMainMenuText,
  formatSubmenuText,
  parseNavigationCommand,
  findCategoryByInput,
  findSuboptionByInput,
} from './whatsapp-conversation.util';
import type { WhatsAppConversationState } from '@palnadu/types';
import type { WhatsAppConversation, WhatsAppMessage } from '@prisma/client';

export interface ConversationStepResult {
  responseText: string;
  nextState: WhatsAppConversationState;
  selectedCategory?: string | null;
  selectedSubmenu?: string | null;
  enquiryDraft?: string | null;
}

@Injectable()
export class WhatsAppConversationService {
  private readonly logger = new Logger(WhatsAppConversationService.name);

  constructor(private readonly enquiryService: WhatsAppEnquiryService) {}

  async processCustomerMessage(
    inboundMessage: WhatsAppMessage,
    conversation: WhatsAppConversation,
  ): Promise<ConversationStepResult> {
    const rawText = inboundMessage.body?.trim();
    const currentState = (conversation.state || 'IDLE') as WhatsAppConversationState;
    const navCommand = parseNavigationCommand(rawText);

    switch (currentState) {
      case 'AWAITING_REQUIREMENT':
        return this.handleAwaitingRequirement(inboundMessage, conversation, rawText, navCommand);

      case 'AWAITING_SUBMENU':
        return this.handleAwaitingSubmenu(conversation, rawText, navCommand);

      case 'AWAITING_CATEGORY':
        return this.handleAwaitingCategory(rawText, navCommand);

      case 'IDLE':
      default:
        return this.handleIdleState(rawText, navCommand);
    }
  }

  private handleIdleState(
    rawText?: string,
    navCommand?: 'BACK' | 'HOME' | null,
  ): ConversationStepResult {
    if (navCommand === 'HOME') {
      return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
    }

    const matchedCat = findCategoryByInput(rawText);
    if (matchedCat) {
      if (matchedCat.isDirectSupport) {
        return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
      }
      return {
        responseText: formatSubmenuText(matchedCat),
        nextState: 'AWAITING_SUBMENU',
        selectedCategory: matchedCat.id,
      };
    }

    return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
  }

  private handleAwaitingCategory(
    rawText?: string,
    navCommand?: 'BACK' | 'HOME' | null,
  ): ConversationStepResult {
    if (navCommand === 'HOME' || navCommand === 'BACK') {
      return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
    }

    const matchedCat = findCategoryByInput(rawText);
    if (!matchedCat) {
      return {
        responseText: INVALID_MENU_CHOICE_MESSAGE,
        nextState: 'AWAITING_CATEGORY',
      };
    }

    if (matchedCat.isDirectSupport) {
      return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
    }

    return {
      responseText: formatSubmenuText(matchedCat),
      nextState: 'AWAITING_SUBMENU',
      selectedCategory: matchedCat.id,
    };
  }

  private handleAwaitingSubmenu(
    conversation: WhatsAppConversation,
    rawText?: string,
    navCommand?: 'BACK' | 'HOME' | null,
  ): ConversationStepResult {
    if (navCommand === 'BACK' || navCommand === 'HOME') {
      return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
    }

    const category = APPROVED_MAIN_MENU.find((c) => c.id === conversation.selectedCategory);
    if (!category) {
      return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
    }

    const matchedSub = findSuboptionByInput(category, rawText);
    if (!matchedSub) {
      return {
        responseText: INVALID_SUBMENU_CHOICE_MESSAGE,
        nextState: 'AWAITING_SUBMENU',
        selectedCategory: category.id,
      };
    }

    if (matchedSub.isSupport) {
      return {
        responseText: DIRECT_CONTACT_SUPPORT_MESSAGE,
        nextState: 'IDLE',
        selectedCategory: null,
        selectedSubmenu: null,
      };
    }

    return {
      responseText: ENQUIRY_PROMPT_MESSAGE,
      nextState: 'AWAITING_REQUIREMENT',
      selectedCategory: category.id,
      selectedSubmenu: matchedSub.id,
    };
  }

  private async handleAwaitingRequirement(
    inboundMessage: WhatsAppMessage,
    conversation: WhatsAppConversation,
    rawText?: string,
    navCommand?: 'BACK' | 'HOME' | null,
  ): Promise<ConversationStepResult> {
    const category = APPROVED_MAIN_MENU.find((c) => c.id === conversation.selectedCategory);

    if (navCommand === 'BACK') {
      if (category) {
        return {
          responseText: formatSubmenuText(category),
          nextState: 'AWAITING_SUBMENU',
          selectedCategory: category.id,
        };
      }
      return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
    }

    if (navCommand === 'HOME') {
      return { responseText: formatMainMenuText(), nextState: 'AWAITING_CATEGORY' };
    }

    const requirementText = rawText || '[No text requirement provided]';
    const suboption = category?.suboptions?.find((s) => s.id === conversation.selectedSubmenu);

    await this.enquiryService.createEnquiryFromWhatsApp({
      phone: inboundMessage.from,
      name: conversation.customerName || inboundMessage.profileName,
      categoryId: category?.id || 'unknown',
      categoryTitle: category?.title || 'General Enquiry',
      suboptionId: suboption?.id || 'unknown',
      suboptionName: suboption?.name || 'General',
      requirementText,
      inboundWamId: inboundMessage.wamId,
    });

    return {
      responseText: ENQUIRY_CONFIRMATION_MESSAGE,
      nextState: 'IDLE',
      selectedCategory: null,
      selectedSubmenu: null,
      enquiryDraft: null,
    };
  }
}
