import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

describe('Phase 1: WhatsApp Business & Owner Number Identification', () => {
  const REGISTERED_BUSINESS_PHONE = '917901546167';
  const OWNER_PERSONAL_PHONE = '919030787819';
  const CUSTOMER_PHONE = '919876543210';

  it('1. Business number self-message: no customer-facing bot response across formats', async () => {
    const formats = [
      REGISTERED_BUSINESS_PHONE,
      '+91 79015 46167',
      '7901546167',
      '07901546167',
    ];

    for (const fmt of formats) {
      const env = createAssistantTestHarness({
        businessPhone: REGISTERED_BUSINESS_PHONE,
        ownerPhone: OWNER_PERSONAL_PHONE,
      });

      const res = await env.assistantService.handleInboundMessage({
        from: fmt,
        to: REGISTERED_BUSINESS_PHONE,
        body: 'Hello from WABA phone',
        wamId: `wamid.self_${Date.now()}_${Math.random()}`,
        direction: 'INBOUND',
        createdAt: new Date(),
      });

      assert.equal(res, null, `Assistant must not reply to business number format: ${fmt}`);
      assert.equal(env.interactiveDispatches.length, 0);
      assert.equal(env.textDispatches.length, 0);
      assert.equal(env.leads.size, 0);

      // Verify legacy auto-reply also ignores business self-messages
      const autoRes = await env.autoReplyService.handleAutoReply({
        from: fmt,
        to: REGISTERED_BUSINESS_PHONE,
        body: 'Hello from WABA phone',
        wamId: `wamid.self_auto_${Date.now()}_${Math.random()}`,
        direction: 'INBOUND',
        createdAt: new Date(),
      });
      assert.equal(autoRes, null);
    }
  });

  it('2. Owner personal number sends a test message: no customer lead or welcome automation', async () => {
    const ownerFormats = [
      OWNER_PERSONAL_PHONE,
      '+91 90307 87819',
      '9030787819',
      '09030787819',
    ];

    for (const fmt of ownerFormats) {
      const env = createAssistantTestHarness({
        businessPhone: REGISTERED_BUSINESS_PHONE,
        ownerPhone: OWNER_PERSONAL_PHONE,
      });

      const res = await env.assistantService.handleInboundMessage({
        from: fmt,
        to: REGISTERED_BUSINESS_PHONE,
        body: 'Hi, testing WhatsApp bot setup',
        wamId: `wamid.owner_test_${Date.now()}_${Math.random()}`,
        direction: 'INBOUND',
        createdAt: new Date(),
      });

      assert.equal(res, null, `Assistant must not send welcome menu to owner: ${fmt}`);
      assert.equal(env.interactiveDispatches.length, 0, 'No interactive list dispatched to owner');
      assert.equal(env.textDispatches.length, 0, 'No text response dispatched to owner');
      assert.equal(env.leads.size, 0, 'Owner test message must NEVER create a lead');

      // Verify legacy auto-reply also ignores owner messages
      const autoRes = await env.autoReplyService.handleAutoReply({
        from: fmt,
        to: REGISTERED_BUSINESS_PHONE,
        body: 'Hi',
        wamId: `wamid.owner_auto_${Date.now()}_${Math.random()}`,
        direction: 'INBOUND',
        createdAt: new Date(),
      });
      assert.equal(autoRes, null, 'Auto-reply must not acknowledge owner test messages');
    }
  });

  it('3. Genuine customer sends "Hi": normal customer journey works', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
      ownerPhone: OWNER_PERSONAL_PHONE,
    });

    const res = await env.assistantService.handleInboundMessage({
      from: CUSTOMER_PHONE,
      to: REGISTERED_BUSINESS_PHONE,
      body: 'Hi',
      wamId: 'wamid.cust_welcome_001',
      profileName: 'Genuine Customer',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    assert.ok(res, 'Customer must receive assistant welcome response');
    assert.equal(res.to, CUSTOMER_PHONE);
    assert.equal(env.interactiveDispatches.length, 1, 'Interactive main menu sent to customer');
    assert.equal(env.interactiveDispatches[0].to, CUSTOMER_PHONE);
  });

  it('4. Customer selects Corporate Website: selection is preserved', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
      ownerPhone: OWNER_PERSONAL_PHONE,
    });

    const step = await env.conversationService.processCustomerMessage(
      {
        body: 'Corporate Website',
        from: CUSTOMER_PHONE,
        wamId: 'wamid.cust_sel_001',
        rawPayload: { interactive: { button_reply: { id: 'sub_1_1', title: 'Corporate Website' } } },
      },
      {
        customerPhone: CUSTOMER_PHONE,
        state: 'AWAITING_SUBMENU',
        selectedCategory: '1',
        humanTakeover: false,
      },
    );

    assert.equal(step.nextState, 'AWAITING_REQUIREMENT');
    assert.equal(step.selectedCategory, '1');
    assert.equal(step.selectedSubmenu, '1');
  });

  it('5. Customer sends another greeting: previous selection is not overwritten', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
      ownerPhone: OWNER_PERSONAL_PHONE,
    });

    const step = await env.conversationService.processCustomerMessage(
      { body: 'Hi', from: CUSTOMER_PHONE, wamId: 'wamid.cust_greet_after_sel' },
      {
        customerPhone: CUSTOMER_PHONE,
        state: 'AWAITING_REQUIREMENT',
        selectedCategory: '1',
        selectedSubmenu: '1',
        humanTakeover: false,
      },
    );

    assert.equal(env.leads.size, 0, 'Greeting in AWAITING_REQUIREMENT must not create a lead');
    assert.equal(step.nextState, 'AWAITING_REQUIREMENT', 'State must stay AWAITING_REQUIREMENT');
    assert.equal(step.selectedCategory, '1', 'Category must be preserved');
    assert.equal(step.selectedSubmenu, '1', 'Submenu must be preserved');
    assert.match(step.responseText, /Corporate Website/i);
  });

  it('6. Customer under HUMAN_TAKEOVER: all automated replies remain suppressed', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
      ownerPhone: OWNER_PERSONAL_PHONE,
    });

    await env.takeoverService.setHumanTakeover(CUSTOMER_PHONE, true, { id: 'admin_1', name: 'Support' });

    const res = await env.assistantService.handleInboundMessage({
      from: CUSTOMER_PHONE,
      body: 'Can someone call me?',
      wamId: 'wamid.cust_takeover_msg',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Bot reply must be strictly suppressed under human takeover');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('7. Duplicate webhook delivery: no duplicate outbound response', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
      ownerPhone: OWNER_PERSONAL_PHONE,
    });

    const payload = {
      from: CUSTOMER_PHONE,
      to: REGISTERED_BUSINESS_PHONE,
      body: 'Hi',
      wamId: 'wamid.dup_delivery_001',
      createdAt: new Date(),
    };

    const first = await env.assistantService.handleInboundMessage(payload);
    assert.ok(first);
    assert.equal(env.interactiveDispatches.length, 1);

    const second = await env.assistantService.handleInboundMessage(payload);
    assert.equal(second, null, 'Second delivery must be deduplicated via wamId');
    assert.equal(env.interactiveDispatches.length, 1, 'No duplicate dispatch occurred');
  });
});
