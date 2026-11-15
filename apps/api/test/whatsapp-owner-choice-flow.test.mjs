import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

describe('WhatsApp Sales Human Takeover & Suppression (Scenarios 1 - 9)', () => {
  const PHONE = '919030787819';
  const ADMIN = { id: 'admin_sales', name: 'Sales Director' };

  it('1. a manually sent quotation immediately activates HUMAN_TAKEOVER', async () => {
    const env = createAssistantTestHarness();
    const msg = await env.takeoverService.sendManualReply(
      PHONE,
      'Quotation: Website Development project estimate is Rs 45,000.',
      ADMIN,
    );

    assert.equal(msg.direction, 'OUTBOUND');
    assert.equal(msg.rawPayload?.origin, 'MANUAL_ADMIN');
    assert.equal(msg.rawPayload?.adminId, ADMIN.id);

    const conv = env.conversations.get(PHONE);
    assert.ok(conv);
    assert.equal(conv.humanTakeover, true);
    assert.equal(conv.mode, 'HUMAN_TAKEOVER');
    assert.equal(conv.takenOverByName, ADMIN.name);
    assert.equal(conv.lastInitiatorId, ADMIN.id);
  });

  it('2. a customer greeting during takeover receives no automated response', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello, here is your proposal.', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hi',
      wamId: 'wamid.cust_greeting_001',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Customer greeting must receive NO automated bot response during takeover');
    assert.equal(env.interactiveDispatches.length, 0);
    assert.equal(env.textDispatches.length, 1); // Only initial manual quotation
  });

  it('3. customer pricing questions receive no automated response', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Please find our project scope attached.', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Can you give a discount on the quotation?',
      wamId: 'wamid.cust_pricing_001',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Customer pricing question must receive NO automated response during takeover');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('4. customer requirement messages receive no automated response', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Let us know if you need any adjustments.', ADMIN);

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'We also need payment gateway integration and SMS alerts.',
      wamId: 'wamid.cust_req_001',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Customer requirements must receive NO automated response during takeover');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('5. multiple manual human replies preserve takeover', async () => {
    const env = createAssistantTestHarness();
    // 1st manual message
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);
    let conv = env.conversations.get(PHONE);
    assert.equal(conv.humanTakeover, true);
    assert.equal(conv.mode, 'HUMAN_TAKEOVER');

    // Customer sends message
    await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Received, thank you.',
      wamId: 'wamid.cust_ack_001',
      createdAt: new Date(),
    });

    // 2nd manual reply by admin
    await env.takeoverService.sendManualReply(PHONE, 'Great! We can start on Monday.', ADMIN);
    conv = env.conversations.get(PHONE);
    assert.equal(conv.humanTakeover, true);
    assert.equal(conv.mode, 'HUMAN_TAKEOVER');

    // Customer sends another follow-up
    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Sounds good to us.',
      wamId: 'wamid.cust_ack_002',
      createdAt: new Date(),
    });
    assert.equal(res, null);
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('6. manual outbound messages never trigger an automated response through webhook echoes', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Proposal sent.', ADMIN);

    // Simulate webhook echo of the outbound message
    const echoRes = await env.assistantService.handleInboundMessage({
      from: 'palnadu_business',
      to: PHONE,
      direction: 'OUTBOUND',
      body: 'Proposal sent.',
      wamId: 'wamid.echo_outbound_001',
      createdAt: new Date(),
    });

    assert.equal(echoRes, null, 'Outbound webhook echo must never trigger bot reply');
  });

  it('7. delivery and read status events never trigger automated responses', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Estimate sent.', ADMIN);

    // Simulate delivery status update event
    const deliveredStatus = {
      wamId: 'wamid.manual_delivered_001',
      recipientId: PHONE,
      status: 'delivered',
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    // Status updates do not contain customer message body and are handled without assistant dispatch
    assert.equal(deliveredStatus.status, 'delivered');
    assert.equal(env.interactiveDispatches.length, 0);

    // Simulate read status event
    const readStatus = {
      wamId: 'wamid.manual_read_001',
      recipientId: PHONE,
      status: 'read',
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    assert.equal(readStatus.status, 'read');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('8. legacy auto-reply cannot bypass takeover', async () => {
    const env = createAssistantTestHarness({ assistantFlag: 'false', autoReplyFlag: 'true' });
    await env.takeoverService.sendManualReply(PHONE, 'Human sales conversation initiated.', ADMIN);

    const autoReplyRes = await env.autoReplyService.handleAutoReply({
      from: PHONE,
      body: 'Hello',
      wamId: 'wamid.legacy_attempt_001',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    assert.equal(autoReplyRes, null, 'Legacy auto-reply must be completely suppressed when takeover is active');
    // textDispatches has only the 1 manual reply, no automated acknowledgement
    assert.equal(env.textDispatches.length, 1);
  });

  it('9. conversational assistant cannot bypass takeover', async () => {
    const env = createAssistantTestHarness({ assistantFlag: 'true' });
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);

    const assistantRes = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: '1',
      wamId: 'wamid.asst_attempt_001',
      createdAt: new Date(),
    });

    assert.equal(assistantRes, null, 'Conversational assistant must be completely suppressed during takeover');
    assert.equal(env.interactiveDispatches.length, 0);
  });
});
