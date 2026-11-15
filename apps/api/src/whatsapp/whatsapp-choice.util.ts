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

export function isExplicitHumanRequest(rawText?: string): boolean {
  if (!rawText) return false;
  const clean = rawText.trim().toLowerCase();
  return HUMAN_REQUEST_TERMS.some((term) => clean.includes(term));
}
