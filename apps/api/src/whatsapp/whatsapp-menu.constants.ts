export const PALNADU_SUPPORT_PHONE = '+91 90307 87819';
export const PALNADU_SUPPORT_WA_LINK = 'https://wa.me/919030787819';

export const DIRECT_CONTACT_SUPPORT_MESSAGE =
  `Don't hesitate to reach out to us anytime!\n\n` +
  `${PALNADU_SUPPORT_PHONE}\n\n` +
  `We're happy to assist you. Feel free to call or WhatsApp us whenever you need support.`;

export const MAIN_MENU_WELCOME_TEXT =
  `Welcome to Palnadu.dev! 👋\n\n` +
  `We help businesses grow with technology. What can we help you with today?`;

export const ENQUIRY_PROMPT_MESSAGE =
  `Please briefly describe what you need. Our team will understand your requirements and assist you.`;

export const ENQUIRY_CONFIRMATION_MESSAGE =
  `Thank you! We have received your requirements. Our team will review them and reach out to you shortly.\n\n` +
  `Feel free to call or WhatsApp us anytime at ${PALNADU_SUPPORT_PHONE}.`;

export const INVALID_MENU_CHOICE_MESSAGE =
  `Please tap an option from the menu, or reply with a number from 1 to 6. Type HOME anytime to view the main menu.`;

export const INVALID_SUBMENU_CHOICE_MESSAGE =
  `Please tap an option above, or type BACK to return to the main menu.`;

export interface MenuSubOption {
  id: string;
  stableId: string;
  name: string;
  buttonTitle?: string;
  isSupport: boolean;
}

export interface MainMenuCategory {
  id: string;
  stableId: string;
  title: string;
  rowTitle?: string;
  rowDescription?: string;
  isDirectSupport?: boolean;
  suboptions?: MenuSubOption[];
}

export const APPROVED_MAIN_MENU: MainMenuCategory[] = [
  {
    id: '1',
    stableId: 'cat_1',
    title: 'Website & Web Applications',
    rowTitle: 'Website & Web Apps',
    rowDescription: 'Website & Web Applications',
    suboptions: [
      {
        id: '1',
        stableId: 'sub_1_1',
        name: 'Business / Corporate Website',
        buttonTitle: 'Corporate Website',
        isSupport: false,
      },
      {
        id: '2',
        stableId: 'sub_1_2',
        name: 'E-commerce / Web Application',
        buttonTitle: 'E-commerce Web App',
        isSupport: false,
      },
      {
        id: '3',
        stableId: 'sub_1_3',
        name: 'Contact Support',
        buttonTitle: 'Contact Support',
        isSupport: true,
      },
    ],
  },
  {
    id: '2',
    stableId: 'cat_2',
    title: 'Mobile App Development',
    rowTitle: 'Mobile App Development',
    rowDescription: 'Android & iOS Applications',
    suboptions: [
      {
        id: '1',
        stableId: 'sub_2_1',
        name: 'Android & iOS App',
        buttonTitle: 'Android & iOS App',
        isSupport: false,
      },
      {
        id: '2',
        stableId: 'sub_2_2',
        name: 'Contact Support',
        buttonTitle: 'Contact Support',
        isSupport: true,
      },
    ],
  },
  {
    id: '3',
    stableId: 'cat_3',
    title: 'Business Automation & Integrations',
    rowTitle: 'Business Automation',
    rowDescription: 'Business Automation & Integrations',
    suboptions: [
      {
        id: '1',
        stableId: 'sub_3_1',
        name: 'WhatsApp / Business Automation',
        buttonTitle: 'Business Automation',
        isSupport: false,
      },
      {
        id: '2',
        stableId: 'sub_3_2',
        name: 'Contact Support',
        buttonTitle: 'Contact Support',
        isSupport: true,
      },
    ],
  },
  {
    id: '4',
    stableId: 'cat_4',
    title: 'Digital Marketing & SEO',
    rowTitle: 'Digital Marketing & SEO',
    rowDescription: 'SEO, Local SEO, AEO & GEO',
    suboptions: [
      {
        id: '1',
        stableId: 'sub_4_1',
        name: 'Digital Marketing (SEO / Local SEO, AEO / GEO included)',
        buttonTitle: 'Digital Marketing',
        isSupport: false,
      },
      {
        id: '2',
        stableId: 'sub_4_2',
        name: 'Contact Support',
        buttonTitle: 'Contact Support',
        isSupport: true,
      },
    ],
  },
  {
    id: '5',
    stableId: 'cat_5',
    title: 'Technical Training & Courses',
    rowTitle: 'Technical Training',
    rowDescription: 'Technical Training & Courses',
    suboptions: [
      {
        id: '1',
        stableId: 'sub_5_1',
        name: 'Web Development, Android / iOS Training',
        buttonTitle: 'Web & App Training',
        isSupport: false,
      },
      {
        id: '2',
        stableId: 'sub_5_2',
        name: 'Digital Marketing Training',
        buttonTitle: 'Marketing Training',
        isSupport: false,
      },
      {
        id: '3',
        stableId: 'sub_5_3',
        name: 'Contact Support',
        buttonTitle: 'Contact Support',
        isSupport: true,
      },
    ],
  },
  {
    id: '6',
    stableId: 'cat_6',
    title: 'Talk to Our Team',
    rowTitle: 'Talk to Our Team',
    rowDescription: 'Direct Support & Consultation',
    isDirectSupport: true,
  },
];
