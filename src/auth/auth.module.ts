import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt/jwt.strategy';
import { rootConfig } from 'src/config/config.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './strategies/jwt/jwt.guard';

@Module({
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: rootConfig.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: rootConfig.ACCESS_TOKEN_EXPIRES_IN },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
