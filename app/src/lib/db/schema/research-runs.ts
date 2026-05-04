import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const researchRuns = pgTable('research_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  itemsFound: integer('items_found').notNull().default(0),
  itemsIngested: integer('items_ingested').notNull().default(0),
  sources: text('sources').array().notNull().default([]),
  error: text('error'),
})
