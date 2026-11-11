import type { Response } from 'express';
import { SESSION_TTL_MS } from './session.service';

export const ADMIN_SESSION_COOKIE = 'admin_session';
export const CSRF_COOKIE = 'csrf_token';

export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(val);
    }
  }

  return cookies;
}

export function setAuthCookies(
  res: Response,
  sessionToken: string,
  csrfToken: string,
  isProduction = process.env.NODE_ENV === 'production',
): void {
  // HttpOnly, Secure session cookie (100% XSS protected)
  res.cookie(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });

  // Client-readable CSRF token cookie for double-submit header protection
  res.cookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

export function clearAuthCookies(res: Response, isProduction = process.env.NODE_ENV === 'production'): void {
  res.cookie(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  res.cookie(CSRF_COOKIE, '', {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

