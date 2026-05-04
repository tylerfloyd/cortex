import { pgTable, uuid, date, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const weeklyRecaps = pgTable('weekly_recaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekStarting: date('week_starting').notNull().unique(),
  summary: text('summary').notNull(),
  topPickIds: text('top_pick_ids').array().notNull().default([]),
  themes: jsonb('themes').notNull().default('[]'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
})
