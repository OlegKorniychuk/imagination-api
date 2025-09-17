import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto implements User {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
