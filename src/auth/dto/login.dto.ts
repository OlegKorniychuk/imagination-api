import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestBodyDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'The JWT access token' })
  access_token: string;
}
