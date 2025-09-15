import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from 'src/auth/entities/access-token-payload';
import { Config } from 'src/config/index.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: Config) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.ACCESS_TOKEN_SECRET,
    });
  }

  validate(payload: AccessTokenPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
