import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  SerializeOptions,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
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
import { SignUpDto } from './auth/dto/sign-up.dto';
import { UserResponseDto } from './users/dto/user-response.dto';
import { Response, Request as ExpressRequest } from 'express';
import { Config } from './config/index.config';

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
    private config: Config,
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
    status: 204,
    description: 'User successfully logged in.',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  login(
    @Request() req: { user: User },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = this.authService.login(req.user);
    res.cookie(this.config.ACCESS_COOKIE_NAME, tokens.accessToken);
    res.cookie(this.config.REFRESH_COOKIE_NAME, tokens.refreshToken);
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

  @Post('auth/signup')
  @Public()
  @SerializeOptions({ type: UserResponseDto })
  async signUp(@Body() signupDto: SignUpDto): Promise<UserResponseDto> {
    return await this.authService.signUp(signupDto);
  }

  @Post('/auth/refresh')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[this.config.REFRESH_COOKIE_NAME] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const newAccessToken =
      await this.authService.refreshAccessToken(refreshToken);

    res.cookie(this.config.ACCESS_COOKIE_NAME, newAccessToken);
  }
}
