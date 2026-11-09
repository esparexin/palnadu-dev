import { LocationData } from './types';

// ─── Coastal & District Hub Profiles ──────────────────────────────
// Authentic business context for Guntur, Palnadu District, and Narasaraopet.

export const coastalLocations: LocationData[] = [
  {
    slug: 'guntur',
    name: 'Guntur',
    district: 'Guntur District',
    revenueDivision: 'Guntur & Tenali Revenue Divisions',
    surroundingMandals: [
      'Guntur East', 'Guntur West', 'Medikonduru', 'Pedakakani', 'Pedanandipadu',
      'Phirangipuram', 'Prathipadu', 'Tadikonda', 'Thullur', 'Vatticherukuru',
      'Tenali', 'Chebrolu', 'Duggirala', 'Mangalagiri', 'Ponnur', 'Tadepalle',
    ],
    tagline: 'Web Applications, Custom Software & Digital Transformation for Guntur Enterprises',
    economicProfile: 'As the commercial and agricultural powerhouse of coastal Andhra Pradesh, Guntur hosts Asia’s largest chili market yard, tobacco trading houses, major multi-speciality medical centers, and expanding educational institutions.',
    keyIndustries: [
      'Agricultural Spice & Grain Trading',
      'Private Hospitals & Diagnostic Centers',
      'Cotton & Textile Ginning',
      'Engineering Colleges & Schools',
      'Wholesale Consumer Goods Distribution',
    ],
    commonPainPoints: [
      'Inventory reconciliation between mandi yards, godowns, and head offices',
      'Unreliable desktop accounting software unable to sync with field billing reps',
      'Slow, bloated WordPress websites that crash during admissions or seasonal marketing campaigns',
    ],
    popularServices: [
      'Custom ERP & Inventory Management Web Apps',
      'Hospital Patient Portals & Appointment Engines',
      'High-Speed Next.js Corporate Websites',
      'B2B Wholesale Ordering Platforms',
    ],
    geo: { latitude: 16.3067, longitude: 80.4365 },
    faq: [
      {
        q: 'Why should Guntur businesses choose custom software over ready-made accounting tools?',
        a: 'Off-the-shelf tools don’t fit regional mandi credit cycles, multiple dispatch godowns, or transport memo workflows. Custom software engineered by Palnadu.dev is built around your exact commercial workflow with 100% data ownership.',
      },
      {
        q: 'Can our sales team in Guntur use the system on their mobile phones?',
        a: 'Yes. All web applications and business portals built by Palnadu.dev are mobile-first, lightweight, and engineered to work reliably on standard 4G and 5G networks.',
      },
    ],
  },
  {
    slug: 'palnadu',
    name: 'Palnadu',
    district: 'Palnadu District',
    revenueDivision: 'Palnadu District (All Divisions)',
    surroundingMandals: [
      'Narasaraopet', 'Chilakaluripet', 'Sattenapalle', 'Vinukonda', 'Macherla',
      'Gurazala', 'Piduguralla', 'Dachepalle', 'Amaravathi', 'Karempudi',
    ],
    tagline: 'Software Engineering, Web Development & Business Automation Rooted in Palnadu',
    economicProfile: 'Formed as a dedicated district with Narasaraopet as its administrative center, Palnadu is an emerging economic corridor with rapid growth in agro-industries, limestone processing, educational campuses, and regional commerce.',
    keyIndustries: [
      'Agro-Processing & Seed Distribution',
      'Cotton Ginning & Trading',
      'Educational Institutions & Academies',
      'Healthcare & Specialty Clinics',
      'Local Merchant Retail',
    ],
    commonPainPoints: [
      'Reliance on paper books, WhatsApp chats, and Excel spreadsheets for critical business orders',
      'High fees paid to metropolitan IT agencies that don’t understand regional commercial realities',
      'Zero technical support when software breaks or staff turnover occurs',
    ],
    popularServices: [
      'Custom Business Management Software',
      'School & College Admissions Portals',
      'Local Business Websites with High-Speed Next.js',
      'Automated Billing & WhatsApp PDF Invoicing',
    ],
    geo: { latitude: 16.2359, longitude: 80.0499 },
    faq: [
      {
        q: 'Where is Palnadu.dev based?',
        a: 'Palnadu.dev is headquartered in the Palnadu region. We work directly with business owners, founders, and institutions across Palnadu, Narasaraopet, Chilakaluripet, and surrounding regions.',
      },
      {
        q: 'How fast can a custom software MVP be launched?',
        a: 'We deliver focused, practical MVPs in rapid 3-to-6-week sprints so your business starts capturing value immediately without massive upfront capital expenditure.',
      },
    ],
  },
  {
    slug: 'narasaraopet',
    name: 'Narasaraopet',
    district: 'Palnadu District (Headquarters)',
    revenueDivision: 'Narasaraopet Revenue Division',
    surroundingMandals: [
      'Narasaraopet', 'Bollapalle', 'Chilakaluripet', 'Edlapadu', 'Ipur',
      'Nadendla', 'Nuzendla', 'Rompicherla', 'Savalyapuram', 'Vinukonda',
    ],
    tagline: 'Fast Websites, Educational Portals & Custom Software in Narasaraopet',
    economicProfile: 'The commercial and educational heart of Palnadu district, Narasaraopet connects surrounding agrarian and industrial centers with leading engineering colleges, healthcare clinics, and wholesale markets.',
    keyIndustries: [
      'Higher Education & Engineering Colleges',
      'Automotive Spares & Machinery',
      'Seed & Agro Inputs',
      'Speciality Hospitals & Diagnostics',
      'Retail Shopping Complexes',
    ],
    commonPainPoints: [
      'College websites that take 8+ seconds to load and fail on smartphones',
      'Manual student fee tracking and enquiry paperwork prone to human error',
      'Loss of local search visibility to competitors on Google Maps and regional searches',
    ],
    popularServices: [
      'Student Information Systems & College Portals',
      'Local SEO & Fast Business Websites',
      'Clinic Patient Scheduling Applications',
      'Automated Ledger & Invoicing Software',
    ],
    geo: { latitude: 16.2359, longitude: 80.0499 },
    faq: [
      {
        q: 'Can Palnadu.dev redesign an existing slow college or school website in Narasaraopet?',
        a: 'Yes. We migrate fragile WordPress and PHP websites to sub-second Next.js edge platforms with online admission inquiries, photo galleries, and mobile-friendly speed.',
      },
    ],
  },
];
