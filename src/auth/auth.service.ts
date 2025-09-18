import { HttpException, Injectable } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from './entities/access-token-payload';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user: User | undefined = await this.usersService.findByEmail(email);

    if (user && (await compare(password, user.password))) return user;

    return null;
  }

  login(user: User) {
    const payload: AccessTokenPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
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
}
