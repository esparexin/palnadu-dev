import { LocationData } from './types';

// ─── Regional Hub Profiles ────────────────────────────────────────
// Authentic business context for Chilakaluripet, Sattenapalle, Vinukonda, and Macherla.

export const regionalHubLocations: LocationData[] = [
  {
    slug: 'chilakaluripet',
    name: 'Chilakaluripet',
    district: 'Palnadu District',
    revenueDivision: 'Narasaraopet Revenue Division',
    surroundingMandals: [
      'Chilakaluripet', 'Edlapadu', 'Nadendla', 'Purushothapatnam', 'Kavuru',
      'Gannavaram', 'Pasumarru', 'NH-16 Logistics Corridor',
    ],
    tagline: 'Transport Logistics, Commercial Software & Web Solutions in Chilakaluripet',
    economicProfile: 'Positioned on the NH-16 highway, Chilakaluripet is an essential transport, vehicle body building, and agricultural produce transit hub in Andhra Pradesh.',
    keyIndustries: [
      'Highway Transport & Fleet Logistics',
      'Commercial Auto Body Works',
      'Cotton & Tobacco Trading',
      'Cold Storage Operations',
      'Agri-Equipment Supply',
    ],
    commonPainPoints: [
      'Tracking vehicle maintenance, driver trip logs, and consignor billings across paper slips',
      'Cold storage bay occupancy tracking managed through prone-to-loss registers',
      'Lack of professional digital presence when pitching corporate logistics contracts',
    ],
    popularServices: [
      'Fleet & Trip Dispatch Tracking Web Apps',
      'Cold Storage Stock Allocation Software',
      'Professional Corporate Websites for Logistics Operators',
      'Automated WhatsApp LR / Consignment Slips',
    ],
    geo: { latitude: 16.0892, longitude: 80.1672 },
    faq: [
      {
        q: 'Do you build custom fleet or lorry transport billing software?',
        a: 'Yes. We engineer customized web platforms that track trip advances, diesel consumption, freight bills, and transport memos with real-time phone access.',
      },
    ],
  },
  {
    slug: 'sattenapalle',
    name: 'Sattenapalle',
    district: 'Palnadu District',
    revenueDivision: 'Sattenapalli Revenue Division',
    surroundingMandals: [
      'Sattenapalli', 'Amaravathi', 'Atchampet', 'Bellamkonda', 'Krosuru',
      'Muppalla', 'Nekarikallu', 'Pedakurapadu', 'Rajupalem',
    ],
    tagline: 'Agri-Trading Software & Modern Web Development in Sattenapalle',
    economicProfile: 'A major railway junction and commercial trading town in Palnadu, Sattenapalle is famous for paddy, cotton, chili markets, and residential educational hubs.',
    keyIndustries: [
      'Paddy & Rice Mills',
      'Cotton Ginning',
      'Timber & Construction Materials',
      'Junior Colleges & Schools',
      'General Merchant Trade',
    ],
    commonPainPoints: [
      'Calculating dynamic moisture deductions and mill yields manually',
      'WhatsApp invoice disputes with wholesale purchasers in other districts',
    ],
    popularServices: [
      'Rice Mill & Ginning Inventory Applications',
      'Wholesale Billing Software with GST Reports',
      'High-Converting School & Business Websites',
    ],
    geo: { latitude: 16.3962, longitude: 80.1504 },
    faq: [
      {
        q: 'Can we access our Sattenapalle mill software while traveling?',
        a: 'Yes. All systems are deployed to secure cloud servers with role-based logins for owners, managers, and clerks accessible from any device.',
      },
    ],
  },
  {
    slug: 'vinukonda',
    name: 'Vinukonda',
    district: 'Palnadu District',
    revenueDivision: 'Narasaraopet Revenue Division',
    surroundingMandals: [
      'Vinukonda', 'Bollapalle', 'Savalyapuram', 'Ipur', 'Nuzendla',
      'Kurichedu Border', 'Tripuranthakam Border',
    ],
    tagline: 'Custom Software & Web Application Development in Vinukonda',
    economicProfile: 'Situated on the Guntur-Guntakal railway route, Vinukonda serves as a vibrant trading bridge connecting Palnadu with Rayalaseema markets.',
    keyIndustries: [
      'Agricultural Commodity Trading',
      'Granite & Mining Quarry Supplies',
      'Retail Trade & Distribution',
      'Healthcare Facilities',
    ],
    commonPainPoints: [
      'Distance from big IT centers making it hard to get reliable software developers',
      'Overpaying for rigid metropolitan software that doesn’t work offline or on low bandwidth',
    ],
    popularServices: [
      'Quarry & Material Dispatch Web Software',
      'Mobile-Friendly Merchant Billing Systems',
      'SEO-Optimized Business Websites',
    ],
    geo: { latitude: 16.0543, longitude: 79.7417 },
    faq: [
      {
        q: 'Does Palnadu.dev support businesses located in Vinukonda?',
        a: 'Yes. We are dedicated to empowering regional commercial businesses across Vinukonda with modern engineering and direct developer support.',
      },
    ],
  },
  {
    slug: 'macherla',
    name: 'Macherla',
    district: 'Palnadu District',
    revenueDivision: 'Gurazala Revenue Division',
    surroundingMandals: [
      'Macherla', 'Gurazala', 'Dachepalle', 'Durgi', 'Karempudi',
      'Machavaram', 'Piduguralla', 'Rentachintala', 'Veldurthi', 'Nagarjuna Sagar',
    ],
    tagline: 'Industrial, Cement & Commercial Technology Solutions in Macherla',
    economicProfile: 'Historically significant and industrially rich, Macherla borders the Nagarjuna Sagar project with thriving cement factories, limestone deposits, and tourism commerce.',
    keyIndustries: [
      'Cement & Mineral Ancillary Suppliers',
      'Tourism & Hospitality',
      'Heavy Transport & Mining Services',
      'Local Commercial Trading',
    ],
    commonPainPoints: [
      'Tracking weighbridge tickets and industrial supply contracts across disparate spreadsheets',
      'Outdated static websites that fail to attract modern commercial clients',
    ],
    popularServices: [
      'Contract & Gate Pass Management Software',
      'Hospitality & Hotel Web Platforms',
      'Industrial Supplier Corporate Websites',
      'Retail Billing & GST POS Systems',
    ],
    geo: { latitude: 16.4807, longitude: 79.2965 },
    serviceOffice: 'Main Road, Macherla, Palnadu District, Andhra Pradesh 522426',
    postalCode: '522426',
    faq: [
      {
        q: 'Can we integrate weighbridge or gate entry records into our custom web portal in Macherla?',
        a: 'Yes. We build APIs and data ingestion connectors that sync electronic weigh slips, vendor invoices, and industrial gate passes directly into your centralized dashboard.',
      },
      {
        q: 'How fast can Palnadu.dev build a business website or software for a Macherla enterprise?',
        a: 'Standard commercial websites and landing pages are delivered within 5 to 10 business days. Custom business ERPs, POS billing, or logistics portals typically take 2 to 4 weeks with full on-site onboarding.',
      },
      {
        q: 'Do you offer on-site consultation and support in Macherla, Gurazala, and Piduguralla?',
        a: 'Yes. Our core engineering and support team directly serves Macherla town and surrounding industrial corridors across Gurazala division, providing on-site workflow audits and in-person team training.',
      },
      {
        q: 'Can our staff use the software in Telugu as well as English?',
        a: 'Absolutely. All our enterprise web portals, mobile apps, and invoice generators support bilingual English and Telugu interfaces tailored for local operational teams.',
      },
    ],
  },
];
