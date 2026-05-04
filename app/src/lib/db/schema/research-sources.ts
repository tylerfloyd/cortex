import { pgTable, uuid, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const researchSources = pgTable('research_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(), // 'reddit' | 'hackernews' | 'youtube' | 'twitter'
  name: text('name').notNull(),
  config: jsonb('config').notNull().default('{}'),
  topics: text('topics').array().notNull().default([]),
  enabled: boolean('enabled').notNull().default(true),
  lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
