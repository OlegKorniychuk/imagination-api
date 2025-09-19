import { Config } from 'src/config/index.config';

export class MockConfig implements Config {
  DATABASE_URL: 'postgres://test';
  PORT: '3500';
  S3_BUCKET_NAME: 'test-bucket';
  S3_BUCKET_REGION: 'us-east-1';
  S3_BUCKET_KEY: 'test-key';
  S3_BUCKET_SECRET: 'test-secret';
  ACCESS_TOKEN_EXPIRES_IN: '1d';
  ACCESS_TOKEN_SECRET: 'secret';
  ACCESS_COOKIE_NAME: 'auth';
  REFRESH_TOKEN_EXPIRES_IN: '30d';
  REFRESH_TOKEN_SECRET: 'secret';
  REFRESH_COOKIE_NAME: 'refresh';
}
