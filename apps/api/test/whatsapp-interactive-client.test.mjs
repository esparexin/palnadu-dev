import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppApiClient, WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.client.js');
const {
  buildMainMenuInteractiveList,
  buildSubmenuInteractiveButtons,
  extractInteractiveSelection,
  META_LIST_BUTTON_MAX_LEN,
  META_LIST_SECTION_TITLE_MAX_LEN,
  META_LIST_ROW_TITLE_MAX_LEN,
  META_LIST_ROW_DESC_MAX_LEN,
  META_REPLY_BUTTON_TITLE_MAX_LEN,
  META_MAX_REPLY_BUTTONS,
} = require('../dist/whatsapp/whatsapp-interactive.util.js');
const { APPROVED_MAIN_MENU } = require('../dist/whatsapp/whatsapp-menu.constants.js');

const createMockConfig = () => ({
  get: (key) => {
    if (key === 'WHATSAPP_ACCESS_TOKEN') return 'valid_token_abc';
    if (key === 'WHATSAPP_PHONE_NUMBER_ID') return '1234567890';
    if (key === 'WHATSAPP_GRAPH_API_VERSION') return 'v21.0';
    return null;
  },
});

describe('WhatsApp Interactive Payload Builders & Meta API Client', () => {
  it('1. builds main menu interactive list complying strictly with Meta limits', () => {
    const list = buildMainMenuInteractiveList();
    assert.equal(list.type, 'list');
    assert.match(list.body.text, /Welcome to Palnadu\.dev!/);
    assert.match(list.body.text, /We help businesses grow with technology/);

    assert.ok(list.action.button.length <= META_LIST_BUTTON_MAX_LEN);
    assert.ok(list.action.sections.length >= 1);
    assert.ok(list.action.sections[0].title.length <= META_LIST_SECTION_TITLE_MAX_LEN);

    const rows = list.action.sections[0].rows;
    assert.equal(rows.length, 6, 'Must contain exactly 6 main menu rows');

    for (const row of rows) {
      assert.ok(row.id.startsWith('cat_'), `Row id ${row.id} must be stable`);
      assert.ok(
        row.title.length <= META_LIST_ROW_TITLE_MAX_LEN,
        `Row title "${row.title}" (${row.title.length}) exceeds Meta limit ${META_LIST_ROW_TITLE_MAX_LEN}`,
      );
      if (row.description) {
        assert.ok(
          row.description.length <= META_LIST_ROW_DESC_MAX_LEN,
          `Row description "${row.description}" exceeds Meta limit`,
        );
      }
    }
  });

  it('2. builds submenu reply buttons complying strictly with Meta limits', () => {
    for (const cat of APPROVED_MAIN_MENU.slice(0, 5)) {
      const btnPayload = buildSubmenuInteractiveButtons(cat);
      assert.ok(btnPayload, `Category ${cat.id} must generate button payload`);
      assert.equal(btnPayload.type, 'button');
      assert.match(btnPayload.body.text, new RegExp(cat.title));

      const buttons = btnPayload.action.buttons;
      assert.ok(buttons.length <= META_MAX_REPLY_BUTTONS);

      for (const btn of buttons) {
        assert.equal(btn.type, 'reply');
        assert.ok(btn.reply.id.startsWith('sub_'));
        assert.ok(
          btn.reply.title.length <= META_REPLY_BUTTON_TITLE_MAX_LEN,
          `Button title "${btn.reply.title}" (${btn.reply.title.length}) exceeds Meta limit ${META_REPLY_BUTTON_TITLE_MAX_LEN}`,
        );
      }
    }

    // Category 6 has no submenu
    const cat6Payload = buildSubmenuInteractiveButtons(APPROVED_MAIN_MENU[5]);
    assert.equal(cat6Payload, null);
  });

  it('3. safely extracts interactive list_reply and button_reply selections', () => {
    // List reply
    const listMsg = {
      type: 'interactive',
      interactive: {
        type: 'list_reply',
        list_reply: { id: 'cat_1', title: 'Website & Web Apps', description: 'Web' },
      },
    };
    const selList = extractInteractiveSelection(listMsg);
    assert.deepEqual(selList, {
      type: 'list_reply',
      id: 'cat_1',
      title: 'Website & Web Apps',
      description: 'Web',
    });

    // Button reply
    const btnMsg = {
      type: 'interactive',
      interactive: {
        type: 'button_reply',
        button_reply: { id: 'sub_1_1', title: 'Corporate Website' },
      },
    };
    const selBtn = extractInteractiveSelection(btnMsg);
    assert.deepEqual(selBtn, {
      type: 'button_reply',
      id: 'sub_1_1',
      title: 'Corporate Website',
    });

    // Raw payload fallback
    const rawMsg = {
      type: 'text',
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'sub_2_2', title: 'Contact Support' },
        },
      },
    };
    const selRaw = extractInteractiveSelection(rawMsg);
    assert.deepEqual(selRaw, {
      type: 'button_reply',
      id: 'sub_2_2',
      title: 'Contact Support',
    });

    // Plain text message returns null
    assert.equal(extractInteractiveSelection({ type: 'text', body: 'Hello' }), null);
  });

  it('4. sendInteractiveMessage formats payload and headers correctly on 200 OK', async () => {
    let capturedUrl = null;
    let capturedHeaders = null;
    let capturedBody = null;

    const mockFetch = async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          contacts: [{ input: '919030787819', wa_id: '919030787819' }],
          messages: [{ id: 'wamid.INTERACTIVE_OUT_001' }],
        }),
      };
    };

    const client = new WhatsAppApiClient(createMockConfig(), { fetchFn: mockFetch });
    const listPayload = buildMainMenuInteractiveList();

    const response = await client.sendInteractiveMessage({
      to: '+91 90307 87819',
      interactive: listPayload,
      replyToWamId: 'wamid.IN_GREETING_001',
    });

    assert.equal(capturedUrl, 'https://graph.facebook.com/v21.0/1234567890/messages');
    assert.equal(capturedHeaders.Authorization, 'Bearer valid_token_abc');
    assert.equal(capturedBody.to, '919030787819');
    assert.equal(capturedBody.type, 'interactive');
    assert.equal(capturedBody.interactive.type, 'list');
    assert.equal(capturedBody.context.message_id, 'wamid.IN_GREETING_001');
    assert.equal(response.messages[0].id, 'wamid.INTERACTIVE_OUT_001');
  });

  it('5. sendInteractiveMessage rejects invalid inputs', async () => {
    const client = new WhatsAppApiClient(createMockConfig());
    await assert.rejects(
      async () => client.sendInteractiveMessage({ to: 'invalid-phone', interactive: { type: 'list' } }),
      (err) => err instanceof WhatsAppApiException && /Invalid recipient phone number/.test(err.message),
    );

    await assert.rejects(
      async () => client.sendInteractiveMessage({ to: '919030787819', interactive: null }),
      (err) => err instanceof WhatsAppApiException && /Interactive payload is required/.test(err.message),
    );
  });
});
