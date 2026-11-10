import { PrismaClient, UserRole, PublishStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CANONICAL_BLOG_CATEGORIES } from '../src/automation/blog/blog-seeds';

const prisma = new PrismaClient();

const initialServices = [
  {
    title: 'Idea Validation',
    slug: 'idea-validation',
    shortDescription:
      'Validate the problem, customer, competition, market opportunity, feasibility, and MVP direction.',
    content:
      'Before investing time and money into development, it is essential to validate whether the idea solves a real problem for real people. We help you evaluate the problem, understand the target customer, analyze competitors, assess the market opportunity, determine technical feasibility, and define an MVP direction.',
    icon: 'Lightbulb',
    order: 1,
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Web Applications',
    slug: 'web-development',
    shortDescription:
      'Build business platforms, SaaS products, portals, dashboards, and custom web applications.',
    content:
      'We build business platforms, SaaS products, internal portals, customer dashboards, and custom web applications. Every web application is built with appropriate technology, clean architecture, and production-ready quality.',
    icon: 'Globe',
    order: 2,
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Mobile Applications',
    slug: 'mobile-app-development',
    shortDescription:
      'Build iOS, Android, and cross-platform mobile applications.',
    content:
      'We build iOS, Android, and cross-platform mobile applications that solve real business problems. We help you determine whether you need a native app, cross-platform solution, or a progressive web app based on your actual requirements and budget.',
    icon: 'Smartphone',
    order: 3,
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'MVP Development',
    slug: 'mvp-development',
    shortDescription:
      'Launch your minimum viable product quickly with the right technology and scope.',
    content:
      'An MVP is not a half-built product — it is the smallest version of a product that validates a business hypothesis. We help you define the right MVP scope, build it quickly with appropriate technology, and launch it to real users for validation.',
    icon: 'Rocket',
    order: 4,
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Custom Software',
    slug: 'custom-software',
    shortDescription:
      'Build software around specific business workflows and requirements.',
    content:
      'Sometimes off-the-shelf software doesn’t fit. When your business has specific workflows, processes, or requirements, custom software is the right choice. We build software around your specific business — not the other way around.',
    icon: 'Code',
    order: 5,
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Business Automation',
    slug: 'business-automation',
    shortDescription:
      'Reduce repetitive manual processes through practical automation.',
    content:
      'Repetitive manual processes are expensive and error-prone. We help you identify which processes can be automated and build practical automation solutions that provide real time and cost savings.',
    icon: 'Zap',
    order: 6,
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Technical Consulting',
    slug: 'technical-consulting',
    shortDescription:
      'Architecture, technology selection, existing-system analysis, feasibility, and technical problem solving.',
    content:
      'Whether you need help choosing technology, designing architecture, analyzing an existing system, evaluating technical feasibility, or solving a specific technical problem — we can help with honest, practical technical advice.',
    icon: 'MessageSquare',
    order: 7,
    status: PublishStatus.PUBLISHED,
  },
];

const initialCaseStudies = [
  {
    title: 'Grain and Rice Mill Gate-Pass Automation',
    slug: 'grain-and-rice-mill-gate-pass-automation',
    problem:
      'Manual weighbridge slips and hand-written gate passes created frequent inventory disputes with buyers, delayed evening reconciliations, and lacked verification across multiple godowns.',
    solution:
      'We engineered a lightweight Next.js portal integrated with weighbridge serial outputs, automated WhatsApp delivery memos, and role-based access for clerks, gate operators, and mill owners.',
    result:
      'Daily reconciliations that took over two hours every evening now happen instantly with zero paper discrepancies.',
    technology: ['Next.js', 'TypeScript', 'MongoDB', 'WhatsApp Cloud API'],
    images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80'],
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Educational Institution Admissions and Fee Portal',
    slug: 'educational-institution-admissions-and-fee-portal',
    problem:
      'Over 1,500 student admissions each academic season caused long campus queues, lost paper inquiry sheets, and delayed fee reconciliations between administrative desks.',
    solution:
      'We built a mobile-friendly admission portal with automated student ID assignment, Razorpay UPI fee payment verification, and instant WhatsApp receipt dispatch.',
    result:
      'Saved administrative staff 20+ hours per week during peak admissions and allowed parents to submit inquiries and fee payments from their smartphones.',
    technology: ['Next.js', 'Tailwind CSS', 'PostgreSQL', 'Razorpay'],
    images: ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'],
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Multi-Chamber Cold Storage Stock Management',
    slug: 'multi-chamber-cold-storage-stock-management',
    problem:
      'Tracking agricultural commodity lot numbers, chamber rack allocations, and moisture levels across registers resulted in accidental space double-booking and slow retrieval times.',
    solution:
      'We developed a responsive cloud platform displaying interactive chamber grid heatmaps, lot aging alerts, and automated WhatsApp delivery orders for farmers and commission agents.',
    result:
      'Enabled complete real-time visibility into chamber occupancy and reduced truck turnaround times during dispatch.',
    technology: ['React', 'TypeScript', 'Node.js', 'Prisma'],
    images: ['https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80'],
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Hospital Patient Scheduling and Diagnostics Dashboard',
    slug: 'hospital-patient-scheduling-and-diagnostics-dashboard',
    problem:
      'A multi-speciality clinic experienced crowded waiting lobbies, overlapping doctor appointments, and lost physical diagnostic reports.',
    solution:
      'We constructed a clean appointment system with digital token queues, automated appointment reminders, and secure PDF diagnostic report delivery to patients.',
    result:
      'Reduced average patient lobby wait times by 35% and centralized doctor schedules across medical departments.',
    technology: ['Next.js', 'Tailwind CSS', 'MongoDB', 'Cloud Storage'],
    images: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80'],
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Cloud Kitchen Order Routing & Multi-Brand POS Platform',
    slug: 'cloud-kitchen-pos',
    problem:
      'A multi-brand cloud kitchen struggled with order fragmentation across Swiggy, Zomato, and direct customer calls, leading to missed tickets and kitchen chaos during peak evening hours.',
    solution:
      'We engineered a unified kitchen display system (KDS) and centralized dispatch dashboard that reconciles orders from all channels onto a single thermal printer queue with real-time station statuses.',
    result:
      'Cut ticket preparation lag by 40% and eliminated duplicate kitchen receipts across 4 virtual restaurant brands.',
    technology: ['Next.js', 'TypeScript', 'Node.js', 'WebSockets'],
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80'],
    status: PublishStatus.PUBLISHED,
  },
  {
    title: 'Regional Agri-Produce & Wholesale Marketplace',
    slug: 'multi-vendor-marketplace',
    problem:
      'Regional wholesale traders and commission merchants relied on fragmented phone calls and middlemen, resulting in price opacity and delayed payment settlements.',
    solution:
      'We designed and launched a high-converting, mobile-first marketplace with verified buyer logins, real-time commodity spot pricing, digital escrow milestones, and automated GST invoices.',
    result:
      'Onboarded 120+ wholesale vendors across the chili, cotton, and grain belts within the first 60 days of launch.',
    technology: ['Next.js', 'Tailwind CSS', 'PostgreSQL', 'Razorpay'],
    images: ['https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80'],
    status: PublishStatus.PUBLISHED,
  },
];

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin@palnadu2024', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@palnadu.dev' },
    update: {},
    create: {
      email: 'admin@palnadu.dev',
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create default settings
  const defaultSettings = [
    { key: 'company_name', value: 'Palnadu.dev', description: 'Company display name' },
    { key: 'contact_email', value: 'hello@palnadu.dev', description: 'Primary contact email' },
    { key: 'notification_email', value: 'admin@palnadu.dev', description: 'Email for notifications' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Seed default published services
  for (const service of initialServices) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    });
  }
  console.log('Created default services');

  // Seed default published case studies
  for (const study of initialCaseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: study.slug },
      update: {},
      create: study,
    });
  }
  console.log('Created default case studies');

  for (const cat of CANONICAL_BLOG_CATEGORIES) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Created default blog categories');

  console.log('Created default settings');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
