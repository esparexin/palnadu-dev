import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma MongoDB cluster connection established successfully');
    } catch (err: any) {
      this.logger.warn(`Prisma initial connect warning (will retry on query): ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma MongoDB connection disconnected');
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.$runCommandRaw({ ping: 1 });
      return (res as any)?.ok === 1;
    } catch {
      return false;
    }
  }
}
