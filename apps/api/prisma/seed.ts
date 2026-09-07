import { PrismaClient, UserRole, PublishStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
    await prisma.setting.upsert({
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
