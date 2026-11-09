export interface CaseStudyItem {
  title: string;
  slug: string;
  category: string;
  location: string;
  problem: string;
  solution: string;
  outcome: string;
  techStack: string[];
  image: string;
}

export interface EngineeringStandardItem {
  title: string;
  description: string;
}

export const caseStudies: CaseStudyItem[] = [
  {
    title: "Grain and Rice Mill Gate-Pass Automation",
    slug: "grain-and-rice-mill-gate-pass-automation",
    category: "Operations Web Application",
    location: "Sattenapalle, Palnadu",
    problem:
      "Manual weighbridge slips and hand-written gate passes created frequent inventory disputes with buyers, delayed evening reconciliations, and lacked verification across multiple godowns.",
    solution:
      "We engineered a lightweight Next.js portal integrated with weighbridge serial outputs, automated WhatsApp delivery memos, and role-based access for clerks, gate operators, and mill owners.",
    outcome:
      "Daily reconciliations that took over two hours every evening now happen instantly with zero paper discrepancies.",
    techStack: ["Next.js", "TypeScript", "MongoDB", "WhatsApp Cloud API"],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Educational Institution Admissions and Fee Portal",
    slug: "educational-institution-admissions-and-fee-portal",
    category: "Institutional Platform",
    location: "Narasaraopet, Palnadu",
    problem:
      "Over 1,500 student admissions each academic season caused long campus queues, lost paper inquiry sheets, and delayed fee reconciliations between administrative desks.",
    solution:
      "We built a mobile-friendly admission portal with automated student ID assignment, Razorpay UPI fee payment verification, and instant WhatsApp receipt dispatch.",
    outcome:
      "Saved administrative staff 20+ hours per week during peak admissions and allowed parents to submit inquiries and fee payments from their smartphones.",
    techStack: ["Next.js", "Tailwind CSS", "PostgreSQL", "Razorpay"],
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Multi-Chamber Cold Storage Stock Management",
    slug: "multi-chamber-cold-storage-stock-management",
    category: "Custom Logistics Platform",
    location: "Chilakaluripet, NH-16 Corridor",
    problem:
      "Tracking agricultural commodity lot numbers, chamber rack allocations, and moisture levels across registers resulted in accidental space double-booking and slow retrieval times.",
    solution:
      "We developed a responsive cloud platform displaying interactive chamber grid heatmaps, lot aging alerts, and automated WhatsApp delivery orders for farmers and commission agents.",
    outcome:
      "Enabled complete real-time visibility into chamber occupancy and reduced truck turnaround times during dispatch.",
    techStack: ["React", "TypeScript", "Node.js", "Prisma"],
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Hospital Patient Scheduling and Diagnostics Dashboard",
    slug: "hospital-patient-scheduling-and-diagnostics-dashboard",
    category: "Healthcare Application",
    location: "Guntur, Andhra Pradesh",
    problem:
      "A multi-speciality clinic experienced crowded waiting lobbies, overlapping doctor appointments, and lost physical diagnostic reports.",
    solution:
      "We constructed a clean appointment system with digital token queues, automated appointment reminders, and secure PDF diagnostic report delivery to patients.",
    outcome:
      "Reduced average patient lobby wait times by 35% and centralized doctor schedules across medical departments.",
    techStack: ["Next.js", "Tailwind CSS", "MongoDB", "Cloud Storage"],
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cloud Kitchen Order Routing & Multi-Brand POS Platform",
    slug: "cloud-kitchen-pos",
    category: "Hospitality & Food Operations",
    location: "Guntur & Vijayawada",
    problem:
      "A multi-brand cloud kitchen struggled with order fragmentation across Swiggy, Zomato, and direct customer calls, leading to missed tickets and kitchen chaos during peak evening hours.",
    solution:
      "We engineered a unified kitchen display system (KDS) and centralized dispatch dashboard that reconciles orders from all channels onto a single thermal printer queue with real-time station statuses.",
    outcome:
      "Cut ticket preparation lag by 40% and eliminated duplicate kitchen receipts across 4 virtual restaurant brands.",
    techStack: ["Next.js", "TypeScript", "Node.js", "WebSockets"],
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Regional Agri-Produce & Wholesale Marketplace",
    slug: "multi-vendor-marketplace",
    category: "B2B E-Commerce Platform",
    location: "Palnadu & Coastal Andhra",
    problem:
      "Regional wholesale traders and commission merchants relied on fragmented phone calls and middlemen, resulting in price opacity and delayed payment settlements.",
    solution:
      "We designed and launched a high-converting, mobile-first marketplace with verified buyer logins, real-time commodity spot pricing, digital escrow milestones, and automated GST invoices.",
    outcome:
      "Onboarded 120+ wholesale vendors across the chili, cotton, and grain belts within the first 60 days of launch.",
    techStack: ["Next.js", "Tailwind CSS", "PostgreSQL", "Razorpay"],
    image:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
  },
];

export const engineeringStandards: EngineeringStandardItem[] = [
  {
    title: "Direct Engineer Collaboration",
    description:
      "You speak directly with the senior developers who design and write your code. We cut out account managers and middle layers so requirements remain accurate.",
  },
  {
    title: "100% Code Ownership",
    description:
      "You own the full source code repository, deployment infrastructure, and database with zero vendor lock-in or recurring monthly per-user licensing fees.",
  },
  {
    title: "Disciplined Delivery Sprints",
    description:
      "We build focused, practical applications delivered in structured three to six-week milestones, allowing you to validate systems with real users quickly.",
  },
];
