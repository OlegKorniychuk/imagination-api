import { Type } from 'class-transformer';
import {
  IsNumberString,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

export class AppConfig {
  @IsNumberString()
  PORT: string;
}

export class DbConfig {
  @IsString()
  DATABASE_URL: string;
}

export class S3Config {
  @IsString()
  BUCKET_NAME: string;

  @IsString()
  BUCKET_REGION: string;

  @IsString()
  BUCKET_KEY: string;

  @IsString()
  BUCKET_SECRET: string;
}

export class TokensConfig {
  @IsString()
  @Length(32, 32)
  ACCESS_TOKEN_SECRET: string;

  @IsString()
  @Matches(/^\d+\s?(ms|s|m|h|d|w|y)$/, {
    message:
      'Should be formatted like 12h (see ms package documentation for details)',
  })
  ACCESS_TOKEN_EXPIRES_IN: string;

  @IsString()
  ACCESS_COOKIE_NAME: string;

  @IsString()
  @Length(32, 32)
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  @Matches(/^\d+\s?(ms|s|m|h|d|w|y)$/, {
    message:
      'Should be formatted like 12h (see ms package documentation for details)',
  })
  REFRESH_TOKEN_EXPIRES_IN: string;

  @IsString()
  REFRESH_COOKIE_NAME: string;
}

export class RootConfig {
  @Type(() => AppConfig)
  @ValidateNested()
  app: AppConfig;

  @Type(() => DbConfig)
  @ValidateNested()
  db: DbConfig;

  @Type(() => S3Config)
  @ValidateNested()
  s3: S3Config;

  @Type(() => TokensConfig)
  @ValidateNested()
  tokens: TokensConfig;
}
