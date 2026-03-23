import {
  pgTable,
  uuid,
  text,
  real,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { items } from './items';

export const itemRelations = pgTable('item_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemAId: uuid('item_a_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  itemBId: uuid('item_b_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  relationType: text('relation_type').notNull(), // 'similar' | 'contradicts' | 'builds_on' | 'references'
  similarity: real('similarity'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('uq_item_relations_a_b_type').on(table.itemAId, table.itemBId, table.relationType),
]);
