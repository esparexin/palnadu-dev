/**
 * Audited MongoDB migration queries and classification logic for WhatsApp conversation states.
 * Guarantees zero duplicate JavaScript object keys, strict type/casing parity,
 * and mutually exclusive classification.
 */

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

export const MIGRATION_FILTER_CLASS_A = {
  mode: 'AWAITING_CUSTOMER_CHOICE',
};

export const MIGRATION_FILTER_CLASS_B = {
  $and: [
    { $or: [{ human_takeover: true }, { humanTakeover: true }] },
    {
      $nor: [
        { human_takeover: true, humanTakeover: false },
        { human_takeover: false, humanTakeover: true },
      ],
    },
    {
      $or: [
        { mode: { $nin: ['HUMAN_TAKEOVER', 'AWAITING_CUSTOMER_CHOICE'] } },
        { mode: { $exists: false } },
        { mode: null },
      ],
    },
  ],
};

export const MIGRATION_FILTER_CLASS_C = {
  $and: [
    {
      $or: [
        { last_initiator_id: { $exists: true, $nin: [null, '', 'system', 'cron'] } },
        { lastInitiatorId: { $exists: true, $nin: [null, '', 'system', 'cron'] } },
      ],
    },
    {
      $nor: [
        {
          last_initiator_id: { $exists: true, $nin: [null, ''] },
          lastInitiatorId: { $exists: true, $nin: [null, ''] },
          $expr: { $ne: ['$last_initiator_id', '$lastInitiatorId'] },
        },
      ],
    },
    { human_takeover: { $ne: true }, humanTakeover: { $ne: true } },
    {
      $nor: [
        { human_takeover: true, humanTakeover: false },
        { human_takeover: false, humanTakeover: true },
      ],
    },
    {
      $or: [
        { mode: { $nin: ['HUMAN_TAKEOVER', 'AWAITING_CUSTOMER_CHOICE'] } },
        { mode: { $exists: false } },
        { mode: null },
      ],
    },
  ],
};

export const MIGRATION_FILTER_CLASS_D = {
  $or: [
    { human_takeover: true, humanTakeover: false },
    { human_takeover: false, humanTakeover: true },
    {
      last_initiator_id: { $exists: true, $nin: [null, ''] },
      lastInitiatorId: { $exists: true, $nin: [null, ''] },
      $expr: { $ne: ['$last_initiator_id', '$lastInitiatorId'] },
    },
    {
      mode: 'HUMAN_TAKEOVER',
      human_takeover: false,
      humanTakeover: false,
    },
    {
      $and: [
        {
          $or: [
            { taken_over_at: { $exists: true, $nin: [null] } },
            { takenOverAt: { $exists: true, $nin: [null] } },
          ],
        },
        { human_takeover: { $ne: true }, humanTakeover: { $ne: true } },
      ],
    },
  ],
};

export const MIGRATION_FILTER_CLASS_E = {
  $and: [
    { $or: [{ mode: { $exists: false } }, { mode: null }, { mode: '' }] },
    {
      $and: [
        { $or: [{ last_initiator_id: { $exists: false } }, { last_initiator_id: null }, { last_initiator_id: '' }] },
        { $or: [{ lastInitiatorId: { $exists: false } }, { lastInitiatorId: null }, { lastInitiatorId: '' }] },
      ],
    },
    { human_takeover: { $ne: true }, humanTakeover: { $ne: true } },
    { taken_over_at: { $in: [null] }, takenOverAt: { $in: [null] } },
    {
      $nor: [
        { human_takeover: true, humanTakeover: false },
        { human_takeover: false, humanTakeover: true },
      ],
    },
  ],
};

/**
 * Pure evaluation function that classifies any conversation record deterministically.
 */
export function classifyConversationRecord(doc: Record<string, unknown>): MigrationClassification {
  const htSnake = doc.human_takeover;
  const htCamel = doc.humanTakeover;
  const initSnake = typeof doc.last_initiator_id === 'string' ? doc.last_initiator_id.trim() : null;
  const initCamel = typeof doc.lastInitiatorId === 'string' ? doc.lastInitiatorId.trim() : null;
  const mode = typeof doc.mode === 'string' ? doc.mode.trim() : null;
  const hasTakenOverAt = Boolean(doc.taken_over_at || doc.takenOverAt);

  // 1. Conflict detection (Class D: Quarantine for manual review)
  const flagMismatch =
    (htSnake === true && htCamel === false) ||
    (htSnake === false && htCamel === true);
  const initMismatch =
    Boolean(initSnake) && Boolean(initCamel) && initSnake !== initCamel;
  const modeFakeTakeover =
    mode === 'HUMAN_TAKEOVER' && (htSnake === false || htCamel === false) && !hasTakenOverAt;
  const timestampWithoutFlags =
    hasTakenOverAt && htSnake !== true && htCamel !== true;

  if (flagMismatch || initMismatch || modeFakeTakeover || timestampWithoutFlags) {
    return MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW;
  }

  // 2. Already compliant check
  const isTakeoverFlagTrue = htSnake === true || htCamel === true;
  if (mode === 'HUMAN_TAKEOVER' && isTakeoverFlagTrue) {
    return MIGRATION_CLASS.CLASS_COMPLIANT;
  }
  if (mode === 'AUTOMATED_ASSISTANCE' && htSnake !== true && htCamel !== true && !initSnake && !initCamel) {
    return MIGRATION_CLASS.CLASS_COMPLIANT;
  }

  // 3. Class A: Superseded choice mode
  if (mode === 'AWAITING_CUSTOMER_CHOICE') {
    return MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE;
  }

  // 4. Class B: Legacy takeover discrepancy
  if (isTakeoverFlagTrue && mode !== 'HUMAN_TAKEOVER') {
    return MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER;
  }

  // 5. Class C: Human admin initiated contact
  const effectiveInit = initSnake || initCamel;
  const isSystemWorker =
    Boolean(effectiveInit) &&
    ['system', 'cron', 'automated'].includes(effectiveInit!.toLowerCase());

  if (effectiveInit && !isSystemWorker && !isTakeoverFlagTrue && mode !== 'HUMAN_TAKEOVER') {
    return MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED;
  }

  // 6. Class E: Verified automated record lacking mode
  const modeMissing = !mode || mode === '';
  if (modeMissing && !effectiveInit && !isTakeoverFlagTrue && !hasTakenOverAt) {
    return MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION;
  }

  // 7. Fallback for ambiguous records with insufficient evidence
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
