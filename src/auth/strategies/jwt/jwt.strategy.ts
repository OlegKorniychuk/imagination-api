import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from 'src/auth/entities/access-token-payload';
import { Config } from 'src/config/index.config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: Config) {
    super({
      jwtFromRequest: (req: Request) => {
        let token: string | null = null;
        if (req && req.cookies) {
          token = req.cookies[config.ACCESS_COOKIE_NAME] as string;
        }

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: config.ACCESS_TOKEN_SECRET,
    });
  }

  validate(payload: AccessTokenPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
