import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
    const [newImage] = await this.db
      .insert(images)
      .values({ ...createImageDto, uniqueName })
      .returning();
    try {
      await this.s3.uploadImage(image, uniqueName);
    } catch (err) {
      await this.db.delete(images).where(eq(images.id, newImage.id));
      console.error(err);

      throw new HttpException(
        'Failed to save image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

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

    if (!image) throw new HttpException('Incorrect ID', HttpStatus.BAD_REQUEST);

    const url: string = await this.s3.getImageUrl(image.uniqueName, 3600);

    return { ...image, url };
  }

  async update(id: string, updateImageDto: UpdateImageDto): Promise<Image> {
    const [updatedImage] = await this.db
      .update(images)
      .set(updateImageDto)
      .where(eq(images.id, id))
      .returning();

    if (!updatedImage)
      throw new HttpException('Incorrect ID', HttpStatus.BAD_REQUEST);

    return updatedImage;
  }

  async remove(id: string): Promise<Image> {
    const [deletedImage] = await this.db
      .delete(images)
      .where(eq(images.id, id))
      .returning();

    if (!deletedImage)
      throw new HttpException('Incorrect ID', HttpStatus.BAD_REQUEST);

    try {
      await this.s3.deleteImage(deletedImage.uniqueName);
    } catch (err) {
      console.log('Failed to delete image from S3');
      console.error(err);
    }

    return deletedImage;
  }
}
