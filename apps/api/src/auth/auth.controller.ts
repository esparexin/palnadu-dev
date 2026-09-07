import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email, body.password);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    const user = await this.authService.validateUser(req.user.sub);
    return { success: true, data: user };
  }
}
