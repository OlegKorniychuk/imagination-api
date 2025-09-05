import { IsNumberString, IsString } from 'class-validator';

export class Config {
  @IsString()
  DATABASE_URL: string;

  @IsNumberString()
  PORT: string;

  @IsString()
  S3_BUCKET_NAME: string;

  @IsString()
  S3_BUCKET_REGION: string;

  @IsString()
  S3_BUCKET_KEY: string;

  @IsString()
  S3_BUCKET_SECRET: string;
}
