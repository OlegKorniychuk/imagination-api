import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { S3Client } from '@aws-sdk/client-s3';
import { Config } from 'config/index.config';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Client,
      useFactory: (config: Config) => {
        return new S3Client({
          region: config.S3_BUCKET_REGION,
          credentials: {
            accessKeyId: config.S3_BUCKET_KEY,
            secretAccessKey: config.S3_BUCKET_SECRET,
          },
        });
      },
      inject: [Config],
    },
  ],
  exports: [S3Service],
})
export class S3Module {}
