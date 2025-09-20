import { Controller, Get, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/modules/auth/public.decorator';

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
}
