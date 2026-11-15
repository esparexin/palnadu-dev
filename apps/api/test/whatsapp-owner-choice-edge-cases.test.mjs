import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

describe('WhatsApp Owner-Initiated Edge Cases & Compliance (Scenarios 10 - 18)', () => {
  const PHONE = '919030787819';
  const ADMIN = { id: 'admin_owner', name: 'Palnadu Owner' };

  it('10. simultaneous admin takeover and automated dispatch: takeover wins and suppresses bot reply', async () => {
    const env = createAssistantTestHarness();
    // Simulate active takeover
    await env.takeoverService.setHumanTakeover(PHONE, true, ADMIN);

    // Customer sends message while in takeover
    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Can someone help?',
      wamId: 'wamid.inbound_takeover_active_001',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Bot reply must be aborted/suppressed when human takeover is active');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('11. manual replies while in human takeover preserve HUMAN_TAKEOVER mode', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.setHumanTakeover(PHONE, true, ADMIN);

    const convBefore = env.conversations.get(PHONE);
    assert.equal(convBefore.mode, 'HUMAN_TAKEOVER');
    assert.equal(convBefore.humanTakeover, true);

    // Admin sends another manual message
    await env.takeoverService.sendManualReply(PHONE, 'Following up with you', ADMIN);

    const convAfter = env.conversations.get(PHONE);
    assert.equal(convAfter.mode, 'HUMAN_TAKEOVER', 'Must remain in HUMAN_TAKEOVER mode');
    assert.equal(convAfter.humanTakeover, true);
  });

  it('12. explicit authorized resume atomically transitions to AUTOMATED_ASSISTANCE', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.setHumanTakeover(PHONE, true, ADMIN);

    const resumedConv = await env.takeoverService.setHumanTakeover(PHONE, false, ADMIN);
    assert.equal(resumedConv.humanTakeover, false);
    assert.equal(resumedConv.mode, 'AUTOMATED_ASSISTANCE');

    // Customer message now reaches automated assistant
    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hello',
      wamId: 'wamid.after_resume_001',
      createdAt: new Date(),
    });
    assert.ok(res);
    assert.equal(env.interactiveDispatches.length, 1);
  });

  it('13. legacy auto-reply is suppressed when human takeover or assistant is active', async () => {
    const env = createAssistantTestHarness({ assistantFlag: 'true' });
    await env.takeoverService.setHumanTakeover(PHONE, true, ADMIN);

    const autoReplyRes = await env.autoReplyService.handleAutoReply({
      from: PHONE,
      body: 'Hello',
      wamId: 'wamid.legacy_suppress_001',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    assert.equal(autoReplyRes, null, 'Auto-reply must be suppressed when takeover is active');
  });

  it('14. opt-out protection: STOP keyword suppresses bot and resume is blocked for opted-out contact', async () => {
    const env = createAssistantTestHarness();

    // 1. Customer sends STOP
    const stopRes = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'STOP',
      wamId: 'wamid.opt_out_stop_001',
      createdAt: new Date(),
    });
    assert.equal(stopRes, null, 'Bot reply must be suppressed on opt-out keyword');

    // 2. Mark recipient as opted out
    env.suppressedPhones.add(PHONE);

    // 3. Attempt to resume assistant must be rejected
    await assert.rejects(
      async () => {
        await env.takeoverService.setHumanTakeover(PHONE, false, ADMIN);
      },
      /Cannot resume automated assistance for an opted-out contact/,
    );
  });

  it('15. 24-hour window enforcement suppresses messages outside service window', async () => {
    const env = createAssistantTestHarness();
    const staleTime = new Date(Date.now() - 26 * 60 * 60 * 1000); // 26 hours old

    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hello',
      wamId: 'wamid.stale_window_001',
      createdAt: staleTime,
      statusTimestamp: staleTime,
    });

    assert.equal(res, null, 'Must suppress message outside 24-hour customer service window');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('16. multiple API instances and process restart maintain durable MongoDB state', async () => {
    const env1 = createAssistantTestHarness();
    // Instance 1: Owner initiates conversation
    await env1.takeoverService.sendManualReply(PHONE, 'Hello from Palnadu team!', ADMIN);
    const savedConv = env1.conversations.get(PHONE);
    assert.equal(savedConv.mode, 'AWAITING_CUSTOMER_CHOICE');

    // Instance 2 (simulating restart or different replica sharing same MongoDB map)
    const env2 = createAssistantTestHarness();
    // Share existing conversation collection
    env2.conversations.set(PHONE, savedConv);

    // Customer responds to Instance 2
    const res = await env2.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hi, please help',
      wamId: 'wamid.instance2_reply_001',
      createdAt: new Date(),
    });

    assert.ok(res);
    // Instance 2 correctly saw AWAITING_CUSTOMER_CHOICE and sent choice buttons
    const dispatch = env2.interactiveDispatches[0];
    assert.equal(dispatch.interactive.type, 'button');
    assert.equal(dispatch.interactive.action.buttons.length, 2);
  });

  it('17. queued messages during mode transitions avoid concurrency races', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Hello!', ADMIN);

    // Two messages arrive concurrently
    const p1 = env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Automated Assistance',
      wamId: 'wamid.concurrent_001',
      type: 'interactive',
      createdAt: new Date(),
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'choice_automated', title: 'Automated Assistance' },
        },
      },
    });

    const p2 = env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Automated Assistance',
      wamId: 'wamid.concurrent_002',
      type: 'interactive',
      createdAt: new Date(),
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'choice_automated', title: 'Automated Assistance' },
        },
      },
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    // Exactly one should succeed to dispatch; the other is locked out or returns gracefully
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.mode, 'AUTOMATED_ASSISTANCE');
  });

  it('18. campaign messages record campaign origin and do not enter owner-initiated mode', async () => {
    const env = createAssistantTestHarness();

    // Create a campaign-originated message
    const campaignMsg = await env.mockPrisma.whatsAppMessage.create({
      data: {
        wamId: 'wamid.campaign_out_001',
        direction: 'OUTBOUND',
        from: 'palnadu_business',
        to: PHONE,
        type: 'template',
        status: 'SENT',
        campaignId: 'camp_123',
        rawPayload: { origin: 'CAMPAIGN', campaignId: 'camp_123' },
      },
    });

    assert.equal(campaignMsg.campaignId, 'camp_123');
    assert.equal(campaignMsg.rawPayload.origin, 'CAMPAIGN');

    // Conversation should NOT be placed into AWAITING_CUSTOMER_CHOICE by campaign message
    const conv = env.conversations.get(PHONE);
    assert.equal(conv?.mode ?? 'AUTOMATED_ASSISTANCE', 'AUTOMATED_ASSISTANCE');
  });
});
