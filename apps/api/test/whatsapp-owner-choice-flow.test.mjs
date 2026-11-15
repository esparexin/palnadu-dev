import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

describe('WhatsApp Owner-Initiated Conversation & Customer Choice Flow (Scenarios 1 - 9)', () => {
  const PHONE = '919030787819';
  const ADMIN = { id: 'admin_owner', name: 'Palnadu Owner' };

  it('1. owner initiates a manual conversation via sendManualReply', async () => {
    const env = createAssistantTestHarness();
    const msg = await env.takeoverService.sendManualReply(PHONE, 'Hello from Palnadu team!', ADMIN);

    assert.equal(msg.direction, 'OUTBOUND');
    assert.equal(msg.body, 'Hello from Palnadu team!');
    assert.equal(msg.rawPayload?.origin, 'MANUAL_ADMIN');
    assert.equal(msg.rawPayload?.adminId, ADMIN.id);
    assert.equal(env.textDispatches.length, 1);
  });

  it('2. owner message sets AWAITING_CUSTOMER_CHOICE and does NOT activate human takeover', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Checking in on your project', ADMIN);

    const conv = env.conversations.get(PHONE);
    assert.ok(conv);
    assert.equal(conv.mode, 'AWAITING_CUSTOMER_CHOICE');
    assert.equal(conv.humanTakeover, false);
    assert.equal(conv.lastInitiatorId, ADMIN.id);
    assert.equal(conv.lastInitiatorName, ADMIN.name);
  });

  it('3. customer replies to owner message and receives two choice reply buttons', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hi, I received your message',
      wamId: 'wamid.cust_reply_001',
      createdAt: new Date(),
    });

    assert.ok(res);
    assert.equal(env.interactiveDispatches.length, 1);
    const dispatch = env.interactiveDispatches[0];
    assert.equal(dispatch.interactive.type, 'button');
    assert.ok(dispatch.interactive.body.text.includes('How would you like to continue?'));

    const buttons = dispatch.interactive.action.buttons;
    assert.equal(buttons.length, 2);
    assert.equal(buttons[0].reply.id, 'choice_automated');
    assert.equal(buttons[0].reply.title, 'Automated Assistance');
    assert.equal(buttons[1].reply.id, 'choice_human');
    assert.equal(buttons[1].reply.title, 'Talk to Our Team');

    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'AWAITING_CUSTOMER_CHOICE');
  });

  it('4. customer selects Automated Assistance and receives 6-category main menu', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Automated Assistance',
      wamId: 'wamid.cust_choice_auto_001',
      type: 'interactive',
      createdAt: new Date(),
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'choice_automated', title: 'Automated Assistance' },
        },
      },
    });

    assert.ok(res);
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'AUTOMATED_ASSISTANCE');
    assert.equal(conv.humanTakeover, false);

    assert.equal(env.interactiveDispatches.length, 1);
    const dispatch = env.interactiveDispatches[0];
    assert.equal(dispatch.interactive.type, 'list');
    assert.equal(dispatch.interactive.action.sections[0].rows.length, 6);
  });

  it('5. customer selects Talk to Our Team, triggering takeover and team notification', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Talk to Our Team',
      wamId: 'wamid.cust_choice_human_001',
      type: 'interactive',
      createdAt: new Date(),
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'choice_human', title: 'Talk to Our Team' },
        },
      },
    });

    assert.ok(res);
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'HUMAN_TAKEOVER');
    assert.equal(conv.humanTakeover, true);
    assert.equal(conv.takenOverByName, 'Customer Choice');

    // Notified team
    assert.equal(env.notifications.length, 1);
    assert.ok(env.notifications[0].title.includes('Customer Requested Team Assistance'));

    // Sent direct contact message with phone number
    assert.equal(env.textDispatches.length, 2); // 1 manual reply + 1 direct contact
    const supportMsg = env.textDispatches[1].text;
    assert.ok(supportMsg.includes('+91 90307 87819'));
    assert.ok(supportMsg.includes("Don't hesitate to reach out to us anytime!"));
  });

  it('6. greeting while awaiting choice repeats the choice without bypassing', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hello',
      wamId: 'wamid.cust_greeting_001',
      createdAt: new Date(),
    });

    assert.ok(res);
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'AWAITING_CUSTOMER_CHOICE');
    assert.equal(conv.humanTakeover, false);

    const dispatch = env.interactiveDispatches[0];
    assert.equal(dispatch.interactive.type, 'button');
    assert.equal(dispatch.interactive.action.buttons[0].reply.id, 'choice_automated');
  });

  it('7. unclear text or "Other" repeats customer choices politely', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Other',
      wamId: 'wamid.cust_other_001',
      createdAt: new Date(),
    });

    assert.ok(res);
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'AWAITING_CUSTOMER_CHOICE');
    assert.equal(conv.humanTakeover, false);
    assert.equal(env.interactiveDispatches.length, 1);
  });

  it('8. natural-language request for human activates takeover directly', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'I want to talk to an agent please',
      wamId: 'wamid.cust_nl_agent_001',
      createdAt: new Date(),
    });

    assert.ok(res);
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'HUMAN_TAKEOVER');
    assert.equal(conv.humanTakeover, true);
    assert.equal(env.notifications.length, 1);
  });

  it('9. duplicate webhook delivery is handled idempotently without duplicate dispatches', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    const payload = {
      from: PHONE,
      body: 'Automated Assistance',
      wamId: 'wamid.dup_webhook_001',
      type: 'interactive',
      createdAt: new Date(),
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'choice_automated', title: 'Automated Assistance' },
        },
      },
    };

    const first = await env.assistantService.handleInboundMessage(payload);
    assert.ok(first);
    const initialDispatches = env.interactiveDispatches.length;

    // Redeliver exact same wamId
    const second = await env.assistantService.handleInboundMessage(payload);
    assert.equal(second, null, 'Duplicate webhook delivery must return null');
    assert.equal(env.interactiveDispatches.length, initialDispatches, 'No duplicate dispatch on retry');
  });
});
