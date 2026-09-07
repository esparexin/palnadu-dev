import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
