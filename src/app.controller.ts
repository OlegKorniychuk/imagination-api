import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { SafeUser } from './users/entities/safe-user.entity';
import { LocalAuthGuard } from './auth/strategies/local/local.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/strategies/jwt/jwt.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  login(@Request() req: { user: SafeUser }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: SafeUser }) {
    return req.user;
  }
}
