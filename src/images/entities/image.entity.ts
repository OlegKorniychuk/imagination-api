import { InferSelectModel } from 'drizzle-orm';
import { images } from 'src/drizzle/schema/images.schema';

export type Image = InferSelectModel<typeof images>;
