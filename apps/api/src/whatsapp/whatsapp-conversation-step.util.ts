import {
  APPROVED_MAIN_MENU,
  DIRECT_CONTACT_SUPPORT_MESSAGE,
  ENQUIRY_PROMPT_MESSAGE,
  type MainMenuCategory,
} from './whatsapp-menu.constants';
import {
  formatMainMenuText,
  formatSubmenuText,
  findCategoryByInput,
  findSuboptionByInput,
  findSuboptionGlobally,
} from './whatsapp-conversation.util';
import {
  buildMainMenuInteractiveList,
  buildSubmenuInteractiveButtons,
} from './whatsapp-interactive.util';
import type {
  WhatsAppConversationState,
  WhatsAppConversationMode,
  WhatsAppInteractivePayload,
} from '@palnadu/types';
import type { WhatsAppConversation } from '@prisma/client';

export interface ConversationStepResult {
  responseText: string;
  nextState: WhatsAppConversationState;
  nextMode?: WhatsAppConversationMode;
  selectedCategory?: string | null;
  selectedSubmenu?: string | null;
  enquiryDraft?: string | null;
  interactive?: WhatsAppInteractivePayload;
}

export function createMainMenuStep(): ConversationStepResult {
  return {
    responseText: formatMainMenuText(),
    interactive: buildMainMenuInteractiveList(),
    nextState: 'AWAITING_CATEGORY',
    selectedCategory: null,
    selectedSubmenu: null,
  };
}

export function createSubmenuStep(category: MainMenuCategory): ConversationStepResult {
  const interactive = buildSubmenuInteractiveButtons(category) || undefined;
  return {
    responseText: formatSubmenuText(category),
    interactive,
    nextState: 'AWAITING_SUBMENU',
    selectedCategory: category.id,
  };
}

export function resolveInteractiveSelection(
  id: string,
  title: string,
  conversation: WhatsAppConversation,
): ConversationStepResult {
  const matchedCat = findCategoryByInput(title, id);
  if (matchedCat) {
    if (matchedCat.isDirectSupport) {
      return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
    }
    return createSubmenuStep(matchedCat);
  }

  const currentCat = APPROVED_MAIN_MENU.find((c) => c.id === conversation.selectedCategory);
  const matchedSub = currentCat
    ? findSuboptionByInput(currentCat, title, id)
    : undefined;

  if (matchedSub && currentCat) {
    if (matchedSub.isSupport) {
      return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
    }
    return {
      responseText: ENQUIRY_PROMPT_MESSAGE,
      nextState: 'AWAITING_REQUIREMENT',
      selectedCategory: currentCat.id,
      selectedSubmenu: matchedSub.id,
    };
  }

  const globalMatch = findSuboptionGlobally(id, title);
  if (globalMatch) {
    if (globalMatch.suboption.isSupport) {
      return { responseText: DIRECT_CONTACT_SUPPORT_MESSAGE, nextState: 'IDLE' };
    }
    return {
      responseText: ENQUIRY_PROMPT_MESSAGE,
      nextState: 'AWAITING_REQUIREMENT',
      selectedCategory: globalMatch.category.id,
      selectedSubmenu: globalMatch.suboption.id,
    };
  }

  return createMainMenuStep();
}
