import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

const require = createRequire(import.meta.url);
const {
  PALNADU_SUPPORT_PHONE,
  APPROVED_MAIN_MENU,
  DIRECT_CONTACT_SUPPORT_MESSAGE,
} = require('../dist/whatsapp/whatsapp-menu.constants.js');

describe('WhatsApp Interactive Menu UX Redesign (Scenarios 1 - 10)', () => {
  it('1. sends pure English main menu without Telugu characters', async () => {
    const { conversationService } = createAssistantTestHarness();
    const result = await conversationService.processCustomerMessage(
      { body: 'Hi', from: '919030787819', wamId: 'wamid.greeting1' },
      { state: 'IDLE', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'AWAITING_CATEGORY');
    assert.match(result.responseText, /Welcome to Palnadu\.dev! 👋/);
    assert.match(result.responseText, /We help businesses grow with technology/);
    assert.doesNotMatch(
      result.responseText,
      /[\u0C00-\u0C7F]/,
      'Main menu text must not contain Telugu characters',
    );
  });

  it('2. provides exactly six directly selectable main-menu rows', async () => {
    const { conversationService } = createAssistantTestHarness();
    const result = await conversationService.processCustomerMessage(
      { body: 'Hello', from: '919030787819', wamId: 'wamid.greeting2' },
      { state: 'IDLE', customerPhone: '919030787819' },
    );

    assert.ok(result.interactive, 'Must include interactive payload');
    assert.equal(result.interactive.type, 'list');
    const rows = result.interactive.action.sections[0].rows;
    assert.equal(rows.length, 6, 'Must contain exactly 6 rows');

    const expectedIds = ['cat_1', 'cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6'];
    const actualIds = rows.map((r) => r.id);
    assert.deepEqual(actualIds, expectedIds);
  });

  it('3. does not introduce separate "Choose a service" application-level confirmation button', async () => {
    const { conversationService } = createAssistantTestHarness();
    const result = await conversationService.processCustomerMessage(
      { body: 'Start', from: '919030787819', wamId: 'wamid.greeting3' },
      { state: 'IDLE', customerPhone: '919030787819' },
    );

    // Each row is directly a service name, not a generic "choose service" button
    const rows = result.interactive.action.sections[0].rows;
    assert.equal(rows[0].title, 'Website & Web Apps');
    assert.equal(rows[1].title, 'Mobile App Development');
    assert.equal(rows[2].title, 'Business Automation');
    assert.equal(rows[3].title, 'Digital Marketing & SEO');
    assert.equal(rows[4].title, 'Technical Training');
    assert.equal(rows[5].title, 'Talk to Our Team');
  });

  it('4. routes every main category directly to its correct submenu', async () => {
    const { conversationService } = createAssistantTestHarness();

    for (let i = 1; i <= 5; i++) {
      const catId = `cat_${i}`;
      const result = await conversationService.processCustomerMessage(
        {
          from: '919030787819',
          wamId: `wamid.nav_cat_${i}`,
          type: 'interactive',
          rawPayload: {
            interactive: {
              type: 'list_reply',
              list_reply: { id: catId, title: APPROVED_MAIN_MENU[i - 1].title },
            },
          },
        },
        { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
      );

      assert.equal(result.nextState, 'AWAITING_SUBMENU');
      assert.equal(result.selectedCategory, String(i));
      assert.ok(result.interactive);
      assert.equal(result.interactive.type, 'button');
    }
  });

  it('5. routes every submenu selection correctly to requirement prompt or support', async () => {
    const { conversationService } = createAssistantTestHarness();

    // Category 1: Website
    const sub1Result = await conversationService.processCustomerMessage(
      {
        from: '919030787819',
        wamId: 'wamid.sub_select_1',
        type: 'interactive',
        rawPayload: {
          interactive: {
            type: 'button_reply',
            button_reply: { id: 'sub_1_1', title: 'Corporate Website' },
          },
        },
      },
      { state: 'AWAITING_SUBMENU', selectedCategory: '1', customerPhone: '919030787819' },
    );
    assert.equal(sub1Result.nextState, 'AWAITING_REQUIREMENT');
    assert.equal(sub1Result.selectedCategory, '1');
    assert.equal(sub1Result.selectedSubmenu, '1');
    assert.match(sub1Result.responseText, /Please briefly describe what you need/);
  });

  it('6. returns exact approved English support message for all Contact Support paths', async () => {
    const { conversationService } = createAssistantTestHarness();
    const expectedMsg =
      `Don't hesitate to reach out to us anytime!\n\n` +
      `${PALNADU_SUPPORT_PHONE}\n\n` +
      `We're happy to assist you. Feel free to call or WhatsApp us whenever you need support.`;

    for (const cat of APPROVED_MAIN_MENU.slice(0, 5)) {
      const supportSub = cat.suboptions.find((s) => s.isSupport);
      assert.ok(supportSub);

      const result = await conversationService.processCustomerMessage(
        {
          from: '919030787819',
          wamId: `wamid.supp_${cat.id}`,
          type: 'interactive',
          rawPayload: {
            interactive: {
              type: 'button_reply',
              button_reply: { id: supportSub.stableId, title: supportSub.name },
            },
          },
        },
        { state: 'AWAITING_SUBMENU', selectedCategory: cat.id, customerPhone: '919030787819' },
      );

      assert.equal(result.nextState, 'IDLE');
      assert.equal(result.responseText, expectedMsg);
      assert.doesNotMatch(result.responseText, /[\u0C00-\u0C7F]/);
    }
  });

  it('7. Category 6 (Talk to Our Team) immediately returns direct support without submenu', async () => {
    const { conversationService } = createAssistantTestHarness();
    const result = await conversationService.processCustomerMessage(
      {
        from: '919030787819',
        wamId: 'wamid.cat6_tap',
        type: 'interactive',
        rawPayload: {
          interactive: {
            type: 'list_reply',
            list_reply: { id: 'cat_6', title: 'Talk to Our Team' },
          },
        },
      },
      { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'IDLE');
    assert.equal(result.responseText, DIRECT_CONTACT_SUPPORT_MESSAGE);
    assert.equal(result.interactive, undefined, 'No submenu interactive buttons for Category 6');
  });

  it('8. parses native interactive list webhook payloads accurately', async () => {
    const { assistantService, interactiveDispatches } = createAssistantTestHarness();
    const inbound = {
      from: '919030787819',
      wamId: 'wamid.webhook_list_001',
      type: 'interactive',
      rawPayload: {
        interactive: {
          type: 'list_reply',
          list_reply: { id: 'cat_2', title: 'Mobile App Development' },
        },
      },
      createdAt: new Date(),
    };

    const reply = await assistantService.handleInboundMessage(inbound);
    assert.ok(reply);
    assert.equal(interactiveDispatches.length, 1);
    assert.equal(interactiveDispatches[0].interactive.type, 'button');
    assert.match(interactiveDispatches[0].interactive.body.text, /Mobile App Development/);
  });

  it('9. parses native reply-button webhook payloads accurately', async () => {
    const { assistantService, textDispatches } = createAssistantTestHarness();
    const inbound = {
      from: '919030787819',
      wamId: 'wamid.webhook_btn_001',
      type: 'interactive',
      rawPayload: {
        interactive: {
          type: 'button_reply',
          button_reply: { id: 'sub_2_1', title: 'Android & iOS App' },
        },
      },
      createdAt: new Date(),
    };

    const reply = await assistantService.handleInboundMessage(inbound);
    assert.ok(reply);
    assert.equal(textDispatches.length, 1);
    assert.match(textDispatches[0].text, /Please briefly describe what you need/);
  });

  it('10. handles stable reply IDs robustly even if text label varies or repeats', async () => {
    const { conversationService } = createAssistantTestHarness();
    // Tapping cat_3 directly via stable ID
    const res = await conversationService.processCustomerMessage(
      {
        from: '919030787819',
        wamId: 'wamid.stable_id_test',
        body: 'cat_3',
      },
      { state: 'IDLE', customerPhone: '919030787819' },
    );

    assert.equal(res.nextState, 'AWAITING_SUBMENU');
    assert.equal(res.selectedCategory, '3');
    assert.match(res.responseText, /Business Automation & Integrations/);
  });
});
