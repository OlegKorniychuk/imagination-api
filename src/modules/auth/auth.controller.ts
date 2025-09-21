import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { User } from 'src/modules/users/entities/user.entity';
import { LoginRequestBodyDto, LoginResponseDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { LocalAuthGuard } from './strategies/local/local.guard';
import { Request } from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { TokensConfig } from 'src/config/index.config';
import { AuthService } from './auth.service';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private tokensConfig: TokensConfig,
    private authService: AuthService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
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
    res.cookie(this.tokensConfig.ACCESS_COOKIE_NAME, tokens.accessToken);
    res.cookie(this.tokensConfig.REFRESH_COOKIE_NAME, tokens.refreshToken);
  }

  @Post('signup')
  @Public()
  @SerializeOptions({ type: UserResponseDto })
  async signUp(@Body() signupDto: SignUpDto): Promise<UserResponseDto> {
    return await this.authService.signUp(signupDto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[
      this.tokensConfig.REFRESH_COOKIE_NAME
    ] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    const newAccessToken =
      await this.authService.refreshAccessToken(refreshToken);

    res.cookie(this.tokensConfig.ACCESS_COOKIE_NAME, newAccessToken);
  }
}
