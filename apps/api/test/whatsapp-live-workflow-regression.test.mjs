import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

describe('WhatsApp Live-Workflow Regression Tests (Defects 1 & 2)', () => {
  const REGISTERED_BUSINESS_PHONE = '917901546167';
  const KALYAN_PHONE = '919876543210';
  const OTHER_CUSTOMER_PHONE = '919876543211';

  it('Defect 1: business number self-message must NOT trigger assistant or auto-reply', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
    });

    // Inbound message where 'from' is the registered WhatsApp Business number (+91 79015 46167)
    const selfMessage = {
      from: REGISTERED_BUSINESS_PHONE,
      to: REGISTERED_BUSINESS_PHONE,
      body: 'Hi',
      wamId: 'wamid.self_msg_001',
      profileName: 'Palnadu.dev Business',
      direction: 'INBOUND',
      createdAt: new Date(),
    };

    const res = await env.assistantService.handleInboundMessage(selfMessage);

    // Expected: assistant must NEVER reply to the business number itself
    assert.equal(res, null, 'Assistant must not reply to registered business number');
    assert.equal(env.interactiveDispatches.length, 0, 'No interactive list sent to business number');
    assert.equal(env.textDispatches.length, 0, 'No text message sent to business number');
  });

  it('Defect 2: customer sending "Hi" in AWAITING_REQUIREMENT must NOT overwrite selected service', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
    });

    // 1. Kalyan selects Category 1 (Website & Web Apps) -> Suboption 1 (Corporate Website) via interactive button
    const suboptionStep = await env.conversationService.processCustomerMessage(
      {
        body: 'Corporate Website',
        from: KALYAN_PHONE,
        wamId: 'wamid.kalyan_sub1',
        rawPayload: {
          interactive: {
            button_reply: { id: 'sub_1_1', title: 'Corporate Website' },
          },
        },
      },
      {
        customerPhone: KALYAN_PHONE,
        state: 'AWAITING_SUBMENU',
        selectedCategory: '1',
        humanTakeover: false,
      },
    );

    assert.equal(suboptionStep.nextState, 'AWAITING_REQUIREMENT');
    assert.equal(suboptionStep.selectedCategory, '1');
    assert.equal(suboptionStep.selectedSubmenu, '1');

    // 2. Kalyan sends "Hi" instead of immediate requirements
    const greetingStep = await env.conversationService.processCustomerMessage(
      { body: 'Hi', from: KALYAN_PHONE, wamId: 'wamid.kalyan_hi_001' },
      {
        customerPhone: KALYAN_PHONE,
        state: 'AWAITING_REQUIREMENT',
        selectedCategory: '1',
        selectedSubmenu: '1',
        humanTakeover: false,
      },
    );

    // CRITICAL: "Hi" must NOT submit an enquiry with requirement "Hi"
    assert.equal(env.leads.size, 0, 'Greeting "Hi" must not be saved as a lead requirement');

    // CRITICAL: "Hi" must NOT reset state to IDLE or wipe selectedCategory/selectedSubmenu
    assert.notEqual(greetingStep.nextState, 'IDLE', 'State must not reset to IDLE on greeting');
    assert.equal(greetingStep.nextState, 'AWAITING_REQUIREMENT', 'Must stay in AWAITING_REQUIREMENT');
    assert.equal(greetingStep.selectedCategory, '1', 'selectedCategory 1 must be preserved');
    assert.equal(greetingStep.selectedSubmenu, '1', 'selectedSubmenu 1 must be preserved');

    // CRITICAL: Must NOT resend full main menu (View Services list)
    assert.equal(greetingStep.interactive, undefined, 'Must not resend interactive main menu list');
    assert.match(greetingStep.responseText, /Corporate Website/i, 'Response must reference selected service');
  });

  it('Defect 2: customer sending "Hi" in IDLE with existing selection acknowledges selected service', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
    });

    // Customer with existing selection (Corporate Website) sends "Hi"
    const step = await env.conversationService.processCustomerMessage(
      { body: 'Hi', from: KALYAN_PHONE, wamId: 'wamid.kalyan_hi_002' },
      {
        customerPhone: KALYAN_PHONE,
        state: 'IDLE',
        selectedCategory: '1',
        selectedSubmenu: '1',
        humanTakeover: false,
      },
    );

    // Must NOT blindly resend full main menu list
    assert.match(step.responseText, /Corporate Website/i, 'Must acknowledge existing service selection');
    assert.equal(step.selectedCategory, '1', 'Category must be preserved');
    assert.equal(step.selectedSubmenu, '1', 'Submenu must be preserved');
  });

  it('Defect 2: selections must never leak across different customers', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
    });

    // Kalyan selects Category 1 (Website)
    const kalyanStep = await env.conversationService.processCustomerMessage(
      { body: '1', from: KALYAN_PHONE, wamId: 'wamid.k_cat1' },
      { customerPhone: KALYAN_PHONE, state: 'AWAITING_CATEGORY', humanTakeover: false },
    );

    // Another customer selects Category 2 (Mobile App Development)
    const otherStep = await env.conversationService.processCustomerMessage(
      { body: '2', from: OTHER_CUSTOMER_PHONE, wamId: 'wamid.o_cat2' },
      { customerPhone: OTHER_CUSTOMER_PHONE, state: 'AWAITING_CATEGORY', humanTakeover: false },
    );

    assert.equal(kalyanStep.selectedCategory, '1');
    assert.equal(otherStep.selectedCategory, '2');

    // Kalyan subsequent message keeps Kalyan's selection
    const kalyanFollowup = await env.conversationService.processCustomerMessage(
      { body: '1', from: KALYAN_PHONE, wamId: 'wamid.k_sub1' },
      {
        customerPhone: KALYAN_PHONE,
        state: 'AWAITING_SUBMENU',
        selectedCategory: '1',
        humanTakeover: false,
      },
    );

    assert.equal(kalyanFollowup.selectedCategory, '1');
    assert.equal(kalyanFollowup.selectedSubmenu, '1');
    assert.match(kalyanFollowup.responseText, /describe what you need/i);
  });

  it('Defect 1: genuine customer messages are NOT suppressed', async () => {
    const env = createAssistantTestHarness({
      businessPhone: REGISTERED_BUSINESS_PHONE,
    });

    // Customer message from 919876543210 to the business
    const customerMsg = {
      from: KALYAN_PHONE,
      to: REGISTERED_BUSINESS_PHONE,
      body: 'Hi',
      wamId: 'wamid.cust_greeting_001',
      profileName: 'Kalyan S V M',
      direction: 'INBOUND',
      createdAt: new Date(),
    };

    const res = await env.assistantService.handleInboundMessage(customerMsg);

    // Customer MUST receive welcome menu
    assert.ok(res, 'Genuine customer message must receive assistant response');
    assert.equal(res.to, KALYAN_PHONE, 'Response must be addressed to customer');
    assert.equal(env.interactiveDispatches.length, 1, 'Interactive list sent to customer');
    assert.equal(env.interactiveDispatches[0].to, KALYAN_PHONE);
  });
});
