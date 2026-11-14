import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  parseNavigationCommand,
  extractNumericChoice,
  formatMainMenuText,
  formatSubmenuText,
  findCategoryByInput,
  findSuboptionByInput,
} = require('../dist/whatsapp/whatsapp-conversation.util.js');
const {
  APPROVED_MAIN_MENU,
  DIRECT_CONTACT_SUPPORT_MESSAGE,
  PALNADU_SUPPORT_PHONE,
} = require('../dist/whatsapp/whatsapp-menu.constants.js');

describe('WhatsApp Conversation Utilities & Menu Formatting', () => {
  it('formats main menu with all approved 6 categories and bilingual text', () => {
    const text = formatMainMenuText();
    assert.match(text, /Welcome to Palnadu\.dev/);
    assert.match(text, /పాలనాడు\.డెవ్ కు స్వాగతం/);
    assert.match(text, /1\. Website & Web Applications/);
    assert.match(text, /2\. Mobile App Development/);
    assert.match(text, /3\. Business Automation & Integrations/);
    assert.match(text, /4\. Digital Marketing & SEO/);
    assert.match(text, /5\. Technical Training & Courses/);
    assert.match(text, /6\. Talk to Our Team/);
  });

  it('formats submenus with approved options and BACK hint', () => {
    const cat1 = APPROVED_MAIN_MENU[0];
    const text1 = formatSubmenuText(cat1);
    assert.match(text1, /Business \/ Corporate Website/);
    assert.match(text1, /E-commerce \/ Web Application/);
    assert.match(text1, /Contact Support/);
    assert.match(text1, /Type BACK to return/);

    const cat2 = APPROVED_MAIN_MENU[1];
    const text2 = formatSubmenuText(cat2);
    assert.match(text2, /Android & iOS App/);
    assert.match(text2, /Contact Support/);
  });

  it('contains accurate support phone number and direct contact message', () => {
    assert.equal(PALNADU_SUPPORT_PHONE, '+91 90307 87819');
    assert.match(DIRECT_CONTACT_SUPPORT_MESSAGE, /\+91 90307 87819/);
    assert.match(DIRECT_CONTACT_SUPPORT_MESSAGE, /Don't hesitate to reach out to us anytime!/);
  });

  it('parses navigation commands in English and Telugu', () => {
    assert.equal(parseNavigationCommand('back'), 'BACK');
    assert.equal(parseNavigationCommand('BACK'), 'BACK');
    assert.equal(parseNavigationCommand('b'), 'BACK');
    assert.equal(parseNavigationCommand('వెనక్కి'), 'BACK');
    assert.equal(parseNavigationCommand('home'), 'HOME');
    assert.equal(parseNavigationCommand('HOME'), 'HOME');
    assert.equal(parseNavigationCommand('menu'), 'HOME');
    assert.equal(parseNavigationCommand('హోమ్'), 'HOME');
    assert.equal(parseNavigationCommand('hello'), null);
  });

  it('extracts numeric choices from ASCII digits, Telugu digits, words, and buttons', () => {
    assert.equal(extractNumericChoice('1'), '1');
    assert.equal(extractNumericChoice(' 2 '), '2');
    assert.equal(extractNumericChoice('౧'), '1');
    assert.equal(extractNumericChoice('౨'), '2');
    assert.equal(extractNumericChoice('౬'), '6');
    assert.equal(extractNumericChoice('one'), '1');
    assert.equal(extractNumericChoice('రెండు'), '2');
    assert.equal(extractNumericChoice('[Button: 3]'), '3');
    assert.equal(extractNumericChoice('[Selected: 2]'), '2');
    assert.equal(extractNumericChoice('invalid text'), null);
  });

  it('finds category and suboptions accurately', () => {
    const cat = findCategoryByInput('1');
    assert.ok(cat);
    assert.equal(cat.id, '1');
    assert.equal(cat.title, 'Website & Web Applications');

    const sub = findSuboptionByInput(cat, '3');
    assert.ok(sub);
    assert.equal(sub.isSupport, true);
    assert.equal(sub.name, 'Contact Support');

    const cat6 = findCategoryByInput('6');
    assert.ok(cat6);
    assert.equal(cat6.isDirectSupport, true);
  });
});
