import { Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { compare } from 'bcrypt';
import { SafeUser } from 'src/users/entities/safe-user.entity';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from './entities/access-token-payload';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user: User | undefined = await this.usersService.findByEmail(email);

    if (user && (await compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;

      return safeUser;
    }

    return null;
  }

  login(user: SafeUser) {
    const payload: AccessTokenPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
