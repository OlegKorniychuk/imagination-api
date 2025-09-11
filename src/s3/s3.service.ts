import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { Config } from 'src/config/index.config';

@Injectable()
export class S3Service {
  constructor(
    private config: Config,
    private client: S3Client,
  ) {}

  async uploadImage(image: Express.Multer.File, uniqueName: string) {
    const params: PutObjectCommandInput = {
      Bucket: this.config.S3_BUCKET_NAME,
      Key: uniqueName,
      Body: image.buffer,
      ContentType: image.mimetype,
    };
    const command = new PutObjectCommand(params);
    await this.client.send(command);
  }

  async getImageUrl(uniqueName: string, expiresIn: number): Promise<string> {
    const params: GetObjectCommandInput = {
      Bucket: this.config.S3_BUCKET_NAME,
      Key: uniqueName,
    };
    const command = new GetObjectCommand(params);
    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async deleteImage(uniqueName: string) {
    const params: DeleteObjectCommandInput = {
      Bucket: this.config.S3_BUCKET_NAME,
      Key: uniqueName,
    };

    const command = new DeleteObjectCommand(params);
    await this.client.send(command);
  }
}
