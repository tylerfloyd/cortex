import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  isAiGenerated: boolean('is_ai_generated').default(true),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
