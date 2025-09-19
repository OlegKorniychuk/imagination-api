import { Controller, Get, Request } from '@nestjs/common';
import { AppService } from './app.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('/hc')
  @ApiOperation({ summary: 'Health Check' })
  @ApiResponse({ status: 200, description: 'Service is up and running.' })
  getHello(): string {
    return this.appService.getHello();
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
