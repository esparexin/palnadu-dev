import { arePhoneNumbersEquivalent, sanitizePhoneNumber } from './whatsapp-api.util';

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

const GREETING_WORDS = new Set([
  'hi',
  'hello',
  'hey',
  'namaste',
  'namaskar',
  'namaskaram',
  'greetings',
  'good morning',
  'good afternoon',
  'good evening',
  'హాయ్',
  'నమస్తే',
  'నమస్కారం',
]);

export function isExplicitHumanRequest(rawText?: string): boolean {
  if (!rawText) return false;
  const clean = rawText.trim().toLowerCase();
  return HUMAN_REQUEST_TERMS.some((term) => clean.includes(term));
}

export function isGreetingText(rawText?: string): boolean {
  if (!rawText) return false;
  const clean = rawText
    .trim()
    .toLowerCase()
    .replace(/[!.,?]+$/, '')
    .trim();
  if (GREETING_WORDS.has(clean)) return true;
  return /^(hi|hello|hey|namaste|namaskaram|greetings|హాయ్|నమస్తే|నమస్కారం)$/i.test(clean);
}

export function isBusinessPhoneNumber(
  phone: string | undefined | null,
  candidates: Array<string | undefined | null>,
): boolean {
  if (!phone) return false;
  const cleanPhone = sanitizePhoneNumber(phone);
  if (!cleanPhone) return false;

  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleanCandidate = sanitizePhoneNumber(candidate);
    if (!cleanCandidate) continue;
    if (cleanPhone === cleanCandidate || arePhoneNumbersEquivalent(cleanPhone, cleanCandidate)) {
      return true;
    }
  }
  return false;
}
