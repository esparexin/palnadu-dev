import type {
  WhatsAppInteractiveListPayload,
  WhatsAppInteractiveButtonPayload,
  WhatsAppInteractiveReplySelection,
} from '@palnadu/types';
import {
  APPROVED_MAIN_MENU,
  MAIN_MENU_WELCOME_TEXT,
  type MainMenuCategory,
} from './whatsapp-menu.constants';

export const META_LIST_BUTTON_MAX_LEN = 20;
export const META_LIST_SECTION_TITLE_MAX_LEN = 24;
export const META_LIST_ROW_TITLE_MAX_LEN = 24;
export const META_LIST_ROW_DESC_MAX_LEN = 72;
export const META_LIST_MAX_ROWS = 10;
export const META_REPLY_BUTTON_TITLE_MAX_LEN = 20;
export const META_MAX_REPLY_BUTTONS = 3;

export function truncateMetaString(str: string, maxLen: number): string {
  const trimmed = str.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim();
}

export function extractInteractiveSelection(
  msg: Record<string, unknown>,
): WhatsAppInteractiveReplySelection | null {
  const interactiveObj =
    (msg.interactive as Record<string, unknown> | undefined) ||
    ((msg.rawPayload as Record<string, unknown> | undefined)?.interactive as
      | Record<string, unknown>
      | undefined);

  if (!interactiveObj) return null;

  const listReply = interactiveObj.list_reply as
    | { id?: string; title?: string; description?: string }
    | undefined;
  if (listReply?.id && listReply.title) {
    return {
      type: 'list_reply',
      id: listReply.id.trim(),
      title: listReply.title.trim(),
      description: listReply.description?.trim(),
    };
  }

  const buttonReply = interactiveObj.button_reply as
    | { id?: string; title?: string }
    | undefined;
  if (buttonReply?.id && buttonReply.title) {
    return {
      type: 'button_reply',
      id: buttonReply.id.trim(),
      title: buttonReply.title.trim(),
    };
  }

  return null;
}

export function buildMainMenuInteractiveList(): WhatsAppInteractiveListPayload {
  const rows = APPROVED_MAIN_MENU.slice(0, META_LIST_MAX_ROWS).map((cat) => ({
    id: cat.stableId || `cat_${cat.id}`,
    title: truncateMetaString(cat.rowTitle || cat.title, META_LIST_ROW_TITLE_MAX_LEN),
    description: cat.rowDescription
      ? truncateMetaString(cat.rowDescription, META_LIST_ROW_DESC_MAX_LEN)
      : undefined,
  }));

  return {
    type: 'list',
    body: {
      text: MAIN_MENU_WELCOME_TEXT,
    },
    action: {
      button: 'View Services',
      sections: [
        {
          title: 'Our Services',
          rows,
        },
      ],
    },
  };
}

export function buildSubmenuInteractiveButtons(
  category: MainMenuCategory,
): WhatsAppInteractiveButtonPayload | null {
  if (!category.suboptions || category.suboptions.length === 0) {
    return null;
  }

  if (category.suboptions.length > META_MAX_REPLY_BUTTONS) {
    return null;
  }

  const buttons = category.suboptions.map((sub) => ({
    type: 'reply' as const,
    reply: {
      id: sub.stableId || `sub_${category.id}_${sub.id}`,
      title: truncateMetaString(
        sub.buttonTitle || sub.name,
        META_REPLY_BUTTON_TITLE_MAX_LEN,
      ),
    },
  }));

  const bodyLines = [
    `*${category.title}*`,
    '',
    'Please select an option below:',
  ];

  return {
    type: 'button',
    body: {
      text: bodyLines.join('\n'),
    },
    action: {
      buttons,
    },
  };
}

export const CUSTOMER_CHOICE_MESSAGE_TEXT =
  'Hello! 👋\n\n' +
  'Thank you for getting back to us.\n\n' +
  'How would you like to continue?';

export const CHOICE_AUTOMATED_ID = 'choice_automated';
export const CHOICE_HUMAN_ID = 'choice_human';

export function buildCustomerChoiceInteractiveButtons(): WhatsAppInteractiveButtonPayload {
  return {
    type: 'button',
    body: {
      text: CUSTOMER_CHOICE_MESSAGE_TEXT,
    },
    action: {
      buttons: [
        {
          type: 'reply',
          reply: {
            id: CHOICE_AUTOMATED_ID,
            title: 'Automated Assistance',
          },
        },
        {
          type: 'reply',
          reply: {
            id: CHOICE_HUMAN_ID,
            title: 'Talk to Our Team',
          },
        },
      ],
    },
  };
}
