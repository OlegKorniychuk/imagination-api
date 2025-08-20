import { sql } from 'drizzle-orm';
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  uploaderId: uuid('uploader_id').references(() => users.id),
  title: text('title').notNull(),
  tags: text('tags')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
});
