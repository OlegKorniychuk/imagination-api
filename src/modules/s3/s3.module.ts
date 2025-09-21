import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Config } from 'src/config/index.config';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Client,
      useFactory: (s3Config: S3Config) => {
        return new S3Client({
          region: s3Config.BUCKET_REGION,
          credentials: {
            accessKeyId: s3Config.BUCKET_KEY,
            secretAccessKey: s3Config.BUCKET_SECRET,
          },
        });
      },
      inject: [S3Config],
    },
  ],
  exports: [S3Service],
})
export class S3Module {}
