import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      const servicesCount = await this.prisma.service.count();
      return {
        status: 'ok',
        database: 'connected',
        servicesCount,
        env: process.env.NODE_ENV,
        dbUrlConfigured: !!process.env.DATABASE_URL,
        dbUrlType: process.env.DATABASE_URL?.startsWith('mongodb') ? 'mongodb' : 'other',
      };
    } catch (err: any) {
      return {
        status: 'error',
        errorName: err?.name,
        errorMessage: err?.message,
        dbUrlConfigured: !!process.env.DATABASE_URL,
        dbUrlType: process.env.DATABASE_URL?.startsWith('mongodb') ? 'mongodb' : 'other',
      };
    }
  }
}
