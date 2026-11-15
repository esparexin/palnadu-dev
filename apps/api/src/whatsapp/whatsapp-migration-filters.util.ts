/**
 * Audited MongoDB migration filters for WhatsApp conversation states.
 * Guarantees zero duplicate JavaScript object keys, strict mutual exclusivity,
 * and deterministic Class D quarantine precedence.
 */

export const CLASS_D_CONDITIONS = [
  // 1. Flag boolean mismatch between snake_case and camelCase
  { human_takeover: true, humanTakeover: false },
  { human_takeover: false, humanTakeover: true },

  // 2. Flag populated in one representation, explicitly null/empty in the other
  { human_takeover: { $in: [true, false] }, humanTakeover: { $exists: true, $in: [null, ''] } },
  { humanTakeover: { $in: [true, false] }, human_takeover: { $exists: true, $in: [null, ''] } },

  // 3. Flag invalid non-boolean types (strings, numbers, objects)
  { human_takeover: { $exists: true, $nin: [null, true, false] } },
  { humanTakeover: { $exists: true, $nin: [null, true, false] } },

  // 4. Initiator mismatch between populated strings
  {
    last_initiator_id: { $exists: true, $nin: [null, ''] },
    lastInitiatorId: { $exists: true, $nin: [null, ''] },
    $expr: { $ne: ['$last_initiator_id', '$lastInitiatorId'] },
  },

  // 5. Initiator populated in one representation, explicitly null/empty in the other
  {
    last_initiator_id: { $exists: true, $nin: [null, ''] },
    lastInitiatorId: { $exists: true, $in: [null, ''] },
  },
  {
    lastInitiatorId: { $exists: true, $nin: [null, ''] },
    last_initiator_id: { $exists: true, $in: [null, ''] },
  },

  // 6. Timestamp populated in one representation, explicitly null/empty in the other
  {
    taken_over_at: { $exists: true, $nin: [null, ''] },
    takenOverAt: { $exists: true, $in: [null, ''] },
  },
  {
    takenOverAt: { $exists: true, $nin: [null, ''] },
    taken_over_at: { $exists: true, $in: [null, ''] },
  },

  // 7. Timestamp present when takeover flags are missing or not true
  {
    $or: [
      { taken_over_at: { $exists: true, $nin: [null, ''] } },
      { takenOverAt: { $exists: true, $nin: [null, ''] } },
    ],
    human_takeover: { $ne: true },
    humanTakeover: { $ne: true },
  },

  // 8. Mode is HUMAN_TAKEOVER but takeover flags are not true
  {
    mode: 'HUMAN_TAKEOVER',
    human_takeover: { $ne: true },
    humanTakeover: { $ne: true },
  },

  // 9. Populated initiator present when mode contradicts human ownership
  {
    mode: { $nin: ['HUMAN_TAKEOVER', 'AWAITING_CUSTOMER_CHOICE', '', null] },
    $or: [
      { last_initiator_id: { $exists: true, $nin: [null, '', 'system', 'cron', 'automated'] } },
      { lastInitiatorId: { $exists: true, $nin: [null, '', 'system', 'cron', 'automated'] } },
    ],
  },
];

export const MIGRATION_FILTER_CLASS_D = {
  $or: CLASS_D_CONDITIONS,
};

export const MIGRATION_FILTER_CLASS_A = {
  $and: [
    { mode: 'AWAITING_CUSTOMER_CHOICE' },
    { $nor: CLASS_D_CONDITIONS },
  ],
};

export const MIGRATION_FILTER_CLASS_B = {
  $and: [
    { $or: [{ human_takeover: true }, { humanTakeover: true }] },
    {
      $or: [
        { mode: { $nin: ['HUMAN_TAKEOVER', 'AWAITING_CUSTOMER_CHOICE'] } },
        { mode: { $exists: false } },
        { mode: null },
      ],
    },
    { $nor: CLASS_D_CONDITIONS },
  ],
};

export const MIGRATION_FILTER_CLASS_C = {
  $and: [
    {
      $or: [
        { last_initiator_id: { $exists: true, $nin: [null, '', 'system', 'cron', 'automated'] } },
        { lastInitiatorId: { $exists: true, $nin: [null, '', 'system', 'cron', 'automated'] } },
      ],
    },
    { human_takeover: { $ne: true }, humanTakeover: { $ne: true } },
    {
      $or: [
        { mode: { $exists: false } },
        { mode: null },
        { mode: '' },
      ],
    },
    { $nor: CLASS_D_CONDITIONS },
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
    { human_takeover: { $in: [false, null] } },
    { humanTakeover: { $in: [false, null] } },
    { taken_over_at: { $in: [null] }, takenOverAt: { $in: [null] } },
    { $nor: CLASS_D_CONDITIONS },
  ],
};
