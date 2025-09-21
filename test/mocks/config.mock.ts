import { RootConfig } from 'src/config/index.config';

export class MockConfig implements RootConfig {
  app = {
    PORT: '3500',
    ORIGIN: ['http://localhost:3080'],
  };

  db = {
    DATABASE_URL: 'postgres://test',
  };

  s3 = {
    BUCKET_NAME: 'test-bucket',
    BUCKET_REGION: 'us-east-1',
    BUCKET_KEY: 'test-key',
    BUCKET_SECRET: 'test-secret',
  };

  tokens = {
    ACCESS_TOKEN_EXPIRES_IN: '1d',
    ACCESS_TOKEN_SECRET: 'secret',
    ACCESS_COOKIE_NAME: 'auth',
    REFRESH_TOKEN_EXPIRES_IN: '30d',
    REFRESH_TOKEN_SECRET: 'secret',
    REFRESH_COOKIE_NAME: 'refresh',
  };
}
