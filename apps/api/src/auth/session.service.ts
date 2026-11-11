import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

export interface CachedSessionData {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
  expiresAt: number;
}

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days absolute lifetime
export const SESSION_CACHE_TTL_MS = 30_000; // 30 seconds in-memory cache to eliminate repeated WAN roundtrips

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly memoryCache = new Map<string, { data: CachedSessionData; cacheExpiresAt: number }>();

  constructor(private prisma: PrismaService) {}

  async createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.adminSession.create({
      data: {
        userId,
        tokenHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    this.cacheSession(tokenHash, {
      userId: session.userId,
      user: session.user,
      expiresAt: expiresAt.getTime(),
    });

    return {
      rawToken,
      expiresAt,
      session,
    };
  }

  async validateSession(rawToken?: string): Promise<CachedSessionData['user'] | null> {
    if (!rawToken || typeof rawToken !== 'string') return null;

    const tokenHash = hashToken(rawToken);
    const now = Date.now();

    const cached = this.memoryCache.get(tokenHash);
    if (cached && now < cached.cacheExpiresAt) {
      if (now >= cached.data.expiresAt || !cached.data.user.isActive) {
        this.memoryCache.delete(tokenHash);
        return null;
      }
      return cached.data.user;
    }

    try {
      const session = await this.prisma.adminSession.findUnique({
        where: { tokenHash },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      if (!session || !session.user || !session.user.isActive) {
        this.memoryCache.delete(tokenHash);
        return null;
      }

      if (session.expiresAt.getTime() <= now) {
        this.memoryCache.delete(tokenHash);
        await this.prisma.adminSession.deleteMany({ where: { tokenHash } }).catch(() => {});
        return null;
      }

      const sessionData: CachedSessionData = {
        userId: session.userId,
        user: session.user,
        expiresAt: session.expiresAt.getTime(),
      };

      this.cacheSession(tokenHash, sessionData);
      return sessionData.user;
    } catch (err: any) {
      this.logger.error(`Session validation error: ${err?.message || err}`);
      return null;
    }
  }

  async revokeSession(rawToken?: string): Promise<boolean> {
    if (!rawToken) return false;
    const tokenHash = hashToken(rawToken);
    this.memoryCache.delete(tokenHash);

    try {
      await this.prisma.adminSession.deleteMany({ where: { tokenHash } });
      this.logger.log(`Admin session revoked for token hash ${tokenHash.substring(0, 8)}...`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Failed to delete revoked session from database: ${err?.message || err}`);
      return false;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    for (const [hash, entry] of this.memoryCache.entries()) {
      if (entry.data.userId === userId) {
        this.memoryCache.delete(hash);
      }
    }

    try {
      const res = await this.prisma.adminSession.deleteMany({ where: { userId } });
      this.logger.log(`Revoked all ${res.count} active sessions for user ${userId}`);
      return res.count;
    } catch (err: any) {
      this.logger.warn(`Failed to revoke user sessions from database: ${err?.message || err}`);
      return 0;
    }
  }

  private cacheSession(tokenHash: string, data: CachedSessionData) {
    if (this.memoryCache.size > 2000) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(tokenHash, {
      data,
      cacheExpiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    });
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

