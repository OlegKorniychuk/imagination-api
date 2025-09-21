import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from './entities/access-token-payload';
import { SignUpDto } from './dto/sign-up.dto';
import { TokensConfig } from 'src/config/index.config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokensConfig: TokensConfig,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user: User | undefined = await this.usersService.findByEmail(email);

    if (user && (await compare(password, user.password))) return user;

    return null;
  }

  login(user: User) {
    const payload: AccessTokenPayload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: this.tokensConfig.ACCESS_TOKEN_EXPIRES_IN,
        secret: this.tokensConfig.ACCESS_TOKEN_SECRET,
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.tokensConfig.REFRESH_TOKEN_EXPIRES_IN,
        secret: this.tokensConfig.REFRESH_TOKEN_SECRET,
      }),
    };
  }

  async signUp(payload: SignUpDto): Promise<User> {
    if (payload.password !== payload.repeatPassword)
      throw new HttpException('Passwords do not match', 400);

    const exists = await this.usersService.findByEmail(payload.email);

    if (exists)
      throw new HttpException('User with this email already exists', 400);

    const hashedPassword = await hash(payload.password, 12);

    return await this.usersService.create({
      username: payload.username,
      email: payload.email,
      password: hashedPassword,
    });
  }

  async refreshAccessToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.tokensConfig.REFRESH_TOKEN_SECRET,
        },
      );

      const newAccessTokenPayload: AccessTokenPayload = {
        sub: payload.sub,
        email: payload.email,
      };

      return this.jwtService.sign(newAccessTokenPayload, {
        secret: this.tokensConfig.ACCESS_TOKEN_SECRET,
        expiresIn: this.tokensConfig.ACCESS_TOKEN_EXPIRES_IN,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
