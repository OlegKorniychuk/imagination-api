import { InferSelectModel } from 'drizzle-orm';
import { images } from 'drizzle/schema/images.schema';

export type Image = InferSelectModel<typeof images>;

export type S3Image = Image & { url: string };
