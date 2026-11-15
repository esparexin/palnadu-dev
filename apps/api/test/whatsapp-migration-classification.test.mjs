import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { matchesMongoFilter } from './mongo-filter-evaluator.util.mjs';

const require = createRequire(import.meta.url);
const {
  MIGRATION_CLASS,
  MIGRATION_FILTER_CLASS_A,
  MIGRATION_FILTER_CLASS_B,
  MIGRATION_FILTER_CLASS_C,
  MIGRATION_FILTER_CLASS_D,
  MIGRATION_FILTER_CLASS_E,
  classifyConversationRecord,
  isEligibleForAutoMigration,
  getMigrationUpdatePayload,
} = require('../dist/whatsapp/whatsapp-migration.util.js');

const FILTERS = [
  { name: 'CLASS_A', filter: MIGRATION_FILTER_CLASS_A },
  { name: 'CLASS_B', filter: MIGRATION_FILTER_CLASS_B },
  { name: 'CLASS_C', filter: MIGRATION_FILTER_CLASS_C },
  { name: 'CLASS_D', filter: MIGRATION_FILTER_CLASS_D },
  { name: 'CLASS_E', filter: MIGRATION_FILTER_CLASS_E },
];

test('1. Direct MongoDB Filter: Quarantined fixtures match only Class D and never A, B, C, or E', () => {
  const quarantinedFixtures = [
    { name: 'flag boolean conflict', doc: { human_takeover: true, humanTakeover: false } },
    { name: 'flag reverse conflict', doc: { human_takeover: false, humanTakeover: true } },
    { name: 'flag populated vs empty string', doc: { human_takeover: true, humanTakeover: '' } },
    { name: 'flag populated vs null', doc: { human_takeover: false, humanTakeover: null } },
    { name: 'flag non-boolean string', doc: { human_takeover: 'true', humanTakeover: true } },
    { name: 'flag non-boolean number', doc: { human_takeover: 1 } },
    { name: 'initiator mismatch differing strings', doc: { last_initiator_id: 'admin_1', lastInitiatorId: 'admin_2' } },
    { name: 'initiator populated vs empty string', doc: { last_initiator_id: 'admin_1', lastInitiatorId: '' } },
    { name: 'initiator populated vs null', doc: { last_initiator_id: 'admin_1', lastInitiatorId: null } },
    { name: 'timestamp populated vs empty string', doc: { taken_over_at: new Date(), takenOverAt: '' } },
    { name: 'timestamp present with missing takeover flags', doc: { taken_over_at: new Date() } },
    { name: 'timestamp present with false takeover flags', doc: { takenOverAt: new Date(), human_takeover: false, humanTakeover: false } },
    { name: 'mode HUMAN_TAKEOVER with false takeover flag', doc: { mode: 'HUMAN_TAKEOVER', human_takeover: false, humanTakeover: false } },
    { name: 'mode AUTOMATED_ASSISTANCE with admin initiator', doc: { mode: 'AUTOMATED_ASSISTANCE', last_initiator_id: 'admin_1' } },
    { name: 'unknown mode with admin initiator', doc: { mode: 'UNKNOWN_LEGACY', lastInitiatorId: 'rep_42' } },
    { name: 'AWAITING_CHOICE with flag conflict', doc: { mode: 'AWAITING_CUSTOMER_CHOICE', human_takeover: true, humanTakeover: false } },
    { name: 'AWAITING_CHOICE with initiator conflict', doc: { mode: 'AWAITING_CUSTOMER_CHOICE', last_initiator_id: 'admin_1', lastInitiatorId: '' } },
  ];

  for (const { name, doc } of quarantinedFixtures) {
    const dMatch = matchesMongoFilter(MIGRATION_FILTER_CLASS_D, doc);
    assert.equal(dMatch, true, `Fixture "${name}" must match Class D filter`);

    assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_A, doc), false, `Fixture "${name}" must NOT match Class A`);
    assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_B, doc), false, `Fixture "${name}" must NOT match Class B`);
    assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_C, doc), false, `Fixture "${name}" must NOT match Class C`);
    assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_E, doc), false, `Fixture "${name}" must NOT match Class E`);

    const classification = classifyConversationRecord(doc);
    assert.equal(classification, MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW, `Fixture "${name}" must classify as Class D`);
    assert.equal(isEligibleForAutoMigration(classification), false, `Fixture "${name}" must not be auto-migrated`);
  }
});

test('2. Direct MongoDB Filter: Class A matches only consistent AWAITING_CUSTOMER_CHOICE', () => {
  const docConsistent = {
    mode: 'AWAITING_CUSTOMER_CHOICE',
    human_takeover: false,
    humanTakeover: false,
    last_initiator_id: 'admin_1',
    lastInitiatorId: 'admin_1',
  };
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_A, docConsistent), true);
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_D, docConsistent), false);
  assert.equal(classifyConversationRecord(docConsistent), MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE), true);

  const payload = getMigrationUpdatePayload(MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE);
  assert.equal(payload.$set.mode, 'HUMAN_TAKEOVER');
  assert.equal(payload.$set.human_takeover, true);
  assert.equal(payload.$set.humanTakeover, true);
});

test('3. Direct MongoDB Filter: Class B matches legacy takeover discrepancy', () => {
  const docSnake = { human_takeover: true, mode: 'AUTOMATED_ASSISTANCE' };
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_B, docSnake), true);
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_D, docSnake), false);
  assert.equal(classifyConversationRecord(docSnake), MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER);

  const docCamel = { humanTakeover: true, mode: null };
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_B, docCamel), true);
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_D, docCamel), false);
  assert.equal(classifyConversationRecord(docCamel), MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER);
});

test('4. Direct MongoDB Filter: Class C matches genuine admin initiated lacking mode', () => {
  const docSnake = { last_initiator_id: 'rep_42', human_takeover: false, mode: null };
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_C, docSnake), true);
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_D, docSnake), false);
  assert.equal(classifyConversationRecord(docSnake), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);

  const docCamel = { lastInitiatorId: 'admin_sales', humanTakeover: false, mode: '' };
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_C, docCamel), true);
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_D, docCamel), false);
  assert.equal(classifyConversationRecord(docCamel), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);
});

test('5. Direct MongoDB Filter: Class E matches verified automated records lacking mode', () => {
  const docMissingMode = { human_takeover: false, humanTakeover: false, state: 'IDLE' };
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_E, docMissingMode), true);
  assert.equal(matchesMongoFilter(MIGRATION_FILTER_CLASS_D, docMissingMode), false);
  assert.equal(classifyConversationRecord(docMissingMode), MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION);

  const payload = getMigrationUpdatePayload(MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION);
  assert.equal(payload.$set.mode, 'AUTOMATED_ASSISTANCE');
  assert.equal(payload.$set.human_takeover, false);
});

test('6. Compliant records remain completely untouched (Zero filter matches)', () => {
  const compliantTakeover = { mode: 'HUMAN_TAKEOVER', human_takeover: true, humanTakeover: true };
  for (const { name, filter } of FILTERS) {
    assert.equal(matchesMongoFilter(filter, compliantTakeover), false, `Compliant takeover must not match ${name}`);
  }
  assert.equal(classifyConversationRecord(compliantTakeover), MIGRATION_CLASS.CLASS_COMPLIANT);

  const compliantAutomation = { mode: 'AUTOMATED_ASSISTANCE', human_takeover: false, humanTakeover: false };
  for (const { name, filter } of FILTERS) {
    assert.equal(matchesMongoFilter(filter, compliantAutomation), false, `Compliant automation must not match ${name}`);
  }
  assert.equal(classifyConversationRecord(compliantAutomation), MIGRATION_CLASS.CLASS_COMPLIANT);
});

test('7. Insufficient evidence fallback leaves unknown states untouched', () => {
  const docSparse = { mode: 'CUSTOM_EXPERIMENTAL_MODE' };
  for (const { name, filter } of FILTERS) {
    assert.equal(matchesMongoFilter(filter, docSparse), false, `Sparse doc must not match ${name}`);
  }
  assert.equal(classifyConversationRecord(docSparse), MIGRATION_CLASS.CLASS_INSUFFICIENT_EVIDENCE);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_INSUFFICIENT_EVIDENCE), false);
  assert.equal(getMigrationUpdatePayload(MIGRATION_CLASS.CLASS_INSUFFICIENT_EVIDENCE), null);
});

test('8. Strict Mutual Exclusivity: At most one MongoDB filter matches across all fixtures', () => {
  const testCorpus = [
    { mode: 'AWAITING_CUSTOMER_CHOICE' },
    { mode: 'AWAITING_CUSTOMER_CHOICE', human_takeover: true, humanTakeover: false },
    { human_takeover: true, mode: 'AUTOMATED_ASSISTANCE' },
    { last_initiator_id: 'admin_1', human_takeover: false, mode: null },
    { last_initiator_id: 'admin_1', human_takeover: false, mode: 'AUTOMATED_ASSISTANCE' },
    { human_takeover: true, humanTakeover: false },
    { mode: null, human_takeover: false },
    { mode: 'HUMAN_TAKEOVER', human_takeover: true, humanTakeover: true },
    { mode: 'UNKNOWN_LEGACY_MODE' },
    { last_initiator_id: 'admin_1', lastInitiatorId: '' },
    { last_initiator_id: 'admin_1', lastInitiatorId: null },
    { human_takeover: 'true' },
    { human_takeover: 1 },
    { taken_over_at: new Date(), human_takeover: false },
  ];

  for (const doc of testCorpus) {
    const matchingFilters = FILTERS.filter(({ filter }) => matchesMongoFilter(filter, doc));
    assert.ok(
      matchingFilters.length <= 1,
      `Doc ${JSON.stringify(doc)} matched multiple filters: ${matchingFilters.map((m) => m.name).join(', ')}`,
    );
  }
});
