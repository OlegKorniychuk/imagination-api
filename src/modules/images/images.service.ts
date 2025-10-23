import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { DrizzleDB } from 'src/modules/drizzle/types/drizzle';
import { DRIZZLE } from 'src/modules/drizzle/drizzle.module';
import { Image } from './entities/image.entity';
import { images } from 'src/modules/drizzle/schema/images.schema';
import {
  eq,
  ilike,
  and,
  SQL,
  asc,
  desc,
  arrayOverlaps,
  count,
} from 'drizzle-orm';
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
    // pass this for user to get his own images, including private
    authorId?: string,
  ): Promise<{ images: Image[]; nextPage: number | null }> {
    const { filter, sort, paginate } = options;

    const page = paginate?.page || 1;
    const pageSize = paginate?.pageSize || 10;

    const whereConditions: SQL<unknown>[] = [];

    // Filters
    if (filter) {
      if (filter.title) {
        whereConditions.push(ilike(images.title, `%${filter.title}%`));
      }

      // Looks for images that have ANY of provided tags
      if (filter.tags && filter.tags.length > 0) {
        whereConditions.push(arrayOverlaps(images.tags, filter.tags));
      }
    }

    if (authorId) {
      whereConditions.push(eq(images.authorId, authorId));
    } else {
      whereConditions.push(eq(images.isPublic, true));
    }

    const whereClause = and(...whereConditions);

    // Ids subquerry
    let idSubquery = this.db
      .select({ id: images.id })
      .from(images)
      .where(whereClause)
      .$dynamic();

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
      idSubquery = idSubquery.limit(pageSize).offset((page - 1) * pageSize);
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

    const plainImages: Image[] = await finalQuery.then((rows) =>
      rows.map((row) => row.images),
    );
    const countResult = await this.db
      .select({ count: count(images.id) })
      .from(images)
      .where(whereClause);

    const totalItems = countResult[0].count;
    const hasNextPage = page * pageSize < totalItems;
    const nextPage = hasNextPage ? page + 1 : null;

    return { images: plainImages, nextPage };
  }

  // pass authorId to get user's private picture
  async findOne(id: string, authorId?: string): Promise<Image | undefined> {
    const [image] = await this.db
      .select()
      .from(images)
      .where(eq(images.id, id));

    if (image && !image.isPublic && authorId !== image.authorId)
      throw new ForbiddenException();

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

  async count(): Promise<number> {
    const [result] = await this.db.select({ count: count() }).from(images);

    return result.count;
  }
}
