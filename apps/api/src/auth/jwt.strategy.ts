import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { SessionService } from './session.service';
import { parseCookies, ADMIN_SESSION_COOKIE } from './cookie.util';

export function cookieOrBearerExtractor(req: Request): string | null {
  if (req && req.headers) {
    const cookies = (req as any).cookies || parseCookies(req.headers.cookie);
    if (cookies && cookies[ADMIN_SESSION_COOKIE]) {
      return cookies[ADMIN_SESSION_COOKIE];
    }
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: cookieOrBearerExtractor,
      ignoreExpiration: false,
      secretOrKey: (() => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
        }
        return secret || 'default-dev-secret-change-me';
      })(),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; sid?: string }) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException();
    }

    if (payload.sid) {
      const activeUser = await this.sessionService.validateSession(payload.sid);
      if (!activeUser || !activeUser.isActive) {
        throw new UnauthorizedException('Session expired or revoked');
      }
      return {
        sub: payload.sub,
        email: payload.email,
        role: activeUser.role || payload.role,
        sid: payload.sid,
      };
    }

    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
