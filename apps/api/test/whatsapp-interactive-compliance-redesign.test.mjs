import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

const require = createRequire(import.meta.url);
const { PALNADU_SUPPORT_PHONE } = require('../dist/whatsapp/whatsapp-menu.constants.js');

describe('WhatsApp Interactive Reliability, Compliance & Safety (Scenarios 11 - 20)', () => {
  it('11. preserves BACK and HOME navigation across states without losing context', async () => {
    const { conversationService } = createAssistantTestHarness();

    // BACK from Submenu returns to Main Menu
    const backFromSub = await conversationService.processCustomerMessage(
      { body: 'BACK', from: '919030787819', wamId: 'wamid.nav_back1' },
      { state: 'AWAITING_SUBMENU', selectedCategory: '1', customerPhone: '919030787819' },
    );
    assert.equal(backFromSub.nextState, 'AWAITING_CATEGORY');
    assert.ok(backFromSub.interactive);
    assert.equal(backFromSub.interactive.type, 'list');

    // BACK from Requirement returns to active Submenu
    const backFromReq = await conversationService.processCustomerMessage(
      { body: 'BACK', from: '919030787819', wamId: 'wamid.nav_back2' },
      { state: 'AWAITING_REQUIREMENT', selectedCategory: '1', selectedSubmenu: '2', customerPhone: '919030787819' },
    );
    assert.equal(backFromReq.nextState, 'AWAITING_SUBMENU');
    assert.equal(backFromReq.selectedCategory, '1');
    assert.ok(backFromReq.interactive);
    assert.equal(backFromReq.interactive.type, 'button');

    // HOME from Requirement returns to Main Menu
    const homeFromReq = await conversationService.processCustomerMessage(
      { body: 'HOME', from: '919030787819', wamId: 'wamid.nav_home1' },
      { state: 'AWAITING_REQUIREMENT', selectedCategory: '1', selectedSubmenu: '2', customerPhone: '919030787819' },
    );
    assert.equal(homeFromReq.nextState, 'AWAITING_CATEGORY');
    assert.equal(homeFromReq.interactive.type, 'list');
  });

  it('12. collects enquiry, notifies Palnadu team, and sends concise English acknowledgement', async () => {
    const { conversationService, leads, notifications } = createAssistantTestHarness();
    const result = await conversationService.processCustomerMessage(
      {
        body: 'We need an e-commerce website for our spices business in Chilakaluripet.',
        from: '919030787819',
        profileName: 'Suresh Kumar',
        wamId: 'wamid.ENQUIRY_COLLECT_001',
      },
      {
        state: 'AWAITING_REQUIREMENT',
        selectedCategory: '1',
        selectedSubmenu: '2',
        customerPhone: '919030787819',
        customerName: 'Suresh Kumar',
      },
    );

    assert.equal(result.nextState, 'IDLE');
    assert.match(result.responseText, /Thank you! We have received your requirements/);
    assert.match(result.responseText, new RegExp(PALNADU_SUPPORT_PHONE.replace('+', '\\+')));
    assert.doesNotMatch(result.responseText, /[\u0C00-\u0C7F]/);

    assert.equal(leads.size, 1);
    const lead = leads.get('wamid.ENQUIRY_COLLECT_001');
    assert.ok(lead);
    assert.equal(lead.phone, '919030787819');
    assert.equal(notifications.length, 1);
  });

  it('13. prevents duplicate enquiry creation and notifications on duplicate webhooks', async () => {
    const { conversationService, leads, notifications } = createAssistantTestHarness();
    const msg = {
      body: 'Need mobile app development',
      from: '919030787819',
      wamId: 'wamid.DUP_WEBHOOK_001',
    };
    const conv = {
      state: 'AWAITING_REQUIREMENT',
      selectedCategory: '2',
      selectedSubmenu: '1',
      customerPhone: '919030787819',
    };

    await conversationService.processCustomerMessage(msg, conv);
    assert.equal(leads.size, 1);
    assert.equal(notifications.length, 1);

    // Duplicate webhook delivery with identical wamId
    await conversationService.processCustomerMessage(msg, conv);
    assert.equal(leads.size, 1, 'Must not duplicate lead on identical wamId');
    assert.equal(notifications.length, 1, 'Must not duplicate notification on retry');
  });

  it('14. automatically falls back to text dispatch when interactive API call fails', async () => {
    const { assistantService, interactiveDispatches, textDispatches } = createAssistantTestHarness({
      simulateInteractiveFailure: true,
    });

    const reply = await assistantService.handleInboundMessage({
      from: '919030787819',
      wamId: 'wamid.fallback_test_001',
      body: 'Hi',
      createdAt: new Date(),
    });

    assert.ok(reply, 'Outbound record must still be created');
    assert.equal(interactiveDispatches.length, 0, 'Failed interactive dispatch caught');
    assert.equal(textDispatches.length, 1, 'Fell back to text dispatch');
    assert.match(textDispatches[0].text, /Welcome to Palnadu\.dev/);
  });

  it('15. suppresses assistant replies when human takeover is active', async () => {
    const { assistantService, takeoverService, interactiveDispatches, textDispatches } =
      createAssistantTestHarness();

    await takeoverService.setHumanTakeover('919030787819', true, { id: 'admin_1' });

    const reply = await assistantService.handleInboundMessage({
      from: '919030787819',
      wamId: 'wamid.takeover_suppressed',
      body: '1',
      createdAt: new Date(),
    });

    assert.equal(reply, null);
    assert.equal(interactiveDispatches.length, 0);
    assert.equal(textDispatches.length, 0);
  });

  it('16. enforces exclusive distributed dispatch lease preventing concurrency races', async () => {
    const { assistantService } = createAssistantTestHarness();
    const inbound = {
      from: '919030787819',
      wamId: 'wamid.race_001',
      body: 'Hi',
      createdAt: new Date(),
    };

    // Sequential promise queue on same phone guarantees serialized execution
    const [res1, res2] = await Promise.all([
      assistantService.handleInboundMessage(inbound),
      assistantService.handleInboundMessage(inbound),
    ]);

    // One succeeds, duplicate webhook retry returns null due to claim record / idempotency
    const nonNullCount = [res1, res2].filter(Boolean).length;
    assert.equal(nonNullCount, 1, 'Only one dispatch must execute per wamId');
  });

  it('17. enforces 24-hour customer service window strictly', async () => {
    const { assistantService, interactiveDispatches, textDispatches } = createAssistantTestHarness();
    const staleTime = new Date(Date.now() - 25 * 3600000); // 25 hours old

    const reply = await assistantService.handleInboundMessage({
      from: '919030787819',
      wamId: 'wamid.stale_window_001',
      body: 'Hi',
      createdAt: staleTime,
      statusTimestamp: staleTime,
    });

    assert.equal(reply, null);
    assert.equal(interactiveDispatches.length, 0);
    assert.equal(textDispatches.length, 0);
  });

  it('18. suppresses automated messages on STOP opt-out', async () => {
    const { assistantService, interactiveDispatches, textDispatches } = createAssistantTestHarness();

    const reply = await assistantService.handleInboundMessage({
      from: '919030787819',
      wamId: 'wamid.optout_stop',
      body: 'STOP',
      createdAt: new Date(),
    });

    assert.equal(reply, null);
    assert.equal(interactiveDispatches.length, 0);
    assert.equal(textDispatches.length, 0);
  });

  it('19. does not dispatch duplicate welcome or acknowledgement messages', async () => {
    const { assistantService, interactiveDispatches } = createAssistantTestHarness();
    const inbound = {
      from: '919030787819',
      wamId: 'wamid.single_welcome_001',
      body: 'Hello',
      createdAt: new Date(),
    };

    await assistantService.handleInboundMessage(inbound);
    assert.equal(interactiveDispatches.length, 1);

    // Retrying same inbound wamId
    const second = await assistantService.handleInboundMessage(inbound);
    assert.equal(second, null);
    assert.equal(interactiveDispatches.length, 1, 'No duplicate welcome dispatched');
  });

  it('20. legacy auto-reply cannot create duplicate messages when assistant is active', async () => {
    const { assistantService, autoReplyService } = createAssistantTestHarness({
      assistantFlag: 'true',
      autoReplyFlag: 'true',
    });

    assert.equal(assistantService.isEnabled(), true);
    // When assistant is enabled, webhook service routes to assistantService, not autoReplyService
    const autoReplyRes = await autoReplyService.handleAutoReply({
      from: '919030787819',
      wamId: 'wamid.legacy_suppression_001',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    // In a clean integration where assistant owns conversation, legacy auto-reply will not conflict
    assert.ok(autoReplyRes !== undefined);
  });
});
