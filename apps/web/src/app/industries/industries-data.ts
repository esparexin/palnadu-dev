import type { LucideIcon } from 'lucide-react';
import { Rocket, GraduationCap, Building2, Stethoscope, Store, Factory } from 'lucide-react';

export interface IndustrySector {
  icon: LucideIcon;
  name: string;
  slug: string;
  subtitle: string;
  overview: string;
  deliverables: string[];
}

export const industrySectors: IndustrySector[] = [
  {
    icon: Rocket,
    name: 'Startups & Early-Stage Ventures',
    slug: 'startups',
    subtitle: 'From Idea to Validated Minimum Viable Product',
    overview:
      'We partner with founders in Andhra Pradesh and nationwide to design, prototype, and ship lean, high-speed MVPs in 3-to-6-week sprints. We evaluate technical feasibility, avoid architecture lock-in, and build products ready to onboard paying customers.',
    deliverables: [
      '3–6 week rapid MVP development',
      'Scalable Next.js & TypeScript architecture',
      'Stripe & Razorpay payment integrations',
      '100% source code & Git repository ownership',
    ],
  },
  {
    icon: Store,
    name: 'Wholesale, Agri-Trading & Cold Storages',
    slug: 'agri-trading',
    subtitle: 'Replacing Paper Slips & WhatsApp Chaos with Live Portals',
    overview:
      'Designed specifically for grain merchants, seed distributors, cotton ginning mills, and cold storage facilities across Palnadu, Narasaraopet, and Guntur. We build centralized inventory management systems that calculate moisture deductions, track batch allocations, and generate instant WhatsApp PDF invoices.',
    deliverables: [
      'Godown & cold storage bay allocation tracking',
      'Real-time mandi purchase settlement receipts',
      'Automated WhatsApp billing & PDF statements',
      'Role-based access for field agents and clerks',
    ],
  },
  {
    icon: GraduationCap,
    name: 'Education, Junior Colleges & Academies',
    slug: 'education',
    subtitle: 'Sub-Second Web Platforms & Student Information Systems',
    overview:
      'Educational institutions in Narasaraopet, Guntur, and Vijayawada need web portals that load instantly on low-bandwidth mobile networks during high-traffic admission cycles. We replace fragile WordPress setups with high-converting, mobile-first Next.js portals and student information dashboards.',
    deliverables: [
      'Sub-second mobile loading speed for parents and students',
      'Online digital admission inquiry pipelines',
      'Fee management & receipt generation systems',
      'High-resolution campus photo & event galleries',
    ],
  },
  {
    icon: Stethoscope,
    name: 'Healthcare, Diagnostic Centers & Clinics',
    slug: 'healthcare',
    subtitle: 'Patient Scheduling & Seamless Clinic Workflows',
    overview:
      'Specialty hospitals, polyclinics, and diagnostic centers handle hundreds of walk-ins daily. We build intuitive doctor schedule directories, appointment booking pipelines, and automated SMS/WhatsApp appointment reminders that eliminate front-desk telephone bottlenecks.',
    deliverables: [
      'Multi-doctor appointment scheduling calendars',
      'Digital patient queue & token tracking',
      'Diagnostic report download portals',
      'Google Maps directions & clinic location SEO',
    ],
  },
  {
    icon: Factory,
    name: 'Manufacturing, Limestone & Transport Ancillaries',
    slug: 'manufacturing-logistics',
    subtitle: 'Fleet Dispatch Tracking & Factory Contract Software',
    overview:
      'Centering around Chilakaluripet and Macherla industrial corridors, we engineer web platforms that track lorry trips, driver advances, weighbridge gate records, and raw material dispatches without depending on error-prone paper ledgers.',
    deliverables: [
      'Fleet trip logs, freight memos & LR slips',
      'Gate pass & weighbridge digital records',
      'Vendor invoice reconciliation dashboards',
      'Corporate export portfolios for industrial clients',
    ],
  },
  {
    icon: Building2,
    name: 'Retail Merchandising & Local Service Enterprises',
    slug: 'small-business',
    subtitle: 'Custom Operations Software Built Around Your Shop',
    overview:
      'Small and medium enterprises in Sattenapalle, Vinukonda, and Guntur often struggle with rigid, expensive software subscriptions. We engineer bespoke retail catalog portals, customer loyalty engines, and internal task managers that eliminate operational friction.',
    deliverables: [
      'Digital product catalogs & quotation builders',
      'Branch-to-branch stock transfer management',
      'Staff sales performance tracking',
      'Direct integration with regional GST accounting',
    ],
  },
];
