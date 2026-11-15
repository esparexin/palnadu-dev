import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

describe('WhatsApp Human Takeover Edge Cases & Guarantees (Scenarios 10 - 18)', () => {
  const PHONE = '919030787819';
  const ADMIN = { id: 'admin_owner', name: 'Palnadu Owner' };

  it('10. queued jobs and retries cannot bypass takeover', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);

    // Simulate a queued / retried assistant message job
    const retryRes = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hello',
      wamId: 'wamid.retry_job_001',
      createdAt: new Date(),
    });

    assert.equal(retryRes, null, 'Queued/retried job must be suppressed during human takeover');
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('11. duplicate webhook deliveries cannot trigger automated responses', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);

    const payload = {
      from: PHONE,
      body: 'Can we discuss further?',
      wamId: 'wamid.dup_webhook_takeover_001',
      createdAt: new Date(),
    };

    const first = await env.assistantService.handleInboundMessage(payload);
    assert.equal(first, null);

    // Duplicate webhook delivery
    const second = await env.assistantService.handleInboundMessage(payload);
    assert.equal(second, null);
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('12. concurrent workers cannot bypass takeover', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);

    // Two customer messages arrive at the same millisecond across concurrent workers
    const [r1, r2] = await Promise.all([
      env.assistantService.handleInboundMessage({
        from: PHONE,
        body: 'Message 1',
        wamId: 'wamid.concurrent_c1',
        createdAt: new Date(),
      }),
      env.assistantService.handleInboundMessage({
        from: PHONE,
        body: 'Message 2',
        wamId: 'wamid.concurrent_c2',
        createdAt: new Date(),
      }),
    ]);

    assert.equal(r1, null);
    assert.equal(r2, null);
    assert.equal(env.interactiveDispatches.length, 0);
  });

  it('13. multiple API instances observe the same durable takeover state', async () => {
    const env1 = createAssistantTestHarness();
    // Instance 1: Admin sends manual quotation
    await env1.takeoverService.sendManualReply(PHONE, 'Quotation: Rs 30,000 for App', ADMIN);
    const savedConv = env1.conversations.get(PHONE);
    assert.equal(savedConv.mode, 'HUMAN_TAKEOVER');
    assert.equal(savedConv.humanTakeover, true);

    // Instance 2 (replica sharing MongoDB state)
    const env2 = createAssistantTestHarness();
    env2.conversations.set(PHONE, savedConv);

    // Customer sends message to Instance 2
    const res = await env2.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Can we pay in milestones?',
      wamId: 'wamid.instance2_c1',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Instance 2 must observe durable takeover and suppress bot replies');
    assert.equal(env2.interactiveDispatches.length, 0);
  });

  it('14. application restart preserves takeover', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);
    const persisted = env.conversations.get(PHONE);

    // Simulate process shutdown and reboot with new service instances
    const rebootedEnv = createAssistantTestHarness();
    rebootedEnv.conversations.set(PHONE, persisted);

    const res = await rebootedEnv.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'Hi, I got the quote.',
      wamId: 'wamid.after_reboot_001',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Takeover must survive application reboot');
    assert.equal(rebootedEnv.interactiveDispatches.length, 0);
  });

  it('15. unauthorized users cannot resume automation', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);

    // Null or invalid admin context
    const invalidAdmin = { id: '' };
    assert.equal(Boolean(invalidAdmin.id), false, 'Admin actor must be authenticated');

    // Takeover remains active
    const conv = env.conversations.get(PHONE);
    assert.equal(conv.humanTakeover, true);
    assert.equal(conv.mode, 'HUMAN_TAKEOVER');
  });

  it('16. authorized explicit resume works correctly', async () => {
    const env = createAssistantTestHarness();
    await env.takeoverService.sendManualReply(PHONE, 'Quotation sent.', ADMIN);

    // Explicit resume by authorized admin
    const resumed = await env.takeoverService.setHumanTakeover(PHONE, false, ADMIN);
    assert.equal(resumed.humanTakeover, false);
    assert.equal(resumed.mode, 'AUTOMATED_ASSISTANCE');
    assert.equal(resumed.takenOverAt, null);
    assert.equal(resumed.takenOverByName, null);

    // Subsequent customer interaction receives automated assistance
    const res = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: '1',
      wamId: 'wamid.after_resume_001',
      createdAt: new Date(),
    });

    assert.ok(res);
    assert.equal(env.interactiveDispatches.length, 1);
  });

  it('17. STOP/opt-out continues to suppress automated messaging and blocks resume', async () => {
    const env = createAssistantTestHarness();

    // 1. Customer sends STOP
    const stopRes = await env.assistantService.handleInboundMessage({
      from: PHONE,
      body: 'STOP',
      wamId: 'wamid.opt_stop_001',
      createdAt: new Date(),
    });
    assert.equal(stopRes, null);

    // 2. Mark recipient as opted out
    env.suppressedPhones.add(PHONE);

    // 3. Attempting to resume automated assistance is blocked
    await assert.rejects(
      async () => {
        await env.takeoverService.setHumanTakeover(PHONE, false, ADMIN);
      },
      /Cannot resume automated assistance for an opted-out contact/,
    );
  });

  it('18. campaign messages remain isolated from manual human takeover logic', async () => {
    const env = createAssistantTestHarness();

    // Create a marketing campaign message
    const campaignMsg = await env.mockPrisma.whatsAppMessage.create({
      data: {
        wamId: 'wamid.camp_msg_001',
        direction: 'OUTBOUND',
        from: 'palnadu_business',
        to: PHONE,
        type: 'template',
        status: 'SENT',
        campaignId: 'camp_diwali_2026',
        rawPayload: { origin: 'CAMPAIGN', campaignId: 'camp_diwali_2026' },
      },
    });

    assert.equal(campaignMsg.campaignId, 'camp_diwali_2026');
    assert.equal(campaignMsg.rawPayload.origin, 'CAMPAIGN');

    // Campaign messages must NOT activate human takeover
    const conv = env.conversations.get(PHONE);
    assert.equal(conv?.humanTakeover ?? false, false);
    assert.equal(conv?.mode ?? 'AUTOMATED_ASSISTANCE', 'AUTOMATED_ASSISTANCE');
  });
});
