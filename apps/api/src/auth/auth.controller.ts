import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { loginSchema, type LoginInput } from '@palnadu/validation';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  setAuthCookies,
  clearAuthCookies,
  parseCookies,
  ADMIN_SESSION_COOKIE,
} from './cookie.util';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(email, password, ip, userAgent);

    setAuthCookies(res, result.accessToken, result.csrfToken);

    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[ADMIN_SESSION_COOKIE];
    let sid: string | undefined;

    if (sessionToken) {
      try {
        const decoded = this.jwtService.decode(sessionToken) as any;
        sid = decoded?.sid;
      } catch {}
    }

    if (!sid && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.substring(7);
        const decoded = this.jwtService.decode(token) as any;
        sid = decoded?.sid;
      } catch {}
    }

    if (sid) {
      await this.authService.logout(sid);
    }

    clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const user = await this.authService.validateUser(req.user.sub);
    return { success: true, data: user };
  }
}
