import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { SafeUser } from './users/entities/safe-user.entity';
import { LocalAuthGuard } from './auth/strategies/local/local.guard';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/strategies/jwt/jwt.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginRequestBodyDto, LoginResponseDto } from './auth/dto/login.dto';
import { UserProfileDto } from './users/dto/user-profile.dto';

@ApiTags('Authentication & healthcheck')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
  ) {}

  @Get('/hc')
  @ApiOperation({ summary: 'Health Check' })
  @ApiResponse({ status: 200, description: 'Service is up and running.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiBody({ type: LoginRequestBodyDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully logged in.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  login(@Request() req: { user: SafeUser }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'The user profile.',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Request() req: { user: SafeUser }): UserProfileDto {
    return req.user;
  }
}
