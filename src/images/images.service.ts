import { Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { randomBytes } from 'crypto';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { Image, S3Image } from './entities/image.entity';
import { images } from 'src/drizzle/schema/images.schema';
import { eq } from 'drizzle-orm';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class ImagesService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private s3: S3Service,
  ) {}

  async create(
    createImageDto: CreateImageDto,
    image: Express.Multer.File,
  ): Promise<Image> {
    const uniqueName: string = randomBytes(32).toString('hex');
    await this.s3.uploadImage(image, uniqueName);
    const [newImage] = await this.db
      .insert(images)
      .values({ ...createImageDto, uniqueName })
      .returning();

    return newImage;
  }

  async findAll(): Promise<S3Image[]> {
    const allImages: Image[] = await this.db.select().from(images);

    const imagesWithUrls: S3Image[] = await Promise.all(
      allImages.map(async (image) => {
        const url: string = await this.s3.getImageUrl(image.uniqueName, 3600);

        return { ...image, url };
      }),
    );

    return imagesWithUrls;
  }

  async findOne(id: string): Promise<S3Image> {
    const [image] = await this.db
      .select()
      .from(images)
      .where(eq(images.id, id));

    const url: string = await this.s3.getImageUrl(image.uniqueName, 3600);

    return { ...image, url };
  }

  async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
    const [updatedImage] = await this.db
      .update(images)
      .set(updateImageDto)
      .where(eq(images.id, id))
      .returning();

    return updatedImage;
  }

  async remove(id: string): Promise<Image> {
    const [deletedImage] = await this.db
      .delete(images)
      .where(eq(images.id, id))
      .returning();

    await this.s3.deleteImage(deletedImage.uniqueName);

    return deletedImage;
  }
}
