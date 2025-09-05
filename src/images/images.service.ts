import { Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Config } from 'src/config/index.config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import { randomBytes } from 'crypto';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { Image } from './entities/image.entity';
import { images } from 'src/drizzle/schema/images.schema';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';

@Injectable()
export class ImagesService {
  private s3;

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private config: Config,
  ) {
    this.s3 = new S3Client({
      region: 'eu-north-1',
      credentials: {
        accessKeyId: config.S3_BUCKET_KEY,
        secretAccessKey: config.S3_BUCKET_SECRET,
      },
    });
  }

  async create(createImageDto: CreateImageDto, image: Express.Multer.File) {
    const uniqueName: string = randomBytes(32).toString('hex');
    const params: PutObjectCommandInput = {
      Bucket: this.config.S3_BUCKET_NAME,
      Key: uniqueName,
      Body: image.buffer,
      ContentType: image.mimetype,
    };
    const command = new PutObjectCommand(params);
    await this.s3.send(command);
    await this.db.insert(images).values({ ...createImageDto, uniqueName });

    return 'A new image was added';
  }

  async findAll() {
    const allImages: Image[] = await this.db.select().from(images);

    const imagesWithUrls: (Image & { url: string })[] = await Promise.all(
      allImages.map(async (image) => {
        const params: GetObjectCommandInput = {
          Bucket: this.config.S3_BUCKET_NAME,
          Key: image.uniqueName,
        };
        const command = new GetObjectCommand(params);
        const url: string = await getSignedUrl(this.s3, command, {
          expiresIn: 3600,
        });

        return { ...image, url };
      }),
    );

    return imagesWithUrls;
  }

  async findOne(id: string) {
    const [image] = await this.db
      .select()
      .from(images)
      .where(eq(images.id, id));

    const params: GetObjectCommandInput = {
      Bucket: this.config.S3_BUCKET_NAME,
      Key: image.uniqueName,
    };
    const command = new GetObjectCommand(params);
    const url: string = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });

    return { ...image, url };
  }

  async update(id: string, updateImageDto: UpdateImageDto) {
    const updatedImage = await this.db
      .update(images)
      .set(updateImageDto)
      .where(eq(images.id, id))
      .returning();

    return updatedImage;
  }

  async remove(id: string) {
    const [deletedImage] = await this.db
      .delete(images)
      .where(eq(images.id, id))
      .returning();

    const params: DeleteObjectCommandInput = {
      Bucket: this.config.S3_BUCKET_NAME,
      Key: deletedImage.uniqueName,
    };

    const command = new DeleteObjectCommand(params);
    await this.s3.send(command);

    return deletedImage;
  }
}
