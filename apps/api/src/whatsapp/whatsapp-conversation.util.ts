import {
  APPROVED_MAIN_MENU,
  MAIN_MENU_WELCOME_TEXT,
  type MainMenuCategory,
  type MenuSubOption,
} from './whatsapp-menu.constants';

const TELUGU_TO_ASCII_DIGITS: Record<string, string> = {
  '౧': '1',
  '౨': '2',
  '౩': '3',
  '౪': '4',
  '౫': '5',
  '౬': '6',
  '౭': '7',
  '౮': '8',
  '౯': '9',
  '౦': '0',
};

const WORD_TO_DIGIT: Record<string, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  ఒకటి: '1',
  రెండు: '2',
  మూడు: '3',
  నాలుగు: '4',
  ఐదు: '5',
  ఆరు: '6',
};

const BACK_PATTERNS = ['back', 'b', 'prev', 'previous', 'return', 'వెనక్కి', 'వెనుకకు'];
const HOME_PATTERNS = ['home', 'h', 'menu', 'main', 'main menu', 'start', 'restart', 'హోమ్', 'మెనూ'];

export function parseNavigationCommand(rawText?: string): 'BACK' | 'HOME' | null {
  if (!rawText) return null;
  const clean = rawText.trim().toLowerCase();
  if (BACK_PATTERNS.includes(clean)) return 'BACK';
  if (HOME_PATTERNS.includes(clean)) return 'HOME';
  return null;
}

export function extractNumericChoice(rawText?: string): string | null {
  if (!rawText) return null;
  let text = rawText.trim().toLowerCase();

  const buttonMatch = text.match(/^\[(?:button|selected):\s*(.*?)]$/i);
  if (buttonMatch?.[1]) {
    text = buttonMatch[1].trim().toLowerCase();
  }

  if (WORD_TO_DIGIT[text]) {
    return WORD_TO_DIGIT[text];
  }

  text = text.replace(/[౦-౯]/g, (ch) => TELUGU_TO_ASCII_DIGITS[ch] || ch);

  const numMatch = text.match(/^(\d+)/);
  if (numMatch?.[1]) {
    return numMatch[1];
  }

  return null;
}

export function formatMainMenuText(): string {
  const lines: string[] = [
    MAIN_MENU_WELCOME_TEXT,
    '',
    'Please select a service (1-6):',
  ];

  for (const cat of APPROVED_MAIN_MENU) {
    lines.push(`${cat.id}. ${cat.title}`);
  }

  lines.push('');
  lines.push('Type HOME anytime to return to the main menu.');
  return lines.join('\n');
}

export function formatSubmenuText(category: MainMenuCategory): string {
  const lines: string[] = [
    `*${category.title}*`,
    '',
    'Please choose a specific service:',
  ];

  if (category.suboptions) {
    for (const sub of category.suboptions) {
      lines.push(`${sub.id}. ${sub.name}`);
    }
  }

  lines.push('');
  lines.push('Type BACK to return to the main menu.');
  return lines.join('\n');
}

export function findCategoryByInput(
  rawText?: string,
  interactiveId?: string,
): MainMenuCategory | undefined {
  if (interactiveId) {
    const directMatch = APPROVED_MAIN_MENU.find(
      (c) => c.stableId === interactiveId || c.id === interactiveId,
    );
    if (directMatch) return directMatch;
  }

  if (!rawText) return undefined;
  const clean = rawText.trim().toLowerCase();

  const stableMatch = APPROVED_MAIN_MENU.find((c) => c.stableId.toLowerCase() === clean);
  if (stableMatch) return stableMatch;

  const num = extractNumericChoice(rawText);
  if (num) {
    const found = APPROVED_MAIN_MENU.find((c) => c.id === num);
    if (found) return found;
  }

  return APPROVED_MAIN_MENU.find(
    (c) =>
      c.title.toLowerCase().includes(clean) ||
      (c.rowTitle && c.rowTitle.toLowerCase().includes(clean)),
  );
}

export function findSuboptionByInput(
  category: MainMenuCategory,
  rawText?: string,
  interactiveId?: string,
): MenuSubOption | undefined {
  if (!category.suboptions) return undefined;

  if (interactiveId) {
    const directMatch = category.suboptions.find(
      (s) => s.stableId === interactiveId || s.id === interactiveId,
    );
    if (directMatch) return directMatch;
  }

  if (!rawText) return undefined;
  const clean = rawText.trim().toLowerCase();

  const stableMatch = category.suboptions.find((s) => s.stableId.toLowerCase() === clean);
  if (stableMatch) return stableMatch;

  const num = extractNumericChoice(rawText);
  if (num) {
    const found = category.suboptions.find((s) => s.id === num);
    if (found) return found;
  }

  return category.suboptions.find(
    (s) =>
      s.name.toLowerCase().includes(clean) ||
      (s.buttonTitle && s.buttonTitle.toLowerCase().includes(clean)),
  );
}

export function findSuboptionGlobally(
  interactiveId?: string,
  rawText?: string,
): { category: MainMenuCategory; suboption: MenuSubOption } | undefined {
  for (const cat of APPROVED_MAIN_MENU) {
    const sub = findSuboptionByInput(cat, rawText, interactiveId);
    if (sub) {
      return { category: cat, suboption: sub };
    }
  }
  return undefined;
}

export function extractMessageBody(msg: Record<string, unknown>): string | undefined {
  const textObj = msg.text as { body?: string } | undefined;
  if (textObj?.body) return textObj.body;

  const mediaObj = (msg.image || msg.document || msg.video) as { caption?: string } | undefined;
  if (mediaObj?.caption) return mediaObj.caption;

  const interactive = msg.interactive as
    | { button_reply?: { title: string }; list_reply?: { title: string } }
    | undefined;
  if (interactive?.button_reply?.title) return `[Button: ${interactive.button_reply.title}]`;
  if (interactive?.list_reply?.title) return `[Selected: ${interactive.list_reply.title}]`;

  const button = msg.button as { text?: string } | undefined;
  if (button?.text) return `[Button: ${button.text}]`;

  const loc = msg.location as { name?: string; address?: string; latitude?: number; longitude?: number } | undefined;
  if (loc) {
    const parts = [loc.name, loc.address, loc.latitude && loc.longitude ? `(${loc.latitude}, ${loc.longitude})` : null].filter(Boolean);
    return parts.length > 0 ? `[Location: ${parts.join(', ')}]` : '[Location]';
  }

  const reaction = msg.reaction as { emoji?: string } | undefined;
  if (reaction?.emoji) return `[Reaction: ${reaction.emoji}]`;

  if (msg.type === 'audio') return '[Audio Message]';
  if (msg.type === 'video') return '[Video Message]';
  if (msg.type === 'sticker') return '[Sticker]';

  return undefined;
}
