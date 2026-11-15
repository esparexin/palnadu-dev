import {
  CHOICE_AUTOMATED_ID,
  CHOICE_HUMAN_ID,
} from './whatsapp-interactive.util';

export type CustomerChoiceOutcome = 'AUTOMATED' | 'HUMAN' | 'UNCLEAR';

const HUMAN_REQUEST_TERMS = [
  'human',
  'agent',
  'support',
  'talk to team',
  'talk to our team',
  'team',
  'representative',
  'person',
  'executive',
  'call me',
  'speak to someone',
  'speak with someone',
  'contact support',
  'need a human',
  'real person',
  'talk to human',
];

const AUTOMATED_TERMS = [
  'automated',
  'automated assistance',
  'bot',
  'assistant',
  'menu',
  'services',
  'self service',
  'auto',
];

const GREETINGS = [
  'hi',
  'hello',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
  'namaste',
  'greetings',
];

export function isExplicitHumanRequest(rawText?: string): boolean {
  if (!rawText) return false;
  const clean = rawText.trim().toLowerCase();
  return HUMAN_REQUEST_TERMS.some((term) => clean.includes(term));
}

export function isGreeting(rawText?: string): boolean {
  if (!rawText) return false;
  const clean = rawText.trim().toLowerCase();
  return GREETINGS.includes(clean);
}

export function classifyCustomerChoice(
  rawText?: string,
  interactiveId?: string,
): CustomerChoiceOutcome {
  if (interactiveId) {
    const cleanId = interactiveId.trim().toLowerCase();
    if (cleanId === CHOICE_AUTOMATED_ID.toLowerCase() || cleanId === '1') {
      return 'AUTOMATED';
    }
    if (cleanId === CHOICE_HUMAN_ID.toLowerCase() || cleanId === '2') {
      return 'HUMAN';
    }
  }

  if (!rawText) return 'UNCLEAR';
  const clean = rawText.trim().toLowerCase();

  if (clean === '1' || AUTOMATED_TERMS.some((term) => clean.includes(term))) {
    return 'AUTOMATED';
  }

  if (clean === '2' || isExplicitHumanRequest(clean)) {
    return 'HUMAN';
  }

  return 'UNCLEAR';
}
