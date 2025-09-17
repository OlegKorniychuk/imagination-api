import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { randomBytes } from 'crypto';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { Image, S3Image } from './entities/image.entity';
import { images } from 'src/drizzle/schema/images.schema';
import { eq, ilike, and, SQL, asc, desc, arrayOverlaps } from 'drizzle-orm';
import { S3Service } from 'src/s3/s3.service';
import { ImageSearchOptionsDto } from './dto/image-search-options.dto';

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
    } catch {
      await this.db.delete(images).where(eq(images.id, newImage.id));

      throw new HttpException(
        'Failed to save image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return newImage;
  }

  async findMany(
    options: ImageSearchOptionsDto = {},
    authorId?: string,
  ): Promise<S3Image[]> {
    const { filter, sort, paginate } = options;

    // Ids subquerry
    let idSubquery = this.db.select({ id: images.id }).from(images).$dynamic();

    // Filters
    if (filter) {
      const conditions: SQL<unknown>[] = [];

      if (filter.title) {
        conditions.push(ilike(images.title, `%${filter.title}%`));
      }

      // Looks for images that have ANY of provided tags
      if (filter.tags && filter.tags.length > 0) {
        conditions.push(arrayOverlaps(images.tags, filter.tags));
      }

      if (conditions.length > 0) {
        idSubquery = idSubquery.where(and(...conditions));
      }
    }

    if (authorId) idSubquery = idSubquery.where(eq(images.authorId, authorId));

    // Sorting

    if (sort) {
      const { field, order } = sort;
      const column = images[field];

      if (column) {
        idSubquery = idSubquery.orderBy(
          order === 'asc' ? asc(column) : desc(column),
          order === 'asc' ? asc(images.id) : desc(images.id),
        );
      }
    }

    if (paginate) {
      idSubquery = idSubquery
        .limit(paginate.pageSize)
        .offset((paginate.page - 1) * paginate.pageSize);
    }

    // All this weird shit is needed to implement deferred join - a pagination optimization technique
    // First we find only ids of needed rows, then join them with the table
    // and reapply sorting, since order will be lost after inner join
    const sq = idSubquery.as('subquery');
    const finalQuery = this.db
      .select()
      .from(images)
      .innerJoin(sq, eq(images.id, sq.id));

    if (sort) {
      const { field, order } = sort;
      const column = images[field];
      if (column) {
        finalQuery.orderBy(
          order === 'asc' ? asc(column) : desc(column),
          order === 'asc' ? asc(images.id) : desc(images.id),
        );
      }
    }

    const filteredImages: Image[] = await finalQuery.then((rows) =>
      rows.map((row) => row.images),
    );

    // const filteredImages: Image[] = await query;

    const imagesWithUrls: S3Image[] = await Promise.all(
      filteredImages.map(async (image) => {
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
