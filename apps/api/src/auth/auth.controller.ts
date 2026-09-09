import { Controller, Post, Body, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { loginSchema } from '@palnadu/validation';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown) {
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((i: any) => `${i.path.join('.')}: ${i.message}`)
        .join(', ');
      throw new BadRequestException(errorMsg);
    }

    const { email, password } = parseResult.data;
    const result = await this.authService.login(email, password);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    const user = await this.authService.validateUser(req.user.sub);
    return { success: true, data: user };
  }
}
