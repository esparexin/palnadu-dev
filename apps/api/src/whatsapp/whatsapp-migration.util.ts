/**
 * Audited MongoDB migration queries and classification logic for WhatsApp conversation states.
 * Guarantees zero duplicate JavaScript object keys, strict type/casing parity,
 * and mutually exclusive classification.
 */

export {
  CLASS_D_CONDITIONS,
  MIGRATION_FILTER_CLASS_A,
  MIGRATION_FILTER_CLASS_B,
  MIGRATION_FILTER_CLASS_C,
  MIGRATION_FILTER_CLASS_D,
  MIGRATION_FILTER_CLASS_E,
} from './whatsapp-migration-filters.util';

export const MIGRATION_CLASS = {
  CLASS_A_AWAITING_CHOICE: 'CLASS_A_AWAITING_CHOICE',
  CLASS_B_LEGACY_TAKEOVER: 'CLASS_B_LEGACY_TAKEOVER',
  CLASS_C_ADMIN_INITIATED: 'CLASS_C_ADMIN_INITIATED',
  CLASS_D_CONFLICT_MANUAL_REVIEW: 'CLASS_D_CONFLICT_MANUAL_REVIEW',
  CLASS_E_VERIFIED_AUTOMATION: 'CLASS_E_VERIFIED_AUTOMATION',
  CLASS_COMPLIANT: 'CLASS_COMPLIANT',
  CLASS_INSUFFICIENT_EVIDENCE: 'CLASS_INSUFFICIENT_EVIDENCE',
} as const;

export type MigrationClassification = (typeof MIGRATION_CLASS)[keyof typeof MIGRATION_CLASS];

function isBoolean(val: unknown): val is boolean {
  return typeof val === 'boolean';
}

function isInvalidBoolean(val: unknown): boolean {
  return val !== undefined && val !== null && typeof val !== 'boolean';
}

/**
 * Pure evaluation function that classifies any conversation record deterministically.
 */
export function classifyConversationRecord(doc: Record<string, unknown>): MigrationClassification {
  const htSnake = doc.human_takeover;
  const htCamel = doc.humanTakeover;
  const initSnake = typeof doc.last_initiator_id === 'string' && doc.last_initiator_id.trim() !== '' ? doc.last_initiator_id.trim() : null;
  const initCamel = typeof doc.lastInitiatorId === 'string' && doc.lastInitiatorId.trim() !== '' ? doc.lastInitiatorId.trim() : null;
  const mode = typeof doc.mode === 'string' && doc.mode.trim() !== '' ? doc.mode.trim() : null;
  const hasSnakeTime = Boolean(doc.taken_over_at);
  const hasCamelTime = Boolean(doc.takenOverAt);
  const hasTime = hasSnakeTime || hasCamelTime;

  // 1. Conflict and Ambiguity Detection (Class D: Quarantine for Manual Review)
  const flagMismatch = (htSnake === true && htCamel === false) || (htSnake === false && htCamel === true);
  const flagRepMismatch =
    (isBoolean(htSnake) && 'humanTakeover' in doc && (doc.humanTakeover === null || doc.humanTakeover === '')) ||
    (isBoolean(htCamel) && 'human_takeover' in doc && (doc.human_takeover === null || doc.human_takeover === ''));
  const flagTypeInvalid = isInvalidBoolean(htSnake) || isInvalidBoolean(htCamel);

  const initMismatch = Boolean(initSnake) && Boolean(initCamel) && initSnake !== initCamel;
  const initRepMismatch =
    (Boolean(initSnake) && 'lastInitiatorId' in doc && (doc.lastInitiatorId === null || doc.lastInitiatorId === '')) ||
    (Boolean(initCamel) && 'last_initiator_id' in doc && (doc.last_initiator_id === null || doc.last_initiator_id === ''));

  const timeRepMismatch =
    (hasSnakeTime && 'takenOverAt' in doc && (doc.takenOverAt === null || doc.takenOverAt === '')) ||
    (hasCamelTime && 'taken_over_at' in doc && (doc.taken_over_at === null || doc.taken_over_at === ''));
  const timeWithoutFlag = hasTime && htSnake !== true && htCamel !== true;

  const modeFakeTakeover = mode === 'HUMAN_TAKEOVER' && htSnake !== true && htCamel !== true;

  const effectiveInit = initSnake || initCamel;
  const isSystemWorker = Boolean(effectiveInit) && ['system', 'cron', 'automated'].includes(effectiveInit!.toLowerCase());
  const modeContradictsHuman = Boolean(effectiveInit) && !isSystemWorker && Boolean(mode) && !['HUMAN_TAKEOVER', 'AWAITING_CUSTOMER_CHOICE'].includes(mode!);

  if (
    flagMismatch ||
    flagRepMismatch ||
    flagTypeInvalid ||
    initMismatch ||
    initRepMismatch ||
    timeRepMismatch ||
    timeWithoutFlag ||
    modeFakeTakeover ||
    modeContradictsHuman
  ) {
    return MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW;
  }

  // 2. Already Compliant Check (Idempotency guarantee)
  const isTakeoverFlagTrue = htSnake === true || htCamel === true;
  if (mode === 'HUMAN_TAKEOVER' && isTakeoverFlagTrue) {
    return MIGRATION_CLASS.CLASS_COMPLIANT;
  }
  if (mode === 'AUTOMATED_ASSISTANCE' && htSnake !== true && htCamel !== true && !effectiveInit && !hasTime) {
    return MIGRATION_CLASS.CLASS_COMPLIANT;
  }

  // 3. Class A: Superseded Choice Mode
  if (mode === 'AWAITING_CUSTOMER_CHOICE') {
    return MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE;
  }

  // 4. Class B: Legacy Takeover Discrepancy
  if (isTakeoverFlagTrue && mode !== 'HUMAN_TAKEOVER') {
    return MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER;
  }

  // 5. Class C: Human Admin Initiated Contact
  if (effectiveInit && !isSystemWorker && !isTakeoverFlagTrue && !mode) {
    return MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED;
  }

  // 6. Class E: Verified Automated Record Lacking Mode
  if (!mode && !effectiveInit && !isTakeoverFlagTrue && !hasTime) {
    return MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION;
  }

  // 7. Fallback for Ambiguous Records With Insufficient Evidence
  return MIGRATION_CLASS.CLASS_INSUFFICIENT_EVIDENCE;
}

export function isEligibleForAutoMigration(classification: MigrationClassification): boolean {
  return (
    classification === MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE ||
    classification === MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER ||
    classification === MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED ||
    classification === MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION
  );
}

export function getMigrationUpdatePayload(
  classification: MigrationClassification,
  now = new Date(),
): Record<string, unknown> | null {
  if (
    classification === MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE ||
    classification === MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER ||
    classification === MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED
  ) {
    return {
      $set: {
        mode: 'HUMAN_TAKEOVER',
        human_takeover: true,
        humanTakeover: true,
        mode_updated_at: now,
        modeUpdatedAt: now,
      },
    };
  }

  if (classification === MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION) {
    return {
      $set: {
        mode: 'AUTOMATED_ASSISTANCE',
        human_takeover: false,
        humanTakeover: false,
        mode_updated_at: now,
        modeUpdatedAt: now,
      },
    };
  }

  return null;
}
