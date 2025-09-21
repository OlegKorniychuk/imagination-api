import { Controller, Get, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/modules/auth/public.decorator';

@ApiTags('Authentication & healthcheck')
@Controller()
export class AppController {
  @Public()
  @Get('/hc')
  @ApiOperation({ summary: 'Health Check' })
  @ApiResponse({ status: 200, description: 'Service is up and running.' })
  getHello() {
    return { message: 'Server up and running' };
  }
}
