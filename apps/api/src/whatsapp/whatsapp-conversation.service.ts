import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppEnquiryService } from './whatsapp-enquiry.service';
import {
  APPROVED_MAIN_MENU,
  DIRECT_CONTACT_SUPPORT_MESSAGE,
  ENQUIRY_PROMPT_MESSAGE,
  ENQUIRY_CONFIRMATION_MESSAGE,
  INVALID_MENU_CHOICE_MESSAGE,
  INVALID_SUBMENU_CHOICE_MESSAGE,
} from './whatsapp-menu.constants';
import {
  parseNavigationCommand,
  findCategoryByInput,
  findSuboptionByInput,
} from './whatsapp-conversation.util';
import { extractInteractiveSelection } from './whatsapp-interactive.util';
import {
  type ConversationStepResult,
  createMainMenuStep,
  createSubmenuStep,
  resolveInteractiveSelection,
} from './whatsapp-conversation-step.util';
import { isExplicitHumanRequest } from './whatsapp-choice.util';
import type { WhatsAppConversationState, WhatsAppConversationMode } from '@palnadu/types';
import type { WhatsAppConversation, WhatsAppMessage } from '@prisma/client';

export type { ConversationStepResult };

@Injectable()
export class WhatsAppConversationService {
  private readonly logger = new Logger(WhatsAppConversationService.name);

  constructor(private readonly enquiryService: WhatsAppEnquiryService) {}

  async processCustomerMessage(
    inboundMessage: WhatsAppMessage,
    conversation: WhatsAppConversation,
  ): Promise<ConversationStepResult> {
    const rawText = inboundMessage.body?.trim();
    const interactiveSel = extractInteractiveSelection(
      inboundMessage as unknown as Record<string, unknown>,
    );
    const currentState = (conversation.state || 'IDLE') as WhatsAppConversationState;
    const navCommand = parseNavigationCommand(rawText);

    if (interactiveSel) {
      return resolveInteractiveSelection(interactiveSel.id, interactiveSel.title, conversation);
    }

    if (isExplicitHumanRequest(rawText)) {
      await this.enquiryService.notifyCustomerRequestedTeam({
        phone: inboundMessage.from,
        name: conversation.customerName || inboundMessage.profileName,
      });
      return {
        responseText: DIRECT_CONTACT_SUPPORT_MESSAGE,
        nextState: 'IDLE',
        nextMode: 'HUMAN_TAKEOVER',
      };
    }

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
    if (navCommand === 'HOME') return createMainMenuStep();

    const matchedCat = findCategoryByInput(rawText);
    if (matchedCat) {
      if (matchedCat.isDirectSupport) {
        return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
      }
      return createSubmenuStep(matchedCat);
    }

    return createMainMenuStep();
  }

  private handleAwaitingCategory(
    rawText?: string,
    navCommand?: 'BACK' | 'HOME' | null,
  ): ConversationStepResult {
    if (navCommand === 'HOME' || navCommand === 'BACK') {
      return createMainMenuStep();
    }

    const matchedCat = findCategoryByInput(rawText);
    if (!matchedCat) {
      const step = createMainMenuStep();
      step.responseText = INVALID_MENU_CHOICE_MESSAGE;
      return step;
    }

    if (matchedCat.isDirectSupport) {
      return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
    }

    return createSubmenuStep(matchedCat);
  }

  private handleAwaitingSubmenu(
    conversation: WhatsAppConversation,
    rawText?: string,
    navCommand?: 'BACK' | 'HOME' | null,
  ): ConversationStepResult {
    if (navCommand === 'BACK' || navCommand === 'HOME') {
      return createMainMenuStep();
    }

    const category = APPROVED_MAIN_MENU.find((c) => c.id === conversation.selectedCategory);
    if (!category) return createMainMenuStep();

    const matchedSub = findSuboptionByInput(category, rawText);
    if (!matchedSub) {
      const otherCat = findCategoryByInput(rawText);
      if (otherCat) {
        if (otherCat.isDirectSupport) {
          return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
        }
        return createSubmenuStep(otherCat);
      }
      const step = createSubmenuStep(category);
      step.responseText = INVALID_SUBMENU_CHOICE_MESSAGE;
      return step;
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
      if (category) return createSubmenuStep(category);
      return createMainMenuStep();
    }

    if (navCommand === 'HOME') return createMainMenuStep();

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
