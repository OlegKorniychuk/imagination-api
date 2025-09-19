import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { Image } from './entities/image.entity';
import { images } from 'src/drizzle/schema/images.schema';
import { eq, ilike, and, SQL, asc, desc, arrayOverlaps } from 'drizzle-orm';
import { ImageSearchOptionsDto } from './dto/image-search-options.dto';

@Injectable()
export class ImagesService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async create(
    createImageDto: CreateImageDto,
    authorId: string,
    uniqueName: string,
  ): Promise<Image> {
    const [newImage] = await this.db
      .insert(images)
      .values({ ...createImageDto, uniqueName, authorId })
      .returning();

    return newImage;
  }

  async findMany(
    options: ImageSearchOptionsDto = {},
    authorId?: string,
  ): Promise<Image[]> {
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

    return await finalQuery.then((rows) => rows.map((row) => row.images));
  }

  async findOne(id: string): Promise<Image | undefined> {
    const [image] = await this.db
      .select()
      .from(images)
      .where(eq(images.id, id));

    return image;
  }

  async update(
    id: string,
    updateImageDto: UpdateImageDto,
    authorId: string,
  ): Promise<Image | undefined> {
    const [image] = await this.db
      .select({ authorId: images.authorId })
      .from(images)
      .where(eq(images.id, id));

    if (image.authorId !== authorId) throw new ForbiddenException();

    const [updatedImage] = await this.db
      .update(images)
      .set(updateImageDto)
      .where(eq(images.id, id))
      .returning();

    return updatedImage;
  }

  async remove(id: string, authorId: string): Promise<Image | undefined> {
    const [image] = await this.db
      .select({ authorId: images.authorId })
      .from(images)
      .where(eq(images.id, id));

    if (image.authorId !== authorId) throw new ForbiddenException();

    const [deletedImage] = await this.db
      .delete(images)
      .where(eq(images.id, id))
      .returning();

    return deletedImage;
  }
}
