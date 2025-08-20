import { IsNumberString, IsString } from 'class-validator';

export class Config {
  @IsString()
  DATABASE_URL: string;

  @IsNumberString()
  PORT: string;
}
