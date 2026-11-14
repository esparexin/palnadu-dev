import {
  APPROVED_MAIN_MENU,
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

  // Strip button/selection wrapper if present, e.g. [Button: 1] or [Selected: 2]
  const buttonMatch = text.match(/^\[(?:button|selected):\s*(.*?)]$/i);
  if (buttonMatch?.[1]) {
    text = buttonMatch[1].trim().toLowerCase();
  }

  // Check word numbers
  if (WORD_TO_DIGIT[text]) {
    return WORD_TO_DIGIT[text];
  }

  // Convert Telugu digits
  text = text.replace(/[౦-౯]/g, (ch) => TELUGU_TO_ASCII_DIGITS[ch] || ch);

  // Extract leading digits or standalone number
  const numMatch = text.match(/^(\d+)/);
  if (numMatch?.[1]) {
    return numMatch[1];
  }

  return null;
}

export function formatMainMenuText(): string {
  const lines: string[] = [
    `Welcome to Palnadu.dev! 🙏`,
    `పాలనాడు.డెవ్ కు స్వాగతం!`,
    ``,
    `Please select an option by replying with a number (1-6):`,
    `(దయచేసి 1 నుండి 6 సంఖ్యతో ఎంచుకోండి):`,
    ``,
  ];

  for (const cat of APPROVED_MAIN_MENU) {
    lines.push(`${cat.id}. ${cat.title}`);
    if (cat.titleTe) {
      lines.push(`   (${cat.titleTe})`);
    }
  }

  lines.push(``);
  lines.push(`Type HOME anytime to return here.`);
  return lines.join('\n');
}

export function formatSubmenuText(category: MainMenuCategory): string {
  const lines: string[] = [
    `*${category.title}*`,
    category.titleTe ? `(${category.titleTe})` : '',
    ``,
    `Please choose a specific service:`,
    `(దయచేసి ఒక ఎంపికను ఎంచుకోండి):`,
    ``,
  ].filter(Boolean);

  if (category.suboptions) {
    for (const sub of category.suboptions) {
      lines.push(`${sub.id}. ${sub.name}`);
      if (sub.nameTe) {
        lines.push(`   (${sub.nameTe})`);
      }
    }
  }

  lines.push(``);
  lines.push(`Type BACK to return to main menu.`);
  return lines.join('\n');
}

export function findCategoryByInput(rawText?: string): MainMenuCategory | undefined {
  if (!rawText) return undefined;
  const num = extractNumericChoice(rawText);
  if (num) {
    const found = APPROVED_MAIN_MENU.find((c) => c.id === num);
    if (found) return found;
  }

  const clean = rawText.trim().toLowerCase();
  return APPROVED_MAIN_MENU.find(
    (c) =>
      c.title.toLowerCase().includes(clean) ||
      (c.titleTe && c.titleTe.toLowerCase().includes(clean)),
  );
}

export function findSuboptionByInput(
  category: MainMenuCategory,
  rawText?: string,
): MenuSubOption | undefined {
  if (!rawText || !category.suboptions) return undefined;
  const num = extractNumericChoice(rawText);
  if (num) {
    const found = category.suboptions.find((s) => s.id === num);
    if (found) return found;
  }

  const clean = rawText.trim().toLowerCase();
  return category.suboptions.find(
    (s) =>
      s.name.toLowerCase().includes(clean) ||
      (s.nameTe && s.nameTe.toLowerCase().includes(clean)),
  );
}
