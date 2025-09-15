import { IsNumberString, IsString, Length, Matches } from 'class-validator';

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

  @IsString()
  @Length(32, 32)
  ACCESS_TOKEN_SECRET: string;

  @IsString()
  @Matches(/^\d+\s?(ms|s|m|h|d|w|y)$/, {
    message:
      'Should be formatted like 12h (see ms package documentation for details)',
  })
  ACCESS_TOKEN_EXPIRES_IN: string;
}
