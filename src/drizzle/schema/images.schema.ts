import { sql } from 'drizzle-orm';
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const images = pgTable('images', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  uploaderId: integer('uploader_id').references(() => users.id),
  title: text('title').notNull(),
  tags: text('tags')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
});
