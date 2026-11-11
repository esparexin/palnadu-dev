import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { parseCookies, ADMIN_SESSION_COOKIE, CSRF_COOKIE } from '../../auth/cookie.util';

@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const method = (req.method || '').toUpperCase();

    // 1. Safe HTTP methods do not mutate state; exempt from CSRF
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const path = req.path || req.url || '';

    // 2. Exempt public login, logout, and webhook routes
    if (
      path.includes('/auth/login') ||
      path.includes('/auth/logout') ||
      path.includes('/whatsapp/webhook') ||
      (path.includes('/leads') && method === 'POST' && !req.headers.cookie?.includes(ADMIN_SESSION_COOKIE))
    ) {
      return true;
    }

    // 3. Extract cookies
    const cookies = req.cookies || parseCookies(req.headers.cookie);
    const sessionToken = cookies[ADMIN_SESSION_COOKIE];

    // If request does not use cookie authentication (e.g. Bearer token in automated test), exempt from CSRF
    if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
      return true;
    }

    // If request has cookie authentication, enforce CSRF token verification
    if (sessionToken) {
      const cookieCsrfToken = cookies[CSRF_COOKIE];
      const headerCsrfToken =
        req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'] || req.headers['csrf-token'];

      if (!cookieCsrfToken || !headerCsrfToken) {
        this.logger.warn(`CSRF protection rejected ${method} ${path}: missing CSRF token header or cookie`);
        throw new ForbiddenException('Invalid or missing CSRF token');
      }

      const cookieBuf = Buffer.from(String(cookieCsrfToken));
      const headerBuf = Buffer.from(String(headerCsrfToken));

      if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
        this.logger.warn(`CSRF protection rejected ${method} ${path}: token mismatch`);
        throw new ForbiddenException('Invalid CSRF token');
      }

      // Verify Origin / Referer against allowed patterns
      const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
      if (origin) {
        const isAllowedOrigin =
          origin.includes('localhost') ||
          origin.endsWith('.palnadu.dev') ||
          origin.endsWith('.vercel.app');
        if (!isAllowedOrigin && process.env.NODE_ENV === 'production') {
          this.logger.warn(`CSRF protection rejected ${method} ${path}: unauthorized origin ${origin}`);
          throw new ForbiddenException('Cross-origin request rejected');
        }
      }
    }

    return true;
  }
}
