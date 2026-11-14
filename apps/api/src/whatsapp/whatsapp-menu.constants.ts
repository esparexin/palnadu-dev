export const PALNADU_SUPPORT_PHONE = '+91 90307 87819';
export const PALNADU_SUPPORT_WA_LINK = 'https://wa.me/919030787819';

export const DIRECT_CONTACT_SUPPORT_MESSAGE =
  `Don't hesitate to reach out to us anytime!\n\n` +
  `${PALNADU_SUPPORT_PHONE}\n` +
  `${PALNADU_SUPPORT_WA_LINK}\n\n` +
  `We're happy to assist you. Feel free to call or WhatsApp us whenever you need support.`;

export const ENQUIRY_PROMPT_MESSAGE =
  `Please briefly describe what you need. Our team will understand your requirements and assist you.\n\n` +
  `(దయచేసి మీ అవసరాలు క్లుప్తంగా తెలియజేయండి. మా బృందం పరిశీలించి మీకు సహాయం చేస్తుంది.)`;

export const ENQUIRY_CONFIRMATION_MESSAGE =
  `Thank you! We have received your requirements. Our team will review them and reach out to you shortly.\n\n` +
  `(ధన్యవాదాలు! మీ వివరాలు మాకు అందాయి. మా బృందం త్వరలోనే మిమ్మల్ని సంప్రదిస్తుంది.)\n\n` +
  `Feel free to call or WhatsApp us anytime at ${PALNADU_SUPPORT_PHONE}.`;

export const INVALID_MENU_CHOICE_MESSAGE =
  `Please reply with a number from 1 to 6 to select a category, or type HOME to view the main menu.\n` +
  `(దయచేసి 1 నుండి 6 సంఖ్యతో ఎంచుకోండి, లేదా మెనూ కొరకు HOME అని టైప్ చేయండి.)`;

export const INVALID_SUBMENU_CHOICE_MESSAGE =
  `Please reply with a valid option number from the menu above, or type BACK to return.\n` +
  `(దయచేసి పై మెనూ నుండి సరైన సంఖ్యను ఎంచుకోండి, లేదా వెనక్కి వెళ్ళడానికి BACK అని టైప్ చేయండి.)`;

export interface MenuSubOption {
  id: string;
  name: string;
  nameTe?: string;
  isSupport: boolean;
}

export interface MainMenuCategory {
  id: string;
  title: string;
  titleTe?: string;
  isDirectSupport?: boolean;
  suboptions?: MenuSubOption[];
}

export const APPROVED_MAIN_MENU: MainMenuCategory[] = [
  {
    id: '1',
    title: 'Website & Web Applications',
    titleTe: 'వెబ్‌సైట్ & వెబ్ అప్లికేషన్లు',
    suboptions: [
      { id: '1', name: 'Business / Corporate Website', nameTe: 'బిజినెస్ / కార్పొరేట్ వెబ్‌సైట్', isSupport: false },
      { id: '2', name: 'E-commerce / Web Application', nameTe: 'ఇ-కామర్స్ / వెబ్ అప్లికేషన్', isSupport: false },
      { id: '3', name: 'Contact Support', nameTe: 'సపోర్ట్ సంప్రదించండి', isSupport: true },
    ],
  },
  {
    id: '2',
    title: 'Mobile App Development',
    titleTe: 'మొబైల్ యాప్ డెవలప్‌మెంట్',
    suboptions: [
      { id: '1', name: 'Android & iOS App', nameTe: 'ఆండ్రాయిడ్ & ఐఓఎస్ యాప్', isSupport: false },
      { id: '2', name: 'Contact Support', nameTe: 'సపోర్ట్ సంప్రదించండి', isSupport: true },
    ],
  },
  {
    id: '3',
    title: 'Business Automation & Integrations',
    titleTe: 'బిజినెస్ ఆటోమేషన్ & ఇంటిగ్రేషన్స్',
    suboptions: [
      { id: '1', name: 'WhatsApp / Business Automation', nameTe: 'వాట్సాప్ / బిజినెస్ ఆటోమేషన్', isSupport: false },
      { id: '2', name: 'Contact Support', nameTe: 'సపోర్ట్ సంప్రదించండి', isSupport: true },
    ],
  },
  {
    id: '4',
    title: 'Digital Marketing & SEO',
    titleTe: 'డిజిటల్ మార్కెటింగ్ & ఎస్ఈఓ',
    suboptions: [
      { id: '1', name: 'Digital Marketing (SEO / Local SEO, AEO / GEO included)', nameTe: 'డిజిటల్ మార్కెటింగ్ (SEO, Local SEO, AEO/GEO)', isSupport: false },
      { id: '2', name: 'Contact Support', nameTe: 'సపోర్ట్ సంప్రదించండి', isSupport: true },
    ],
  },
  {
    id: '5',
    title: 'Technical Training & Courses',
    titleTe: 'టెక్నికల్ ట్రైనింగ్ & కోర్సులు',
    suboptions: [
      { id: '1', name: 'Web Development, Android / iOS Training', nameTe: 'వెబ్ డెవలప్‌మెంట్, ఆండ్రాయిడ్ / ఐఓఎస్ ట్రైనింగ్', isSupport: false },
      { id: '2', name: 'Digital Marketing Training', nameTe: 'డిజిటల్ మార్కెటింగ్ ట్రైనింగ్', isSupport: false },
      { id: '3', name: 'Contact Support', nameTe: 'సపోర్ట్ సంప్రదించండి', isSupport: true },
    ],
  },
  {
    id: '6',
    title: `Talk to Our Team (Anytime 😊 Don't Hesitate)`,
    titleTe: `మా బృందంతో మాట్లాడండి (ఎప్పుడైనా సంప్రదించండి)`,
    isDirectSupport: true,
  },
];
