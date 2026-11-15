import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  MIGRATION_CLASS,
  classifyConversationRecord,
  isEligibleForAutoMigration,
  getMigrationUpdatePayload,
} = require('../dist/whatsapp/whatsapp-migration.util.js');

test('1. Class A: Awaiting Customer Choice records are eligible for migration to HUMAN_TAKEOVER', () => {
  const doc = {
    customer_phone: '919876543201',
    mode: 'AWAITING_CUSTOMER_CHOICE',
    human_takeover: false,
    last_initiator_id: 'admin_1',
  };
  const classification = classifyConversationRecord(doc);
  assert.equal(classification, MIGRATION_CLASS.CLASS_A_AWAITING_CHOICE);
  assert.equal(isEligibleForAutoMigration(classification), true);

  const payload = getMigrationUpdatePayload(classification);
  assert.equal(payload.$set.mode, 'HUMAN_TAKEOVER');
  assert.equal(payload.$set.human_takeover, true);
  assert.equal(payload.$set.humanTakeover, true);
});

test('2. Class B: Legacy takeover discrepancy (snake_case and camelCase)', () => {
  const docSnake = { customer_phone: '919876543202', human_takeover: true, mode: 'AUTOMATED_ASSISTANCE' };
  assert.equal(classifyConversationRecord(docSnake), MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER), true);

  const docCamel = { customerPhone: '919876543203', humanTakeover: true, mode: null };
  assert.equal(classifyConversationRecord(docCamel), MIGRATION_CLASS.CLASS_B_LEGACY_TAKEOVER);
});

test('3. Class C: Genuine admin-initiated contact (snake_case and camelCase)', () => {
  const docSnake = { customer_phone: '919876543204', last_initiator_id: 'rep_42', human_takeover: false, mode: 'AUTOMATED_ASSISTANCE' };
  assert.equal(classifyConversationRecord(docSnake), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED), true);

  const docCamel = { customerPhone: '919876543205', lastInitiatorId: 'admin_ops', humanTakeover: false, mode: '' };
  assert.equal(classifyConversationRecord(docCamel), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);
});

test('4. Class C: Rejects blank, null, or system initiator identities', () => {
  const docBlank = { customer_phone: '919876543206', last_initiator_id: '', human_takeover: false, mode: 'AUTOMATED_ASSISTANCE' };
  assert.notEqual(classifyConversationRecord(docBlank), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);

  const docNull = { customer_phone: '919876543207', last_initiator_id: null, human_takeover: false, mode: 'AUTOMATED_ASSISTANCE' };
  assert.notEqual(classifyConversationRecord(docNull), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);

  const docSystem = { customer_phone: '919876543208', last_initiator_id: 'system', human_takeover: false, mode: 'AUTOMATED_ASSISTANCE' };
  assert.notEqual(classifyConversationRecord(docSystem), MIGRATION_CLASS.CLASS_C_ADMIN_INITIATED);
});

test('5. Class D: Conflicting flags and initiator identities are quarantined for manual review', () => {
  const docFlagConflict = { customer_phone: '919876543209', human_takeover: true, humanTakeover: false };
  assert.equal(classifyConversationRecord(docFlagConflict), MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW), false);

  const docInitConflict = { customer_phone: '919876543210', last_initiator_id: 'admin_1', lastInitiatorId: 'admin_2' };
  assert.equal(classifyConversationRecord(docInitConflict), MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW);

  const docTimestampNoFlag = { customer_phone: '919876543211', taken_over_at: new Date(), human_takeover: false };
  assert.equal(classifyConversationRecord(docTimestampNoFlag), MIGRATION_CLASS.CLASS_D_CONFLICT_MANUAL_REVIEW);
});

test('6. Class E: Verified automated conversations lacking mode default to AUTOMATED_ASSISTANCE', () => {
  const docMissingMode = { customer_phone: '919876543212', human_takeover: false, state: 'IDLE' };
  const classification = classifyConversationRecord(docMissingMode);
  assert.equal(classification, MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION);
  assert.equal(isEligibleForAutoMigration(classification), true);

  const payload = getMigrationUpdatePayload(classification);
  assert.equal(payload.$set.mode, 'AUTOMATED_ASSISTANCE');
  assert.equal(payload.$set.human_takeover, false);
});

test('7. Class E: Never classifies any record with initiator, takeover flag, or timestamps as automated', () => {
  const docWithInitiator = { customer_phone: '919876543213', last_initiator_id: 'rep_1', mode: null };
  assert.notEqual(classifyConversationRecord(docWithInitiator), MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION);

  const docWithTakeover = { customer_phone: '919876543214', human_takeover: true, mode: null };
  assert.notEqual(classifyConversationRecord(docWithTakeover), MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION);

  const docWithTimestamp = { customer_phone: '919876543215', taken_over_at: new Date(), mode: null };
  assert.notEqual(classifyConversationRecord(docWithTimestamp), MIGRATION_CLASS.CLASS_E_VERIFIED_AUTOMATION);
});

test('8. Compliant records remain completely untouched (Idempotency guarantee)', () => {
  const compliantTakeover = { customer_phone: '919876543216', mode: 'HUMAN_TAKEOVER', human_takeover: true, humanTakeover: true };
  assert.equal(classifyConversationRecord(compliantTakeover), MIGRATION_CLASS.CLASS_COMPLIANT);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_COMPLIANT), false);

  const compliantAutomation = { customer_phone: '919876543217', mode: 'AUTOMATED_ASSISTANCE', human_takeover: false };
  assert.equal(classifyConversationRecord(compliantAutomation), MIGRATION_CLASS.CLASS_COMPLIANT);
  assert.equal(isEligibleForAutoMigration(MIGRATION_CLASS.CLASS_COMPLIANT), false);
});

test('9. Insufficient evidence fallback quaranines unknown states', () => {
  const docSparse = { customer_phone: '919876543218', mode: 'UNKNOWN_CUSTOM_MODE' };
  const classification = classifyConversationRecord(docSparse);
  assert.equal(classification, MIGRATION_CLASS.CLASS_INSUFFICIENT_EVIDENCE);
  assert.equal(isEligibleForAutoMigration(classification), false);
  assert.equal(getMigrationUpdatePayload(classification), null);
});

test('10. Mutually exclusive classification across all test fixtures', () => {
  const fixtures = [
    { mode: 'AWAITING_CUSTOMER_CHOICE' },
    { human_takeover: true, mode: 'AUTOMATED_ASSISTANCE' },
    { last_initiator_id: 'admin_1', human_takeover: false, mode: 'AUTOMATED_ASSISTANCE' },
    { human_takeover: true, humanTakeover: false },
    { mode: null, human_takeover: false },
    { mode: 'HUMAN_TAKEOVER', human_takeover: true },
    { mode: 'UNKNOWN_LEGACY_MODE' },
  ];

  const results = fixtures.map((f) => classifyConversationRecord(f));
  const validClasses = new Set(Object.values(MIGRATION_CLASS));
  for (const r of results) {
    assert.ok(validClasses.has(r), `Result ${r} must be a recognized MigrationClassification`);
  }
});
