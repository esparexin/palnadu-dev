import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export function tuneDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  if (!rawUrl.startsWith('mongodb://') && !rawUrl.startsWith('mongodb+srv://')) {
    return rawUrl;
  }
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('minPoolSize')) url.searchParams.set('minPoolSize', '5');
    if (!url.searchParams.has('maxPoolSize')) url.searchParams.set('maxPoolSize', '20');
    if (!url.searchParams.has('maxIdleTimeMS')) url.searchParams.set('maxIdleTimeMS', '60000');
    if (!url.searchParams.has('connectTimeoutMS')) url.searchParams.set('connectTimeoutMS', '10000');
    if (!url.searchParams.has('serverSelectionTimeoutMS')) url.searchParams.set('serverSelectionTimeoutMS', '10000');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const tunedUrl = tuneDatabaseUrl(process.env.DATABASE_URL);
    super(tunedUrl ? { datasources: { db: { url: tunedUrl } } } : undefined);
  }

  async onModuleInit() {
    const connectStart = Date.now();
    try {
      await this.$connect();
      const connectDuration = Date.now() - connectStart;
      this.logger.log(`Prisma MongoDB cluster connection established successfully (${connectDuration}ms)`);
      await this.prewarmConnection();
    } catch (err: any) {
      this.logger.warn(`Prisma initial connect warning (will retry on query): ${err?.message || err}`);
    }
  }

  private async prewarmConnection(timeoutMs = 4000): Promise<void> {
    const prewarmStart = Date.now();
    try {
      const pingPromise = this.ping();
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Pre-warm ping exceeded ${timeoutMs}ms limit`)), timeoutMs);
      });
      const isOk = await Promise.race([pingPromise, timeoutPromise]).finally(() => {
        clearTimeout(timer);
      });
      const duration = Date.now() - prewarmStart;
      if (isOk) {
        this.logger.log(`Prisma MongoDB connection pool pre-warmed successfully (${duration}ms)`);
      } else {
        this.logger.warn(`Prisma MongoDB pre-warm returned non-ok ping response (${duration}ms)`);
      }
    } catch (prewarmErr: any) {
      this.logger.warn(`Prisma MongoDB pre-warm skipped or timed out: ${prewarmErr?.message || prewarmErr}`);
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
