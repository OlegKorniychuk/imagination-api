import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { LocalAuthGuard } from './auth/strategies/local/local.guard';
import { AuthService } from './auth/auth.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoginRequestBodyDto, LoginResponseDto } from './auth/dto/login.dto';
import { User } from './users/entities/user.entity';
import { Public } from './auth/public.decorator';

// will be removed along with /me endpoint, used for auth development
class TemporaryMeResponse {
  id: string;
  email: string;
}

@ApiTags('Authentication & healthcheck')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
  ) {}

  @Public()
  @Get('/hc')
  @ApiOperation({ summary: 'Health Check' })
  @ApiResponse({ status: 200, description: 'Service is up and running.' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
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
  login(@Request() req: { user: User }): { access_token: string } {
    return this.authService.login(req.user);
  }

  @Get('/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user user token data' })
  @ApiResponse({
    status: 200,
    description: 'The user token data.',
    type: TemporaryMeResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getProfile(@Request() req: { user: User }): TemporaryMeResponse {
    return req.user;
  }
}
