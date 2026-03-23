import {
  pgTable,
  uuid,
  real,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { items } from './items';
import { tags } from './tags';

export const itemTags = pgTable(
  'item_tags',
  {
    itemId: uuid('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    confidence: real('confidence'),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.tagId] })],
);
