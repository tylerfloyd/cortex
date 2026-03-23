import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  customType,
  index,
} from 'drizzle-orm/pg-core';
import { categories } from './categories';

// Custom pgvector type — drizzle-orm exports the vector builder only under
// the deep path drizzle-orm/pg-core/columns/vector_extension/vector which is
// not part of the standard pg-core barrel. Using customType keeps the schema
// portable and avoids the non-standard import.
const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.slice(1, -1).split(',').map(Number);
  },
});

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull().unique(),
    sourceType: text('source_type').notNull(), // 'article' | 'youtube' | 'twitter' | 'reddit' | 'pdf' | 'newsletter'
    title: text('title'),
    author: text('author'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    rawContent: text('raw_content'),
    summary: text('summary'),
    keyInsights: jsonb('key_insights').default([]),
    categoryId: uuid('category_id').references(() => categories.id),
    aiModelUsed: text('ai_model_used'),
    contentType: text('content_type').$type<'tutorial' | 'opinion' | 'news' | 'research' | 'reference' | 'discussion'>(),
    difficultyLevel: text('difficulty_level').$type<'beginner' | 'intermediate' | 'advanced'>(),
    estimatedReadTimeMinutes: integer('estimated_read_time_minutes'),
    processingStatus: text('processing_status').default('pending').$type<'pending' | 'processing' | 'ai-complete' | 'completed' | 'failed'>(), // pending | processing | ai-complete | completed | failed
    embedding: vector('embedding', { dimensions: 1536 }),
    captureSource: text('capture_source'), // 'discord' | 'extension' | 'dashboard' | 'api'
    discordChannel: text('discord_channel'),
    userNotes: text('user_notes'),
    isFavorite: boolean('is_favorite').default(false),
    readCount: integer('read_count').default(0),
    markdownFilePath: text('markdown_file_path'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_items_category').on(table.categoryId),
    index('idx_items_source_type').on(table.sourceType),
    index('idx_items_created_at').on(table.createdAt),
  ],
);
