import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from 'src/modules/auth/entities/access-token-payload';
import { TokensConfig } from 'src/config/index.config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private tokensConfig: TokensConfig) {
    super({
      jwtFromRequest: (req: Request) => {
        let token: string | null = null;
        if (req && req.cookies) {
          token = req.cookies[tokensConfig.ACCESS_COOKIE_NAME] as string;
        }

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: tokensConfig.ACCESS_TOKEN_SECRET,
    });
  }

  validate(payload: AccessTokenPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
