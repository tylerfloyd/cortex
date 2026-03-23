import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color'),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id),
  isAiSuggested: boolean('is_ai_suggested').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
