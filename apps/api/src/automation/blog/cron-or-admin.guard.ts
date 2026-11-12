import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { isObservable, lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

function extractHeaderString(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
}

function timingSafeSecretEquals(provided: string, expected: string): boolean {
  const providedDigest = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const expectedDigest = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

/**
 * Authorizes external scheduler invocations via `x-cron-secret` (timing-safe match against
 * `AUTOMATION_CRON_SECRET`) OR authenticated Admin/SuperAdmin dashboard sessions.
 */
@Injectable()
export class CronOrAdminGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const providedSecret = extractHeaderString(req?.headers?.['x-cron-secret']);

    if (providedSecret !== null && providedSecret.length > 0) {
      const expectedSecret = process.env.AUTOMATION_CRON_SECRET?.trim();
      if (!expectedSecret || !timingSafeSecretEquals(providedSecret.trim(), expectedSecret)) {
        throw new UnauthorizedException('Invalid or unconfigured cron authorization secret');
      }
      req.cronAuthorized = true;
      return true;
    }

    const authResult = super.canActivate(context);
    const authenticated = isObservable(authResult) ? await lastValueFrom(authResult) : await authResult;
    if (!authenticated) return false;

    const role = req?.user?.role;
    if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin privileges required for cron endpoints');
    }
    return true;
  }
}

