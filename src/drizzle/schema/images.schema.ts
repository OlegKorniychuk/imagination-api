import { sql } from 'drizzle-orm';
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: uuid('author_id')
    .references(() => users.id)
    .notNull(),
  uniqueName: text('unique_name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  tags: text('tags')
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
