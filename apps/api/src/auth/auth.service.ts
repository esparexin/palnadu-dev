import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { SessionService, generateCsrfToken } from './session.service';

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [name, domain] = email.split('@');
  const masked = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${masked}@${domain}`;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService?: SessionService,
  ) {}

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const totalStart = Date.now();

    const dbStart = Date.now();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    const dbDuration = Date.now() - dbStart;

    if (!user || !user.isActive) {
      this.logger.warn(
        `Failed login attempt for ${maskEmail(email)} (user inactive or not found, db=${dbDuration}ms)`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const bcryptStart = Date.now();
    const isValid = await bcrypt.compare(password, user.password);
    const bcryptDuration = Date.now() - bcryptStart;

    if (!isValid) {
      this.logger.warn(
        `Failed login attempt for ${maskEmail(email)} (invalid credentials, verify=${bcryptDuration}ms)`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionStart = Date.now();
    let rawToken: string = user.id;
    if (this.sessionService) {
      const sessionResult = await this.sessionService.createSession(user.id, ipAddress, userAgent);
      rawToken = sessionResult.rawToken;
    }
    const sessionDuration = Date.now() - sessionStart;

    const csrfToken = generateCsrfToken();

    const jwtStart = Date.now();
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: rawToken,
    };
    const accessToken = this.jwtService.sign(payload);
    const jwtDuration = Date.now() - jwtStart;

    const totalDuration = Date.now() - totalStart;
    this.logger.log(
      `Admin login verified for ${maskEmail(email)} [${user.role}]: ` +
      `db=${dbDuration}ms, verify=${bcryptDuration}ms, session=${sessionDuration}ms, jwt=${jwtDuration}ms, total=${totalDuration}ms`,
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      rawToken,
      csrfToken,
    };
  }

  async logout(rawToken?: string): Promise<boolean> {
    if (!rawToken || !this.sessionService) return false;
    return this.sessionService.revokeSession(rawToken);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
