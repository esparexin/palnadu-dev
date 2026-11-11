#!/usr/bin/env node
/**
 * WhatsApp Staging Live Verifier
 * Verifies live Meta Cloud API webhook ingress and handshake on Render staging.
 * Enforces single authorised test recipient constraint.
 */
import * as crypto from 'node:crypto';

const args = process.argv.slice(2);
const getArg = (name) => {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3).trim() : null;
};

const stagingUrl = (getArg('url') || process.env.STAGING_API_URL || '').replace(/\/+$/, '');
const verifyToken = getArg('verify-token') || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const appSecret = getArg('secret') || process.env.META_APP_SECRET;
const recipientPhone = getArg('recipient') || process.env.TEST_RECIPIENT_PHONE;

console.log('===============================================================');
console.log('   PALNADU.DEV — WHATSAPP STAGING LIVE VERIFICATION SUITE       ');
console.log('===============================================================\n');

if (!stagingUrl) {
  console.log('Usage: node scripts/verify-whatsapp-staging.mjs [options]');
  console.log('Options:');
  console.log('  --url=<staging-api-url>          Render staging URL (e.g. https://api-staging.onrender.com)');
  console.log('  --verify-token=<token>           Configured webhook verify token');
  console.log('  --secret=<app-secret>            Meta App Secret for HMAC validation');
  console.log('  --recipient=<phone>              Single authorised recipient phone number');
  console.log('\nStatus: Standby. Run with arguments once staging service is deployed.\n');
  process.exit(0);
}

async function verifyLiveStaging() {
  console.log(`[1/4] Checking Staging Health (${stagingUrl}/api/health)...`);
  try {
    const healthRes = await fetch(`${stagingUrl}/api/health`);
    const healthJson = await healthRes.json();
    console.log(`  -> Status: ${healthRes.status} OK | DB: ${healthJson.database || healthJson.status}`);
  } catch (err) {
    console.error(`  -> Failed to reach staging service: ${err.message}`);
    process.exit(1);
  }

  if (verifyToken) {
    console.log('\n[2/4] Testing Meta Webhook Verification Handshake (GET challenge)...');
    const challenge = 'test_challenge_' + Date.now();
    const query = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.challenge': challenge,
      'hub.verify_token': verifyToken,
    });
    try {
      const getRes = await fetch(`${stagingUrl}/api/webhooks/whatsapp?${query.toString()}`);
      const text = await getRes.text();
      if (getRes.status === 200 && text === challenge) {
        console.log(`  -> Handshake PASS: Returned challenge matching Meta protocol exactly.`);
      } else {
        console.warn(`  -> Handshake FAIL: HTTP ${getRes.status}, body: "${text}"`);
      }
    } catch (err) {
      console.error(`  -> Handshake request failed: ${err.message}`);
    }
  }

  if (appSecret && recipientPhone) {
    console.log(`\n[3/4] Testing Authenticated HMAC Ingress with Test Recipient: ${recipientPhone.slice(0, 4)}...`);
    const testWamId = `wamid.STAGING_TEST_${Date.now()}`;
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'WHATSAPP_TEST_ACCOUNT',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '919030787819', phone_number_id: 'staging_test_id' },
            contacts: [{ profile: { name: 'Authorised Tester' }, wa_id: recipientPhone }],
            messages: [{
              from: recipientPhone,
              id: testWamId,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: { body: 'PING: Palnadu staging live verification message' },
            }],
          },
        }],
      }],
    };

    const rawBody = JSON.stringify(payload);
    const signature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    try {
      const postRes = await fetch(`${stagingUrl}/api/webhooks/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': signature,
        },
        body: rawBody,
      });
      const resJson = await postRes.json();
      console.log(`  -> Ingress response: HTTP ${postRes.status} | Body: ${JSON.stringify(resJson)}`);
      console.log(`  -> Correlation WamID: ${testWamId}`);
    } catch (err) {
      console.error(`  -> Ingress test failed: ${err.message}`);
    }
  }

  console.log('\n[4/4] Live Verification Ready.');
  console.log('Send a test WhatsApp message from the authorised phone number to the Meta registered number.');
}

verifyLiveStaging().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
